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

// Action creator để trigger WebSocket initialization
export const initWebSocket = createAction("INIT_WEBSOCKET");

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

    // Setup WebSocket event listeners (chỉ setup 1 lần)
    if (!wsManager.hasListeners()) {
      console.log("🔌 Setting up WebSocket listeners");
      setupWebSocketListeners(listenerApi.dispatch);
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
      await connectWebSocketWithRetry(listenerApi.dispatch, token);
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
    listenerApi.dispatch(disconnected("User logged out"));
  },
});

function setupWebSocketListeners(dispatch: Dispatch<AnyAction>) {
  wsManager.on("connected", () => {
    console.log("🔌 WebSocket connected successfully");
    dispatch(connected());
  });

  wsManager.on("disconnected", (reason: string) => {
    console.log("🔌 WebSocket disconnected:", reason);
    dispatch(disconnected(reason));

    // Auto-reconnect với exponential backoff
    setTimeout(() => {
      const token = localStorage.getItem("auth_token");
      if (token) {
        connectWebSocketWithRetry(dispatch, token);
      }
    }, 3000);
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
