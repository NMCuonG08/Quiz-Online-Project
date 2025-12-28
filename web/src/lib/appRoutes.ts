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
    LIST: "/quizzes",
    DETAIL: (slug: string) => `/quizzes/${slug}`,
    PLAY: (slug: string) => `/quizzes/${slug}/play`,
    RESULT: (sessionId: string) => `/quizzes/result/${sessionId}`,
  },
  ADMIN: {
    DASHBOARD: "/admin",
    QUIZZES: "/admin/quizzes",
    CATEGORIES: "/admin/categories",
    USERS: "/admin/users",
  },
};
