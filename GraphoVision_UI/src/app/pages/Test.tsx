import React, { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { Camera, Paperclip, X, Plus, CheckCircle2 } from "lucide-react";
import { TopNav } from "../components/ui/TopNav";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { BottomNav } from "../components/ui/BottomNav";
import { motion, AnimatePresence } from "motion/react";

const MOCK_ANALYSES = [
  { id: "1", name: "지훈", date: "2026.05.23" },
  { id: "2", name: "민지", date: "2026.05.20" },
  { id: "3", name: "수진", date: "2026.05.18" },
];

export function Test() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"select" | "upload" | "analyzing">("select");
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [isNewPerson, setIsNewPerson] = useState(false);
  const [newPersonName, setNewPersonName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(selectedFile);
  };

  const handlePersonSelect = () => {
    if (isNewPerson && !newPersonName.trim()) {
      alert("이름을 입력해주세요");
      return;
    }
    if (!isNewPerson && !selectedPerson) {
      alert("분석할 사람을 선택해주세요");
      return;
    }
    setStep("upload");
  };

  const handleResetPerson = () => {
    setStep("select");
    setSelectedPerson(null);
    setIsNewPerson(false);
    setNewPersonName("");
    setFile(null);
    setPreview(null);
  };

  const startAnalysis = () => {
    setStep("analyzing");
    // mock analysis delay
    setTimeout(() => {
      navigate("/result/mock-id-123");
    }, 3000);
  };

  const getCurrentName = () => {
    if (isNewPerson) return newPersonName;
    const person = MOCK_ANALYSES.find(p => p.id === selectedPerson);
    return person?.name || "";
  };

  const handleBackClick = () => {
    if (step === "upload") {
      handleResetPerson();
    }
  };

  return (
    <div className="min-h-screen bg-cream-white pb-24">
      <TopNav
        title="GraphoVision"
        showBack={step !== "select"}
        showCredit
        creditCount={3}
        onBackClick={handleBackClick}
      />

      <div className="px-5 pt-6">
        {step === "select" && (
          <>
            <h2 className="mb-2 text-[22px] font-semibold text-charcoal">누구의 필기체를 분석할까요?</h2>
            <p className="mb-8 text-[15px] text-warm-brown leading-relaxed">
              기존 분석 내역에 추가하거나<br />새로운 사람을 추가할 수 있어요
            </p>

            <div className="space-y-4">
              <div>
                <h3 className="mb-3 text-[14px] font-medium text-charcoal">기존 분석 내역</h3>
                <div className="space-y-2">
                  {MOCK_ANALYSES.map((person) => (
                    <Card
                      key={person.id}
                      className={`cursor-pointer p-4 transition-all ${
                        selectedPerson === person.id && !isNewPerson
                          ? "border-2 border-indigo bg-indigo/5"
                          : "border border-gray-200 hover:bg-gray-50"
                      }`}
                      onClick={() => {
                        setSelectedPerson(person.id);
                        setIsNewPerson(false);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[15px] font-semibold text-charcoal">{person.name}</div>
                          <div className="text-[13px] text-warm-brown">마지막 분석: {person.date}</div>
                        </div>
                        {selectedPerson === person.id && !isNewPerson && (
                          <CheckCircle2 size={20} className="text-indigo" />
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-[14px] font-medium text-charcoal">새로운 사람 추가</h3>
                <Card
                  className={`cursor-pointer p-4 transition-all ${
                    isNewPerson
                      ? "border-2 border-indigo bg-indigo/5"
                      : "border border-gray-200 hover:bg-gray-50"
                  }`}
                  onClick={() => {
                    setIsNewPerson(true);
                    setSelectedPerson(null);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo/10">
                        <Plus size={20} className="text-indigo" />
                      </div>
                      <span className="text-[15px] font-semibold text-charcoal">새로운 사람 추가하기</span>
                    </div>
                    {isNewPerson && <CheckCircle2 size={20} className="text-indigo" />}
                  </div>
                </Card>

                {isNewPerson && (
                  <div className="mt-3">
                    <Input
                      type="text"
                      placeholder="이름을 입력하세요 (예: 영희)"
                      value={newPersonName}
                      onChange={(e) => setNewPersonName(e.target.value)}
                      maxLength={10}
                    />
                  </div>
                )}
              </div>

              <Button
                fullWidth
                onClick={handlePersonSelect}
                disabled={(isNewPerson && !newPersonName.trim()) || (!isNewPerson && !selectedPerson)}
              >
                다음
              </Button>
            </div>
          </>
        )}

        {step === "upload" && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-[22px] font-semibold text-charcoal">{getCurrentName()}님의 필체 분석</h2>
                <p className="mt-1 text-[15px] text-warm-brown">
                  직접 쓴 글씨 사진을 업로드하세요
                </p>
              </div>
              <Button variant="secondary" onClick={handleResetPerson}>
                변경
              </Button>
            </div>

            {!preview ? (
              <div className="space-y-4">
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
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                }}
              >
                <X size={18} />
              </button>
            </div>

            <Button fullWidth onClick={startAnalysis}>
              분석 시작 (1 크레딧)
            </Button>
          </div>
        )}
          </>
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
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="mb-8 h-16 w-16 rounded-full border-4 border-indigo border-t-transparent animate-spin"
            />
            <h3 className="mb-2 text-[18px] font-semibold text-charcoal">
              {getCurrentName()}님의 필체를 분석하고 있어요
            </h3>
            <p className="mb-8 text-[15px] text-warm-brown">잠시만 기다려 주세요...</p>
            
            <div className="w-full max-w-xs overflow-hidden rounded-full bg-warm-gray/30">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "68%" }}
                transition={{ duration: 2 }}
                className="h-2 bg-indigo"
              />
            </div>
            <p className="mt-3 text-[13px] text-warm-brown">필압 패턴 분석 중...</p>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
