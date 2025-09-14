import { apiClient } from "@/lib/api";
import { LoginFormData, RegisterFormData } from "../schema/auth";

export class AuthenticationService {
  // Handle user login
  static async handleLogin(credentials: LoginFormData) {
    try {
      console.log("Attempting login with credentials:", {
        email: credentials.email,
      });
      const response = await apiClient.post("/auth/login", credentials);
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

  static async handleRegister(credentials: RegisterFormData) {
    try {
      const response = await apiClient.post("/auth/signup", credentials);
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
      const response = await apiClient.get("/auth/profile");
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

  static async refreshToken() {
    try {
      const refreshResponse = await apiClient.post(
        "/auth/refresh",
        {},
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Token refresh response:", refreshResponse.data.data);
      if (refreshResponse.data) {
        return refreshResponse.data.data;
      }
      return {
        error: {
          message: "Token refresh failed",
          code: "REFRESH_ERROR",
        },
      };
    } catch (error) {
      console.error("Token refresh failed:", error);
      // Trả về response từ backend thay vì throw error
      return (
        error.response?.data || {
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
      const response = await apiClient.post("/auth/logout");
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
