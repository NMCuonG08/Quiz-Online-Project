"use client";

import React, { useState } from "react";

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
    <div className="bg-red-light dark:bg-gray-dark rounded-lg p-6 border space-y-3">
      <div className="font-medium">Bình luận</div>
      <div className="flex gap-2">
        <input
          className="flex-1 rounded border px-3 py-2 text-sm"
          placeholder="Viết bình luận..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button className="rounded bg-black text-white px-3 text-sm">
          Gửi
        </button>
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
    </div>
  );
};

export default QuizComments;
