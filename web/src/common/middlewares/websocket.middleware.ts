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
    // Get token from auth state (đã được restore)
    const state = listenerApi.getState() as RootState;
    const token = state.auth?.token || localStorage.getItem("auth_token") || "";

    if (!token) return;

    // Setup WebSocket event listeners (chỉ setup 1 lần)
    if (!listenersSetup) {
      setupWebSocketListeners(listenerApi.dispatch);
      listenersSetup = true;
    }

    // New RxJS-based connect
    wsManager.connect(token);
  },
});

// Listen for successful login actions
websocketMiddleware.startListening({
  actionCreator: loginUser.fulfilled,
  effect: async (action, listenerApi) => {
    const state = listenerApi.getState() as RootState;
    const token = state.auth?.token;

    if (token) {
      wsManager.connect(token);
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
      wsManager.connect(token);
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
      wsManager.reconnectWithNewToken(token);
    }
  },
});

// Listen for auth state changes to trigger WebSocket reconnect
websocketMiddleware.startListening({
  predicate: (action) => {
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

    if (isAuthenticated && token && !wsManager.isConnected()) {
      wsManager.connect(token);
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
    dispatch(disconnected(reason));
    // Auto-reconnect is now handled internally by wsManager using RxJS
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

// connectWebSocketWithRetry is now removed as RxJS handles it
