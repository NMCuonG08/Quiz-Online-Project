"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/common/components/ui/card";
import { Button } from "@/common/components/ui/button";
import { AlertCircle, RefreshCw, ArrowLeft, Ghost } from "lucide-react";

interface QuizErrorProps {
  error: string;
  onRetry: () => void;
  onGoBack: () => void;
}

const QuizError: React.FC<QuizErrorProps> = ({ error, onRetry, onGoBack }) => {
  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center p-4 z-50 overflow-hidden">
      {/* Aesthetic Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`, backgroundSize: '40px 40px' }}
      />

      <Card className="w-full max-w-md border-none shadow-2xl bg-card/60 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-500 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-destructive" />

        <CardHeader className="text-center pt-10">
          <div className="relative inline-block mb-6">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-destructive/10 flex items-center justify-center animate-pulse">
              <AlertCircle className="w-10 h-10 text-destructive" />
            </div>
            <Ghost className="absolute -bottom-2 -right-2 w-8 h-8 text-muted-foreground/20" />
          </div>
          <CardTitle className="text-3xl font-black tracking-tighter">Opps! Trouble Found</CardTitle>
          <CardDescription className="text-base font-medium text-destructive/80 mt-2 px-4">
            {error}
          </CardDescription>
        </CardHeader>

        <CardContent className="px-8 pb-10 space-y-4">
          <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 text-sm text-muted-foreground leading-relaxed italic">
            "Software is like a quiz; sometimes you get the wrong answer. Let's try to fix it together."
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4">
            <Button onClick={onGoBack} variant="outline" size="lg" className="h-12 rounded-2xl font-bold border-2 hover:bg-muted">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            <Button onClick={onRetry} size="lg" className="h-12 rounded-2xl font-black bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>

      <p className="mt-8 text-xs font-bold text-muted-foreground/50 uppercase tracking-widest">
        Error Code: 0x500_QUIZ_INIT_FAIL
      </p>
    </div>
  );
};

export default QuizError;
