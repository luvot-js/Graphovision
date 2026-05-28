"""
main.py
-------
GraphoVision FastAPI 앱 진입점

실행:
  cd backend
  uvicorn main:app --reload --host 0.0.0.0 --port 8000

API 문서:
  http://localhost:8000/docs
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import create_tables
from routers import auth, user, analyze, history, compatibility, billing


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 앱 시작 시 DB 테이블 생성
    create_tables()
    # 모델을 미리 로드 (첫 요청 지연 방지)
    try:
        from services.inference import load_model
        load_model()
    except FileNotFoundError as e:
        print(f"[WARNING] {e} — /api/analyze 사용 불가")
    yield


app = FastAPI(
    title="GraphoVision API",
    description="필기 기반 성격 분석 서비스",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(user.router)
app.include_router(analyze.router)
app.include_router(history.router)
app.include_router(compatibility.router)
app.include_router(billing.router)


@app.get("/")
def root():
    return {"status": "ok", "service": "GraphoVision API"}
