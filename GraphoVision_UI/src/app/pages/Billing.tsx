import React, { useState } from "react";
import { TopNav } from "../components/ui/TopNav";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { CheckCircle2, Circle } from "lucide-react";
import { clsx } from "clsx";

const PACKAGES = [
  { id: 1, credits: 1, price: 1000, originalPrice: null, badge: null },
  { id: 2, credits: 5, price: 4500, originalPrice: 5000, badge: "인기" },
  { id: 3, credits: 10, price: 8000, originalPrice: 10000, badge: "추천" },
  { id: 4, credits: 20, price: 14000, originalPrice: 20000, badge: "30% 할인" },
];

export function Billing() {
  const [selectedPkg, setSelectedPkg] = useState(PACKAGES[1]);
  const [paymentMethod, setPaymentMethod] = useState<"toss" | "kakao">("toss");

  return (
    <div className="min-h-screen bg-cream-white pb-10">
      <TopNav title="크레딧 충전" />

      <div className="px-5 pt-6 space-y-8">
        <div className="flex items-center justify-between rounded-2xl bg-indigo/5 p-5">
          <span className="text-[15px] font-medium text-charcoal">현재 보유 크레딧</span>
          <span className="text-[20px] font-bold text-indigo">2 cr</span>
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

        <div>
          <h3 className="mb-4 text-[18px] font-semibold text-charcoal">결제 수단</h3>
          <div className="flex gap-3">
            <button
              onClick={() => setPaymentMethod("toss")}
              className={clsx(
                "flex-1 rounded-xl border-2 py-4 text-[15px] font-semibold transition-all",
                paymentMethod === "toss"
                  ? "border-indigo bg-indigo/5 text-indigo"
                  : "border-gray-200 bg-white text-charcoal hover:bg-gray-50"
              )}
            >
              토스페이먼츠
            </button>
            <button
              onClick={() => setPaymentMethod("kakao")}
              className={clsx(
                "flex-1 rounded-xl border-2 py-4 text-[15px] font-semibold transition-all",
                paymentMethod === "kakao"
                  ? "border-[#FAE100] bg-[#FAE100]/10 text-charcoal"
                  : "border-gray-200 bg-white text-charcoal hover:bg-gray-50"
              )}
            >
              카카오페이
            </button>
          </div>
        </div>

        <div className="pt-4 text-center">
          <Button fullWidth className="mb-3">
            {selectedPkg.price.toLocaleString()}원 결제하기
          </Button>
          <span className="text-[13px] text-warm-brown">🔒 안전한 결제가 보장됩니다</span>
        </div>
      </div>
    </div>
  );
}
