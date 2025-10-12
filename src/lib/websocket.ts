import { io, Socket } from "socket.io-client";
import type { ClientEventMap, ServerEventMap } from "../types";

class WebSocketManager {
  private socket: Socket | null = null;
  private eventCallbacks = new Map<string, Function[]>();
  private isConnecting = false;

  async connect(token: string): Promise<void> {
    if (this.socket?.connected || this.isConnecting) return;

    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      this.socket = io(
        process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3333",
        {
          auth: { token },
          transports: ["websocket"],
          path: "/api/socket.io",
        }
      );

      this.socket.on("connect", () => {
        console.log("🔌 WebSocket connected");
        this.isConnecting = false;
        this.emit("connected");
        resolve();
      });

      this.socket.on("disconnect", (reason) => {
        console.log("🔌 WebSocket disconnected:", reason);
        this.emit("disconnected", reason);
      });

      this.socket.on("connect_error", (error) => {
        console.error("🔌 WebSocket error:", error);
        this.isConnecting = false;
        this.emit("error", error);
        reject(error);
      });

      // Listen for backend events
      this.socket.on("notification", (data) => {
        console.log("📢 Notification received:", data);

        // If data is string, convert to object. If already object, just add missing fields
        const notificationData =
          typeof data === "string"
            ? {
                type: "info" as const,
                title: "Thông báo",
                message: data,
                userId: "system",
                timestamp: new Date().toISOString(),
                read: false,
              }
            : {
                ...data,
                timestamp: data.timestamp || new Date().toISOString(),
                read: data.read || false,
              };

        this.emit("notification", notificationData);
      });

      this.socket.on("on_user_delete", (userId) => {
        this.emit("user_deleted", userId);
      });

      this.socket.on("on_asset_delete", (assetId) => {
        this.emit("asset_deleted", assetId);
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
  }

  emit(event: string, ...args: any[]): void {
    const callbacks = this.eventCallbacks.get(event) || [];
    callbacks.forEach((cb) => cb(...args));
  }

  on(event: string, callback: Function): void {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, []);
    }
    this.eventCallbacks.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) callbacks.splice(index, 1);
    }
  }

  send<T extends keyof ServerEventMap>(
    event: T,
    ...args: ServerEventMap[T]
  ): void {
    if (this.socket?.connected) {
      this.socket.emit(event, ...args);
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  hasListeners(): boolean {
    return this.eventCallbacks.size > 0;
  }

  clearListeners(): void {
    this.eventCallbacks.clear();
  }
}

export const wsManager = new WebSocketManager();
