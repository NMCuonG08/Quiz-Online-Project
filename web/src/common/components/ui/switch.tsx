"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        // Track colors
        "data-[state=checked]:bg-emerald-500 dark:data-[state=checked]:bg-emerald-400",
        "data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-600",
        // Border + focus
        "border border-input focus-visible:border-ring focus-visible:ring-ring/50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block size-4 rounded-full ring-0 transition-transform",
          // Thumb position
          "data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0",
          // Thumb colors for contrast in both modes
          "data-[state=checked]:bg-white data-[state=unchecked]:bg-white",
          "dark:data-[state=checked]:bg-gray-900 dark:data-[state=unchecked]:bg-gray-300",
          // Outline to ensure visibility on colored track
          "border border-border"
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
