"""
model.py
--------
GraphoVision 모델 정의

GraphoVisionResNet  : CNN 단독 모델 (기존)
GraphoVisionHybrid  : CNN + 수작업 특징 이중 브랜치 모델 (고도화)

Hybrid 구조:
  Branch 1 (CNN)     : ResNet18 → 512d 이미지 특징
  Branch 2 (Feature) : 5d 수작업 특징 → MLP → 32d
  Fusion             : concat(512+32=544) → Dropout → Linear(544, num_labels)
"""

import torch
import torch.nn as nn
from torchvision.models import resnet18, ResNet18_Weights


def _make_resnet_backbone(dropout: float, freeze_backbone: bool, num_labels: int = None):
    """
    공통 ResNet18 백본 생성 헬퍼.
    num_labels=None 이면 fc를 Identity로 두어 512d 특징만 출력.
    """
    backbone = resnet18(weights=ResNet18_Weights.IMAGENET1K_V1)

    # conv1: 3채널 → 1채널 (pretrained 가중치 평균으로 초기화)
    old_conv1 = backbone.conv1
    new_conv1 = nn.Conv2d(
        in_channels=1,
        out_channels=old_conv1.out_channels,
        kernel_size=old_conv1.kernel_size,
        stride=old_conv1.stride,
        padding=old_conv1.padding,
        bias=False,
    )
    new_conv1.weight.data = old_conv1.weight.data.mean(dim=1, keepdim=True)
    backbone.conv1 = new_conv1

    if num_labels is None:
        backbone.fc = nn.Identity()
    else:
        backbone.fc = nn.Sequential(
            nn.Dropout(dropout),
            nn.Linear(backbone.fc.in_features, num_labels),
        )

    if freeze_backbone:
        for name, param in backbone.named_parameters():
            if not any(name.startswith(p) for p in ("layer3", "layer4", "fc")):
                param.requires_grad = False

    return backbone


class GraphoVisionResNet(nn.Module):
    """
    CNN 단독 모델 (기존 버전 — 하위 호환용)

    입력: (B, 1, 224, 224)
    출력: (B, num_labels)
    """

    def __init__(self, num_labels: int = 5, dropout: float = 0.3, freeze_backbone: bool = False):
        super().__init__()
        self.model = _make_resnet_backbone(dropout, freeze_backbone, num_labels)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.model(x)


class GraphoVisionHybrid(nn.Module):
    """
    이중 브랜치 모델 — CNN + 수작업 필기 특징 결합

    입력:
      x        : (B, 1, 224, 224)  그레이스케일 이미지
      features : (B, 5)            정규화된 수작업 특징
                   [0] baseline_angle
                   [1] letter_size
                   [2] word_spacing
                   [3] pen_pressure
                   [4] slant_angle

    출력: (B, num_labels) 로짓

    구조:
      CNN 브랜치     : ResNet18 backbone → 512d
      Feature 브랜치 : Linear(5→32) → ReLU → Linear(32→32) → ReLU
      Fusion         : concat(512, 32) → Dropout → Linear(544, num_labels)
    """

    CNN_DIM     = 512
    FEATURE_DIM = 5
    HIDDEN_DIM  = 32

    def __init__(self, num_labels: int = 5, dropout: float = 0.3, freeze_backbone: bool = False):
        super().__init__()

        # ── Branch 1: CNN ──────────────────────────────────────────
        self.cnn = _make_resnet_backbone(dropout=0.0, freeze_backbone=freeze_backbone)
        # Identity fc → 512d 출력

        # ── Branch 2: Feature MLP ──────────────────────────────────
        self.feature_mlp = nn.Sequential(
            nn.Linear(self.FEATURE_DIM, self.HIDDEN_DIM),
            nn.BatchNorm1d(self.HIDDEN_DIM),
            nn.ReLU(),
            nn.Linear(self.HIDDEN_DIM, self.HIDDEN_DIM),
            nn.ReLU(),
        )

        # ── Fusion ─────────────────────────────────────────────────
        fusion_dim = self.CNN_DIM + self.HIDDEN_DIM   # 544
        self.classifier = nn.Sequential(
            nn.Dropout(dropout),
            nn.Linear(fusion_dim, num_labels),
        )

    def forward(self, x: torch.Tensor, features: torch.Tensor) -> torch.Tensor:
        cnn_feat  = self.cnn(x)                          # (B, 512)
        hand_feat = self.feature_mlp(features)           # (B, 32)
        combined  = torch.cat([cnn_feat, hand_feat], dim=1)  # (B, 544)
        return self.classifier(combined)

    def freeze_backbone(self, freeze: bool = True):
        """학습 중 백본 freeze/unfreeze 전환용 헬퍼"""
        for name, param in self.cnn.named_parameters():
            if any(name.startswith(p) for p in ("layer3", "layer4")):
                param.requires_grad = True
            else:
                param.requires_grad = not freeze


# ─────────────────────────────────────────────
# 단독 실행 시: 두 모델 구조 비교
# ─────────────────────────────────────────────

if __name__ == "__main__":
    B = 4
    img   = torch.randn(B, 1, 224, 224)
    feats = torch.randn(B, 5)

    print("=" * 50)
    print("GraphoVisionResNet (CNN 단독)")
    model_base = GraphoVisionResNet(num_labels=5)
    out = model_base(img)
    print(f"  입력: {img.shape}  →  출력: {out.shape}")
    total = sum(p.numel() for p in model_base.parameters())
    print(f"  파라미터: {total:,}")

    print()
    print("=" * 50)
    print("GraphoVisionHybrid (CNN + 수작업 특징)")
    model_hyb = GraphoVisionHybrid(num_labels=5)
    out = model_hyb(img, feats)
    print(f"  이미지 입력: {img.shape}")
    print(f"  특징 입력  : {feats.shape}")
    print(f"  출력       : {out.shape}")
    total = sum(p.numel() for p in model_hyb.parameters())
    print(f"  파라미터: {total:,}")
