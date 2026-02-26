"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";
import { useTranslations } from "next-intl";

interface QuizCreatorProps {
  creatorName?: string | null;
}

const QuizCreator: React.FC<QuizCreatorProps> = ({ creatorName }) => {
  const t = useTranslations("quizDetail");
  if (!creatorName) return null;
  return (
    <Card className="w-full bg-card">
      <CardHeader>
        <CardTitle>{t("creator")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm">{creatorName}</div>
      </CardContent>
    </Card>
  );
};

export default QuizCreator;
