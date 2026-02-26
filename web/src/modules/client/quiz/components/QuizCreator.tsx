"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";

interface QuizCreatorProps {
  creatorName?: string | null;
}

const QuizCreator: React.FC<QuizCreatorProps> = ({ creatorName }) => {
  if (!creatorName) return null;
  return (
    <Card className="w-full bg-card">
      <CardHeader>
        <CardTitle>Người tạo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm">{creatorName}</div>
      </CardContent>
    </Card>
  );
};

export default QuizCreator;
