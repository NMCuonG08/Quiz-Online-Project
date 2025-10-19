import {
  createListenerMiddleware,
  Dispatch,
  AnyAction,
  createAction,
} from "@reduxjs/toolkit";
import { wsManager } from "@/lib/websocket";
import {
  connecting,
  connected,
  disconnected,
  connectionError,
  reconnectAttempt,
} from "@/common/slices/websocket.slice";
import { notificationReceived } from "@/common/slices/notification.slice";
import {
  loginUser,
  logout,
  loginWithGoogleCode,
} from "@/modules/auth/common/slices/authSlice";
import type { NotificationData } from "@/common/types";
import type { RootState } from "@/store";

export const websocketMiddleware = createListenerMiddleware();

// Flag to prevent multiple listener setups
let listenersSetup = false;
// Flag to prevent multiple connection attempts
let isConnecting = false;

// Action creator để trigger WebSocket initialization
export const initWebSocket = createAction("INIT_WEBSOCKET");

// Action creator để force reconnect WebSocket
export const forceReconnectWebSocket = createAction(
  "FORCE_RECONNECT_WEBSOCKET"
);

// Auto-connect khi app khởi động và khi auth state thay đổi
websocketMiddleware.startListening({
  actionCreator: initWebSocket,
  effect: async (action, listenerApi) => {
    console.log("🔌 WebSocket middleware triggered:", action.type);

    // Get token from auth state (đã được restore)
    const state = listenerApi.getState() as RootState;
    const token = state.auth?.token || localStorage.getItem("auth_token") || "";

    console.log("🔌 Auth state:", {
      isAuthenticated: state.auth?.isAuthenticated,
      hasToken: !!token,
      tokenLength: token?.length || 0,
    });

    if (!token) {
      console.warn("🔌 No auth token found, skipping WebSocket connection");
      return;
    }

    // Prevent multiple simultaneous connection attempts
    if (wsManager.getIsConnecting() || isConnecting) {
      console.log("🔌 WebSocket already connecting, skipping...");
      return;
    }

    // Setup WebSocket event listeners (chỉ setup 1 lần)
    if (!listenersSetup) {
      console.log("🔌 Setting up WebSocket listeners");
      setupWebSocketListeners(listenerApi.dispatch);
      listenersSetup = true;
    }

    // Connect với retry logic
    console.log("🔌 Attempting WebSocket connection...");
    await connectWebSocketWithRetry(listenerApi.dispatch, token);
  },
});

// Listen for successful login actions
websocketMiddleware.startListening({
  actionCreator: loginUser.fulfilled,
  effect: async (action, listenerApi) => {
    const state = listenerApi.getState() as RootState;
    const token = state.auth?.token;

    if (token) {
      console.log("🔌 User logged in, connecting WebSocket...");

      // Luôn force reconnect khi user đăng nhập để đảm bảo sync
      if (wsManager.isConnected()) {
        console.log("🔌 User logged in, force reconnecting with new token...");
        await wsManager.reconnectWithNewToken(token);
      } else {
        console.log("🔌 User logged in, connecting WebSocket...");
        await connectWebSocketWithRetry(listenerApi.dispatch, token);
      }
    }
  },
});

// Listen for Google login success
websocketMiddleware.startListening({
  actionCreator: loginWithGoogleCode.fulfilled,
  effect: async (action, listenerApi) => {
    const state = listenerApi.getState() as RootState;
    const token = state.auth?.token;

    if (token) {
      console.log("🔌 Google login successful, connecting WebSocket...");

      // Luôn force reconnect khi user đăng nhập để đảm bảo sync
      if (wsManager.isConnected()) {
        console.log(
          "🔌 Google login successful, force reconnecting with new token..."
        );
        await wsManager.reconnectWithNewToken(token);
      } else {
        console.log("🔌 Google login successful, connecting WebSocket...");
        await connectWebSocketWithRetry(listenerApi.dispatch, token);
      }
    }
  },
});

// Listen for force reconnect action
websocketMiddleware.startListening({
  actionCreator: forceReconnectWebSocket,
  effect: async (action, listenerApi) => {
    const state = listenerApi.getState() as RootState;
    const token = state.auth?.token || localStorage.getItem("auth_token") || "";

    if (token) {
      console.log("🔌 Force reconnecting WebSocket...");
      await wsManager.reconnectWithNewToken(token);
    }
  },
});

