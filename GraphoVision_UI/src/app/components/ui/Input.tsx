import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-[10px] border-[1.5px] border-warm-gray bg-white px-4 py-3 text-[15px] font-pretendard text-charcoal outline-none transition-colors placeholder:text-warm-gray/70 focus:border-indigo disabled:bg-gray-50",
          error && "border-red-500 focus:border-red-500",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
