"use client";

import React from "react";
import { Card } from "@/common/components/ui/card";
import { Skeleton } from "@/common/components/ui/skeleton";

export const GameLoading: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[60] bg-background flex items-center justify-center p-4">
      <Card className="p-8 sm:p-12 md:p-16 text-center max-w-md">
        <Skeleton className="h-12 sm:h-16 md:h-20 w-full mb-6 sm:mb-8" />
        <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-6 sm:mb-8">
          Đang tải game...
        </div>
        <div className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
      </Card>
    </div>
  );
};

