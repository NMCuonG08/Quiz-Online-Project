import React, { useMemo } from "react";
import { Question, UserAnswer } from "../../do-quiz/types/quiz.types";
import QuestionCard from "../../do-quiz/components/QuestionCard";
import AnswerOptions from "../../do-quiz/components/AnswerOptions";

interface QuestionDisplayProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  selectedAnswer?: string | string[];
  onAnswerSelect: (answer: string | string[]) => void;
  isAnswered: boolean;
  timeRemaining?: number;
}

export const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  onAnswerSelect,
  isAnswered,
}) => {
  // Map selectedAnswer to UserAnswer shape for AnswerOptions
  const mappedUserAnswer = useMemo(() => {
    if (!selectedAnswer) return undefined;
    
    return {
      question_id: question.id,
      selected_option_id: typeof selectedAnswer === "string" ? selectedAnswer : undefined,
      selected_option_ids: Array.isArray(selectedAnswer) ? selectedAnswer : typeof selectedAnswer === "string" ? [selectedAnswer] : [],
      text_answer: typeof selectedAnswer === "string" ? selectedAnswer : undefined,
      is_correct: false, // Not needed for selection view
      points_earned: 0,
      time_spent: 0,
      answered_at: new Date().toISOString(),
    } as UserAnswer;
  }, [selectedAnswer, question.id]);

  const handleSelect = (answer: Omit<UserAnswer, "question_id" | "answered_at">) => {
    if (answer.selected_option_ids && answer.selected_option_ids.length > 0) {
      onAnswerSelect(answer.selected_option_ids);
    } else if (answer.selected_option_id) {
      onAnswerSelect(answer.selected_option_id);
    } else if (answer.text_answer) {
      onAnswerSelect(answer.text_answer);
    } else {
      // Handle empty selection (clearing)
      onAnswerSelect([]);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <QuestionCard
        question={question}
        questionNumber={questionNumber}
        totalQuestions={totalQuestions}
      />
      
      <AnswerOptions
        question={question}
        userAnswer={mappedUserAnswer}
        onAnswerSelect={handleSelect}
        readOnly={isAnswered}
        showCorrectAnswers={isAnswered}
      />
    </div>
  );
};


