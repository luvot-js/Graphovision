import React from "react";
import { Link, useNavigate } from "react-router";
import { TopNav } from "../components/ui/TopNav";
import { Card } from "../components/ui/Card";
import { BottomNav } from "../components/ui/BottomNav";
import { ChevronRight, LogOut, Radar as RadarIcon } from "lucide-react";
import { Radar, RadarChart, PolarGrid, ResponsiveContainer } from "recharts";

const MOCK_HISTORY = [
  { id: "1", name: "지훈", date: "2026.05.23 14:32", score: 0.71, data: [{ subject: "p0", v: 80 }, { subject: "p1", v: 60 }, { subject: "p2", v: 70 }, { subject: "p3", v: 90 }, { subject: "p4", v: 50 }, { subject: "p5", v: 30 }, { subject: "p6", v: 40 }, { subject: "p7", v: 80 }] },
  { id: "2", name: "민지", date: "2026.05.20 09:14", score: 0.65, data: [{ subject: "p0", v: 60 }, { subject: "p1", v: 50 }, { subject: "p2", v: 80 }, { subject: "p3", v: 70 }, { subject: "p4", v: 60 }, { subject: "p5", v: 40 }, { subject: "p6", v: 50 }, { subject: "p7", v: 60 }] },
];

function MiniRadar({ data }: { data: any[] }) {
  const chartKey = `mini-radar-${data[0]?.subject || Math.random()}`;
  return (
    <div className="h-[60px] w-[60px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} key={chartKey}>
          <PolarGrid key={`${chartKey}-grid`} />
          <Radar
            key={`${chartKey}-radar`}
            dataKey="v"
            stroke="#4F46E5"
            fill="#4F46E5"
            fillOpacity={0.25}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-cream-white pb-24">
      <TopNav title="마이페이지" showBack={false} />

      <div className="px-5 pt-6 space-y-8">
        <Card className="flex flex-col p-6">
          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo/10 text-indigo">
              <span className="text-[20px] font-bold">지</span>
            </div>
            <div>
              <div className="text-[18px] font-semibold text-charcoal">지훈</div>
              <div className="text-[13px] text-warm-brown">user@example.com</div>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-warm-beige/30 p-4">
            <span className="text-[15px] font-medium text-charcoal">보유 크레딧: 3 cr</span>
            <Link to="/billing" className="text-[13px] font-semibold text-indigo hover:underline">
              충전하기 →
            </Link>
          </div>
        </Card>

        <div>
          <h3 className="mb-4 text-[18px] font-semibold text-charcoal">검사 히스토리</h3>
          <div className="space-y-3">
            {MOCK_HISTORY.map((item) => (
              <Card
                key={item.id}
                className="flex cursor-pointer items-center p-4 transition-colors hover:bg-gray-50"
                onClick={() => navigate(`/mypage/history/${item.id}`)}
              >
                <MiniRadar data={item.data} />
                <div className="ml-4 flex-1">
                  <div className="text-[15px] font-semibold text-charcoal">{item.name}</div>
                  <div className="text-[13px] text-warm-brown">{item.date}</div>
                  <div className="text-[13px] text-warm-brown">평균 점수: {item.score}</div>
                </div>
                <ChevronRight size={20} className="text-warm-gray" />
              </Card>
            ))}
          </div>
          <button className="mt-4 w-full py-3 text-center text-[13px] font-medium text-warm-brown hover:text-charcoal">
            더 보기
          </button>
        </div>

        <div className="pt-8 border-t border-gray-200">
          <button
            onClick={() => navigate("/login")}
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
