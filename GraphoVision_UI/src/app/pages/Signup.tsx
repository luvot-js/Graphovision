import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Eye, EyeOff, ChevronLeft } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

export function Signup() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen flex-col bg-cream-white px-5 py-6">
      <div className="mb-8 flex items-center">
        <button onClick={() => navigate(-1)} className="mr-4 text-charcoal">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-[22px] font-semibold text-charcoal">회원가입</h1>
      </div>

      <form onSubmit={handleSignup} className="flex flex-1 flex-col space-y-4">
        <div>
          <label className="mb-1.5 block text-[13px] text-warm-brown">이메일</label>
          <Input type="email" placeholder="example@email.com" required />
        </div>
        
        <div>
          <label className="mb-1.5 block text-[13px] text-warm-brown">닉네임</label>
          <Input type="text" placeholder="2~10자, 특수문자 제외" required />
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] text-warm-brown">비밀번호</label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="8자 이상, 영문+숫자 혼합"
              required
            />
            <button
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-warm-gray hover:text-charcoal"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] text-warm-brown">비밀번호 확인</label>
          <div className="relative">
            <Input
              type={showConfirm ? "text" : "password"}
              placeholder="비밀번호 다시 입력"
              required
            />
            <button
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-warm-gray hover:text-charcoal"
              onClick={() => setShowConfirm(!showConfirm)}
            >
              {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div className="mt-auto pt-8">
          <Button fullWidth type="submit">
            가입하기
          </Button>
        </div>
      </form>
    </div>
  );
}
