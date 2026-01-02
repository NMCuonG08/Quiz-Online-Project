export const APP_ROUTES = {
  HOME: "/",
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    FORGOT_PASSWORD: "/auth/forgot-password",
    GOOGLE_CALLBACK: "/auth/google/callback",
    GOOGLE_AUTH_URL: "https://accounts.google.com/o/oauth2/v2/auth",
  },
  USER: {
    PROFILE: "/profile",
    SETTINGS: "/settings",
  },
  QUIZ: {
    LIST: "/quiz",
    DETAIL: (slug: string) => `/quiz/${slug}`,
    PLAY: (slug: string) => `/quiz/${slug}/play`,
    DO_QUIZ: (slug: string) => `/quiz/${slug}/do-quiz`,
    RESULT: (sessionId: string) => `/quiz/result/${sessionId}`,
  },
  ADMIN: {
    DASHBOARD: "/admin",
    QUIZZES: "/admin/quizzes",
    CATEGORIES: "/admin/categories",
    USERS: "/admin/users",
  },
};
