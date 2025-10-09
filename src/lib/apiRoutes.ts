export const apiRoutes = {
  CATEGORIES: {
    BASE: "/api/categories",
    GET_ALL: "/api/categories",
    GET_BY_SLUG: (slug: string) => `/api/categories/slug/${slug}`,
    CREATE: "/api/categories",
    UPDATE_BY_ID: (id: string | number) => `/api/categories/${id}`,
    DELETE_BY_ID: (id: string | number) => `/api/categories/${id}`,
  },
  QUIZZES: {
    BASE: "/api/quizzes",
    GET_ALL: "/api/quizzes",
    GET_BY_SLUG: (slug: string) => `/api/quizzes/slug/${slug}`,
    CREATE: "/api/quizzes",
    UPDATE_BY_ID: (Id: string) => `/api/quizzes/${Id}`,
    DELETE_BY_ID: (Id: string) => `/api/quizzes/${Id}`,
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
