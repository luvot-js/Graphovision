import React from "react";
import { ChevronLeft, User, Coins } from "lucide-react";
import { useNavigate, Link, useLocation } from "react-router";

interface TopNavProps {
  title?: string;
  showBack?: boolean;
  showCredit?: boolean;
  creditCount?: number;
  onBackClick?: () => void;
}

export function TopNav({ title = "GraphoVision", showBack = true, showCredit = false, creditCount = 0, onBackClick }: TopNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isMyPage = location.pathname.includes("/mypage");

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      navigate(-1);
    }
  };

  const handleTitleClick = () => {
    if (title === "GraphoVision") {
      // 로그아웃하고 랜딩 페이지로 이동
      navigate("/");
    }
  };

  return (
    <div className="sticky top-0 z-10 flex h-14 items-center justify-between bg-cream-white border-b border-gray-200 px-5">
      <div className="flex flex-1 items-center">
        {showBack && (
          <button onClick={handleBackClick} className="mr-2 p-1 text-charcoal hover:opacity-70">
            <ChevronLeft size={24} />
          </button>
        )}
      </div>
      <div
        className={`flex-1 text-center font-pretendard text-[18px] font-semibold text-charcoal ${
          title === "GraphoVision" ? "cursor-pointer hover:opacity-70 transition-opacity" : ""
        }`}
        onClick={handleTitleClick}
      >
        {title}
      </div>
      <div className="flex flex-1 items-center justify-end gap-2">
        {showCredit && (
          <Link
            to="/billing"
            className="flex items-center gap-1.5 rounded-full bg-warm-beige px-3 py-1.5 text-[13px] font-medium text-charcoal transition-colors hover:bg-gray-200"
          >
            <Coins size={14} className="text-warm-brown" />
            <span>{creditCount} cr</span>
          </Link>
        )}
        {!isMyPage && (
          <Link
            to="/mypage"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-warm-beige text-charcoal transition-colors hover:bg-gray-200"
          >
            <User size={16} />
          </Link>
        )}
      </div>
    </div>
  );
}
