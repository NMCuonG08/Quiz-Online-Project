import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border-primary shadow-sm hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground border-destructive shadow-sm hover:bg-destructive/90 focus-visible:ring-destructive/20",
        outline:
          "bg-card text-foreground border-border hover:bg-muted/60 hover:text-foreground",
        secondary:
          "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80",
        ghost:
          "border-none text-foreground hover:bg-muted/50 hover:text-foreground dark:text-white dark:hover:bg-white/10",
        link: "border-none text-primary underline-offset-4 hover:underline dark:text-white",
        shadowBorder:
          "bg-card text-foreground border-border shadow-sm hover:bg-muted/60",
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
  disableShadow = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    disableShadow?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";
  const showShadow = !disableShadow && variant !== "ghost" && variant !== "link";

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
      className={cn("relative isolate group/button inline-block", widthClass)}
      style={{ overflow: "visible" }}
    >
      {/* Shadow Layer - hiệu ứng đổ bóng đẹp, chỉ hiển thị ở phần dư */}
      {showShadow && (
        <div
          className="absolute bg-foreground/35 rounded-lg w-full h-full -bottom-1 -right-1 -z-10 transition-[transform] duration-150 group-active/button:translate-x-1 group-active/button:translate-y-1"
          style={{ overflow: "visible" }}
        />
      )}
      <div
        className={cn(
          "absolute inset-0 rounded-lg bg-card -z-[5]",
          (variant === "link" || variant === "ghost") && "hidden"
        )}
      />
      <Comp
        data-slot="button"
        className={cn(
          buttonVariants({ variant, size, className: buttonClassName }),
          "relative z-10 hover:cursor-pointer transition-colors duration-150 w-full"
        )}
        {...props}
      />
    </div>
  );
}

export { Button, buttonVariants };
