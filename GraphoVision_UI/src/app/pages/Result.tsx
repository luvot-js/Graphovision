import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Share2, Link as LinkIcon, RefreshCw, Users } from "lucide-react";
import { TopNav } from "../components/ui/TopNav";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { motion } from "motion/react";
import { analyzeApi } from "../../lib/api";

const TRAITS = ['정서 안정성', '정신력/의지력', '겸손', '유연성', '독립성'];

function getColorForScore(score: number) {
  if (score < 0.3) return "bg-radar-b";
  if (score < 0.6) return "bg-amber";
  return "bg-sage-green";
}

export function Result() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [scores, setScores] = useState<number[]>([]);
  const [report, setReport] = useState("");
  const [reportText, setReportText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    analyzeApi.getResult(id)
      .then((res) => {
        setScores(res.scores);
        setReport(res.report || "");
      })
      .catch((err) => setError(err.message || "결과를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [id]);

  // 타이핑 효과
  useEffect(() => {
    if (!report) return;
    let i = 0;
    setReportText("");
    const interval = setInterval(() => {
      setReportText(report.slice(0, i));
      i++;
      if (i > report.length) clearInterval(interval);
    }, 20);
    return () => clearInterval(interval);
  }, [report]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-white">
        <p className="text-warm-brown">결과 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-cream-white px-5">
        <p className="mb-4 text-red-500">{error}</p>
        <Button onClick={() => navigate("/test")}>다시 검사하기</Button>
      </div>
    );
  }

  const chartData = TRAITS.map((trait, i) => ({
    subject: `${trait}_${i}`,
    name: trait,
    value: Math.round((scores[i] ?? 0) * 100),
    fullMark: 100,
  }));

  return (
    <div className="min-h-screen bg-cream-white pb-10">
      <TopNav title="분석 결과" />

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
              const score = scores[i] ?? 0;
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

        {report && (
          <div>
            <h3 className="mb-4 text-[18px] font-semibold text-charcoal">AI 분석 리포트</h3>
            <Card className="bg-white/80 p-5">
              <p className="text-[15px] leading-relaxed text-charcoal whitespace-pre-line">
                {reportText}
                <span className="animate-pulse inline-block w-1.5 h-4 ml-1 bg-indigo align-middle" />
              </p>
            </Card>
          </div>
        )}

        <div className="flex justify-center gap-3">
          <button
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-charcoal shadow-sm transition hover:bg-gray-50"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              });
            }}
            title="링크 복사"
          >
            <LinkIcon size={20} />
          </button>
        </div>

        {copied && (
          <div className="fixed bottom-28 left-1/2 -translate-x-1/2 rounded-full bg-charcoal px-5 py-2.5 text-[13px] text-white shadow-lg">
            링크가 복사됐어요!
          </div>
        )}

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
