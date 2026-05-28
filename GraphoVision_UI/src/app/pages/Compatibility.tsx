import React, { useState } from "react";
import { TopNav } from "../components/ui/TopNav";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { BottomNav } from "../components/ui/BottomNav";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { Share2, RefreshCw, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";

const TRAITS = ['정서', '사회성', '에너지', '의지력', '감수성'];

const MOCK_ANALYSES = [
  { id: "1", name: "지훈", date: "2026.05.23", scores: [82, 64, 71, 89, 78] },
  { id: "2", name: "민지", date: "2026.05.20", scores: [75, 80, 60, 85, 50] },
  { id: "3", name: "수진", date: "2026.05.18", scores: [70, 75, 65, 80, 70] },
];

export function Compatibility() {
  const [selectedPerson1, setSelectedPerson1] = useState<string | null>(null);
  const [selectedPerson2, setSelectedPerson2] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  const person1 = MOCK_ANALYSES.find(p => p.id === selectedPerson1);
  const person2 = MOCK_ANALYSES.find(p => p.id === selectedPerson2);

  const mergedData = person1 && person2 ? TRAITS.map((trait, i) => ({
    subject: `${trait}_${i}`,
    name: trait,
    [person1.name]: person1.scores[i],
    [person2.name]: person2.scores[i],
    fullMark: 100
  })) : [];

  const handleStartAnalysis = () => {
    if (selectedPerson1 && selectedPerson2) {
      setShowComparison(true);
    }
  };

  const handleReset = () => {
    setSelectedPerson1(null);
    setSelectedPerson2(null);
    setShowComparison(false);
  };

  return (
    <div className="min-h-screen bg-cream-white pb-24">
      <TopNav title="필기 궁합" showBack={false} />

      <div className="px-5 pt-6 space-y-8">
        {!showComparison ? (
          <>
            <div>
              <h3 className="mb-3 text-[16px] font-semibold text-charcoal">첫 번째 사람 선택</h3>
              <div className="space-y-2">
                {MOCK_ANALYSES.map((person) => (
                  <Card
                    key={person.id}
                    className={`cursor-pointer p-4 transition-all ${
                      selectedPerson1 === person.id
                        ? "border-2 border-indigo bg-indigo/5"
                        : "border border-gray-200 hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedPerson1(person.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[15px] font-semibold text-charcoal">{person.name}</div>
                        <div className="text-[13px] text-warm-brown">{person.date} 분석</div>
                      </div>
                      {selectedPerson1 === person.id && (
                        <CheckCircle2 size={20} className="text-indigo" />
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {selectedPerson1 && (
              <div>
                <h3 className="mb-3 text-[16px] font-semibold text-charcoal">두 번째 사람 선택</h3>
                <div className="space-y-2">
                  {MOCK_ANALYSES.filter(p => p.id !== selectedPerson1).map((person) => (
                    <Card
                      key={person.id}
                      className={`cursor-pointer p-4 transition-all ${
                        selectedPerson2 === person.id
                          ? "border-2 border-indigo bg-indigo/5"
                          : "border border-gray-200 hover:bg-gray-50"
                      }`}
                      onClick={() => setSelectedPerson2(person.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[15px] font-semibold text-charcoal">{person.name}</div>
                          <div className="text-[13px] text-warm-brown">{person.date} 분석</div>
                        </div>
                        {selectedPerson2 === person.id && (
                          <CheckCircle2 size={20} className="text-indigo" />
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {selectedPerson1 && selectedPerson2 && (
              <Button fullWidth onClick={handleStartAnalysis}>
                궁합 분석 시작
              </Button>
            )}
          </>
        ) : (
          <>
            <div className="flex justify-between items-center rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-radar-a" />
                <span className="text-[15px] font-semibold text-charcoal">{person1.name}</span>
              </div>
              <div className="text-warm-gray">vs</div>
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-semibold text-charcoal">{person2.name}</span>
                <div className="h-3 w-3 rounded-full bg-radar-b" />
              </div>
            </div>

            <Card className="flex flex-col items-center justify-center p-2">
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={mergedData} key="compatibility-radar-chart">
                  <PolarGrid key="polar-grid-comp" />
                  <PolarAngleAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: '#7A6A5A' }}
                    key="polar-angle-axis-comp"
                  />
                  <Radar
                    key={`radar-${person1.id}`}
                    name={person1.name}
                    dataKey={person1.name}
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.2}
                  />
                  <Radar
                    key={`radar-${person2.id}`}
                    name={person2.name}
                    dataKey={person2.name}
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
                      animate={{ width: "87%" }}
                      transition={{ duration: 1 }}
                      className="h-full bg-indigo"
                    />
                  </div>
                </div>
                <div className="text-[28px] font-bold text-indigo">87%</div>
              </Card>
            </div>

            <div className="grid gap-4 grid-cols-1">
              <Card className="border-l-4 border-l-sage-green bg-white/80 p-5">
                <div className="mb-2 text-[13px] font-bold text-sage-green">시너지 분석</div>
                <p className="text-[15px] leading-relaxed text-charcoal">
                  💡 두 사람의 의지력이 비슷해 강력한 팀이 될 수 있어요!
                </p>
              </Card>
              <Card className="border-l-4 border-l-amber bg-white/80 p-5">
                <div className="mb-2 text-[13px] font-bold text-amber">주의 포인트</div>
                <p className="text-[15px] leading-relaxed text-charcoal">
                  ⚠️ 감수성 차이가 커서 오해가 생길 수 있어요
                </p>
              </Card>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <Button fullWidth>
                <Share2 size={18} className="mr-2" /> 결과 공유하기
              </Button>
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
