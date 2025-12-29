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
    // WebSocket middleware triggered

    // Get token from auth state (đã được restore)
    const state = listenerApi.getState() as RootState;
    const token = state.auth?.token || localStorage.getItem("auth_token") || "";



    if (!token) {
      // No auth token found, skipping WebSocket connection
      return;
    }

    // Prevent multiple simultaneous connection attempts
    if (wsManager.getIsConnecting() || isConnecting) {
      // WebSocket already connecting, skipping
      return;
    }

    // Setup WebSocket event listeners (chỉ setup 1 lần)
    if (!listenersSetup) {
      // Setting up WebSocket listeners
      setupWebSocketListeners(listenerApi.dispatch);
      listenersSetup = true;
    }

    // Connect với retry logic
    // Attempting WebSocket connection
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
      // User logged in, connecting WebSocket

      // Luôn force reconnect khi user đăng nhập để đảm bảo sync
      if (wsManager.isConnected()) {
        // User logged in, force reconnecting with new token
        await wsManager.reconnectWithNewToken(token);
      } else {
        // User logged in, connecting WebSocket
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
      // Google login successful, connecting WebSocket

      // Luôn force reconnect khi user đăng nhập để đảm bảo sync
      if (wsManager.isConnected()) {
        // Google login successful, force reconnecting with new token
        await wsManager.reconnectWithNewToken(token);
      } else {
        // Google login successful, connecting WebSocket
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
      // Force reconnecting WebSocket
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
      // Auth state changed, ensuring WebSocket connection
      await connectWebSocketWithRetry(listenerApi.dispatch, token);
    }
  },
});

// Listen for logout actions
websocketMiddleware.startListening({
  actionCreator: logout.fulfilled,
  effect: async (action, listenerApi) => {
    // User logged out, disconnecting WebSocket
    wsManager.disconnect();
    listenersSetup = false; // Reset flag on logout
    listenerApi.dispatch(disconnected("User logged out"));
  },
});

function setupWebSocketListeners(dispatch: Dispatch<AnyAction>) {
  // Setting up WebSocket listeners (clearing old ones first)
  // Clear all existing listeners first to prevent duplicates
  wsManager.clearListeners();

  wsManager.on("connected", () => {
    // WebSocket connected successfully
    isConnecting = false; // Reset flag on successful connection
    dispatch(connected());
  });

  wsManager.on("disconnected", (reason: string) => {
    // WebSocket disconnected
    isConnecting = false; // Reset flag on disconnect
    dispatch(disconnected(reason));

    // Auto-reconnect for all cases except explicit logout
    if (reason === "User logged out") {
      // Logout disconnect, skip auto-reconnect
      return;
    }

    // Avoid overlapping connection attempts
    if (wsManager.getIsConnecting() || isConnecting) {
      // Already connecting, skip auto-reconnect
      return;
    }

    // Quick retry with small delay to survive page reloads
    setTimeout(() => {
      const token = localStorage.getItem("auth_token");
      if (
        token &&
        !wsManager.getIsConnecting() &&
        !wsManager.isConnected() &&
        !isConnecting
      ) {
        // Auto-reconnecting after disconnect
        connectWebSocketWithRetry(dispatch, token);
      }
    }, 1000);
  });

  wsManager.on("error", (error: Error) => {
    // WebSocket error (silent)
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
    // Connection attempt failed (silent)

    if (attempt < maxAttempts) {
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      // Retrying connection

      setTimeout(() => {
        connectWebSocketWithRetry(dispatch, token, attempt + 1);
      }, delay);
    } else {
      // Max reconnection attempts reached
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
