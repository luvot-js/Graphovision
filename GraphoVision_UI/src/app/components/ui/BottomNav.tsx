import React from "react";
import { useNavigate, useLocation } from "react-router";
import { Home, Users, User } from "lucide-react";
import { clsx } from "clsx";

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: "/test", label: "홈", icon: Home },
    { path: "/compatibility", label: "궁합", icon: Users },
    { path: "/mypage", label: "프로필", icon: User },
  ];

  return (
    <nav className="absolute bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={clsx(
                "flex flex-1 flex-col items-center gap-1 py-3 transition-colors",
                isActive ? "text-indigo" : "text-warm-gray hover:text-charcoal"
              )}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className={clsx("text-[11px]", isActive ? "font-semibold" : "font-medium")}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
