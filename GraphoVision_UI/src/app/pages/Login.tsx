import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { authApi } from "../../lib/api";
import { saveToken } from "../../lib/auth";

export function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      saveToken(res.access_token);
      navigate("/test");
    } catch (err: any) {
      setError(err.message || "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream-white px-5 py-12">
      <div className="mb-10 text-center">
        <h1 className="font-pretendard text-[28px] font-bold text-charcoal">GraphoVision</h1>
        <p className="mt-2 text-[13px] text-warm-brown">내 필체로 읽는 나의 심리</p>
      </div>

      <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
        <div>
          <Input
            type="email"
            placeholder="이메일"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="비밀번호"
            required
            error={!!error}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-warm-gray hover:text-charcoal"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {error && <p className="text-[13px] text-red-500">{error}</p>}

        <div className="pt-2">
          <Button fullWidth type="submit" disabled={loading}>
            {loading ? "로그인 중..." : "로그인"}
          </Button>
        </div>
      </form>

      <div className="mt-8 text-[13px] text-warm-brown">
        계정이 없으신가요?{" "}
        <Link to="/signup" className="font-medium text-indigo hover:underline">
          회원가입
        </Link>
      </div>
    </div>
  );
}
