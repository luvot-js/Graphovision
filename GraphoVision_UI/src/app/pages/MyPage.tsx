import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { TopNav } from "../components/ui/TopNav";
import { Card } from "../components/ui/Card";
import { BottomNav } from "../components/ui/BottomNav";
import { ChevronRight, LogOut } from "lucide-react";
import { Radar, RadarChart, PolarGrid, ResponsiveContainer } from "recharts";
import { userApi, historyApi } from "../../lib/api";
import { removeToken } from "../../lib/auth";

const TRAITS = ['정서 안정성', '정신력/의지력', '겸손', '유연성', '독립성'];

function MiniRadar({ scores }: { scores: number[] }) {
  const data = scores.map((v, i) => ({ subject: `p${i}`, v: Math.round(v * 100) }));
  const chartKey = `mini-radar-${scores.join("-")}`;
  return (
    <div className="h-[60px] w-[60px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} key={chartKey}>
          <PolarGrid key={`${chartKey}-grid`} />
          <Radar key={`${chartKey}-radar`} dataKey="v" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.25} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function MyPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ nickname: string; email: string; credits: number } | null>(null);
  const [history, setHistory] = useState<{ id: string; scores: number[]; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([userApi.me(), historyApi.list()])
      .then(([u, h]) => { setUser(u); setHistory(h); })
      .catch(() => navigate("/login"))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    removeToken();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-white">
        <p className="text-warm-brown">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-white pb-24">
      <TopNav title="마이페이지" showBack={false} />

      <div className="px-5 pt-6 space-y-8">
        <Card className="flex flex-col p-6">
          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo/10 text-indigo">
              <span className="text-[20px] font-bold">{user?.nickname?.[0] ?? "?"}</span>
            </div>
            <div>
              <div className="text-[18px] font-semibold text-charcoal">{user?.nickname}</div>
              <div className="text-[13px] text-warm-brown">{user?.email}</div>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-warm-beige/30 p-4">
            <span className="text-[15px] font-medium text-charcoal">보유 크레딧: {user?.credits ?? 0} cr</span>
            <Link to="/billing" className="text-[13px] font-semibold text-indigo hover:underline">
              충전하기 →
            </Link>
          </div>
        </Card>

        <div>
          <h3 className="mb-4 text-[18px] font-semibold text-charcoal">검사 히스토리</h3>
          {history.length === 0 ? (
            <p className="text-[14px] text-warm-brown">아직 검사 기록이 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {history.map((item) => {
                const mean = item.scores.reduce((a, b) => a + b, 0) / item.scores.length;
                return (
                  <Card
                    key={item.id}
                    className="flex cursor-pointer items-center p-4 transition-colors hover:bg-gray-50"
                    onClick={() => navigate(`/result/${item.id}`)}
                  >
                    <MiniRadar scores={item.scores} />
                    <div className="ml-4 flex-1">
                      <div className="text-[13px] text-warm-brown">{formatDate(item.created_at)}</div>
                      <div className="text-[13px] text-warm-brown">평균 점수: {mean.toFixed(2)}</div>
                    </div>
                    <ChevronRight size={20} className="text-warm-gray" />
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <div className="pt-8 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center text-[15px] text-warm-brown hover:text-charcoal"
          >
            <LogOut size={18} className="mr-2" /> 로그아웃
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
