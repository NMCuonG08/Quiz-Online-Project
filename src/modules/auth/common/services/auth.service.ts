import { apiClient } from "@/lib/api";
import { LoginFormData, RegisterFormData } from "../schema/auth";

export class AuthenticationService {
  // Handle user login
  static async handleLogin(credentials: LoginFormData) {
    try {
      const response = await apiClient.post("/auth/login", credentials);

      return response.data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  static async handleRegister(credentials: RegisterFormData) {
    try {
      const response = await apiClient.post("/auth/register", credentials);
      return response.data;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  }

  static async getUserProfile() {
    try {
      const response = await apiClient.get("/auth/profile");
      return response.data;
    } catch (error) {
      console.error("Get user profile error:", error);
      throw error;
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
      throw new Error("Token refresh failed");
    } catch (error) {
      console.error("Token refresh failed:", error);
      throw error;
    }
  }

  static async handleLogout() {
    try {
      const response = await apiClient.post("/auth/logout");
      return response.data;
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  }
}
