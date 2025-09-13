import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "@/modules/auth/common/slices/authSlice";

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
});

export default rootReducer;
