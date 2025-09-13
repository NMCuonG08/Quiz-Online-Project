import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive [&.w-full]:flex",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border-2 border-primary hover:bg-primary/90 active:translate-x-0.5 active:translate-y-0.5",
        destructive:
          "bg-destructive text-destructive-foreground border-2 border-destructive hover:bg-destructive/90 active:translate-x-0.5 active:translate-y-0.5 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground active:translate-x-0.5 active:translate-y-0.5",
        secondary:
          "bg-secondary text-secondary-foreground border-2 border-secondary hover:bg-secondary/80 active:translate-x-0.5 active:translate-y-0.5",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        shadowBorder:
          "bg-background border-2 border-border active:translate-x-0.5 active:translate-y-0.5",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-9 has-[>svg]:px-4",
        xl: "h-12 rounded-lg px-12 has-[>svg]:px-6 text-base",
        icon: "size-9",
        full: "w-full h-12 px-4 py-2 has-[>svg]:px-3 text-base",
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

  return (
    <div
      className={cn(
        "relative group",
        size === "full" || className?.includes("w-full")
          ? "block w-full"
          : "inline-block"
      )}
      style={{ overflow: "visible" }}
    >
      {/* Shadow Layer - hiệu ứng đổ bóng đẹp, chỉ hiển thị ở phần dư */}
      <div
        className="absolute bg-black/20 dark:bg-white/20 rounded-md w-full h-full -bottom-1 -right-1 transition-all duration-200 group-hover:-bottom-1 group-hover:-right-1 group-active:bottom-0 group-active:right-0 -z-10"
        style={{ overflow: "visible" }}
      ></div>
      <Comp
        data-slot="button"
        className={cn(
          buttonVariants({ variant, size, className }),
          "relative bg-white dark:bg-black z-10 hover:cursor-pointer transition-all duration-200"
        )}
        {...props}
      />
    </div>
  );
}

export { Button, buttonVariants };
