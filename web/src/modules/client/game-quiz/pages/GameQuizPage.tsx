"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useParams, useRouter } from "next/navigation";
import { Question } from "../../do-quiz/types/quiz.types";
import { useGameQuiz } from "../hooks/useGameQuiz";
import { GameHeader } from "../components/GameHeader";
import { QuestionDisplay } from "../components/QuestionDisplay";
import { GameControls } from "../components/GameControls";
import { GameLoading } from "../components/GameLoading";
import { GameQuizAnswer } from "../types/game-quiz.types";
import { Card } from "@/common/components/ui/card";
import { Button } from "@/common/components/ui/button";

interface GameQuizPageProps {
  questions: Question[];
  roomCode?: string;
  onExit?: () => void;
}

const GameQuizPage: React.FC<GameQuizPageProps> = ({
  questions,
  roomCode,
  onExit,
}) => {
  const [mounted, setMounted] = useState(false);
  const params = useParams();
  const router = useRouter();
  const roomId = params?.id as string;
  const quizId = (params?.quizId as string) || "";

  const {
    currentQuestion,
    currentQuestionIndex,
    totalQuestions,
    selectedAnswer,
    isAnswered,
    isGameStarted,
    isGameEnded,
    score,
    totalScore,
    timeRemaining,
    hasSelectedAnswer,
    isLastQuestion,
    startGame,
    selectAnswer,
    submitAnswer,
    nextQuestion,
  } = useGameQuiz({
    roomId: roomId || "",
    quizId,
    questions,
    onAnswerSubmit: (answer: GameQuizAnswer) => {
      console.log("Answer submitted:", answer);
      // TODO: Send answer to server via WebSocket
    },
    onGameEnd: (finalScore: number) => {
      console.log("Game ended with score:", finalScore);
      // TODO: Navigate to results page or show results
    },
  });

  // Auto start game when component mounts and hide header/footer
  useEffect(() => {
    setMounted(true);
    const prevOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;

    // Lock scroll
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    // Add class to body to hide layout elements
    document.body.classList.add("game-active");

    // Hide all potential header/footer elements
    const selectors = [
      "header",
      "nav",
      "footer",
      "[role='navigation']",
      "[role='contentinfo']",
      "main",
    ];

    const hiddenElements: Array<{ element: HTMLElement; display: string }> = [];

    selectors.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        if (htmlEl.style.display !== "none") {
          hiddenElements.push({
            element: htmlEl,
            display: htmlEl.style.display || "",
          });
          htmlEl.style.display = "none";
        }
      });
    });

    return () => {
      document.body.style.overflow = prevOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.classList.remove("game-active");

      // Restore all hidden elements
      hiddenElements.forEach(({ element, display }) => {
        element.style.display = display;
      });
    };
  }, []);

  useEffect(() => {
    if (!isGameStarted && questions.length > 0) {
      startGame();
    }
  }, [isGameStarted, questions.length, startGame]);

  const handleExit = () => {
    if (onExit) {
      onExit();
    } else {
      router.back();
    }
  };

  if (!mounted || !isGameStarted) {
    return <GameLoading />;
  }

  if (isGameEnded) {
    return (
      <div className="fixed inset-0 z-60 bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-4xl mx-auto w-full">
          <Card className="p-8 sm:p-12 md:p-16">
            <div className="text-6xl sm:text-7xl md:text-8xl mb-6 sm:mb-8">
              🎉
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-6 sm:mb-8">
              Hoàn thành!
            </h1>
            <div className="space-y-4 sm:space-y-6 mb-8 sm:mb-12">
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary">
                Điểm số: {score} / {totalScore}
              </div>
              <div className="text-2xl sm:text-3xl md:text-4xl text-muted-foreground">
                Tỷ lệ: {((score / totalScore) * 100).toFixed(1)}%
              </div>
            </div>
            <Button
              size="xl"
              onClick={handleExit}
              className="text-xl sm:text-2xl md:text-3xl font-bold px-8 sm:px-12 md:px-16 py-4 sm:py-5 md:py-6"
            >
              Quay lại
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return <GameLoading />;
  }

  const content = (
    <div
      className="fixed inset-0 z-2147483647 bg-background text-foreground overflow-hidden flex flex-col"
      style={{ isolation: "isolate" }}
    >
      {/* Header (fullscreen override) */}
      <GameHeader
        roomCode={roomCode}
        currentQuestion={currentQuestionIndex + 1}
        totalQuestions={totalQuestions}
        score={score}
        totalScore={totalScore}
        onExit={handleExit}
      />

      {/* Main Content with top/bottom padding to clear header/footer */}
      <div className="flex-1 overflow-y-auto pt-20 sm:pt-24 md:pt-28 pb-[220px] sm:pb-[260px] md:pb-[280px]">
        <QuestionDisplay
          question={currentQuestion}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={totalQuestions}
          selectedAnswer={selectedAnswer}
          onAnswerSelect={selectAnswer}
          isAnswered={isAnswered}
          timeRemaining={timeRemaining}
        />
      </div>

      {/* Controls (docked bottom) */}
      <GameControls
        onSubmitAnswer={submitAnswer}
        onNextQuestion={nextQuestion}
        isAnswered={isAnswered}
        hasSelectedAnswer={hasSelectedAnswer}
        isLastQuestion={isLastQuestion}
      />
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(content, document.body)
    : content;
};

export default GameQuizPage;
