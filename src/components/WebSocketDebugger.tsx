"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAppSelector, useAppDispatch } from "@/hooks/useRedux";
import { useNotifications } from "@/common/hooks/useNotifications";

export function WebSocketDebugger() {
  const dispatch = useAppDispatch();
  const { createNotification, isConnected, isConnecting, error } =
    useNotifications();

  const authState = useAppSelector((state) => state.auth);

  const [logs, setLogs] = useState<string[]>([]);
  const prevAuthRef = useRef(authState.isAuthenticated);
  const prevTokenRef = useRef(authState.token);
  const prevConnectedRef = useRef(isConnected);
  const prevConnectingRef = useRef(isConnecting);
  const prevErrorRef = useRef(error);

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev.slice(-9), `[${timestamp}] ${message}`]);
  }, []);

  // Log only when specific values change
  useEffect(() => {
    if (prevAuthRef.current !== authState.isAuthenticated) {
      addLog(
        `Auth: ${
          authState.isAuthenticated ? "Authenticated" : "Not authenticated"
        }`
      );
      prevAuthRef.current = authState.isAuthenticated;
    }
  }, [authState.isAuthenticated, addLog]);

  useEffect(() => {
    if (prevTokenRef.current !== authState.token) {
      addLog(`Token: ${authState.token ? "Present" : "Missing"}`);
      prevTokenRef.current = authState.token;
    }
  }, [authState.token, addLog]);

  useEffect(() => {
    if (prevConnectedRef.current !== isConnected) {
      addLog(`WebSocket: ${isConnected ? "Connected" : "Disconnected"}`);
      prevConnectedRef.current = isConnected;
    }
  }, [isConnected, addLog]);

  useEffect(() => {
    if (prevConnectingRef.current !== isConnecting) {
      addLog(`Connecting: ${isConnecting ? "Yes" : "No"}`);
      prevConnectingRef.current = isConnecting;
    }
  }, [isConnecting, addLog]);

  useEffect(() => {
    if (prevErrorRef.current !== error) {
      if (error) {
        addLog(`Error: ${error}`);
      }
      prevErrorRef.current = error;
    }
  }, [error, addLog]);

  const testNotification = () => {
    try {
      createNotification(
        "success",
        "Test Notification",
        "This is a test notification from WebSocket debugger"
      );
      addLog("Created test notification");
    } catch (error) {
      console.error("Failed to create test notification:", error);
      addLog("Failed to create test notification");
    }
  };

  const reconnect = () => {
    dispatch({ type: "INIT_WEBSOCKET" });
    addLog("Triggered WebSocket reconnection");
  };

  const clearLogs = () => {
    setLogs([]);
  };

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg shadow-lg max-w-sm z-50">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-sm">🔌 WebSocket Debug</h3>
        <div className="flex gap-2">
          <button
            onClick={reconnect}
            className="text-xs bg-blue-600 px-2 py-1 rounded hover:bg-blue-700"
          >
            Reconnect
          </button>
          <button
            onClick={clearLogs}
            className="text-xs bg-gray-600 px-2 py-1 rounded hover:bg-gray-700"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span>Auth:</span>
          <span
            className={
              authState.isAuthenticated ? "text-green-400" : "text-red-400"
            }
          >
            {authState.isAuthenticated ? "✓" : "✗"}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Token:</span>
          <span className={authState.token ? "text-green-400" : "text-red-400"}>
            {authState.token ? "✓" : "✗"}
          </span>
        </div>
        <div className="flex justify-between">
          <span>WebSocket:</span>
          <span
            className={
              isConnected
                ? "text-green-400"
                : isConnecting
                ? "text-yellow-400"
                : "text-red-400"
            }
          >
            {isConnected
              ? "Connected"
              : isConnecting
              ? "Connecting..."
              : "Disconnected"}
          </span>
        </div>
        {error && <div className="text-red-400 text-xs">Error: {error}</div>}
      </div>

      <div className="mt-3">
        <button
          onClick={testNotification}
          className="w-full text-xs bg-green-600 px-2 py-1 rounded hover:bg-green-700 mb-2"
        >
          Test Notification
        </button>

        <div className="text-xs text-gray-300 max-h-32 overflow-y-auto">
          {logs.map((log, index) => (
            <div key={index} className="text-xs">
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
