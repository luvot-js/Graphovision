"""
services/compatibility_report.py
---------------------------------
두 사람의 5개 지표 점수 → 궁합 리포트 텍스트 생성

기본: 룰 기반 템플릿 (GEMINI_API_KEY 없어도 동작)
선택: GEMINI_API_KEY 환경변수 설정 시 Gemini 2.5 Flash 사용
"""

import os

TRAIT_NAMES_KR = ["정서 안정성", "정신력/의지력", "겸손", "유연성", "독립성"]


def _rule_based_report(scores_a: list[float], scores_b: list[float]) -> str:
    diffs = [abs(a - b) for a, b in zip(scores_a, scores_b)]
    synergy = [TRAIT_NAMES_KR[i] for i in range(5) if scores_a[i] >= 0.7 and scores_b[i] >= 0.7]
    caution = [TRAIT_NAMES_KR[i] for i in range(5) if diffs[i] >= 0.4]

    if synergy:
        synergy_desc = f"{', '.join(synergy)} 면에서 강한 공감대를 형성하며 서로를 깊이 이해하는 사이입니다."
    else:
        synergy_desc = "두 사람은 서로 다른 강점으로 상대방의 빈자리를 채워주는 보완적인 관계입니다."

    if caution:
        caution_desc = f"{', '.join(caution)} 부분에서 성향 차이가 있어 가끔 오해가 생길 수 있지만, 서로의 다름을 존중한다면 오히려 더 단단한 관계가 될 수 있습니다."
    else:
        caution_desc = "전반적으로 균형 잡힌 궁합으로, 큰 갈등 없이 자연스럽게 맞춰가는 편입니다."

    title = "우리 두 사람의 시너지 타이틀:\n서로의 결을 채워주는 따뜻한 동반자"
    body = f"{synergy_desc} 함께할수록 서로의 존재가 더 빛나는 관계입니다. 각자의 개성이 뚜렷하기에 함께 있을 때 더 큰 가능성을 만들어냅니다."
    advice = f"{caution_desc} 상대방의 페이스를 인정하고 여유를 갖는 것이 이 관계를 더욱 깊게 만드는 열쇠입니다."

    return f"{title}\n\n{body}\n\n{advice}"


def _build_prompt(scores_a: list[float], scores_b: list[float]) -> str:
    def fmt(scores):
        return ", ".join(f"{TRAIT_NAMES_KR[i]}:{round(scores[i]*100)}%" for i in range(5))

    return f"""당신은 사람 간의 관계 역학을 날카롭게 짚어내는 관계 심리 전문가이자 매력적인 카피라이터입니다.
사용자 A와 사용자 B의 5가지 필기체 심리 지표 점수를 비교하여, 두 사람의 궁합과 시너지를 심층적으로 분석하는 리포트를 작성해 주세요.

[작성 규칙]
1. 별표(**)나 샵(#) 같은 마크다운 특수기호는 절대 사용하지 마세요. 깔끔한 평문으로 작성하세요.
2. 수치(%)를 그대로 노출하지 말고, 두 사람의 점수 차이나 공통점을 바탕으로 '어떤 상호작용'이 일어나는지 스토리텔링하세요.
3. 긍정적인 시너지를 강조하되, 성향 차이로 인해 발생할 수 있는 '귀여운 갈등 요소'와 '해결책'도 부드럽게 조언해 주세요.
4. 문체는 "~합니다", "~하는 편입니다"와 같이 다정하고 전문적인 존댓말을 사용하세요.

[출력 양식] (반드시 아래 3단락 구조를 따르세요)

우리 두 사람의 시너지 타이틀:
(두 사람의 관계를 요약하는 비유적이고 매력적인 한 줄 타이틀, 예: 흔들리지 않는 닻과 유연한 돛의 완벽한 항해)

(엔터 1번 띄우고)
(두 사람의 시너지 및 강점 분석: 3~4문장. 비슷한 점이 있다면 어떤 깊은 공감대가 형성되는지, 다른 점이 있다면 어떻게 서로의 단점을 완벽하게 보완해 주는지 구체적으로 묘사하세요.)

(엔터 1번 띄우고)
(더 완벽한 관계를 위한 조언: 2~3문장. 두 사람의 성향 차이로 인해 조심해야 할 부분이나, 서로를 대할 때 필요한 태도를 따뜻하게 조언하세요.)

[입력 데이터]
사용자 A - {fmt(scores_a)}
사용자 B - {fmt(scores_b)}"""


def _gemini_report(scores_a: list[float], scores_b: list[float]) -> str:
    try:
        from google import genai

        api_key = os.environ.get("GEMINI_API_KEY")
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=_build_prompt(scores_a, scores_b),
        )
        return response.text.strip()
    except Exception:
        return _rule_based_report(scores_a, scores_b)


def generate_compatibility_report(scores_a: list[float], scores_b: list[float]) -> str:
    if os.environ.get("GEMINI_API_KEY"):
        return _gemini_report(scores_a, scores_b)
    return _rule_based_report(scores_a, scores_b)
