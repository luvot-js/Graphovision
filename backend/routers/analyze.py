"""
routers/analyze.py
------------------
POST /api/analyze — 이미지 업로드 → 모델 예측 → 결과 저장
GET  /api/result/{id} — 결과 조회
"""

import json
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from database import get_db, User, Result, CreditTransaction
from models.schemas import AnalyzeResponse, ResultDetail
from routers.user import get_current_user
from services.inference import predict, TRAIT_NAMES_KR
from services.report import generate_report

router = APIRouter(prefix="/api", tags=["analyze"])

UPLOAD_DIR = Path(__file__).parent.parent.parent / "data" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/bmp"}
MAX_SIZE_MB   = 10


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # 크레딧 확인
    if current_user.credits < 1:
        raise HTTPException(status_code=402, detail="크레딧이 부족합니다.")

    # 파일 타입 확인
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=415, detail="이미지 파일만 업로드 가능합니다 (JPEG/PNG/WebP/BMP).")

    image_bytes = await file.read()
    if len(image_bytes) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"파일 크기는 {MAX_SIZE_MB}MB 이하여야 합니다.")

    # 예측
    try:
        result_data = predict(image_bytes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"모델 추론 실패: {str(e)}")

    scores = result_data["scores"]

    # 리포트 생성
    report_text = generate_report(scores)

    # 이미지 저장 (로컬 전용 — 배포 환경에서는 파일시스템이 없으므로 스킵)
    result_id = str(uuid.uuid4())
    image_path = ""
    try:
        img_file_path = str(UPLOAD_DIR / f"{result_id}.jpg")
        with open(img_file_path, "wb") as f:
            f.write(image_bytes)
        image_path = img_file_path
    except Exception:
        pass

    # DB 저장
    db_result = Result(
        id=result_id,
        user_id=current_user.id,
        image_path=image_path,
        scores=json.dumps(scores),
        report=report_text,
    )
    db.add(db_result)

    # 크레딧 차감
    current_user.credits -= 1
    db.add(CreditTransaction(user_id=current_user.id, delta=-1, reason="analyze"))
    db.commit()
    db.refresh(current_user)

    return AnalyzeResponse(
        result_id=result_id,
        scores=scores,
        trait_names=TRAIT_NAMES_KR,
        report=report_text,
        credits_remaining=current_user.credits,
    )


@router.get("/result/{result_id}", response_model=ResultDetail)
def get_result(
    result_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    result = db.query(Result).filter(
        Result.id == result_id,
        Result.user_id == current_user.id,
    ).first()

    if not result:
        raise HTTPException(status_code=404, detail="결과를 찾을 수 없습니다.")

    return ResultDetail(
        id=result.id,
        scores=json.loads(result.scores),
        trait_names=TRAIT_NAMES_KR,
        report=result.report,
        created_at=result.created_at,
    )
