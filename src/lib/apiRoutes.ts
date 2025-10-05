export const apiRoutes = {
  CATEGORIES: {
    BASE: "/api/categories",
    GET_ALL: "/api/categories",
    GET_BY_SLUG: (slug: string) => `/api/categories/slug/${slug}`,
  },
  QUIZZES: {
    BASE: "/api/quizzes",
    GET_ALL: "/api/quizzes",
    GET_BY_SLUG: (slug: string) => `/api/quizzes/slug/${slug}`,
  },
};
