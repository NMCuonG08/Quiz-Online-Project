import { AuthenticationService } from "@/modules/auth/common/services/auth.service";
import { detectLocaleFromPath, withLocalePrefix } from "@/lib/locale";
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
  private static formatError(status: number, statusText: string): string {
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
}

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Flag to prevent multiple logout calls
let isLoggingOut = false;

// Refresh token single-flight control
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

// Flag to track if currently calling refresh endpoint (prevent interceptor loop)
let isCallingRefreshEndpoint = false;

// Removed unused store access helpers

// Token expiration configuration (for future use if needed)
// const TOKEN_EXPIRY_MINUTES = parseInt(
//   process.env.NEXT_PUBLIC_TOKEN_EXPIRY_MINUTES || "15"
// );

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
      isLoggingOut = false; // Reset logout flag when setting new token
      console.log("✅ Token set");
    } else {
      localStorage.removeItem("auth_token");
      delete apiClient.defaults.headers.common["Authorization"];
      console.log("🗑️ Token removed");
    }
  } catch (error) {
    console.error("Failed to set access token:", error);
  }
};

// Enhanced logout logic
const performLogout = async (): Promise<void> => {
  try {
    // Clear all auth-related storage
    const authKeys = [
      "auth_token",
      "persist:root",
      "persist:auth",
      "token",
      "refresh_token",
    ];
    authKeys.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`Failed to remove ${key}:`, error);
      }
    });

    // Clear session storage just in case
    try {
      sessionStorage.clear();
    } catch (e) {}

    // Dispatch clearAuth to Redux store if accessible
    try {
      const store = (window as any).__STORE__;
      if (store) {
        // Import might be tricky, use string type or check if we can import it
        store.dispatch({ type: "auth/clearAuth" });
      }
    } catch (e) {
      console.warn("Could not dispatch clearAuth:", e);
    }

    // Clear axios defaults
    delete apiClient.defaults.headers.common["Authorization"];

    // Only redirect to login if not already on auth pages
    const currentPath = window.location.pathname;
    const locale = detectLocaleFromPath(currentPath);
    const isOnAuthPage =
      currentPath.includes("/auth/login") ||
      currentPath.includes("/auth/register");

    if (!isOnAuthPage) {
      window.location.href = withLocalePrefix("/auth/login", {
        pathname: currentPath,
        locale,
      });
    }
  } catch (error) {
    console.error("Logout process failed:", error);
    // Only force redirect if not on auth pages
    const currentPath = window.location.pathname;
    const locale = detectLocaleFromPath(currentPath);
    const isOnAuthPage =
      currentPath.includes("/auth/login") ||
      currentPath.includes("/auth/register");

    if (!isOnAuthPage) {
      window.location.href = withLocalePrefix("/auth/login", {
        pathname: currentPath,
        locale,
      });
    }
  }
};

// Enhanced request interceptor
apiClient.interceptors.request.use(
  async (config) => {
    APILogger.logRequest(config);

    // Auto-attach token if available
    const token = getAccessToken();
    if (token && !config.headers?.Authorization) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Remove Content-Type header for FormData to let browser set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers?.["Content-Type"];
    }

    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Helper: start a refresh single-flight
const startTokenRefresh = async (): Promise<string | null> => {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }
  isRefreshing = true;
  isCallingRefreshEndpoint = true; // Set flag before calling refresh
  refreshPromise = (async () => {
    try {
      type RefreshResult =
        | { token?: string; user?: unknown }
        | { error: { message: string; code: string } };
      const result: RefreshResult = await AuthenticationService.refreshToken();
      if ("error" in result) {
        return null;
      }
      const newToken = result.token || null;
      if (newToken) {
        setAccessToken(newToken);
      }
      return newToken;
    } catch {
      return null;
    } finally {
      isRefreshing = false;
      isCallingRefreshEndpoint = false; // Reset flag after refresh completes
    }
  })();
  return refreshPromise;
};

// Enhanced response interceptor with comprehensive error handling
apiClient.interceptors.response.use(
  (response) => {
    APILogger.logResponse(response);
    return response;
  },
  async (error: AxiosError) => {
    // Log the error with professional formatting
    APILogger.logError(error);

    // Handle 500 Internal Server Error - return fallback response
    if (error.response?.status === 500) {
      console.warn("🔄 API returned 500 error");
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized - try refresh once, then logout if refresh fails
    if (error.response?.status === 401) {
      const originalConfig = error.config as AxiosRequestConfig & {
        _retry?: boolean;
      };

      // If we're currently calling refresh endpoint and it fails, logout immediately
      if (isCallingRefreshEndpoint) {
        console.warn(
          "⚠️ 401 on refresh endpoint - Refresh token invalid, auto logout"
        );
        if (!isLoggingOut) {
          isLoggingOut = true;
          await performLogout();
          setTimeout(() => {
            isLoggingOut = false;
          }, 1000);
        }
        return Promise.reject(error);
      }

      if (originalConfig && originalConfig._retry) {
        // Already retried, prevent loops -> logout
        console.warn("🔄 401 Already retried - Auto logout");
        if (!isLoggingOut) {
          isLoggingOut = true;
          await performLogout();
          setTimeout(() => {
            isLoggingOut = false;
          }, 1000);
        }
        return Promise.reject(error);
      }

      // Try to refresh token - only retry if refresh succeeds
      try {
        console.log("🔄 Attempting token refresh...");
        const newToken: string | null = await startTokenRefresh();

        if (!newToken) {
          // Refresh failed -> logout immediately
          console.warn("⚠️ Token refresh failed - Auto logout");
          if (!isLoggingOut) {
            isLoggingOut = true;
            await performLogout();
            setTimeout(() => {
              isLoggingOut = false;
            }, 1000);
          }
          return Promise.reject(error);
        }

        // Retry once with new token
        console.log("✅ Token refreshed successfully - Retrying request");
        originalConfig._retry = true;
        const hdrs: Record<string, unknown> =
          (originalConfig.headers as Record<string, unknown>) || {};
        hdrs["Authorization"] = `Bearer ${newToken}`;
        originalConfig.headers = hdrs as AxiosRequestConfig["headers"];
        return apiClient(originalConfig) as Promise<AxiosResponse>;
      } catch (refreshError) {
        // Refresh failed with error -> logout
        console.error("❌ Token refresh error - Auto logout:", refreshError);
        if (!isLoggingOut) {
          isLoggingOut = true;
          await performLogout();
          setTimeout(() => {
            isLoggingOut = false;
          }, 1000);
        }
        return Promise.reject(refreshError);
      }
    }

    // Handle 403 Forbidden - invalid token or access denied, auto logout
    if (error.response?.status === 403) {
      console.warn(
        "🔒 403 Forbidden - Auto logout due to invalid token or access denied"
      );
      if (!isLoggingOut) {
        isLoggingOut = true;
        await performLogout();
        setTimeout(() => {
          isLoggingOut = false;
        }, 1000);
      }
      return Promise.reject(error);
    }

    // For all other errors, reject with the error
    return Promise.reject(error);
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
