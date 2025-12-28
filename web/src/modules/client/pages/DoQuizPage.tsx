"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuiz } from "../do-quiz/hooks/useQuiz";
import {
  QuizHeader,
  QuestionCard,
  AnswerOptions,
  QuizNavigation,
  QuizResults,
  QuizLoading,
  QuizError,
} from "../do-quiz/components";
import { Button } from "@/common/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/common/components/ui/card";
import { AlertTriangle, ArrowLeft, RefreshCw, CheckCircle2 } from "lucide-react";

interface DoQuizPageProps {
  slug: string;
}

const DoQuizPage: React.FC<DoQuizPageProps> = ({ slug }) => {
  const router = useRouter();

  const {
    questions,
    currentQuestionIndex,
    result,
    loading,
    error,
    isQuizStarted,
    isQuizCompleted,
    isSubmitting,
    progress,
    timeRemaining,
    timerActive,
    startQuiz,
    handleSubmitAnswer,
    handleNextQuestion,
    handlePreviousQuestion,
    handleCompleteQuiz,
    getCurrentQuestion,
    getUserAnswer,
    clearQuizError,
    resetQuizState,
  } = useQuiz(slug);

  const [hasAnswered, setHasAnswered] = useState(false);

  // Get current question
  const currentQuestion = getCurrentQuestion();
  const currentUserAnswer = currentQuestion
    ? getUserAnswer(currentQuestion.id)
    : undefined;

  // Check if current question has been answered
  useEffect(() => {
    if (currentQuestion) {
      const answer = getUserAnswer(currentQuestion.id);
      setHasAnswered(!!answer);
    }
  }, [currentQuestion, getUserAnswer]);

  // Validate slug
  if (!slug || slug.trim() === '') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Slug không hợp lệ</CardTitle>
            <CardDescription>
              Slug của quiz không được để trống hoặc không hợp lệ.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.back()}
              className="w-full"
              variant="default"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle answer submission
  const handleAnswerSubmit = (
    answer: Omit<
      import("../do-quiz/types/quiz.types").UserAnswer,
      "question_id" | "answered_at"
    >
  ) => {
    if (!currentQuestion) return;

    handleSubmitAnswer(answer);
    setHasAnswered(true);
  };

  // Handle navigation
  const handleNext = () => {
    if (hasAnswered) {
      handleNextQuestion();
      setHasAnswered(false);
    }
  };

  const handlePrevious = () => {
    handlePreviousQuestion();
    setHasAnswered(false);
  };

  const handleSubmit = () => {
    if (hasAnswered) {
      handleCompleteQuiz();
    }
  };

  // Handle retake quiz
  const handleRetakeQuiz = () => {
    resetQuizState();
    setHasAnswered(false);
  };

  // Handle view answers
  const handleViewAnswers = () => {
    // Navigate to answers review page
    router.push(`/quiz/${slug}/review`);
  };

  // Handle go back
  const handleGoBack = () => {
    router.back();
  };

  // Handle retry
  const handleRetry = () => {
    clearQuizError();
    if (slug) {
      startQuiz();
    }
  };

  // Start quiz when questions are loaded
  useEffect(() => {
    if (questions.length > 0 && !isQuizStarted && !loading && !error) {
      startQuiz();
    }
  }, [questions, isQuizStarted, loading, error, startQuiz]);

  // Loading state
  if (loading && questions.length === 0) {
    return <QuizLoading message="Loading quiz questions..." />;
  }

  // No questions found
  if (!loading && questions.length === 0 && !error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted/50 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl">Không tìm thấy câu hỏi</CardTitle>
            <CardDescription>
              Quiz này chưa có câu hỏi nào hoặc không tồn tại. Vui lòng kiểm tra lại.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={handleGoBack}
              className="w-full"
              variant="default"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Button>
            <Button
              onClick={handleRetry}
              className="w-full"
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Thử lại
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error && !isQuizStarted) {
    return (
      <QuizError error={error} onRetry={handleRetry} onGoBack={handleGoBack} />
    );
  }

  // Quiz completed - show results
  if (isQuizCompleted && result) {
    return (
      <div className="min-h-screen bg-background py-8">
        <QuizResults
          result={result}
          onRetakeQuiz={handleRetakeQuiz}
          onViewAnswers={handleViewAnswers}
        />
      </div>
    );
  }

  // Quiz in progress
  if (isQuizStarted && currentQuestion) {
    return (
      <div className="min-h-screen bg-background">
        <QuizHeader
          title={`Quiz: ${currentQuestion.content.slice(0, 50)}...`}
          progress={progress}
          timeRemaining={timeRemaining}
          timerActive={timerActive}
        />

        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="space-y-6">
            <QuestionCard
              question={currentQuestion}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={questions.length}
            />

            <AnswerOptions
              question={currentQuestion}
              userAnswer={currentUserAnswer}
              onAnswerSelect={handleAnswerSubmit}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>

        <QuizNavigation
          currentQuestion={currentQuestionIndex + 1}
          totalQuestions={questions.length}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onSubmit={handleSubmit}
          isFirstQuestion={currentQuestionIndex === 0}
          isLastQuestion={currentQuestionIndex === questions.length - 1}
          isSubmitting={isSubmitting}
          hasAnswered={hasAnswered}
        />
      </div>
    );
  }

  // Default loading state
  return <QuizLoading message="Preparing quiz..." />;
};

export default DoQuizPage;
