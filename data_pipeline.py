"""
data_pipeline.py
----------------
label_list.txt 파싱 → XML 메타데이터 조인 → lines/ 이미지 경로 매핑
→ PyTorch Dataset / DataLoader 구축

use_features=True 시 수작업 특징(5d)도 함께 반환.
특징은 feature_cache.pkl에 캐싱해 매 epoch 재추출을 방지.
"""

import os
import glob
import json
import pickle
from pathlib import Path
from xml.etree import ElementTree as ET
from collections import defaultdict

import numpy as np
import pandas as pd
from PIL import Image

import torch
from torch.utils.data import Dataset, DataLoader, WeightedRandomSampler
from torchvision import transforms

from feature_extractor import extract_all as extract_handwriting_features


# 사용할 레이블 인덱스 (0~7 중 선택한 5개) — HBPA label_list.txt 기준
# 0:Emotional Stability  1:Mental Energy/Willpower  2:Modesty
# 3:Personal Harmony     4:Lack of Discipline       5:Poor Concentration
# 6:Non-Communicativeness  7:Social Isolation
ACTIVE_LABELS = [0, 1, 2, 3, 7]
NUM_LABELS    = len(ACTIVE_LABELS)   # 5


# ─────────────────────────────────────────────
# 1. label_list.txt 파싱
# ─────────────────────────────────────────────

