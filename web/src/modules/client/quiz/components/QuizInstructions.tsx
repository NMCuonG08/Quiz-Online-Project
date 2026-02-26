"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";

interface QuizInstructionsProps {
  instructions?: string | null;
}

const QuizInstructions: React.FC<QuizInstructionsProps> = ({
  instructions,
}) => {
  if (!instructions) return null;
  return (
    <Card className="w-full bg-card">
      <CardHeader>
        <CardTitle>Hướng dẫn</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm whitespace-pre-line">{instructions}</p>
      </CardContent>
    </Card>
  );
};

export default QuizInstructions;
