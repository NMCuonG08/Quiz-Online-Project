"use client";

import React, { useState } from "react";
import GameQuizPage from "@/modules/client/game-quiz/pages/GameQuizPage";
import { mockQuestions, mockRoomCode } from "@/data/mock-game-quiz";

const GameQuizDemoPage: React.FC = () => {
  const [started, setStarted] = useState(false);

  if (started) {
    return (
      <GameQuizPage
        questions={mockQuestions}
        roomCode={mockRoomCode}
        onExit={() => setStarted(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 flex items-center justify-center px-6">
      <div className="max-w-3xl w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl text-center">
        <h1 className="text-5xl font-bold text-white mb-6">
          Game Quiz Demo (Strategy + Factory)
        </h1>
        <p className="text-lg text-white/80 mb-10">
          Dữ liệu câu hỏi mock tại <code>@/data/mock-game-quiz</code>. Nhấn
          nút bên dưới để mở UI game full màn hình, không header/footer.
        </p>
        <button
          onClick={() => setStarted(true)}
          className="px-12 py-5 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-2xl font-bold rounded-2xl shadow-xl hover:scale-105 transition-transform"
        >
          🎮 Bắt đầu xem UI
        </button>
      </div>
    </div>
  );
};

export default GameQuizDemoPage;


