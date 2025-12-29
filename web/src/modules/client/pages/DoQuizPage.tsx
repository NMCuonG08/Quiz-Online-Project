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
import { AlertTriangle, ArrowLeft, RefreshCw, CheckCircle2, Ghost } from "lucide-react";
import { APP_ROUTES } from "@/lib/appRoutes";

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
    userAnswers,
    startQuiz,
    handleSubmitAnswer,
    handleNextQuestion,
    handlePreviousQuestion,
    handleCompleteQuiz,
    goToQuestion,
    getCurrentQuestion,
    getUserAnswer,
    clearQuizError,
    resetQuizState,
  } = useQuiz(slug);

  // Track answered question indices - only count if actually answered
  const answeredQuestions = React.useMemo(() => {
    const answered = new Set<number>();
    userAnswers.forEach(answer => {
      // Only count as answered if there's an actual selection or text
      const hasActualAnswer =
        answer.selected_option_id !== undefined ||
        (answer.text_answer !== undefined && answer.text_answer.trim() !== '');

      if (hasActualAnswer) {
        const index = questions.findIndex(q => q.id === answer.question_id);
        if (index !== -1) {
          answered.add(index);
        }
      }
    });
    return answered;
  }, [userAnswers, questions]);

  const [hasAnswered, setHasAnswered] = useState(false);

  // Get current question - use useMemo to ensure proper dependency tracking
  const currentQuestion = React.useMemo(() => {
    if (questions.length === 0) return undefined;
    return questions[currentQuestionIndex];
  }, [questions, currentQuestionIndex]);

  // Use useMemo to ensure currentUserAnswer updates when userAnswers changes
  const currentUserAnswer = React.useMemo(() => {
    if (!currentQuestion) return undefined;
    const answer = userAnswers.find(a => a.question_id === currentQuestion.id);
    console.log("currentUserAnswer recalculated:", {
      questionId: currentQuestion.id,
      selectedOptionId: answer?.selected_option_id,
      totalAnswers: userAnswers.length,
    });
    return answer;
  }, [currentQuestion, userAnswers]);

  // Check if current question has been answered
  useEffect(() => {
    // Check if answer exists AND has actual content (not just empty/undefined values)
    const hasActualAnswer = !!currentUserAnswer && (
      currentUserAnswer.selected_option_id !== undefined ||
      (currentUserAnswer.text_answer !== undefined && currentUserAnswer.text_answer.trim() !== '')
    );
    setHasAnswered(hasActualAnswer);
  }, [currentUserAnswer]);

  // Validate slug
  if (!slug || slug.trim() === '') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.1),rgba(255,255,255,0))]" />
        <Card className="w-full max-w-md border-none shadow-2xl bg-card/60 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-500">
          <CardHeader className="text-center pt-10">
            <div className="w-20 h-20 mx-auto mb-6 bg-destructive/10 rounded-3xl flex items-center justify-center animate-pulse">
              <AlertTriangle className="w-10 h-10 text-destructive" />
            </div>
            <CardTitle className="text-3xl font-black tracking-tighter">Invalid Identifier</CardTitle>
            <CardDescription className="text-base font-medium mt-2">
              The quiz slug provided is either empty or structurally incorrect.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-10">
            <Button
              onClick={() => router.back()}
              className="w-full h-12  font-black bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
            >
              <ArrowLeft className="w-5 h-5 mr-3" />
              Go Back
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

    // Create complete answer with question_id here, not in hook
    // This avoids stale closure issues
    const completeAnswer = {
      ...answer,
      question_id: currentQuestion.id,
      answered_at: new Date().toISOString(),
    };

    console.log("handleAnswerSubmit:", {
      questionId: completeAnswer.question_id,
      selectedOptionId: completeAnswer.selected_option_id,
    });

    handleSubmitAnswer(completeAnswer as import("../do-quiz/types/quiz.types").UserAnswer);

    // Check if answer actually has content (support for toggle/deselect)
    const hasActualAnswer =
      answer.selected_option_id !== undefined ||
      (answer.text_answer !== undefined && answer.text_answer.trim() !== '');
    setHasAnswered(hasActualAnswer);
  };

  // Handle navigation - allow navigation without requiring answer
  const handleNext = () => {
    handleNextQuestion();
  };

  const handlePrevious = () => {
    handlePreviousQuestion();
  };

  const handleSubmit = () => {
    handleCompleteQuiz();
  };

  // Handle retake quiz
  const handleRetakeQuiz = () => {
    resetQuizState();
    setHasAnswered(false);
  };

  // Handle view answers
  const handleViewAnswers = () => {
    router.push(`${APP_ROUTES.QUIZZES.LIST}/${slug}/review`);
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
    return <QuizLoading message="Fetching questions..." />;
  }

  // No questions found
  if (!loading && questions.length === 0 && !error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))]" />
        <Card className="w-full max-w-md border-none shadow-2xl bg-card/60 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-500">
          <CardHeader className="text-center pt-10">
            <div className="w-20 h-20 mx-auto mb-6 bg-muted rounded-3xl flex items-center justify-center opacity-50">
              <Ghost className="w-10 h-10 text-muted-foreground" />
            </div>
            <CardTitle className="text-3xl font-black tracking-tighter">Empty Quiz</CardTitle>
            <CardDescription className="text-base font-medium mt-2">
              This quiz doesn't contain any questions yet. Maybe check back later?
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-10 space-y-4">
            <Button
              onClick={handleGoBack}
              className="w-full h-12  font-black bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
            >
              <ArrowLeft className="w-5 h-5 mr-3" />
              Go Back
            </Button>
            <Button
              onClick={handleRetry}
              className="w-full h-12  font-bold border-2 hover:bg-muted transition-all"
              variant="outline"
            >
              <RefreshCw className="w-5 h-5 mr-3" />
              Try Again
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
      <div className="min-h-screen bg-background/50 py-12 px-4 selection:bg-primary/20">
        <QuizResults
          result={result}
          questions={questions}
          userAnswers={userAnswers}
          onRetakeQuiz={handleRetakeQuiz}
          onViewAnswers={handleViewAnswers}
        />
      </div>
    );
  }

  // Quiz in progress
  if (isQuizStarted && currentQuestion) {
    return (
      <div className="min-h-screen bg-background flex flex-col selection:bg-primary/20">
        {/* Background Gradients */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -mr-64 -mt-64 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-[100px] -ml-64 -mb-64 animate-pulse duration-1000" />
        </div>

        <QuizHeader
          title="Quiz"
          progress={progress}
          timeRemaining={timeRemaining}
          timerActive={timerActive}
          answeredQuestions={answeredQuestions}
          onQuestionSelect={goToQuestion}
        />

        <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 pb-32 relative z-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <QuestionCard
            question={currentQuestion}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={questions.length}
          />

          <AnswerOptions
            key={currentQuestion.id}
            question={currentQuestion}
            userAnswer={currentUserAnswer}
            onAnswerSelect={handleAnswerSubmit}
            isSubmitting={isSubmitting}
          />
        </main>

        <QuizNavigation
          currentQuestion={currentQuestionIndex + 1}
          totalQuestions={questions.length}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onSubmit={handleSubmit}
          isFirstQuestion={currentQuestionIndex === 0}
          isLastQuestion={currentQuestionIndex === questions.length - 1}
          isSubmitting={isSubmitting}
        />
      </div>
    );
  }

  // Default loading state
  return <QuizLoading message="Spinning up your session..." />;
};

export default DoQuizPage;
