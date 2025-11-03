"use client";

import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/common/components/ui/button";

interface RoomErrorProps {
  error: string;
  onRetry?: () => void;
  className?: string;
}

export function RoomError({ error, onRetry, className = "" }: RoomErrorProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center min-h-[400px] ${className}`}
    >
      <div className="bg-destructive/10 border border-destructive/30 p-8 rounded-lg text-center max-w-md">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h3 className="text-destructive text-lg font-semibold mb-2">Error</h3>
        <p className="text-foreground mb-4">{error}</p>
        {onRetry && (
          <Button
            variant="outline"
            onClick={onRetry}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}
