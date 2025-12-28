import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border-2 border-gray-900",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground active:translate-x-0.5 active:translate-y-0.5 dark:bg-black dark:text-white dark:border-white",
        destructive:
          "bg-destructive text-destructive-foreground border-destructive active:translate-x-0.5 active:translate-y-0.5 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-black dark:text-white",
        outline:
          "bg-white text-foreground hover:bg-muted/60 hover:text-foreground active:translate-x-0.5 active:translate-y-0.5 dark:bg-black dark:text-white dark:border-white dark:hover:bg-white/10",
        secondary:
          "bg-secondary text-secondary-foreground border-secondary active:translate-x-0.5 active:translate-y-0.5 dark:bg-black dark:text-white",
        ghost:
          "border-none text-foreground hover:bg-muted/50 hover:text-foreground dark:text-white dark:hover:bg-white/10",
        link: "border-none text-primary underline-offset-4 hover:underline dark:text-white",
        shadowBorder:
          "bg-background text-foreground active:translate-x-0.5 active:translate-y-0.5 dark:bg-black dark:text-white dark:border-white",
      },
      size: {
        default: "h-9 px-6 py-4 has-[>svg]:px-6",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-9 has-[>svg]:px-4",
        xl: "h-12 rounded-lg px-12 has-[>svg]:px-6 text-base",
        icon: "size-9",
        full: "w-full h-12 px-4 py-4 has-[>svg]:px-3 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  // Extract width classes from className
  const widthMatch = className?.match(/\bw-(?:full|fit|auto|\d+|\[.*?\])\b/);
  const widthClass = widthMatch
    ? widthMatch[0]
    : size === "full"
      ? "w-full"
      : undefined;

  // Remove width classes from button className since we apply them to wrapper
  const buttonClassName =
    className?.replace(/\bw-(?:full|fit|auto|\d+|\[.*?\])\b/g, "").trim() ||
    undefined;

  return (
    <div
      className={cn("relative group inline-block", widthClass)}
      style={{ overflow: "visible" }}
    >
      {/* Shadow Layer - hiệu ứng đổ bóng đẹp, chỉ hiển thị ở phần dư */}
      <div
        className="absolute bg-black dark:bg-white rounded-md w-full h-full -bottom-1 -right-1 transition-all duration-200 group-active:bottom-0 group-active:right-0 -z-10"
        style={{ overflow: "visible" }}
      />
      <div
        className={cn(
          "absolute inset-0 rounded-md bg-white dark:bg-black -z-[5]",
          variant === "link" && "hidden"
        )}
      />
      <Comp
        data-slot="button"
        className={cn(
          buttonVariants({ variant, size, className: buttonClassName }),
          "relative z-10 hover:cursor-pointer transition-all duration-200 w-full"
        )}
        {...props}
      />
    </div>
  );
}

export { Button, buttonVariants };