def parse_label_list(txt_path: str) -> pd.DataFrame:
    """
    label_list.txt 파일을 읽어 필요한 열만 추출한다.

    열 구조 (0-indexed):
      0~6  : 물리적 특징 (사용 안 함)
      7~14 : 8가지 심리 지표 (0 or 1) ← 타겟 레이블
      15   : 파일명 ex) "002-0.png"  ← writer_id + form_index

    반환: DataFrame with columns
      writer_id (str, zero-padded 3자리), form_index (int),
      label_0 ~ label_7 (int)
    """
    rows = []
    with open(txt_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            parts = line.split()
            if len(parts) < 16:
                continue

            filename = parts[15]                        # ex) "002-0.png"
            stem = filename.replace(".png", "")         # ex) "002-0"
            dash_idx = stem.rfind("-")
            suffix = stem[dash_idx + 1:]
            if not suffix.isdigit():   # "598-1-" 같은 비정상 항목 스킵
                continue
            writer_id = stem[:dash_idx].zfill(3)        # "002"
            form_index = int(suffix)                    # 0

            labels = [int(parts[i]) for i in range(7, 15)]  # 8개

            rows.append({
                "writer_id": writer_id,
                "form_index": form_index,
                **{f"label_{j}": labels[j] for j in range(8)},
            })

    df = pd.DataFrame(rows)
    print(f"[parse_label_list] {len(df)}행 로드 완료")
    return df


# ─────────────────────────────────────────────
# 2. XML 파싱 → writer_id → form_id 목록 매핑
# ─────────────────────────────────────────────

def build_writer_form_map(xml_dir: str) -> dict:
    """
    xml/ 디렉터리의 모든 XML 파일을 파싱하여
    writer-id → 정렬된 form_id 목록을 반환한다.

    예) {"002": ["a01-003", "b02-015", ...], ...}
    """
    xml_files = sorted(glob.glob(os.path.join(xml_dir, "*.xml")))
    writer_form_map = defaultdict(list)

    for xml_path in xml_files:
        try:
            tree = ET.parse(xml_path)
            root = tree.getroot()
            writer_id = root.get("writer-id", "").zfill(3)
            form_id = root.get("id", "")
            if writer_id and form_id:
                writer_form_map[writer_id].append(form_id)
        except ET.ParseError:
            continue

    # 각 writer의 form 목록을 알파벳순 정렬 (form_index 기준이 됨)
    for wid in writer_form_map:
        writer_form_map[wid] = sorted(writer_form_map[wid])

    print(f"[build_writer_form_map] writer 수: {len(writer_form_map)}")
    return dict(writer_form_map)


# ─────────────────────────────────────────────
# 3. 이미지 경로 + 레이블 샘플 목록 구축
# ─────────────────────────────────────────────

def build_sample_list(
    label_df: pd.DataFrame,
    writer_form_map: dict,
    lines_dir: str,
) -> list:
    """
    label_df의 각 행을 실제 이미지 파일 경로와 연결한다.

    매핑 규칙:
      writer_id + form_index → form_id
      form_id → lines/{form_id[:3]}/{form_id}/*.png
      각 줄 이미지가 하나의 학습 샘플 (같은 form의 모든 줄이 동일한 레이블 공유)

    반환: List of {"image_path": Path, "labels": np.ndarray(8,), "writer_id": str}
    """
    label_cols = [f"label_{i}" for i in range(8)]
    samples = []
    skipped = 0

    for _, row in label_df.iterrows():
        wid = row["writer_id"]
        fidx = int(row["form_index"])

        if wid not in writer_form_map:
            skipped += 1
            continue

        forms = writer_form_map[wid]
        if fidx >= len(forms):
            skipped += 1
            continue

        form_id = forms[fidx]                           # ex) "a01-003"
        parent = form_id[:3]                            # ex) "a01"
        form_dir = Path(lines_dir) / parent / form_id

        if not form_dir.exists():
            skipped += 1
            continue

        png_files = sorted(form_dir.glob("*.png"))
        if not png_files:
            skipped += 1
            continue

        labels = np.array(row[label_cols].values, dtype=np.float32)[ACTIVE_LABELS]

        for img_path in png_files:
            samples.append({
                "image_path": img_path,
                "labels": labels,
                "writer_id": wid,
            })

    print(f"[build_sample_list] 샘플 수: {len(samples)}, 스킵: {skipped}")
    return samples


# ─────────────────────────────────────────────
# 4. 특징 캐시 로드/저장
# ─────────────────────────────────────────────

FEATURE_CACHE_PATH = Path(__file__).parent / "feature_cache.pkl"


def load_feature_cache() -> dict:
    if FEATURE_CACHE_PATH.exists():
        with open(FEATURE_CACHE_PATH, "rb") as f:
            return pickle.load(f)
    return {}


def save_feature_cache(cache: dict):
    with open(FEATURE_CACHE_PATH, "wb") as f:
        pickle.dump(cache, f)


def build_feature_cache(samples: list) -> dict:
    """
    샘플 목록의 모든 이미지에서 수작업 특징을 추출해 캐시 딕셔너리를 반환.
    이미 캐시된 항목은 재추출하지 않음.
    """
    cache = load_feature_cache()
    missing = [s for s in samples if str(s["image_path"]) not in cache]

    if missing:
        print(f"[build_feature_cache] 특징 추출 중: {len(missing)}개 (캐시 히트: {len(cache)}개)")
        for i, s in enumerate(missing):
            key = str(s["image_path"])
            try:
                img = Image.open(s["image_path"]).convert("L")
                cache[key] = extract_handwriting_features(img)
            except Exception:
                cache[key] = np.full(5, 0.5, dtype=np.float32)

            if (i + 1) % 1000 == 0:
                print(f"  {i + 1}/{len(missing)} 완료...")
                save_feature_cache(cache)

        save_feature_cache(cache)
        print(f"[build_feature_cache] 완료. 총 {len(cache)}개 캐시 저장됨")

    return cache


# ─────────────────────────────────────────────
# 5. PyTorch Dataset
# ─────────────────────────────────────────────

class HandwritingDataset(Dataset):
    """
    IAM 필기 줄 이미지를 로드하고 전처리하여 반환하는 Dataset.

    use_features=True 시 수작업 특징(5d)도 함께 반환:
      반환값: (img_tensor, feature_tensor, label_tensor)
      반환값: (img_tensor, label_tensor)  — use_features=False

    전처리:
      1. 그레이스케일 로드
      2. 세로(H)를 224px로 리사이즈 (가로비율 유지)
      3. 가로 방향에서 224×224 RandomCrop
      4. ToTensor → Normalize(0.5, 0.5)

    수작업 특징은 리사이즈 후 crop 전 이미지에서 추출 (원본 비율 보존).
    """

    TARGET_H = 224
    CROP_SIZE = 224

    def __init__(self, samples: list, augment: bool = True,
                 use_features: bool = True, feature_cache: dict = None):
        self.samples = samples
        self.use_features = use_features
        self.feature_cache = feature_cache or {}

        if augment:
            self.transform = transforms.Compose([
                transforms.RandomCrop(self.CROP_SIZE),
                transforms.RandomAffine(degrees=3, translate=(0.02, 0.02)),
                transforms.ColorJitter(brightness=0.2, contrast=0.2),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.5], std=[0.5]),
            ])
        else:
            self.transform = transforms.Compose([
                transforms.CenterCrop(self.CROP_SIZE),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.5], std=[0.5]),
            ])

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int):
        item = self.samples[idx]
        img = Image.open(item["image_path"]).convert("L")

        # 세로를 224px로 리사이즈 (비율 유지)
        w, h = img.size
        new_w = max(self.CROP_SIZE, int(w * self.TARGET_H / h))
        img = img.resize((new_w, self.TARGET_H), Image.LANCZOS)

        # 가로가 CROP_SIZE보다 짧으면 패딩
        if img.width < self.CROP_SIZE:
            padded = Image.new("L", (self.CROP_SIZE, self.TARGET_H), color=255)
            padded.paste(img, (0, 0))
            img = padded

        img_tensor = self.transform(img)
        labels = torch.tensor(item["labels"], dtype=torch.float32)

        if self.use_features:
            key = str(item["image_path"])
            feat = self.feature_cache.get(key)
            if feat is None:
                feat = extract_handwriting_features(
                    Image.open(item["image_path"]).convert("L")
                )
            feature_tensor = torch.tensor(feat, dtype=torch.float32)
            return img_tensor, feature_tensor, labels

        return img_tensor, labels


