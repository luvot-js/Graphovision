import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { TopNav } from "../components/ui/TopNav";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { CheckCircle2, Circle } from "lucide-react";
import { clsx } from "clsx";
import { userApi, billingApi } from "../../lib/api";

const PACKAGES = [
  { id: 1, credits: 1,  price: 1000,  originalPrice: null,  badge: null },
  { id: 2, credits: 5,  price: 4500,  originalPrice: 5000,  badge: "인기" },
  { id: 3, credits: 10, price: 8000,  originalPrice: 10000, badge: "추천" },
  { id: 4, credits: 20, price: 14000, originalPrice: 20000, badge: "30% 할인" },
];

export function Billing() {
  const navigate = useNavigate();
  const [selectedPkg, setSelectedPkg] = useState(PACKAGES[1]);
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    userApi.me().then((u) => setCredits(u.credits)).catch(() => navigate("/login"));
  }, []);

  const handleCharge = async () => {
    setLoading(true);
    try {
      const res = await billingApi.charge(selectedPkg.credits);
      setCredits(res.credits);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err: any) {
      alert(err.message || "충전에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-white pb-10">
      <TopNav title="크레딧 충전" />

      <div className="px-5 pt-6 space-y-8">
        <div className="flex items-center justify-between rounded-2xl bg-indigo/5 p-5">
          <span className="text-[15px] font-medium text-charcoal">현재 보유 크레딧</span>
          <span className="text-[20px] font-bold text-indigo">{credits} cr</span>
        </div>

        <div>
          <h3 className="mb-4 text-[18px] font-semibold text-charcoal">충전 패키지</h3>
          <div className="space-y-3">
            {PACKAGES.map((pkg) => {
              const isSelected = selectedPkg.id === pkg.id;
              return (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPkg(pkg)}
                  className={clsx(
                    "relative flex cursor-pointer items-center justify-between rounded-2xl border-2 p-5 transition-all",
                    isSelected ? "border-indigo bg-indigo/5" : "border-gray-200 bg-white hover:border-gray-300"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {isSelected ? (
                      <CheckCircle2 size={22} className="text-indigo" />
                    ) : (
                      <Circle size={22} className="text-warm-gray" />
                    )}
                    <span className="text-[16px] font-semibold text-charcoal">{pkg.credits}회권</span>
                    <span className="text-[15px] text-warm-brown">{pkg.credits} cr</span>
                  </div>
                  <div className="flex flex-col items-end">
                    {pkg.badge && (
                      <span className="mb-1 rounded bg-indigo px-2 py-0.5 text-[11px] font-bold text-white">
                        {pkg.badge}
                      </span>
                    )}
                    <div className="flex items-center gap-2">
                      {pkg.originalPrice && (
                        <span className="text-[13px] text-warm-gray line-through">
                          {pkg.originalPrice.toLocaleString()}원
                        </span>
                      )}
                      <span className="text-[16px] font-bold text-charcoal">
                        {pkg.price.toLocaleString()}원
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-4 text-center">
          {success ? (
            <div className="mb-3 rounded-2xl bg-sage-green/20 p-4 text-center text-[15px] font-semibold text-sage-green">
              ✓ {selectedPkg.credits} 크레딧이 충전되었습니다!
            </div>
          ) : (
            <Button fullWidth className="mb-3" onClick={handleCharge} disabled={loading}>
              {loading ? "처리 중..." : `${selectedPkg.price.toLocaleString()}원 결제하기`}
            </Button>
          )}
          <span className="text-[13px] text-warm-brown">🔒 로컬 테스트 환경 — 즉시 충전됩니다</span>
        </div>
      </div>
    </div>
  );
}
