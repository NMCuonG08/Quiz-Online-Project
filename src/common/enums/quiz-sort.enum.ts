export enum QuizSortCriteria {
  RECENTLY_PUBLISHED = 'recently_published',
  BEST_RATING = 'best_rating',
  POPULAR = 'popular',
  EASY = 'easy',
  HARD = 'hard',
  MOST_QUESTIONS = 'most_questions',
  LEAST_QUESTIONS = 'least_questions',
  MOST_ATTEMPTS = 'most_attempts',
  ALPHABETICAL = 'alphabetical',
}

export const QUIZ_SORT_CRITERIA_DESCRIPTIONS = {
  [QuizSortCriteria.RECENTLY_PUBLISHED]: 'Recently Published',
  [QuizSortCriteria.BEST_RATING]: 'Best Rating',
  [QuizSortCriteria.POPULAR]: 'Popular',
  [QuizSortCriteria.EASY]: 'Easy',
  [QuizSortCriteria.HARD]: 'Hard',
  [QuizSortCriteria.MOST_QUESTIONS]: 'Most Questions',
  [QuizSortCriteria.LEAST_QUESTIONS]: 'Least Questions',
  [QuizSortCriteria.MOST_ATTEMPTS]: 'Most Attempts',
  [QuizSortCriteria.ALPHABETICAL]: 'Alphabetical',
} as const;

export type QuizSortCriteriaType = keyof typeof QuizSortCriteria;
