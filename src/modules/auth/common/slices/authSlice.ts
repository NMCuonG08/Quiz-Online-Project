import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AuthenticationService } from "../services/auth.service";
import { LoginFormData, RegisterFormData } from "../schema/auth";

interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  isPremium?: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: User | null;
  loading: boolean;
  error: string | null;
}

const TokenStorage = {
  get: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("auth_token");
  },
  set: (token: string): void => {
    if (typeof window === "undefined") return;
    localStorage.setItem("auth_token", token);
  },
  remove: (): void => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("auth_token");
  },
};

const initialState: AuthState = {
  isAuthenticated: false,
  token: null, // Don't initialize from sessionStorage here - will be restored later
  user: null,
  loading: false,
  error: null,
};

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials: LoginFormData, { rejectWithValue }) => {
    const response = await AuthenticationService.handleLogin(credentials);
    console.log("Login response:", response);

    // Kiểm tra nếu có error trong response
    if (response.error) {
      return rejectWithValue(response.error.message || "Login failed");
    }

    return response;
  }
);

export const getUserProfile = createAsyncThunk(
  "auth/getUserProfile",
  async (_, { rejectWithValue }) => {
    const response = await AuthenticationService.getUserProfile();
    console.log("User profile fetched successfully:", response);

    // Kiểm tra nếu có error trong response
    if (response.error) {
      return rejectWithValue(
        response.error.message || "Failed to get user profile"
      );
    }

    return response.data || response;
  }
);

export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (credentials: RegisterFormData, { rejectWithValue }) => {
    // Remove confirmPassword before sending to service
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword, ...registerData } = credentials;
    const response = await AuthenticationService.handleRegister(registerData);

    console.log("Registration response:", response);

    // Kiểm tra nếu có error trong response
    if (response.error) {
      return rejectWithValue(response.error.message || "Registration failed");
    }

    return response;
  }
);

// Refresh token async thunk
export const refreshToken = createAsyncThunk(
  "auth/refreshToken",
  async (_, { rejectWithValue }) => {
    const response = await AuthenticationService.refreshToken();

    // Kiểm tra nếu có error trong response
    if (response.error) {
      return rejectWithValue(response.error.message || "Token refresh failed");
    }

    return response;
  }
);

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    const response = await AuthenticationService.handleLogout();
    TokenStorage.remove();

    // Kiểm tra nếu có error trong response
    if (response.error) {
      return rejectWithValue(response.error.message || "Logout failed");
    }

    return response;
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (
      state,
      action: PayloadAction<{ token: string; user: User }>
    ) => {
      state.isAuthenticated = true;
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.loading = false;
      state.error = null;

      // Store token in localStorage
      TokenStorage.set(action.payload.token);
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    clearError: (state) => {
      state.error = null;
    },
    // Force logout when no token is available
    forceLogout: (state) => {
      state.isAuthenticated = false;
      state.token = null;
      state.user = null;
      state.loading = false;
      state.error = null;
      TokenStorage.remove();
      console.log("🚫 Force logout - no valid token");
    },
    // Clear all auth state completely
    clearAuth: (state) => {
      state.isAuthenticated = false;
      state.token = null;
      state.user = null;
      state.loading = false;
      state.error = null;
      TokenStorage.remove();
      console.log("🧹 Clear auth - complete state reset");
    },
    // Add action to restore auth state từ localStorage
    restoreAuth: (state) => {
      const token = TokenStorage.get();
      if (token) {
        state.token = token;
        state.isAuthenticated = true;
        console.log("🔑 Auth restored from localStorage");
      } else {
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
        console.log("🚫 No token found, keeping logged out state");
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        const response = action.payload;
        const data = response.data || response;

        const token = data?.token || data?.accessToken || null;

        state.isAuthenticated = true;
        state.token = token;
        state.user = data?.user || null;
        state.loading = false;
        state.error = null;

        // Store token in localStorage
        if (token) {
          TokenStorage.set(token);
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        const response = action.payload;
        const data = response.data || response;
        const token = data?.token || data?.accessToken || null;

        state.isAuthenticated = true;
        state.token = token;
        state.user = data?.user || null;
        state.loading = false;
        state.error = null;

        // Store token in localStorage
        if (token) {
          TokenStorage.set(token);
        }
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(logout.pending, (state) => {
        state.loading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        console.log("🚪 Logout fulfilled - clearing state...");
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
        state.loading = false;
        state.error = null;

        // Remove token from sessionStorage
        TokenStorage.remove();
        console.log("✅ Logout completed - state cleared");
      })
      .addCase(logout.rejected, (state, action) => {
        console.log("❌ Logout rejected - clearing state anyway...");
        state.loading = false;
        state.error = action.payload as string;
        // Ensure token is cleared on logout failure
        TokenStorage.remove();
        // Force clear auth state even on logout failure
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
        console.log("✅ Logout rejected but state cleared");
      })

      .addCase(refreshToken.pending, (state) => {
        state.loading = true;
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        const response = action.payload;
        const data = response.data || response;
        const token = data?.token || data?.accessToken || null;

        if (token) {
          state.token = token;
          state.isAuthenticated = true;
          state.loading = false;
          state.error = null;

          // Store new token in localStorage
          TokenStorage.set(token);
          console.log("✅ Token refreshed successfully");
        } else {
          // If no token in response, treat as failed refresh
          state.isAuthenticated = false;
          state.token = null;
          state.user = null;
          state.loading = false;
          state.error = "Session expired. Please login again.";
          TokenStorage.remove();
          console.log("❌ Token refresh failed - no token in response");
        }
      })
      .addCase(refreshToken.rejected, (state) => {
        // If refresh fails, logout user
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
        state.loading = false;
        state.error = "Session expired. Please login again.";

        // Remove token from storage
        TokenStorage.remove();
      })
      .addCase(getUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(getUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  clearError,
  forceLogout,
  clearAuth,
  restoreAuth,
} = authSlice.actions;
export default authSlice.reducer;
