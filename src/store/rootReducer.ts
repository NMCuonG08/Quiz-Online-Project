import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "@/modules/auth/common/slices/authSlice";
import categoryReducer from "@/modules/client/category/slices/category.slice";
import adminCategoryReducer from "@/modules/admin/categories/slices/admin.category.slice";
import adminQuizReducer from "@/modules/admin/quizzes/slices/admin.quiz.slice";
import adminQuestionReducer from "@/modules/admin/questions/slices/admin.question.slice";

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
});

export default rootReducer;
