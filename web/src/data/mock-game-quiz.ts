"use client";

import { Question } from "@/modules/client/do-quiz/types/quiz.types";

export const mockRoomCode = "ROOM-1234";

export const mockQuestions: Question[] = [
  {
    id: "q1",
    content: "Thủ đô của Nhật Bản là gì?",
    media_url:
      "https://images.unsplash.com/photo-1549692520-acc6669e2f0c?auto=format&fit=crop&w=1200&q=80",
    media_type: "image",
    time_limit: 20,
    points: 1000,
    sort_order: 0,
    question_type: "multiple_choice",
    options: [
      { id: "q1a", content: "Osaka", is_correct: false, sort_order: 0 },
      { id: "q1b", content: "Tokyo", is_correct: true, sort_order: 1 },
      { id: "q1c", content: "Kyoto", is_correct: false, sort_order: 2 },
      { id: "q1d", content: "Nagoya", is_correct: false, sort_order: 3 },
    ],
    correct_answer: "q1b",
    explanation: "Tokyo là thủ đô và thành phố lớn nhất của Nhật Bản.",
  },
  {
    id: "q2",
    content: "React là thư viện hay framework?",
    time_limit: 15,
    points: 800,
    sort_order: 1,
    question_type: "true_false",
    options: [
      { id: "q2a", content: "Thư viện (Library)", is_correct: true, sort_order: 0 },
      { id: "q2b", content: "Framework", is_correct: false, sort_order: 1 },
    ],
    correct_answer: "q2a",
  },
  {
    id: "q3",
    content: "Điền từ còn thiếu: HyperText Markup ____",
    time_limit: 25,
    points: 900,
    sort_order: 2,
    question_type: "fill_blank",
    options: [],
    correct_answer: "Language",
    explanation: "HTML viết tắt của HyperText Markup Language.",
  },
  {
    id: "q4",
    content: "Hãy mô tả ngắn cách bạn tối ưu hiệu năng React app.",
    time_limit: 40,
    points: 1200,
    sort_order: 3,
    question_type: "essay",
    options: [],
    correct_answer: "",
  },
];