# ─────────────────────────────────────────────
# 5. 오버샘플링 가중치 계산
# ─────────────────────────────────────────────

def compute_sample_weights(samples: list) -> torch.DoubleTensor:
    """
    멀티레이블 오버샘플링용 per-sample 가중치 계산.

    각 샘플의 가중치 = 해당 샘플이 가진 양성 레이블 중 가장 희귀한 것의 역빈도.
    → Lack of Discipline / Non-Communicativeness 같은 희귀 레이블을 포함한 샘플이 더 자주 선택됨.
    음성만 있는 샘플은 가중치 1.0.
    """
    labels_all = np.array([s["labels"] for s in samples])   # (N, 8)
    total = len(samples)
    pos_count = labels_all.sum(axis=0) + 1e-6               # (8,)
    label_weights = total / pos_count                        # 역빈도 (8,)

    sample_weights = []
    for lbls in labels_all:
        pos_idx = np.where(lbls == 1)[0]
        w = float(label_weights[pos_idx].max()) if len(pos_idx) > 0 else 1.0
        sample_weights.append(w)

    return torch.DoubleTensor(sample_weights)


# ─────────────────────────────────────────────
# 6. DataLoader 생성
# ─────────────────────────────────────────────

def get_dataloaders(
    lines_dir: str,
    xml_dir: str,
    label_txt: str,
    batch_size: int = 32,
    split: tuple = (0.7, 0.15, 0.15),
    num_workers: int = 0,
    seed: int = 42,
    oversample: bool = True,
    use_features: bool = True,
):
    """
    전체 파이프라인을 실행하여 train/val/test DataLoader를 반환한다.

    writer 단위로 분리하여 동일 필기자의 이미지가 train/test에 동시에 포함되지 않도록 한다.
    oversample=True : 희귀 레이블 샘플을 WeightedRandomSampler로 오버샘플링.
    use_features=True: 수작업 특징(5d)도 함께 반환. 첫 실행 시 feature_cache.pkl 생성.
    """
    label_df = parse_label_list(label_txt)
    writer_form_map = build_writer_form_map(xml_dir)
    all_samples = build_sample_list(label_df, writer_form_map, lines_dir)

    # writer 단위 분리
    rng = np.random.default_rng(seed)
    all_writers = sorted(set(s["writer_id"] for s in all_samples))
    rng.shuffle(all_writers)

    n = len(all_writers)
    n_train = int(n * split[0])
    n_val = int(n * split[1])

    train_writers = set(all_writers[:n_train])
    val_writers = set(all_writers[n_train:n_train + n_val])
    test_writers = set(all_writers[n_train + n_val:])

    train_samples = [s for s in all_samples if s["writer_id"] in train_writers]
    val_samples   = [s for s in all_samples if s["writer_id"] in val_writers]
    test_samples  = [s for s in all_samples if s["writer_id"] in test_writers]

    print(f"[get_dataloaders] train: {len(train_samples)}, val: {len(val_samples)}, test: {len(test_samples)}")

    # 수작업 특징 캐시 (전체 샘플 한 번에 추출)
    feature_cache = {}
    if use_features:
        feature_cache = build_feature_cache(all_samples)

    if oversample:
        sample_weights = compute_sample_weights(train_samples)
        sampler = WeightedRandomSampler(
            weights=sample_weights,
            num_samples=len(train_samples),
            replacement=True,
        )
        print(f"[get_dataloaders] WeightedRandomSampler 적용 (oversample=True)")
        train_loader = DataLoader(
            HandwritingDataset(train_samples, augment=True,
                               use_features=use_features, feature_cache=feature_cache),
            batch_size=batch_size, sampler=sampler, num_workers=num_workers,
        )
    else:
        train_loader = DataLoader(
            HandwritingDataset(train_samples, augment=True,
                               use_features=use_features, feature_cache=feature_cache),
            batch_size=batch_size, shuffle=True, num_workers=num_workers,
        )
    val_loader = DataLoader(
        HandwritingDataset(val_samples, augment=False,
                           use_features=use_features, feature_cache=feature_cache),
        batch_size=batch_size, shuffle=False, num_workers=num_workers,
    )
    test_loader = DataLoader(
        HandwritingDataset(test_samples, augment=False),
        batch_size=batch_size, shuffle=False, num_workers=num_workers,
    )
    return train_loader, val_loader, test_loader


