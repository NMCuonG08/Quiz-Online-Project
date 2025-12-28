import { apiClient } from "@/lib/api";
import { apiRoutes } from "@/lib/apiRoutes";
import { LoginFormData, RegisterFormData } from "../schema/auth";

export class AuthenticationService {
  // Handle user login
  static async handleLogin(credentials: LoginFormData) {
    try {
      console.log("Attempting login with credentials:", {
        email: credentials.email,
      });
      const response = await apiClient.post(apiRoutes.AUTH.LOGIN, credentials);
      console.log("Login API response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Login error:", error);
      // Trả về response từ backend thay vì throw error
      return (
        error.response?.data || {
          error: {
            message: "Login failed",
            code: "LOGIN_ERROR",
          },
        }
      );
    }
  }

  // Get Google OAuth URL (server generates URL with state, etc.)
  static async getGoogleAuthUrl() {
    try {
      const response = await apiClient.get(apiRoutes.AUTH.GOOGLE_URL);
      return response.data;
    } catch (error) {
      console.error("Get Google URL error:", error);
      return (
        error.response?.data || {
          error: {
            message: "Failed to get Google auth URL",
            code: "GOOGLE_URL_ERROR",
          },
        }
      );
    }
  }

  // Exchange Google code for tokens on server
  static async exchangeGoogleCode(payload: {
    code: string;
    state?: string;
    redirectUri?: string;
  }) {
    try {
      const response = await apiClient.post(
        apiRoutes.AUTH.GOOGLE_CALLBACK,
        payload
      );
      return response.data;
    } catch (error) {
      console.error("Exchange Google code error:", error);
      return (
        error.response?.data || {
          error: {
            message: "Failed to exchange Google code",
            code: "GOOGLE_EXCHANGE_ERROR",
          },
        }
      );
    }
  }

  static async handleRegister(credentials: RegisterFormData) {
    try {
      const response = await apiClient.post(apiRoutes.AUTH.REGISTER, credentials);
      return response.data;
    } catch (error) {
      console.error("Registration error:", error);
      // Trả về response từ backend thay vì throw error
      return (
        error.response?.data || {
          error: {
            message: "Registration failed",
            code: "REGISTRATION_ERROR",
          },
        }
      );
    }
  }

  static async getUserProfile() {
    try {
      const response = await apiClient.get(apiRoutes.AUTH.PROFILE);
      return response.data;
    } catch (error) {
      console.error("Get user profile error:", error);
      // Trả về response từ backend thay vì throw error
      return (
        error.response?.data || {
          error: {
            message: "Failed to get user profile",
            code: "PROFILE_ERROR",
          },
        }
      );
    }
  }

  // Refresh token method - DISABLED
  static async refreshToken(): Promise<
    | { token?: string; user?: unknown }
    | { error: { message: string; code: string } }
  > {
    try {
      // Expect backend to read refresh token from HttpOnly cookie
      const refreshResponse = await apiClient.post(
        apiRoutes.AUTH.REFRESH,
        {},
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      const data = refreshResponse?.data?.data || refreshResponse?.data;
      if (data?.token || data?.accessToken) {
        return { token: data.token || data.accessToken, user: data.user };
      }

      return {
        error: {
          message: "Token refresh failed",
          code: "REFRESH_ERROR",
        },
      };
    } catch (error) {
      console.error("Token refresh failed:", error);
      // Normalize error shape
      // @ts-expect-error Axios error dynamic
      const resp = error?.response?.data;
      return (
        resp || {
          error: {
            message: "Token refresh failed",
            code: "REFRESH_ERROR",
          },
        }
      );
    }
  }

  static async handleLogout() {
    try {
      const response = await apiClient.post(apiRoutes.AUTH.LOGOUT);
      return response.data;
    } catch (error) {
      console.error("Logout error:", error);
      // Trả về response từ backend thay vì throw error
      return (
        error.response?.data || {
          error: {
            message: "Logout failed",
            code: "LOGOUT_ERROR",
          },
        }
      );
    }
  }
}
