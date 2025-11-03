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

  return (
    <Card className="bg-red-light dark:bg-gray-dark w-full">
      <CardHeader>
        <CardTitle>Bình luận</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            className="flex-1"
            placeholder="Viết bình luận..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <Button className="bg-black text-white">Gửi</Button>
        </div>
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="text-sm">
              <div className="font-medium">{c.user}</div>
              <div className="text-gray-700">{c.content}</div>
              <div className="text-xs text-gray-500">
                {new Date(c.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
          {comments.length === 0 && (
            <div className="text-sm text-gray-500">Chưa có bình luận</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuizComments;
