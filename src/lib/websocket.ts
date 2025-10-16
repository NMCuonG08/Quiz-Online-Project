import { io, Socket } from "socket.io-client";
import type { ServerEventMap } from "../types";

class WebSocketManager {
  private socket: Socket | null = null;
  private eventCallbacks = new Map<string, ((...args: unknown[]) => void)[]>();
  private isConnecting = false;
  private currentToken: string | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  async connect(token: string): Promise<void> {
    // Nếu đã connected với cùng token, không cần reconnect
    if (this.socket?.connected && this.currentToken === token) {
      console.log("🔌 WebSocket already connected with same token");
      return;
    }

    // Nếu đang connecting, đợi hoặc cancel connection cũ
    if (this.isConnecting) {
      console.log("🔌 WebSocket connection in progress, waiting...");
      return new Promise((resolve) => {
        const checkConnection = () => {
          if (!this.isConnecting) {
            if (this.socket?.connected && this.currentToken === token) {
              resolve();
            } else {
              this.connect(token).then(resolve);
            }
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
      });
    }

    // Disconnect existing connection if token changed
    if (this.socket && this.currentToken !== token) {
      console.log("🔌 Token changed, disconnecting old connection");
      this.socket.disconnect();
      this.socket = null;
    }

    this.isConnecting = true;
    this.currentToken = token;

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
        this.startHeartbeat();
        this.emit("connected");
        resolve();
      });

      this.socket.on("disconnect", (reason) => {
        console.log("🔌 WebSocket disconnected:", reason);
        this.stopHeartbeat();
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
    this.currentToken = null;
    this.stopHeartbeat();
    this.clearReconnectTimeout();
  }

  emit(event: string, ...args: unknown[]): void {
    const callbacks = this.eventCallbacks.get(event) || [];
    callbacks.forEach((cb) => cb(...args));
  }

  on(event: string, callback: (...args: unknown[]) => void): void {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, []);
    }
    this.eventCallbacks.get(event)!.push(callback);
  }

  off(event: string, callback: (...args: unknown[]) => void): void {
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

  getCurrentToken(): string | null {
    return this.currentToken;
  }

  // Method để force reconnect với token mới
  async reconnectWithNewToken(token: string): Promise<void> {
    console.log("🔌 Force reconnecting with new token");
    this.disconnect();

    // Đợi một chút để đảm bảo disconnect hoàn toàn
    await new Promise((resolve) => setTimeout(resolve, 100));

    await this.connect(token);
  }

  hasListeners(): boolean {
    return this.eventCallbacks.size > 0;
  }

  clearListeners(): void {
    this.eventCallbacks.clear();
  }

  // Heartbeat để kiểm tra connection health
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit("ping");
      }
    }, 30000); // Ping mỗi 30 giây
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  // Method để schedule reconnect
  scheduleReconnect(delay: number = 3000): void {
    this.clearReconnectTimeout();
    this.reconnectTimeout = setTimeout(() => {
      if (this.currentToken && !this.isConnecting) {
        console.log("🔌 Scheduled reconnect triggered");
        this.connect(this.currentToken).catch(console.error);
      }
    }, delay);
  }

  // Debug method để kiểm tra trạng thái
  getDebugInfo() {
    return {
      isConnected: this.isConnected(),
      isConnecting: this.isConnecting,
      currentToken: this.currentToken,
      hasListeners: this.hasListeners(),
      socketId: this.socket?.id,
      socketConnected: this.socket?.connected,
    };
  }

  // Method để force setup listeners (for debugging)
  forceSetupListeners() {
    console.log("🔌 Force setting up WebSocket listeners");
    this.clearListeners();
    // This will be called from middleware
    return true;
  }
}

export const wsManager = new WebSocketManager();
