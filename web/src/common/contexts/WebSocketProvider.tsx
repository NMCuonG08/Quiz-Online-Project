"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import { wsManager } from "@/lib/websocket";
import {
  initWebSocket,
  forceReconnectWebSocket,
} from "@/common/middlewares/websocket.middleware";
import type {
  ServerEventMap,
  ClientEventMap,
} from "@/common/types/websocket-event.type";

interface WebSocketContextValue {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  reconnectAttempts: number;

  // Connection methods
  connect: (token: string) => Promise<void>;
  disconnect: () => void;
  reconnect: () => void;

  // Event methods
  send: <T extends keyof ServerEventMap>(
    event: T,
    ...args: ServerEventMap[T]
  ) => void;
  on: <T extends keyof ClientEventMap>(
    event: T,
    callback: (...args: ClientEventMap[T]) => void
  ) => () => void;
  off: <T extends keyof ClientEventMap>(
    event: T,
    callback: (...args: ClientEventMap[T]) => void
  ) => void;

  // Room helpers
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  subscribeParticipants: (
    roomId: string,
    callback: (payload: { roomId: string; participants: unknown[] }) => void,
    options?: { immediateFetch?: boolean }
  ) => () => void;

  // Debug
  getDebugInfo: () => {
    isConnected: boolean;
    isConnecting: boolean;
    currentToken: string | null;
    hasListeners: boolean;
    socketId: string | undefined;
    socketConnected: boolean | undefined;
  };
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

interface WebSocketProviderProps {
  children: ReactNode;
  autoConnect?: boolean;
}

export function WebSocketProvider({
  children,
  autoConnect = true,
}: WebSocketProviderProps) {
  const dispatch = useAppDispatch();
  const websocketState = useAppSelector((state) => state.websocket);
  const authState = useAppSelector((state) => state.auth);
  const hasInitialized = useRef(false);

  const { isConnected, isConnecting, error, reconnectAttempts } =
    websocketState;

  // Auto-connect when authenticated
  useEffect(() => {
    if (!autoConnect || hasInitialized.current) return;

    if (authState.isAuthenticated && authState.token) {
      hasInitialized.current = true;
      dispatch(initWebSocket());
    }
  }, [authState.isAuthenticated, authState.token, autoConnect, dispatch]);

  // Reconnect when token changes
  useEffect(() => {
    if (
      authState.isAuthenticated &&
      authState.token &&
      wsManager.getCurrentToken() !== authState.token
    ) {
      dispatch(forceReconnectWebSocket());
    }
  }, [authState.token, authState.isAuthenticated, dispatch]);

  // Disconnect on logout
  useEffect(() => {
    if (!authState.isAuthenticated) {
      wsManager.disconnect();
      hasInitialized.current = false;
    }
  }, [authState.isAuthenticated]);

  const connect = useCallback(async (token: string) => {
    await wsManager.connect(token);
  }, []);

  const disconnect = useCallback(() => {
    wsManager.disconnect();
  }, []);

  const reconnect = useCallback(() => {
    dispatch(forceReconnectWebSocket());
  }, [dispatch]);

  const send = useCallback(
    <T extends keyof ServerEventMap>(event: T, ...args: ServerEventMap[T]) => {
      wsManager.send(event, ...args);
    },
    []
  );

  const on = useCallback(
    <T extends keyof ClientEventMap>(
      event: T,
      callback: (...args: ClientEventMap[T]) => void
    ) => {
      wsManager.on(event as string, callback as (...args: unknown[]) => void);
      // Return unsubscribe function
      return () => {
        wsManager.off(
          event as string,
          callback as (...args: unknown[]) => void
        );
      };
    },
    []
  );

  const off = useCallback(
    <T extends keyof ClientEventMap>(
      event: T,
      callback: (...args: ClientEventMap[T]) => void
    ) => {
      wsManager.off(event as string, callback as (...args: unknown[]) => void);
    },
    []
  );

  const joinRoom = useCallback((roomId: string) => {
    wsManager.joinRoom(roomId);
  }, []);

  const leaveRoom = useCallback((roomId: string) => {
    wsManager.leaveRoom(roomId);
  }, []);

  const subscribeParticipants = useCallback(
    (
      roomId: string,
      callback: (payload: { roomId: string; participants: unknown[] }) => void,
      options?: { immediateFetch?: boolean }
    ) => {
      return wsManager.subscribeParticipants(roomId, callback, options);
    },
    []
  );

  const getDebugInfo = useCallback(() => {
    return wsManager.getDebugInfo();
  }, []);

  const value: WebSocketContextValue = {
    // State
    isConnected,
    isConnecting,
    error,
    reconnectAttempts,

    // Methods
    connect,
    disconnect,
    reconnect,
    send,
    on,
    off,
    joinRoom,
    leaveRoom,
    subscribeParticipants,
    getDebugInfo,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error(
      "useWebSocketContext must be used within a WebSocketProvider"
    );
  }
  return context;
}
