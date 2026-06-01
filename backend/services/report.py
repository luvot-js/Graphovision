"""
services/report.py
------------------
5개 지표 점수 → 심리 리포트 텍스트 생성

기본: 룰 기반 템플릿 (GEMINI_API_KEY 없어도 동작)
선택: GEMINI_API_KEY 환경변수 설정 시 Gemini 2.5 Flash 사용
"""

import os

TRAIT_NAMES_KR = ["정서 안정성", "정신력/의지력", "겸손", "개인적 조화", "사회적 고립"]

_HIGH = [
    "감정 기복이 적고 안정적인 심리 상태를 유지합니다.",
    "강한 의지와 집중력으로 목표를 끝까지 추구하는 경향이 있습니다.",
    "자신을 내세우기보다 겸손하게 행동하며 타인의 의견을 잘 수용합니다.",
    "내면의 균형이 잘 잡혀 있고 주변과 조화를 이루며 생활합니다.",
    "혼자만의 시간을 중요하게 여기며 내향적인 성향을 가집니다.",
]
_LOW = [
    "감정 변화가 크거나 스트레스에 민감한 편입니다.",
    "목표를 향한 지속력이 다소 부족하거나 쉽게 포기하는 경향이 있습니다.",
    "자기 표현이 강하고 자신감 있게 의견을 제시하는 편입니다.",
    "내면 갈등이 있거나 주변 환경에 적응하는 데 어려움을 겪을 수 있습니다.",
    "사교적이고 타인과의 교류를 즐기는 외향적 성향을 가집니다.",
]


def _rule_based_report(scores: list[float]) -> str:
    lines = ["## 필기 성격 분석 결과\n"]
    for i, (score, name) in enumerate(zip(scores, TRAIT_NAMES_KR)):
        level = "높음" if score >= 0.5 else "낮음"
        desc = _HIGH[i] if score >= 0.5 else _LOW[i]
        lines.append(f"**{name}** ({score:.0%}) — {level}\n{desc}\n")

    sorted_idx = sorted(range(5), key=lambda i: scores[i], reverse=True)
    top_names = [TRAIT_NAMES_KR[i] for i in sorted_idx[:2]]
    lines.append(
        f"---\n종합적으로 **{top_names[0]}**과 **{top_names[1]}**이 "
        "두드러지는 성격 유형입니다. 필기 특징에서 드러나는 이 성향은 "
        "일상적인 의사결정 방식과 대인관계 스타일에도 영향을 줄 수 있습니다."
    )
    return "\n".join(lines)


def _build_prompt(scores: list[float]) -> str:
    trait_lines = "\n".join(
        f"- {name}: {score:.0%} ({'높음' if score >= 0.5 else '낮음'})"
        for name, score in zip(TRAIT_NAMES_KR, scores)
    )

    sorted_idx = sorted(range(5), key=lambda i: scores[i], reverse=True)
    top2 = [TRAIT_NAMES_KR[i] for i in sorted_idx[:2]]
    low1 = TRAIT_NAMES_KR[sorted_idx[-1]]

    return f"""당신은 필기 분석 전문가입니다. 사용자의 필기에서 추출된 심리 지표 점수를 바탕으로 따뜻하고 통찰력 있는 성격 분석 리포트를 작성해주세요.

## 분석된 성격 지표 점수
{trait_lines}

## 지표 설명
- 정서 안정성: 높을수록 감정이 안정적, 낮을수록 감정 기복이 큼
- 정신력/의지력: 높을수록 강한 의지와 집중력, 낮을수록 지속력 부족
- 겸손: 높을수록 겸손하고 수용적, 낮을수록 자기 표현이 강함
- 개인적 조화: 높을수록 내면 균형이 좋음, 낮을수록 내면 갈등 있음
- 사회적 고립: 높을수록 내향적, 낮을수록 외향적

## 작성 지침
- 가장 두드러진 특성({top2[0]}, {top2[1]})을 중심으로 서술하세요
- 가장 낮은 지표({low1})가 주는 보완적 측면도 언급하세요
- 200자 내외의 한국어로 작성하세요
- 존댓말을 사용하고, 단정짓기보다 가능성으로 표현하세요 (예: "~하는 경향이 있습니다", "~할 수 있습니다")
- 부정적 표현보다 강점 중심으로 서술하세요
- 마크다운 없이 순수 텍스트로만 작성하세요"""


def _gemini_report(scores: list[float]) -> str:
    try:
        from google import genai

        api_key = os.environ.get("GEMINI_API_KEY")
        client = genai.Client(api_key=api_key)

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=_build_prompt(scores),
        )
        return response.text.strip()
    except Exception:
        return _rule_based_report(scores)


def generate_report(scores: list[float]) -> str:
    if os.environ.get("GEMINI_API_KEY"):
        return _gemini_report(scores)
    return _rule_based_report(scores)
