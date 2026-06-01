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
    sorted_idx = sorted(range(5), key=lambda i: scores[i], reverse=True)
    top2 = [TRAIT_NAMES_KR[i] for i in sorted_idx[:2]]

    reframe = {
        "정서 안정성":    ("감정의 흐름에 솔직하고 풍부한 내면을 지닌 사람", "안정적인 심리 상태로 어떤 상황에서도 중심을 잡는 사람"),
        "정신력/의지력":  ("자신만의 속도로 유연하게 움직이는 사람",         "한번 마음먹은 일은 끝까지 해내는 강인한 의지를 가진 사람"),
        "겸손":           ("당당하게 자신을 표현할 줄 아는 주체적인 사람",   "타인의 말에 귀 기울이며 배움을 멈추지 않는 사람"),
        "개인적 조화":    ("주변에 휘둘리지 않고 줏대 있는 사람",           "내면의 균형이 잘 잡혀 어디서든 안정감을 주는 사람"),
        "사회적 고립":    ("사교적이고 에너지 넘치는 관계의 중심인 사람",    "독립적이고 자기만의 세계가 깊은 사람"),
    }

    top_desc = reframe[top2[0]][1]
    second_desc = reframe[top2[1]][1]

    title = f"나의 필기체 성격 유형은:\n{reframe[top2[0]][1].rstrip('사람')}이면서 {reframe[top2[1]][0]}"

    body = (
        f"{top_desc} 동시에 {second_desc} "
        "이 두 가지 성향이 조화를 이루며 당신만의 독특한 매력을 만들어냅니다. "
        "필체에서 드러나는 이 특징들은 단순한 습관이 아니라 당신이 세상을 바라보는 방식 그 자체입니다."
    )

    advice = (
        "이러한 성향은 깊은 집중이 필요한 환경에서 가장 빛을 발합니다. "
        "혼자만의 시간을 충분히 확보하고, 자신의 리듬을 존중하는 방식으로 일할 때 최고의 결과를 만들어내는 편입니다."
    )

    return f"{title}\n\n{body}\n\n{advice}"


def _build_prompt(scores: list[float]) -> str:
    trait_lines = "\n".join(
        f"{name}: {score:.0%}"
        for name, score in zip(TRAIT_NAMES_KR, scores)
    )

    sorted_idx = sorted(range(5), key=lambda i: scores[i], reverse=True)
    top2 = [TRAIT_NAMES_KR[i] for i in sorted_idx[:2]]

    return f"""당신은 사람의 마음을 통찰력 있게 읽어내는 수석 심리 분석가이자, 매력적인 글을 쓰는 카피라이터입니다.
아래 5가지 필기체 심리 지표 점수를 바탕으로, 유명 MBTI 테스트 결과지처럼 몰입감 있고 트렌디한 성격 분석 리포트를 작성해 주세요.

[작성 규칙]
1. 별표(**)나 샵(#) 같은 마크다운 특수기호를 절대 사용하지 마세요. 깔끔한 평문으로 작성하세요.
2. '정신력 98% 높음'처럼 수치나 지표명을 기계적으로 나열하지 마세요. 수치는 분석을 위한 참고용으로만 쓰고, 자연스러운 줄글 형태로 스토리텔링하세요.
3. 부정적인 의미의 지표를 긍정적이고 매력적인 단어로 리프레이밍(Reframing) 하세요.
   - 예: '사회적 고립'이 높다면 -> "독립적이고 자기만의 세계가 깊은 사람"
   - 예: '개인적 조화'가 낮다면 -> "주변에 휘둘리지 않고 줏대 있는 사람"
4. 문체는 "~합니다", "~하는 편입니다"와 같이 부드럽고 친절한 존댓말을 사용하세요.

[출력 양식] (반드시 아래 구조를 따르세요)

나의 필기체 성격 유형은:
(가장 높은 특징 2개를 조합하여, 예: '흔들림 없는 의지를 지닌 독립적인 개척자'처럼 매력적인 타이틀을 1줄로 작성)

(엔터 1번 띄우고)
(이 사람의 전반적인 성격과 강점을 묘사하는 3~4문장 분량의 상세 분석. 가장 두드러지는 특징들을 엮어서 "어떤 사람인지" 묘사할 것.)

(엔터 1번 띄우고)
(이런 성격이 일상이나 업무에서 어떻게 긍정적으로 발휘될 수 있는지, 혹은 어떤 환경에서 가장 빛을 발하는지 2~3문장으로 조언.)

[입력 데이터]
{trait_lines}

가장 두드러진 지표: {top2[0]}, {top2[1]}"""


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
