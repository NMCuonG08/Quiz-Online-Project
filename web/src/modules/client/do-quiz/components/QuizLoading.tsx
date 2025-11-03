"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/common/components/ui/card";
import { Loader2 } from "lucide-react";

interface QuizLoadingProps {
  message?: string;
}

const QuizLoading: React.FC<QuizLoadingProps> = ({
  message = "Loading quiz...",
}) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
          <CardTitle className="text-lg">{message}</CardTitle>
          <CardDescription>
            Please wait while we prepare your quiz...
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
};

export default QuizLoading;
