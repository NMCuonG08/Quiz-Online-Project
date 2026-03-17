"use client";

import React from "react";
import { Card, CardContent } from "@/common/components/ui/card";
import { Loader2, Sparkles } from "lucide-react";

interface QuizLoadingProps {
  message?: string;
}

const QuizLoading: React.FC<QuizLoadingProps> = ({
  message = "Initializing knowledge engine...",
}) => {
  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center p-4 z-50">
      {/* Dynamic Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl animate-pulse duration-1000" />

      <div className="relative z-10 w-full max-w-md text-center space-y-8 animate-in fade-in zoom-in-95 duration-1000">
        <div className="relative inline-block">
          <div className="w-24 h-24 rounded-3xl bg-card border-2 border-primary/20 flex items-center justify-center shadow-2xl">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
          <div className="absolute -top-3 -right-3 w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg animate-bounce">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-3xl font-black tracking-tighter text-foreground animate-pulse">
            {message}
          </h2>
          <p className="text-muted-foreground font-medium max-w-[280px] mx-auto leading-relaxed">
            Hold tight! We're fetching the best questions and preparing your session...
          </p>
        </div>

        {/* Loading Progress Sim (Visual only) */}
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden max-w-[240px] mx-auto">
          <div className="h-full bg-primary animate-timer-progress rounded-full origin-left" />
        </div>
      </div>
    </div>
  );
};

export default QuizLoading;
