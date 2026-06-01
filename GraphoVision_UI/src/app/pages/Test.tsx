import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { Camera, Paperclip, X, Plus, CheckCircle2 } from "lucide-react";
import { TopNav } from "../components/ui/TopNav";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { BottomNav } from "../components/ui/BottomNav";
import { motion, AnimatePresence } from "motion/react";
import { analyzeApi, historyApi, userApi } from "../../lib/api";

export function Test() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"upload" | "analyzing">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [credits, setCredits] = useState<number>(0);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    userApi.me().then((u) => setCredits(u.credits)).catch(() => {});
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
  };

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(selectedFile);
  };

  const startAnalysis = async () => {
    if (!file) return;
    setError("");
    setStep("analyzing");
    try {
      const res = await analyzeApi.analyze(file);
      setCredits(res.credits_remaining);
      navigate(`/result/${res.result_id}`);
    } catch (err: any) {
      setStep("upload");
      setError(err.message || "분석에 실패했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-cream-white pb-24">
      <TopNav
        title="GraphoVision"
        showCredit
        creditCount={credits}
      />

      <div className="px-5 pt-6">
        <h2 className="mb-2 text-[22px] font-semibold text-charcoal">필체 분석</h2>
        <p className="mb-8 text-[15px] text-warm-brown leading-relaxed">
          직접 쓴 글씨 사진을 업로드하세요
        </p>

        {!preview ? (
          <div className="space-y-4">
            <p className="text-[13px] text-warm-brown italic text-center">
              "그대만큼 사랑스러운 사람을 본 일이 없다"
            </p>
            <div
              className={`flex h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-colors ${
                isDragging ? "border-indigo bg-indigo/5" : "border-warm-gray bg-white"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip size={32} className="mb-3 text-warm-gray" />
              <p className="text-center text-[15px] text-warm-brown">
                이미지를 여기에 드래그하거나<br />클릭해서 업로드
              </p>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
              />
            </div>

            <Button variant="secondary" fullWidth onClick={() => fileInputRef.current?.click()}>
              <Camera size={18} className="mr-2" /> 카메라로 찍기
            </Button>

            <Card className="mt-8 bg-warm-beige/30 p-5">
              <h3 className="mb-3 text-[13px] font-semibold text-charcoal">권장 필기 조건 (Tip)</h3>
              <ul className="space-y-1.5 text-[13px] text-warm-brown">
                <li>✅ 흰 종이에 검정/파란 펜</li>
                <li>✅ 자연광 또는 밝은 환경</li>
                <li>✅ 최소 A5 크기 분량의 필기</li>
                <li>❌ 타이핑 텍스트 불가</li>
              </ul>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="relative overflow-hidden rounded-2xl border border-gray-200">
              <img src={preview} alt="미리보기" className="h-64 w-full object-cover" />
              <button
                className="absolute right-3 top-3 rounded-full bg-black/50 p-1.5 text-white backdrop-blur-sm transition hover:bg-black/70"
                onClick={() => { setFile(null); setPreview(null); }}
              >
                <X size={18} />
              </button>
            </div>

            {error && <p className="text-[13px] text-red-500">{error}</p>}

            <Button fullWidth onClick={startAnalysis} disabled={credits < 1}>
              {credits < 1 ? "크레딧 부족" : "분석 시작 (1 크레딧)"}
            </Button>

            {credits < 1 && (
              <Button variant="secondary" fullWidth onClick={() => navigate("/billing")}>
                크레딧 충전하기
              </Button>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {step === "analyzing" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-cream-white/95 px-5 backdrop-blur-sm"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="mb-8 h-16 w-16 rounded-full border-4 border-indigo border-t-transparent"
            />
            <h3 className="mb-2 text-[18px] font-semibold text-charcoal">
              필체를 분석하고 있어요
            </h3>
            <p className="mb-8 text-[15px] text-warm-brown">잠시만 기다려 주세요...</p>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
