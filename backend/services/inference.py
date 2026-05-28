"""
services/inference.py
---------------------
best_model.pth 로드 → 이미지 분석 → 5개 지표 점수 반환

전처리 파이프라인 (train과 동일):
  1. 그레이스케일 변환
  2. 세로(H)를 224px로 리사이즈 (비율 유지, 가로 부족 시 white padding)
  3. CenterCrop(224)
  4. ToTensor → Normalize(mean=0.5, std=0.5)

Per-label threshold (evaluate.py optimal threshold 기반):
  [0.25, 0.50, 0.10, 0.50, 0.50]
  → Emotional Stability, Mental Energy/Willpower, Modesty, Personal Harmony, Social Isolation
"""

import sys
import json
from pathlib import Path
from io import BytesIO

import numpy as np
import torch
from PIL import Image
from torchvision import transforms

# 프로젝트 루트를 sys.path에 추가 (model.py, feature_extractor.py 접근)
ROOT = Path(__file__).parent.parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from model import GraphoVisionHybrid
from feature_extractor import extract_all as extract_features

# ─────────────────────────────────────────────
# 설정
# ─────────────────────────────────────────────

MODEL_PATH = ROOT / "best_model.pth"
DEVICE     = "cuda" if torch.cuda.is_available() else "cpu"

TRAIT_NAMES_EN = [
    "Emotional Stability",
    "Mental Energy/Willpower",
    "Modesty",
    "Personal Harmony",
    "Social Isolation",
]

TRAIT_NAMES_KR = [
    "정서 안정성",
    "정신력/의지력",
    "겸손",
    "개인적 조화",
    "사회적 고립",
]

# evaluate.py optimal threshold sweep 결과
PER_LABEL_THRESHOLDS = [0.25, 0.50, 0.10, 0.50, 0.50]

TARGET_H  = 224
CROP_SIZE = 224

_val_transform = transforms.Compose([
    transforms.CenterCrop(CROP_SIZE),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.5], std=[0.5]),
])


# ─────────────────────────────────────────────
# 모델 싱글턴 (앱 시작 시 1회 로드)
# ─────────────────────────────────────────────

_model: GraphoVisionHybrid | None = None


def load_model() -> GraphoVisionHybrid:
    global _model
    if _model is None:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(f"best_model.pth 없음: {MODEL_PATH}")
        m = GraphoVisionHybrid(num_labels=5, pretrained=False).to(DEVICE)
        m.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
        m.eval()
        _model = m
        print(f"[inference] 모델 로드 완료 ({DEVICE}): {MODEL_PATH}")
    return _model


# ─────────────────────────────────────────────
# 전처리
# ─────────────────────────────────────────────

def _preprocess_image(img: Image.Image) -> tuple[torch.Tensor, torch.Tensor]:
    """
    PIL Image → (img_tensor, feat_tensor)
    img_tensor  : (1, 1, 224, 224)
    feat_tensor : (1, 5)
    """
    img = img.convert("L")

    # 세로 224px 리사이즈 (비율 유지)
    w, h = img.size
    new_w = max(CROP_SIZE, int(w * TARGET_H / h))
    img_resized = img.resize((new_w, TARGET_H), Image.LANCZOS)

    # 가로가 부족하면 흰색 패딩
    if img_resized.width < CROP_SIZE:
        padded = Image.new("L", (CROP_SIZE, TARGET_H), color=255)
        padded.paste(img_resized, (0, 0))
        img_resized = padded

    # 수작업 특징 추출 (리사이즈 후, crop 전 이미지 기준)
    feats = extract_features(img_resized)

    img_tensor  = _val_transform(img_resized).unsqueeze(0).to(DEVICE)    # (1,1,224,224)
    feat_tensor = torch.tensor(feats, dtype=torch.float32).unsqueeze(0).to(DEVICE)  # (1,5)

    return img_tensor, feat_tensor


# ─────────────────────────────────────────────
# 추론
# ─────────────────────────────────────────────

def predict(image_bytes: bytes) -> dict:
    """
    이미지 바이트 → 예측 결과 딕셔너리 반환

    Returns:
        {
          "scores":       [0.74, 0.92, 0.61, 0.48, 0.83],   # sigmoid 확률값
          "predictions":  [1, 1, 1, 0, 1],                  # per-label threshold 적용
          "thresholds":   [0.25, 0.50, 0.10, 0.50, 0.50],
          "trait_names":  [...],
          "trait_names_kr": [...],
        }
    """
    model = load_model()

    img = Image.open(BytesIO(image_bytes))
    img_tensor, feat_tensor = _preprocess_image(img)

    with torch.no_grad():
        logits = model(img_tensor, feat_tensor)
        probs  = torch.sigmoid(logits).squeeze().cpu().numpy()   # (5,)

    thresholds  = PER_LABEL_THRESHOLDS
    predictions = [int(float(probs[i]) >= thresholds[i]) for i in range(5)]

    return {
        "scores":         [round(float(p), 4) for p in probs],
        "predictions":    predictions,
        "thresholds":     thresholds,
        "trait_names":    TRAIT_NAMES_EN,
        "trait_names_kr": TRAIT_NAMES_KR,
    }
