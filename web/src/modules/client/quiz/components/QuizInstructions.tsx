"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";
import { useTranslations } from "next-intl";

interface QuizInstructionsProps {
  instructions?: string | null;
}

const QuizInstructions: React.FC<QuizInstructionsProps> = ({
  instructions,
}) => {
  const t = useTranslations("quizDetail");
  if (!instructions) return null;
  return (
    <Card className="w-full bg-card">
      <CardHeader>
        <CardTitle>{t("instructions")}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm whitespace-pre-line">{instructions}</p>
      </CardContent>
    </Card>
  );
};

export default QuizInstructions;
