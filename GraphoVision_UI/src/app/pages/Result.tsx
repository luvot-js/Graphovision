import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Share2, Link as LinkIcon, Download, RefreshCw, Users } from "lucide-react";
import { TopNav } from "../components/ui/TopNav";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { motion } from "motion/react";

const TRAITS = ['정서 안정성', '정신력/의지력', '겸손', '개인적 조화', '사회적 고립'];
const mockScores = [0.82, 0.64, 0.71, 0.89, 0.78];

const chartData = TRAITS.map((trait, i) => ({
  subject: `${trait}_${i}`,
  name: trait,
  value: Math.round(mockScores[i] * 100),
  fullMark: 100
}));

function getColorForScore(score: number) {
  if (score < 0.3) return "bg-radar-b";
  if (score < 0.6) return "bg-amber";
  return "bg-sage-green";
}

export function Result() {
  const navigate = useNavigate();
  const [reportText, setReportText] = useState("");
  const mockName = "지훈"; // Mock data - 실제로는 라우팅에서 전달받아야 함
  const fullReport = "당신의 필체에서는 강한 의지력과 높은 정서적 안정성이 느껴집니다. 글씨의 기울기와 필압을 보았을 때 목표를 향해 흔들림 없이 나아가는 성향을 지니셨네요. 동시에 유연한 사고방식을 가져 새로운 상황에서도 잘 적응하는 편입니다.";

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setReportText(fullReport.slice(0, i));
      i++;
      if (i > fullReport.length) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-cream-white pb-10">
      <TopNav title={`${mockName}님의 결과`} />

      <div className="px-5 pt-6 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="flex flex-col items-center justify-center p-2">
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={chartData} key="result-radar-chart">
                <PolarGrid key="polar-grid" />
                <PolarAngleAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#7A6A5A' }}
                  key="polar-angle-axis"
                />
                <Radar
                  key="radar-data"
                  dataKey="value"
                  stroke="#4F46E5"
                  fill="#4F46E5"
                  fillOpacity={0.25}
                />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        <div>
          <h3 className="mb-4 text-[18px] font-semibold text-charcoal">지표별 점수</h3>
          <div className="space-y-3">
            {TRAITS.map((trait, i) => {
              const score = mockScores[i];
              return (
                <div key={`trait-${i}`} className="flex items-center text-[13px]">
                  <span className="w-32 text-warm-brown">{trait}</span>
                  <div className="flex-1 px-2">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-warm-gray/30">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: score * 100 + '%' }}
                        transition={{ duration: 1, delay: i * 0.1 }}
                        className={'h-full ' + getColorForScore(score)}
                      />
                    </div>
                  </div>
                  <span className="w-8 text-right font-medium text-charcoal">{score.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-[18px] font-semibold text-charcoal">AI 분석 리포트</h3>
          <Card className="bg-white/80 p-5">
            <p className="text-[15px] leading-relaxed text-charcoal">
              {reportText}
              <span className="animate-pulse inline-block w-1.5 h-4 ml-1 bg-indigo align-middle" />
            </p>
          </Card>
        </div>

        <div className="flex justify-center gap-3">
          <button className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FAE100] text-black shadow-sm transition hover:opacity-80">
            <Share2 size={20} />
          </button>
          <button className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-charcoal shadow-sm transition hover:bg-gray-50">
            <LinkIcon size={20} />
          </button>
          <button className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-charcoal shadow-sm transition hover:bg-gray-50">
            <Download size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <Button variant="secondary" fullWidth onClick={() => navigate("/test")}>
            <RefreshCw size={18} className="mr-2" /> 다시 검사하기
          </Button>
          <Button fullWidth onClick={() => navigate("/compatibility")}>
            <Users size={18} className="mr-2" /> 친구와 비교하기
          </Button>
        </div>
      </div>
    </div>
  );
}
