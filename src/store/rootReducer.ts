import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "@/modules/auth/common/slices/authSlice";
import categoryReducer from "@/modules/client/category/slices/category.slice";
import adminCategoryReducer from "@/modules/admin/categories/slices/admin.category.slice";
import adminQuizReducer from "@/modules/admin/quizzes/slices/admin.quiz.slice";
import adminQuestionReducer from "@/modules/admin/questions/slices/admin.question.slice";
import clientQuizReducer from "@/modules/client/category/slices/client.quiz.slice";
import quizDetailReducer from "@/modules/client/quiz/slices/quiz.detail.slice";
import roomQuizReducer from "@/modules/client/room-quiz/slices/room-quiz.slice";
import quizReducer from "@/modules/client/do-quiz/slices/quiz.slice";
import websocketReducer from "@/common/slices/websocket.slice";
import notificationReducer from "@/common/slices/notification.slice";
// Temporarily disable persistence for auth slice to test logout
// const authPersistConfig = {
//   key: 'auth',
//   storage,
//   whitelist: ['user'], // Only persist user info
//   blacklist: ['token', 'isAuthenticated', 'loading', 'error'], // Never persist token, auth status, loading, or error
// };

// Create persisted auth reducer
// const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);

const rootReducer = combineReducers({
  auth: authReducer, // Use non-persisted version for testing
  category: categoryReducer,
  adminCategory: adminCategoryReducer,
  adminQuiz: adminQuizReducer,
  adminQuestion: adminQuestionReducer,
  clientQuiz: clientQuizReducer,
  quizDetail: quizDetailReducer,
  roomQuiz: roomQuizReducer,
  quiz: quizReducer,
  websocket: websocketReducer,
  notifications: notificationReducer,
});

export default rootReducer;
