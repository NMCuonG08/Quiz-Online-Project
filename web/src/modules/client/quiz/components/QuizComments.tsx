"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";
import { Button } from "@/common/components/ui/button";
import { Input } from "@/common/components/ui/input";
import { useTranslations } from "next-intl";

interface CommentItem {
  id: string;
  user: string;
  content: string;
  createdAt: string;
}

interface QuizCommentsProps {
  comments?: CommentItem[];
}

const QuizComments: React.FC<QuizCommentsProps> = ({ comments = [] }) => {
  const [value, setValue] = useState("");
  const t = useTranslations("quizDetail");

  return (
    <Card className="w-full bg-card">
      <CardHeader>
        <CardTitle>{t("comments")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            className="flex-1"
            placeholder={t("commentPlaceholder")}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <Button>{t("send")}</Button>
        </div>
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="text-sm">
              <div className="font-medium">{c.user}</div>
              <div className="text-foreground">{c.content}</div>
              <div className="text-xs text-muted-foreground">
                {new Date(c.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
          {comments.length === 0 && (
            <div className="text-sm text-muted-foreground">{t("noComments")}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuizComments;
