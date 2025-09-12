import * as React from "react";
import { cn } from "@/lib/utils";

interface ShadowCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "large" | "xl";
  shadowColor?: "foreground" | "primary" | "secondary" | "accent";
  hoverEffect?: boolean;
  children: React.ReactNode;
}

const ShadowCard = React.forwardRef<HTMLDivElement, ShadowCardProps>(
  (
    {
      className,
      variant = "default",
      shadowColor = "foreground",
      hoverEffect = true,
      children,
      ...props
    },
    ref
  ) => {
    const shadowVariants = {
      default: "w-full h-full -bottom-1 -right-1",
      elevated: "w-full h-full -bottom-1.5 -right-1.5",
      large: "w-full h-full -bottom-2 -right-2",
      xl: "w-full h-full -bottom-3 -right-3",
    };

    const hoverVariants = {
      default: "group-hover:-bottom-1.5 group-hover:-right-1.5",
      elevated: "group-hover:-bottom-2 group-hover:-right-2",
      large: "group-hover:-bottom-2.5 group-hover:-right-2.5",
      xl: "group-hover:-bottom-3.5 group-hover:-right-3.5",
    };

    const shadowColorClasses = {
      foreground: "bg-black/20 dark:bg-white/20",
      primary: "bg-primary/20",
      secondary: "bg-secondary/20",
      accent: "bg-accent/20",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative inline-block group",
          hoverEffect && "hover:cursor-pointer",
          className
        )}
        {...props}
      >
        {/* Shadow Layer - hiệu ứng đổ bóng đẹp, chỉ hiển thị ở phần dư */}
        <div
          className={cn(
            "absolute rounded-lg transition-all duration-300 -z-10",
            shadowColorClasses[shadowColor],
            shadowVariants[variant],
            hoverEffect && hoverVariants[variant],
            hoverEffect && "group-hover:scale-105 group-hover:opacity-80"
          )}
        />

        {/* Content Layer */}
        <div className="relative z-10 transition-all duration-300 group-hover:scale-105">
          {children}
        </div>
      </div>
    );
  }
);

ShadowCard.displayName = "ShadowCard";

export { ShadowCard };
