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
    JOIN: (roomId: string) => `/api/rooms/${roomId}/join`,
    BY_CODE: (roomCode: string) => `/api/rooms/code/${roomCode}`,
  },
  QUIZZES: {
    BASE: "/api/quizzes",
    GET_ALL: "/api/quizzes",

    GET_BY_SLUG: (slug: string) => `/api/quizzes/slug/${slug}`,
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
  },
  QUESTIONS: {
    BASE: "/api/questions",
    GET_ALL: "/api/questions",
    GET_BY_ID: (id: string) => `/api/questions/quiz/${id}`,
    CREATE: "/api/questions",
    UPDATE_BY_ID: (id: string) => `/api/questions/${id}`,
    DELETE_BY_ID: (id: string) => `/api/questions/${id}`,
  },
};
