"use client";

import React from "react";
import { Loader2 } from "lucide-react";

interface RoomLoadingProps {
  message?: string;
  className?: string;
}

export function RoomLoading({
  message = "Loading room information...",
  className = "",
}: RoomLoadingProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center min-h-[400px] ${className}`}
    >
      <div className="bg-card border border-border p-8 rounded-lg text-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground text-lg">{message}</p>
      </div>
    </div>
  );
}
