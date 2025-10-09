import * as React from "react";

import { cn } from "@/lib/utils";

type CardProps = React.ComponentProps<"div"> & {
  disableHover?: boolean;
  tightShadow?: boolean;
};

function Card({ className, disableHover, tightShadow, ...props }: CardProps) {
  const wrapperClass = cn("relative inline-block", disableHover ? "" : "group");
  const shadowHover = disableHover
    ? ""
    : "group-hover:-bottom-2 group-hover:-right-2 group-hover:scale-105";
  const contentHover = disableHover ? "" : "group-hover:scale-105";
  const shadowOffset = tightShadow ? "bottom-0 right-0" : "-bottom-1 -right-1";

  return (
    <div className={wrapperClass}>
      {/* Shadow Layer - hiệu ứng đổ bóng đẹp, chỉ hiển thị ở phần dư */}
      <div
        className={cn(
          "absolute bg-black/20 dark:bg-white/20 rounded-xl w-full h-full transition-all duration-300 -z-10",
          shadowOffset,
          shadowHover
        )}
      />

      {/* Content Layer - với z-index cao hơn shadow */}
      <div
        data-slot="card"
        className={cn(
          "bg-white dark:bg-black border-border p-4 text-card-foreground flex flex-col gap-6 rounded-xl border-2 py-6 relative z-10 transition-all duration-300",
          contentHover,
          className
        )}
        {...props}
      />
    </div>
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-1 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-1", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-1 [.border-t]:pt-6", className)}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
