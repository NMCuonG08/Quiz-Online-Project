import { Question, QuestionOption } from "../../do-quiz/types/quiz.types";

export interface GameQuizState {
  roomId: string;
  quizId: string;
  currentQuestionIndex: number;
  questions: Question[];
  selectedAnswers: Map<string, string | string[]>; // questionId -> answer(s)
  timeRemaining: number;
  isAnswered: boolean;
  isGameStarted: boolean;
  isGameEnded: boolean;
  score: number;
  totalScore: number;
}

export interface GameQuizAnswer {
  questionId: string;
  selectedOptionId?: string;
  selectedOptionIds?: string[];
  textAnswer?: string;
  answeredAt: Date;
  timeSpent: number;
}

export interface QuestionRendererProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  selectedAnswer?: string | string[];
  onAnswerSelect: (answer: string | string[]) => void;
  isAnswered: boolean;
  timeRemaining?: number;
}

export interface IQuestionRendererStrategy {
  render(props: QuestionRendererProps): React.ReactNode;
  validateAnswer(question: Question, answer: string | string[]): boolean;
  getDefaultAnswer(): string | string[];
}

export enum QuestionType {
  MULTIPLE_CHOICE = "multiple_choice",
  TRUE_FALSE = "true_false",
  FILL_BLANK = "fill_blank",
  ESSAY = "essay",
}

