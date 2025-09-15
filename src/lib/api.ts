import { AuthenticationService } from "@/modules/auth/common/services/auth.service";
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
// Note: AuthenticationService will be dynamically imported to avoid circular dependencies
// Enhanced error interface with comprehensive error information
export interface StandardError extends Error {
  status?: number;
  statusText?: string;
  code?: string;
  data?: unknown;
  isNetworkError?: boolean;
  isTimeoutError?: boolean;
  isRetryable?: boolean;
  originalError?: AxiosError;
}

// Error severity levels for better logging
enum ErrorSeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

// Error classification with severity mapping
const ERROR_CONFIG = {
  400: {
    severity: ErrorSeverity.MEDIUM,
    message: "Bad Request - Invalid data sent",
  },
  401: {
    severity: ErrorSeverity.HIGH,
    message: "Unauthorized - Authentication required",
  },
  403: { severity: ErrorSeverity.HIGH, message: "Forbidden - Access denied" },
  404: {
    severity: ErrorSeverity.MEDIUM,
    message: "Not Found - Resource not available",
  },
  409: {
    severity: ErrorSeverity.MEDIUM,
    message: "Conflict - Resource already exists",
  },
  422: {
    severity: ErrorSeverity.MEDIUM,
    message: "Validation Error - Invalid input data",
  },
  429: {
    severity: ErrorSeverity.HIGH,
    message: "Rate Limited - Too many requests",
  },
  500: { severity: ErrorSeverity.CRITICAL, message: "Internal Server Error" },
  502: {
    severity: ErrorSeverity.CRITICAL,
    message: "Bad Gateway - Server unavailable",
  },
  503: { severity: ErrorSeverity.CRITICAL, message: "Service Unavailable" },
  504: { severity: ErrorSeverity.CRITICAL, message: "Gateway Timeout" },
} as const;

// Professional logging utility
class APILogger {
  private static formatError(
    status: number,
    statusText: string,
    data?: unknown
  ): string {
    const config = ERROR_CONFIG[status as keyof typeof ERROR_CONFIG];
    const severity = config?.severity || ErrorSeverity.MEDIUM;
    const defaultMessage = config?.message || statusText;

    return `[${severity}] ${status} ${defaultMessage}`;
  }

  static logRequest(config: AxiosRequestConfig): void {
    if (process.env.NODE_ENV === "development") {
      console.group(
        `🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`
      );

      console.groupEnd();
    }
  }

  static logResponse(response: AxiosResponse): void {
    if (process.env.NODE_ENV === "development") {
      console.group(
        `✅ API Response: ${response.status} ${response.config.url}`
      );
      console.groupEnd();
    }
  }

  static logError(error: AxiosError): void {
    const status = error.response?.status;
    const statusText = error.response?.statusText;
    const url = error.config?.url;
    const method = error.config?.method?.toUpperCase();

    if (status && statusText) {
      const severity =
        ERROR_CONFIG[status as keyof typeof ERROR_CONFIG]?.severity ||
        ErrorSeverity.MEDIUM;
      const logMethod =
        severity === ErrorSeverity.CRITICAL ? console.error : console.warn;

      logMethod(
        `🚨 ${this.formatError(status, statusText)}\n` +
          `   URL: ${method} ${url}\n` +
          `   Response:`,
        error.response?.data
      );

      // Log additional context for critical errors
      if (severity === ErrorSeverity.CRITICAL) {
        console.error("Full error context:", {
          config: error.config,
          response: error.response,
          stack: error.stack,
        });
      }
    } else {
      console.error("🔌 Network Error:", error.message);
      console.error("Error details:", error);
    }
  }

  static logRefreshAttempt(attempt: number): void {
    console.warn(`🔄 Token refresh attempt ${attempt}/3...`);
  }

  static logRefreshSuccess(): void {
    console.info("✅ Token refreshed successfully");
  }

  static logRefreshFailure(): void {
    console.error("❌ Token refresh failed - redirecting to login");
  }
}

