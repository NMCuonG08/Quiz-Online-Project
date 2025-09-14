import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import {
  loginUser,
  logout,
  registerUser,
  clearAuth,
  getUserProfile,
} from "@/modules/auth/common/slices/authSlice";
import {
  LoginFormData,
  RegisterFormData,
} from "@/modules/auth/common/schema/auth";

/**
 * Chuyên nghiệp: Hook quản lý auth, trả về state và action, không xử lý UI
 */
export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, token, user, loading, error } = useAppSelector(
    (state) => state.auth
  );

  const login = useCallback(
    async (credentials: LoginFormData) => {
      try {
        const result = await dispatch(loginUser(credentials)).unwrap();
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: error as string };
      }
    },
    [dispatch]
  );

  const logoutUser = useCallback(async () => {
    try {
      await dispatch(logout()).unwrap();
      if (typeof window !== "undefined") {
        localStorage.removeItem("persist:auth");
      }
      dispatch(clearAuth());
      return { success: true };
    } catch (error) {
      dispatch(clearAuth());
      return { success: false, error: error as string };
    }
  }, [dispatch]);

  const profile = useCallback(async () => {
    try {
      console.log("Fetching user profile...");
      const result = await dispatch(getUserProfile()).unwrap();
      console.log("User profile fetched successfully:", result);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error as string };
    }
  }, [dispatch]);

  const register = useCallback(
    async (userData: RegisterFormData) => {
      try {
        const result = await dispatch(registerUser(userData)).unwrap();
        return result;
      } catch (error) {
        console.error("Register Hook Error:", error);
        return error;
      }
    },
    [dispatch]
  );

  return {
    isAuthenticated,
    isLoggedIn: isAuthenticated && !!token,
    token,
    user,
    loading,
    error,
    profile,
    login,
    logout: logoutUser,
    register,
  };
};
