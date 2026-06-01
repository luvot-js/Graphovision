import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { TopNav } from "../components/ui/TopNav";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { BottomNav } from "../components/ui/BottomNav";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { RefreshCw, CheckCircle2, Plus } from "lucide-react";
import { motion } from "motion/react";
import { historyApi, compatibilityApi } from "../../lib/api";

const TRAITS = ['정서 안정성', '정신력/의지력', '겸손', '유연성', '독립성'];

type HistoryItem = {
  id: string;
  scores: number[];
  created_at: string;
  name: string;
};

type CompatibilityResult = {
  harmony_score: number;
  synergy_traits: string[];
  caution_traits: string[];
  scores_a: number[];
  scores_b: number[];
  report?: string;
};

function getNameFromStorage(id: string): string {
  return localStorage.getItem(`gv_name_${id}`) || "이름 없음";
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export function Compatibility() {
  const navigate = useNavigate();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId1, setSelectedId1] = useState<string | null>(null);
  const [selectedId2, setSelectedId2] = useState<string | null>(null);
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    historyApi.list()
      .then((items) => {
        setHistory(items.map((item) => ({
          ...item,
          name: getNameFromStorage(item.id),
        })));
      })
      .catch(() => setError("히스토리를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  const person1 = history.find((h) => h.id === selectedId1);
  const person2 = history.find((h) => h.id === selectedId2);

  const handleStartAnalysis = async () => {
    if (!selectedId1 || !selectedId2) return;
    setAnalyzing(true);
    setError("");
    try {
      const res = await compatibilityApi.compare(selectedId1, selectedId2);
      setResult(res);
    } catch (err: any) {
      setError(err.message || "궁합 분석에 실패했습니다.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReset = () => {
    setSelectedId1(null);
    setSelectedId2(null);
    setResult(null);
    setError("");
  };

  const radarData = result && person1 && person2
    ? TRAITS.map((trait, i) => ({
        subject: `${trait}_${i}`,
        name: trait,
        [person1.name]: Math.round(result.scores_a[i] * 100),
        [person2.name]: Math.round(result.scores_b[i] * 100),
        fullMark: 100,
      }))
    : [];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-white">
        <p className="text-warm-brown">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-white pb-24">
      <TopNav title="필기 궁합" showBack={false} />

      <div className="px-5 pt-6 space-y-8">
        {!result ? (
          <>
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <p className="text-[15px] text-warm-brown text-center">
                  아직 분석한 필체가 없어요.<br />먼저 필체 분석을 진행해 주세요.
                </p>
                <Button onClick={() => navigate("/test")}>
                  <Plus size={18} className="mr-2" /> 필체 분석하러 가기
                </Button>
              </div>
            ) : (
              <>
                <div>
                  <h3 className="mb-3 text-[16px] font-semibold text-charcoal">첫 번째 사람 선택</h3>
                  <div className="space-y-2">
                    {history.map((item) => (
                      <Card
                        key={item.id}
                        className={`cursor-pointer p-4 transition-all ${
                          selectedId1 === item.id
                            ? "border-2 border-indigo bg-indigo/5"
                            : "border border-gray-200 hover:bg-gray-50"
                        }`}
                        onClick={() => {
                          setSelectedId1(item.id);
                          if (selectedId2 === item.id) setSelectedId2(null);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-[15px] font-semibold text-charcoal">{item.name}</div>
                            <div className="text-[13px] text-warm-brown">{formatDate(item.created_at)} 분석</div>
                          </div>
                          {selectedId1 === item.id && <CheckCircle2 size={20} className="text-indigo" />}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                {selectedId1 && (
                  <div>
                    <h3 className="mb-3 text-[16px] font-semibold text-charcoal">두 번째 사람 선택</h3>
                    <div className="space-y-2">
                      {history.filter((h) => h.id !== selectedId1).map((item) => (
                        <Card
                          key={item.id}
                          className={`cursor-pointer p-4 transition-all ${
                            selectedId2 === item.id
                              ? "border-2 border-indigo bg-indigo/5"
                              : "border border-gray-200 hover:bg-gray-50"
                          }`}
                          onClick={() => setSelectedId2(item.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-[15px] font-semibold text-charcoal">{item.name}</div>
                              <div className="text-[13px] text-warm-brown">{formatDate(item.created_at)} 분석</div>
                            </div>
                            {selectedId2 === item.id && <CheckCircle2 size={20} className="text-indigo" />}
                          </div>
                        </Card>
                      ))}

                      {history.filter((h) => h.id !== selectedId1).length === 0 && (
                        <div className="rounded-2xl border border-dashed border-warm-gray p-5 text-center">
                          <p className="mb-3 text-[14px] text-warm-brown">비교할 다른 사람의 필체가 없어요</p>
                          <Button variant="secondary" onClick={() => navigate("/test")}>
                            <Plus size={16} className="mr-1.5" /> 필체 추가하기
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {error && <p className="text-[13px] text-red-500">{error}</p>}

                {selectedId1 && selectedId2 && (
                  <Button fullWidth onClick={handleStartAnalysis} disabled={analyzing}>
                    {analyzing ? "분석 중..." : "궁합 분석 시작"}
                  </Button>
                )}
              </>
            )}
          </>
        ) : (
          <>
            <div className="flex justify-between items-center rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-[#3B82F6]" />
                <span className="text-[15px] font-semibold text-charcoal">{person1?.name}</span>
              </div>
              <div className="text-warm-gray">vs</div>
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-semibold text-charcoal">{person2?.name}</span>
                <div className="h-3 w-3 rounded-full bg-[#EF4444]" />
              </div>
            </div>

            <Card className="flex flex-col items-center justify-center p-2">
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="name" tick={{ fontSize: 12, fill: '#7A6A5A' }} />
                  <Radar
                    name={person1?.name}
                    dataKey={person1?.name ?? ""}
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.2}
                  />
                  <Radar
                    name={person2?.name}
                    dataKey={person2?.name ?? ""}
                    stroke="#EF4444"
                    fill="#EF4444"
                    fillOpacity={0.2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </Card>

            <div>
              <h3 className="mb-4 text-[18px] font-semibold text-charcoal">궁합 점수</h3>
              <Card className="flex items-center justify-between p-5">
                <div>
                  <p className="text-[15px] font-semibold text-charcoal">전체 조화도</p>
                  <div className="mt-2 h-2 w-32 overflow-hidden rounded-full bg-warm-gray/30">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${result.harmony_score}%` }}
                      transition={{ duration: 1 }}
                      className="h-full bg-indigo"
                    />
                  </div>
                </div>
                <div className="text-[28px] font-bold text-indigo">{result.harmony_score}%</div>
              </Card>
            </div>

            <div className="grid gap-4 grid-cols-1">
              {result.synergy_traits.length > 0 && (
                <Card className="border-l-4 border-l-sage-green bg-white/80 p-5">
                  <div className="mb-2 text-[13px] font-bold text-sage-green">시너지 분석</div>
                  <p className="text-[15px] leading-relaxed text-charcoal">
                    💡 두 사람의 {result.synergy_traits.join(", ")}이 비슷해 강력한 팀이 될 수 있어요!
                  </p>
                </Card>
              )}
              {result.caution_traits.length > 0 && (
                <Card className="border-l-4 border-l-amber bg-white/80 p-5">
                  <div className="mb-2 text-[13px] font-bold text-amber">주의 포인트</div>
                  <p className="text-[15px] leading-relaxed text-charcoal">
                    ⚠️ {result.caution_traits.join(", ")} 차이가 커서 오해가 생길 수 있어요
                  </p>
                </Card>
              )}
              {result.synergy_traits.length === 0 && result.caution_traits.length === 0 && (
                <Card className="bg-white/80 p-5">
                  <p className="text-[15px] text-warm-brown text-center">전반적으로 균형 잡힌 궁합이에요!</p>
                </Card>
              )}
            </div>

            {result.report && (
              <div>
                <h3 className="mb-4 text-[18px] font-semibold text-charcoal">AI 궁합 리포트</h3>
                <Card className="bg-white/80 p-5">
                  <p className="text-[15px] leading-relaxed text-charcoal whitespace-pre-line">
                    {result.report}
                  </p>
                </Card>
              </div>
            )}

            <div className="flex flex-col gap-3 pt-4">
              <Button variant="secondary" fullWidth onClick={handleReset}>
                <RefreshCw size={18} className="mr-2" /> 다시 비교하기
              </Button>
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