# ─────────────────────────────────────────────
# 단독 실행 시: 파이프라인 검증 출력
# ─────────────────────────────────────────────

if __name__ == "__main__":
    BASE = Path(__file__).parent
    LINES_DIR = str(BASE / "lines")
    XML_DIR   = str(BASE / "xml")
    LABEL_TXT = str(BASE / "label_list.txt")

    label_df = parse_label_list(LABEL_TXT)
    writer_form_map = build_writer_form_map(XML_DIR)
    samples = build_sample_list(label_df, writer_form_map, LINES_DIR)

    # 레이블 분포 확인
    print("\n=== 레이블 분포 (1의 비율) ===")
    labels_all = np.array([s["labels"] for s in samples])
    for i in range(8):
        ratio = labels_all[:, i].mean()
        print(f"  label_{i}: {ratio:.3f} ({labels_all[:, i].sum():.0f} / {len(samples)})")

    # DataLoader 샘플 확인 (use_features=True)
    train_loader, val_loader, test_loader = get_dataloaders(
        LINES_DIR, XML_DIR, LABEL_TXT, batch_size=8, use_features=True
    )
    imgs, feats, lbls = next(iter(train_loader))
    print(f"\n배치 이미지 shape  : {imgs.shape}")    # (8, 1, 224, 224)
    print(f"배치 특징 shape    : {feats.shape}")    # (8, 5)
    print(f"배치 레이블 shape  : {lbls.shape}")     # (8, 5)
    print(f"특징 샘플 (첫 행)  : {feats[0].tolist()}")
    print("파이프라인 검증 완료!")