// Listen for auth state changes to trigger WebSocket reconnect
websocketMiddleware.startListening({
  predicate: (action) => {
    // Only listen for specific auth actions, not all auth actions
    return (
      action.type === "auth/restoreAuth/fulfilled" ||
      action.type === "auth/loginUser/fulfilled" ||
      action.type === "auth/loginWithGoogleCode/fulfilled"
    );
  },
  effect: async (action, listenerApi) => {
    const state = listenerApi.getState() as RootState;
    const token = state.auth?.token;
    const isAuthenticated = state.auth?.isAuthenticated;

    // Only connect if not already connected and not connecting
    if (
      isAuthenticated &&
      token &&
      !wsManager.isConnected() &&
      !wsManager.getIsConnecting() &&
      !isConnecting
    ) {
      console.log("🔌 Auth state changed, ensuring WebSocket connection...");
      await connectWebSocketWithRetry(listenerApi.dispatch, token);
    }
  },
});

// Listen for logout actions
websocketMiddleware.startListening({
  actionCreator: logout.fulfilled,
  effect: async (action, listenerApi) => {
    console.log("🔌 User logged out, disconnecting WebSocket");
    wsManager.disconnect();
    listenersSetup = false; // Reset flag on logout
    listenerApi.dispatch(disconnected("User logged out"));
  },
});

function setupWebSocketListeners(dispatch: Dispatch<AnyAction>) {
  console.log("🔌 Setting up WebSocket listeners (clearing old ones first)");
  // Clear all existing listeners first to prevent duplicates
  wsManager.clearListeners();

  wsManager.on("connected", () => {
    console.log("🔌 WebSocket connected successfully");
    isConnecting = false; // Reset flag on successful connection
    dispatch(connected());
  });

  wsManager.on("disconnected", (reason: string) => {
    console.log("🔌 WebSocket disconnected:", reason);
    isConnecting = false; // Reset flag on disconnect
    dispatch(disconnected(reason));

    // Chỉ auto-reconnect nếu:
    // 1. Không phải do user logout
    // 2. Không phải do server force disconnect
    // 3. Không phải do client disconnect
    // 4. Chưa có connection attempt nào đang chạy
    if (
      reason !== "io server disconnect" &&
      reason !== "User logged out" &&
      reason !== "io client disconnect" &&
      !wsManager.getIsConnecting() &&
      !isConnecting
    ) {
      // Thêm delay để tránh reconnect quá nhanh
      setTimeout(() => {
        const token = localStorage.getItem("auth_token");
        if (
          token &&
          !wsManager.getIsConnecting() &&
          !wsManager.isConnected() &&
          !isConnecting
        ) {
          console.log("🔌 Auto-reconnecting after disconnect...");
          connectWebSocketWithRetry(dispatch, token);
        }
      }, 5000); // Tăng delay lên 5s
    } else {
      console.log(
        "🔌 Server/client disconnect or logout, skipping auto-reconnect"
      );
    }
  });

  wsManager.on("error", (error: Error) => {
    console.error("🔌 WebSocket error:", error);
    dispatch(connectionError(error.message || "Connection failed"));
  });

  wsManager.on("notification", (data: NotificationData) => {
    console.log("📢 Notification received from WebSocket:", data);

    // Convert to NotificationItem và dispatch
    const notification = {
      ...data,
      autoRemove: data.type === "success" || data.type === "info",
      duration: 5,
    };

    dispatch(notificationReceived(notification));
  });
}

async function connectWebSocketWithRetry(
  dispatch: Dispatch<AnyAction>,
  token: string,
  attempt: number = 1
) {
  if (!token) return;

  // Set connecting flag
  isConnecting = true;

  const maxAttempts = 5;
  const baseDelay = 1000; // 1 second
  const maxDelay = 30000; // 30 seconds

  try {
    if (attempt === 1) {
      dispatch(connecting());
    } else {
      dispatch(reconnectAttempt());
    }

    await wsManager.connect(token);
    isConnecting = false; // Reset flag on success
  } catch (error: unknown) {
    console.error(`🔌 Connection attempt ${attempt} failed:`, error);

    if (attempt < maxAttempts) {
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      console.log(`🔌 Retrying connection in ${delay}ms...`);

      setTimeout(() => {
        connectWebSocketWithRetry(dispatch, token, attempt + 1);
      }, delay);
    } else {
      console.error("🔌 Max reconnection attempts reached");
      isConnecting = false; // Reset flag on failure
      dispatch(
        connectionError(
          error instanceof Error
            ? error.message
            : "Max reconnection attempts reached"
        )
      );
    }
  }
}
