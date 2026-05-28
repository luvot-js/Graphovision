"""
feature_extractor.py
--------------------
필기 라인 이미지에서 5가지 수작업 특징 추출

HBPA(CODERdotEXE/HBPA)의 알고리즘을 라인 단위 이미지에 맞게 적용.
전체 페이지 기반이었던 top_margin, line_spacing은 라인 이미지에 의미 없으므로 제외.

추출 특징 (5개):
  0. baseline_angle : 글자 중심점들의 기울기 (도)
  1. letter_size    : 연결 성분 평균 높이 (px)
  2. word_spacing   : 단어 간 평균 공백 / letter_size (상대값)
  3. pen_pressure   : 잉크 픽셀 평균 어두움 (0~255)
  4. slant_angle    : 수직 프로젝션 분산 최대화 각도 인덱스 (0~8)

출력: np.ndarray shape (5,), dtype float32, 정규화 후 [0, 1] 범위
"""

import numpy as np
import cv2
from PIL import Image


# ─── 정규화 범위 ───────────────────────────────────────────────────────────────
# categorize.py 임계값과 실험적 관찰 기반
FEATURE_RANGES = {
    "baseline_angle": (-10.0, 10.0),    # 도(degree)
    "letter_size":    (5.0,   50.0),    # 픽셀
    "word_spacing":   (0.3,   5.0),     # 상대값 (gap / letter_size)
    "pen_pressure":   (30.0,  220.0),   # 픽셀 강도
    "slant_angle":    (0.0,   8.0),     # 인덱스
}

SLANT_ANGLES = [-45, -30, -15, -5, 0, 5, 15, 30, 45]


# ─── 내부 유틸 ─────────────────────────────────────────────────────────────────

