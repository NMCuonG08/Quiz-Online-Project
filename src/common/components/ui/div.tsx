import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const divVariants = cva("relative inline-block", {
  variants: {
    variant: {
      default: "shadow-sm",
      elevated: "shadow-md",
      large: "shadow-lg",
      xl: "shadow-xl",
      none: "",
    },
    size: {
      sm: "p-2",
      default: "p-4",
      lg: "p-6",
      xl: "p-8",
    },
    rounded: {
      none: "rounded-none",
      sm: "rounded-sm",
      default: "rounded-md",
      lg: "rounded-lg",
      xl: "rounded-xl",
      full: "rounded-full",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
    rounded: "default",
  },
});

interface DivProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof divVariants> {
  asChild?: boolean;
  containerClassName?: string;
}

const Div = React.forwardRef<HTMLDivElement, DivProps>(
  (
    {
      className,
      containerClassName,
      variant,
      size,
      rounded,
      asChild = false,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? "div" : "div";

    return (
      <div className={cn("relative inline-block group", containerClassName)}>
        {/* Shadow Layer - hiệu ứng đổ bóng đẹp */}
        <div
          className={cn(
            "absolute bg-black/20 dark:bg-white/20 transition-all duration-300 group-hover:scale-105 -z-10",
            // Shadow positioning giống button
            variant === "default" &&
              "w-full h-full -bottom-1 -right-1 group-hover:-bottom-1.5 group-hover:-right-1.5",
            variant === "elevated" &&
              "w-full h-full -bottom-1.5 -right-1.5 group-hover:-bottom-2 group-hover:-right-2",
            variant === "large" &&
              "w-full h-full -bottom-2 -right-2 group-hover:-bottom-2.5 group-hover:-right-2.5",
            variant === "xl" &&
              "w-full h-full -bottom-3 -right-3 group-hover:-bottom-3.5 group-hover:-right-3.5",
            variant === "none" && "hidden",
            // Rounded corners cho shadow
            rounded === "none" && "rounded-none",
            rounded === "sm" && "rounded-sm",
            rounded === "default" && "rounded-md",
            rounded === "lg" && "rounded-lg",
            rounded === "xl" && "rounded-xl",
            rounded === "full" && "rounded-full"
          )}
        />

        {/* Content Layer - với z-index cao hơn shadow */}
        <Comp
          ref={ref}
          className={cn(
            divVariants({ variant, size, rounded }),
            "relative z-10 bg-white dark:bg-black border-2 border-border transition-all duration-300 group-hover:scale-105",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

Div.displayName = "Div";

export { Div, divVariants };
