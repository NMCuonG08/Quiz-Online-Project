export interface Question {
  id: string;
  content: string;
  media_url?: string;
  media_type?: "image" | "video" | "audio";
  time_limit?: number;
  points: number;
  sort_order: number;
  question_type: "multiple_choice" | "true_false" | "fill_blank" | "essay";
  options: QuestionOption[];
  correct_answer?: string;
  explanation?: string;
}

export interface QuestionOption {
  id: string;
  content: string;
  is_correct: boolean;
  sort_order: number;
}

export interface QuizSession {
  id: string;
  quiz_id: string;
  user_id: string;
  started_at: string;
  completed_at?: string;
  current_question_index: number;
  total_questions: number;
  score: number;
  time_spent: number;
  answers: UserAnswer[];
}

export interface UserAnswer {
  question_id: string;
  selected_option_id?: string;
  text_answer?: string;
  is_correct: boolean;
  points_earned: number;
  time_spent: number;
  answered_at: string;
}

export interface QuizResult {
  session_id: string;
  total_questions: number;
  correct_answers: number;
  total_score: number;
  percentage: number;
  time_spent: number;
  passed: boolean;
  rank?: number;
  feedback?: string;
}

export interface QuizProgress {
  current_question: number;
  total_questions: number;
  percentage: number;
  time_remaining: number;
  score: number;
}

export interface QuizSettings {
  show_correct_answers: boolean;
  show_explanations: boolean;
  allow_review: boolean;
  shuffle_questions: boolean;
  shuffle_options: boolean;
}