def _to_binary(img: Image.Image) -> np.ndarray:
    """PIL 그레이스케일 → 이진 배열 (잉크=255, 배경=0)"""
    arr = np.array(img.convert("L"))
    _, binary = cv2.threshold(arr, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    return binary


def _get_components(binary: np.ndarray):
    """노이즈 제거 후 유효한 연결 성분 stats, centroids 반환"""
    h, w = binary.shape
    min_area = max(4, int(h * w * 0.00005))
    max_area = int(h * w * 0.25)

    num_labels, _, stats, centroids = cv2.connectedComponentsWithStats(binary)

    valid_stats = []
    valid_centroids = []
    for i in range(1, num_labels):
        area = stats[i, cv2.CC_STAT_AREA]
        if min_area < area < max_area:
            valid_stats.append(stats[i])
            valid_centroids.append(centroids[i])

    return valid_stats, valid_centroids


# ─── 특징 추출 함수 ────────────────────────────────────────────────────────────

def extract_baseline_angle(img: Image.Image) -> float:
    """
    글자 연결 성분들의 무게중심에 1차 선형 회귀를 적용해
    기준선 기울기 각도(도)를 반환.

    양수: 오른쪽으로 올라가는 기준선 (ascending)
    음수: 오른쪽으로 내려가는 기준선 (descending)
    """
    binary = _to_binary(img)
    _, centroids = _get_components(binary)

    if len(centroids) < 3:
        return 0.0

    xs = np.array([c[0] for c in centroids])
    ys = np.array([c[1] for c in centroids])

    # 1차 선형 회귀 → 기울기 → 각도
    coeffs = np.polyfit(xs, ys, 1)
    angle = float(np.degrees(np.arctan(coeffs[0])))
    return np.clip(angle, -45.0, 45.0)


def extract_letter_size(img: Image.Image) -> float:
    """
    연결 성분의 평균 높이(px)를 글자 크기로 반환.
    """
    binary = _to_binary(img)
    valid_stats, _ = _get_components(binary)

    h = img.height
    if not valid_stats:
        return float(h * 0.4)

    heights = [s[cv2.CC_STAT_HEIGHT] for s in valid_stats]
    # 극단값 제거 (상하위 10%)
    heights_sorted = sorted(heights)
    trim = max(1, len(heights_sorted) // 10)
    trimmed = heights_sorted[trim:-trim] if len(heights_sorted) > 2 * trim else heights_sorted

    return float(np.mean(trimmed)) if trimmed else float(h * 0.4)


def extract_word_spacing(img: Image.Image, letter_size: float = None) -> float:
    """
    수직 프로젝션으로 단어 간 공백의 평균을 letter_size 기준으로 정규화해 반환.
    """
    binary = _to_binary(img)
    h, w = binary.shape

    if letter_size is None or letter_size < 1:
        letter_size = extract_letter_size(img)
    if letter_size < 1:
        letter_size = h * 0.4

    col_proj = binary.sum(axis=0)
    min_gap = max(2, int(letter_size * 0.35))

    in_gap = False
    gap_count = 0
    gap_sizes = []

    for val in col_proj:
        if val == 0:
            in_gap = True
            gap_count += 1
        else:
            if in_gap and gap_count >= min_gap:
                gap_sizes.append(gap_count)
            in_gap = False
            gap_count = 0

    if not gap_sizes:
        return 1.0

    return float(np.mean(gap_sizes)) / letter_size


def extract_pen_pressure(img: Image.Image) -> float:
    """
    잉크 픽셀(어두운 픽셀)의 평균 어두움을 필압으로 반환.
    값이 높을수록 강한 필압.
    """
    arr = np.array(img.convert("L"), dtype=np.float32)
    ink = arr[arr < 128]
    if len(ink) == 0:
        return 100.0
    return float(255.0 - np.mean(ink))


def extract_slant_angle(img: Image.Image) -> float:
    """
    HBPA 원본 방식: 9개 각도 후보에서 수직 프로젝션 분산을 최대화하는
    각도의 인덱스를 반환 (0~8).

    인덱스 → 각도: [-45, -30, -15, -5, 0, 5, 15, 30, 45]
    인덱스 4 = 0도 (직립)
    인덱스 < 4 = 왼쪽으로 기울어짐
    인덱스 > 4 = 오른쪽으로 기울어짐
    """
    arr = np.array(img.convert("L"))
    _, binary = cv2.threshold(arr, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    h, w = binary.shape

    best_idx = 4
    best_score = -1.0

    for idx, angle in enumerate(SLANT_ANGLES):
        shear = np.tan(np.radians(-angle))
        M = np.float32([[1, shear, 0], [0, 1, 0]])
        new_w = int(w + abs(shear) * h)
        try:
            transformed = cv2.warpAffine(binary, M, (new_w, h))
        except cv2.error:
            continue

        col_proj = transformed.sum(axis=0).astype(np.float64)
        score = float(np.var(col_proj))

        if score > best_score:
            best_score = score
            best_idx = idx

    return float(best_idx)


# ─── 정규화 ────────────────────────────────────────────────────────────────────

def normalize_features(raw: np.ndarray) -> np.ndarray:
    """
    raw 특징 벡터 (5,)를 FEATURE_RANGES 기준으로 [0, 1] 클램핑 후 정규화.
    """
    keys = ["baseline_angle", "letter_size", "word_spacing", "pen_pressure", "slant_angle"]
    result = np.zeros(5, dtype=np.float32)
    for i, key in enumerate(keys):
        lo, hi = FEATURE_RANGES[key]
        result[i] = float(np.clip((raw[i] - lo) / (hi - lo + 1e-8), 0.0, 1.0))
    return result


# ─── 메인 인터페이스 ──────────────────────────────────────────────────────────

def extract_all(img: Image.Image) -> np.ndarray:
    """
    PIL 이미지에서 5개 특징을 추출하고 [0,1]로 정규화해 반환.

    반환: np.ndarray shape (5,), dtype float32
      [0] baseline_angle  — 기준선 기울기
      [1] letter_size     — 글자 크기
      [2] word_spacing    — 단어 간격 (상대)
      [3] pen_pressure    — 필압
      [4] slant_angle     — 기울기 방향 인덱스
    """
    try:
        letter_size = extract_letter_size(img)
        raw = np.array([
            extract_baseline_angle(img),
            letter_size,
            extract_word_spacing(img, letter_size),
            extract_pen_pressure(img),
            extract_slant_angle(img),
        ], dtype=np.float32)
        return normalize_features(raw)
    except Exception:
        # 추출 실패 시 중립값 반환
        return np.full(5, 0.5, dtype=np.float32)


# ─── 단독 실행 테스트 ─────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys
    from pathlib import Path
    import glob

    # lines/ 에서 샘플 이미지 3개 테스트
    sample_paths = glob.glob("lines/**/*.png", recursive=True)[:3]
    if not sample_paths:
        print("lines/ 디렉터리에 이미지가 없습니다.")
        sys.exit(0)

    names = ["baseline_angle", "letter_size", "word_spacing", "pen_pressure", "slant_angle"]
    print(f"{'이미지':<40} " + "  ".join(f"{n:>14}" for n in names))
    print("-" * 120)

    for path in sample_paths:
        img = Image.open(path).convert("L")
        feats = extract_all(img)
        print(f"{Path(path).name:<40} " + "  ".join(f"{v:>14.4f}" for v in feats))
