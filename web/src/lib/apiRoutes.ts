export const apiRoutes = {
  CATEGORIES: {
    BASE: "/api/categories",
    GET_ALL: "/api/categories",
    GET_BY_SLUG: (slug: string) => `/api/categories/slug/${slug}`,
    CREATE: "/api/categories",
    UPDATE_BY_ID: (id: string | number) => `/api/categories/${id}`,
    DELETE_BY_ID: (id: string | number) => `/api/categories/${id}`,
  },
  ROOMS: {
    BASE: "/api/rooms",
    CREATE: "/api/rooms",
    BY_QUIZ: (quizId: string, status?: string) =>
      `/api/rooms/quiz/id/${quizId}${status ? `?status=${status}` : ""}`,
    BY_QUIZ_SLUG: (quizSlug: string, status?: string) =>
      `/api/rooms/quiz/slug/${quizSlug}${status ? `?status=${status}` : ""}`,
    JOIN: (roomId: string) => `/api/rooms/${roomId}/join`,
    BY_CODE: (roomCode: string) => `/api/rooms/code/${roomCode}`,
  },
  QUIZZES: {
    BASE: "/api/quizzes",
    GET_ALL: "/api/quizzes",

    GET_BY_SLUG: (slug: string) => `/api/quizzes/slug/${slug}`,
    GET_BY_ID: (id: string) => `/api/quizzes/id/${id}`,
    CREATE: "/api/quizzes",
    UPDATE_BY_ID: (Id: string) => `/api/quizzes/${Id}`,
    DELETE_BY_ID: (Id: string) => `/api/quizzes/${Id}`,
    // Client quiz endpoints
    BEST_RATED: "/api/quizzes/best-rated",
    RECENTLY_PUBLISHED: "/api/quizzes/recently-published",
    POPULAR: "/api/quizzes/popular",
    EASY: "/api/quizzes/easy",
    HARD: "/api/quizzes/hard",
    BY_DIFFICULTY: (difficulty: string) =>
      `/api/quizzes/difficulty/${difficulty}`,
    BY_CATEGORY: (categoryId: string) =>
      `/api/quizzes/category/${categoryId}`,
  },
  QUESTIONS: {
    BASE: "/api/questions",
    GET_ALL: "/api/questions",
    GET_BY_ID: (id: string) => `/api/questions/quiz/${id}`,
    GET_ALL_BY_QUIZ: (quizId: string) => `/api/questions/quiz/${quizId}/all`,
    GET_PUBLIC_BY_QUIZ: (quizId: string) =>
      `/api/questions/quiz/${quizId}/public`,
    GET_PUBLIC_BY_SLUG: (slug: string) =>
      `/api/questions/quiz/slug/${slug}/public`,
    CREATE: "/api/questions",
    UPDATE_BY_ID: (id: string) => `/api/questions/${id}`,
    DELETE_BY_ID: (id: string) => `/api/questions/${id}`,
  },
  QUIZ_SESSIONS: {
    BASE: "/api/quiz-sessions",
    CREATE: "/api/quiz-sessions",
    CREATE_PUBLIC: "/api/quiz-sessions/public",
    CREATE_PUBLIC_BY_SLUG: "/api/quiz-sessions/public/slug",
    SUBMIT_ANSWER: (sessionId: string) =>
      `/api/quiz-sessions/${sessionId}/answers`,
    SUBMIT_ANSWER_PUBLIC: (sessionId: string) =>
      `/api/quiz-sessions/${sessionId}/answers/public`,
    COMPLETE: (sessionId: string) => `/api/quiz-sessions/${sessionId}/complete`,
    COMPLETE_PUBLIC: (sessionId: string) =>
      `/api/quiz-sessions/${sessionId}/complete/public`,
    GET_RESULT: (sessionId: string) => `/api/quiz-sessions/${sessionId}/result`,
    DELETE_ATTEMPT: (sessionId: string) => `/api/quiz-sessions/${sessionId}`,
    USER_HISTORY: "/api/quiz-sessions/user/history",
    USER_IN_PROGRESS: "/api/quiz-sessions/user/in-progress",
    USER_ALL_ATTEMPTS: "/api/quiz-sessions/user/all-attempts",
  },
  AUTH: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    LOGOUT: "/api/auth/logout",
    PROFILE: "/api/auth/profile",
    REFRESH: "/api/auth/refresh-cookie",
    GOOGLE_URL: "/api/auth/google/url",
    GOOGLE_CALLBACK: "/api/auth/google/callback",
  },
};