const apiClient = axios.create({
  baseURL: "http://localhost:3333",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Enhanced store access with proper typing
interface AppStore {
  getState: () => {
    auth?: {
      token?: string;
      user?: unknown;
    };
  };
  dispatch: (action: unknown) => void;
}

interface WindowWithStore extends Window {
  __STORE__?: AppStore;
}

const getStore = (): AppStore | null => {
  try {
    if (typeof window === "undefined") return null;

    const globalWindow = window as WindowWithStore;
    return globalWindow.__STORE__ || null;
  } catch (error) {
    console.warn("Store access error:", error);
    return null;
  }
};

// Enhanced token management
const getAccessToken = (): string | null => {
  if (typeof window === "undefined") return null;

  try {
    return localStorage.getItem("auth_token");
  } catch (error) {
    console.error("Failed to get access token:", error);
    return null;
  }
};

const setAccessToken = (token: string | null): void => {
  if (typeof window === "undefined") return;

  try {
    if (token) {
      localStorage.setItem("auth_token", token);
      apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      localStorage.removeItem("auth_token");
      delete apiClient.defaults.headers.common["Authorization"];
    }
  } catch (error) {
    console.error("Failed to set access token:", error);
  }
};

// Enhanced logout logic
const performLogout = async (): Promise<void> => {
  try {
    // Clear all auth-related storage
    const authKeys = ["auth_token", "persist:auth", "token", "refresh_token"];
    authKeys.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`Failed to remove ${key}:`, error);
      }
    });

    // Clear axios defaults
    delete apiClient.defaults.headers.common["Authorization"];

    // Dispatch logout action if store is available
    const store = getStore();
    if (store?.dispatch) {
      try {
        const { handleLogout } = AuthenticationService;
        store.dispatch(handleLogout());
      } catch (error) {
        console.warn("Failed to dispatch logout action:", error);
      }
    }

    // Only redirect to login if not already on auth pages
    const currentPath = window.location.pathname;
    const isOnAuthPage =
      currentPath.includes("/auth/login") ||
      currentPath.includes("/auth/register");

    if (!isOnAuthPage) {
      window.location.href = "/auth/login";
    }
  } catch (error) {
    console.error("Logout process failed:", error);
    // Only force redirect if not on auth pages
    const currentPath = window.location.pathname;
    const isOnAuthPage =
      currentPath.includes("/auth/login") ||
      currentPath.includes("/auth/register");

    if (!isOnAuthPage) {
      window.location.href = "/auth/login";
    }
  }
};

// Enhanced request interceptor
apiClient.interceptors.request.use(
  (config) => {
    APILogger.logRequest(config);

    // Auto-attach token if available
    const token = getAccessToken();
    if (token && !config.headers?.Authorization) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Enhanced response interceptor with comprehensive error handling
apiClient.interceptors.response.use(
  (response) => {
    APILogger.logResponse(response);
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
      _retryCount?: number;
    };

    // Log the error with professional formatting
    APILogger.logError(error);

    // Handle 401 Unauthorized with token refresh
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      // Check if this is a login/register request - don't try to refresh token
      const isAuthRequest =
        originalRequest.url?.includes("/auth/login") ||
        originalRequest.url?.includes("/auth/signup") ||
        originalRequest.url?.includes("/auth/register");

      if (isAuthRequest) {
        // For auth requests, return the error response instead of rejecting
        return Promise.resolve({
          data: error.response?.data || {
            error: {
              message: "Authentication failed",
              code: "AUTH_ERROR",
            },
          },
          status: error.response?.status || 401,
          statusText: error.response?.statusText || "Unauthorized",
          headers: error.response?.headers || {},
          config: error.config,
        });
      }

      originalRequest._retry = true;
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

      // Limit retry attempts
      if (originalRequest._retryCount > 3) {
        APILogger.logRefreshFailure();
        await performLogout();
        return Promise.resolve({
          data: {
            error: {
              message: "Token refresh failed after multiple attempts",
              code: "REFRESH_FAILED",
            },
          },
          status: 401,
          statusText: "Unauthorized",
          headers: {},
          config: error.config,
        });
      }

      try {
        APILogger.logRefreshAttempt(originalRequest._retryCount);

        // Use existing AuthenticationService for token refresh
        const refreshData = await AuthenticationService.refreshToken();

        const newToken = refreshData?.token || refreshData?.accessToken;
        console.log("New token received:", newToken);
        if (newToken) {
          setAccessToken(newToken);
          APILogger.logRefreshSuccess();

          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }

          return apiClient(originalRequest);
        } else {
          return Promise.resolve({
            data: {
              error: {
                message: "No token received from refresh service",
                code: "REFRESH_ERROR",
              },
            },
            status: 401,
            statusText: "Unauthorized",
            headers: {},
            config: error.config,
          });
        }
      } catch (refreshError) {
        APILogger.logRefreshFailure();
        await performLogout();
        return Promise.resolve({
          data: {
            error: {
              message: "Token refresh failed",
              code: "REFRESH_ERROR",
            },
          },
          status: 401,
          statusText: "Unauthorized",
          headers: {},
          config: error.config,
        });
      }
    }

    // For all other errors, return the response instead of rejecting
    return Promise.resolve({
      data: error.response?.data || {
        error: {
          message: error.message || "An unexpected error occurred",
          code: error.code || "UNKNOWN_ERROR",
        },
      },
      status: error.response?.status || 500,
      statusText: error.response?.statusText || "Internal Server Error",
      headers: error.response?.headers || {},
      config: error.config,
    });
  }
);

// Utility functions for external use
export const clearAuthData = (): void => {
  setAccessToken(null);
};

export const setAuthToken = (token: string): void => {
  setAccessToken(token);
};

export { apiClient };
export default apiClient;
