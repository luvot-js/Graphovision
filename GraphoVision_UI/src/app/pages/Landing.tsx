import React from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/Button";
import { motion } from "motion/react";
import { PenTool, Brain, Users, TrendingUp } from "lucide-react";

export function Landing() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <PenTool size={32} />,
      title: "필체 분석",
      description: "당신의 필체를 업로드하면 AI가 상세하게 분석합니다"
    },
    {
      icon: <Brain size={32} />,
      title: "성격 파악",
      description: "필압, 기울기, 자간 등을 종합하여 성격을 파악합니다"
    },
    {
      icon: <Users size={32} />,
      title: "궁합 분석",
      description: "친구나 연인과의 궁합도를 확인해보세요"
    },
    {
      icon: <TrendingUp size={32} />,
      title: "히스토리 관리",
      description: "과거 분석 결과를 언제든 다시 확인할 수 있습니다"
    }
  ];

  return (
    <div className="min-h-screen bg-cream-white overflow-y-auto">
      <div className="flex min-h-screen flex-col px-5 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <h1 className="font-pretendard mb-3 text-[32px] font-bold text-charcoal">
            GraphoVision
          </h1>
          <p className="text-[15px] leading-relaxed text-warm-brown">
            필기체로 알아보는 나의 성격
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12 overflow-hidden rounded-2xl bg-gradient-to-br from-soft-coral/20 to-sage-green/20 p-8 text-center shadow-sm"
        >
          <h2 className="mb-3 text-[20px] font-semibold text-charcoal">
            필체 분석으로 성격을 알아보세요
          </h2>
          <p className="mb-6 text-[14px] leading-relaxed text-warm-brown">
            당신의 손글씨에는 당신만의 이야기가 담겨있습니다.
            <br />
            AI가 필체를 통해 당신의 성격을 분석해드립니다.
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => navigate("/login")} variant="primary" fullWidth>
              시작하기
            </Button>
            <Button onClick={() => navigate("/signup")} variant="secondary" fullWidth>
              회원가입
            </Button>
          </div>
        </motion.div>

        <div className="grid flex-1 grid-cols-1 gap-4 mb-12">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              className="flex flex-col items-center rounded-xl bg-white p-6 text-center shadow-sm"
            >
              <div className="mb-3 text-soft-coral">{feature.icon}</div>
              <h3 className="mb-2 text-[16px] font-semibold text-charcoal">
                {feature.title}
              </h3>
              <p className="text-[13px] leading-relaxed text-warm-brown">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center text-[12px] text-warm-gray"
        >
          <p>© 2026 GraphoVision. All rights reserved.</p>
        </motion.div>
      </div>
    </div>
  );
}
