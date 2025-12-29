import { io, Socket } from "socket.io-client";
import type { ServerEventMap } from "@/common/types/websocket-event.type";

class WebSocketManager {
  private socket: Socket | null = null;
  private eventCallbacks = new Map<string, ((...args: unknown[]) => void)[]>();
  private isConnecting = false;
  private currentToken: string | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private connectionAttempts = 0;
  private maxConnectionAttempts = 3;
  private lastConnectionAttempt = 0;
  private connectionDebounceMs = 3000; // 3 seconds debounce
  private connectionTimeout: NodeJS.Timeout | null = null;
  private joinedRooms = new Set<string>();
  private participantsRoomHandlers = new Map<
    string,
    Set<(payload: { roomId: string; participants: unknown[] }) => void>
  >();
  private pendingEmits: Array<{ event: string; args: unknown[] }> = [];

  async connect(token: string): Promise<void> {
    // Clear any pending connection timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    // Check debounce - prevent too frequent connection attempts
    const now = Date.now();
    if (now - this.lastConnectionAttempt < this.connectionDebounceMs) {
      // Debouncing connection attempt
      // Schedule connection for later
      this.connectionTimeout = setTimeout(() => {
        this.connect(token);
      }, this.connectionDebounceMs - (now - this.lastConnectionAttempt));
      return;
    }
    this.lastConnectionAttempt = now;

    // Check if we've exceeded max connection attempts
    if (this.connectionAttempts >= this.maxConnectionAttempts) {
      // Max connection attempts reached
      return;
    }

    // Nếu đã connected với cùng token, không cần connect lại
    if (this.socket?.connected && this.currentToken === token) {
      // Already connected with same token
      return;
    }

    // Luôn disconnect trước khi connect mới
    if (this.socket) {
      // Disconnecting previous WebSocket before connecting
      this.socket.disconnect();
      this.socket = null;
    }

    this.connectionAttempts++;

    // Nếu đang connecting, đợi hoặc cancel connection cũ
    if (this.isConnecting) {
      // WebSocket connection in progress
      return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 30; // 3 seconds max wait

        const checkConnection = () => {
          attempts++;
          if (!this.isConnecting) {
            this.connect(token).then(resolve).catch(reject);
          } else if (attempts >= maxAttempts) {
            // Connection timeout, forcing new connection
            this.isConnecting = false;
            // Disconnect existing socket before new connection
            if (this.socket) {
              this.socket.disconnect();
              this.socket = null;
            }
            this.connect(token).then(resolve).catch(reject);
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
      });
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
        // WebSocket connected
        this.isConnecting = false;
        this.connectionAttempts = 0; // Reset on successful connection
        this.startHeartbeat();
        this.emit("connected");
        // Flush any pending emits queued while offline
        try {
          if (this.pendingEmits.length) {
            const toSend = [...this.pendingEmits];
            this.pendingEmits = [];
            toSend.forEach(({ event, args }) => {
              try {
                this.socket!.emit(event, ...args);
              } catch {
                // swallow
              }
            });
          }
        } catch {
          // swallow
        }
        // Rejoin previously joined rooms and refresh state
        try {
          if (this.joinedRooms.size > 0) {
            this.joinedRooms.forEach((roomId) => {
              this.send("join_room", { roomId });
              // Refresh participants and messages for this room
              this.send("get_participants", { roomId });
              this.send("get_messages", { roomId });
            });
          }
        } catch (e) {
          console.warn("⚠️ Failed to auto rejoin rooms after connect:", e);
        }
        resolve();
      });

      this.socket.on("disconnect", (reason) => {
        // WebSocket disconnected
        this.isConnecting = false; // Đảm bảo luôn reset trạng thái
        this.stopHeartbeat();
        this.emit("disconnected", reason);
      });

      this.socket.on("connect_error", (error) => {
        // WebSocket connection error (silent)
        this.isConnecting = false;

        // Handle specific error types
        if (error.message?.includes("Connection too frequent")) {
          console.warn(
            "🔌 Connection rejected: too frequent, will retry later"
          );
          // Don't reject immediately, let the retry logic handle it
          setTimeout(() => {
            if (!this.socket?.connected) {
              reject(error);
            }
          }, 2000);
        } else {
          this.emit("error", error);
          reject(error);
        }
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

      // ============== CHAT EVENTS ==============
      this.socket.on("room_message", (message) => {
        try {
          this.emit("room_message", message);
        } catch (e) {
          console.warn("⚠️ Failed to dispatch room_message:", e);
        }
      });

      this.socket.on("messages_list", (messages) => {
        try {
          this.emit("messages_list", messages);
        } catch (e) {
          console.warn("⚠️ Failed to dispatch messages_list:", e);
        }
      });

      // ============== ROOM LIFECYCLE EVENTS ==============
      this.socket.on("room_joined", (payload) => {
        try {
          this.emit("room_joined", payload);
        } catch (e) {
          console.warn("⚠️ Failed to dispatch room_joined:", e);
        }
      });

      this.socket.on("room_left", (payload) => {
        try {
          this.emit("room_left", payload);
        } catch (e) {
          console.warn("⚠️ Failed to dispatch room_left:", e);
        }
      });

      this.socket.on("room_join_error", (payload) => {
        try {
          this.emit("room_join_error", payload);
        } catch (e) {
          console.warn("⚠️ Failed to dispatch room_join_error:", e);
        }
      });

      this.socket.on("room_leave_error", (payload) => {
        try {
          this.emit("room_leave_error", payload);
        } catch (e) {
          console.warn("⚠️ Failed to dispatch room_leave_error:", e);
        }
      });

      this.socket.on("user_joined", (payload) => {
        try {
          this.emit("user_joined", payload);
        } catch (e) {
          console.warn("⚠️ Failed to dispatch user_joined:", e);
        }
      });

      this.socket.on("user_left", (payload) => {
        try {
          this.emit("user_left", payload);
        } catch (e) {
          console.warn("⚠️ Failed to dispatch user_left:", e);
        }
      });

      this.socket.on("on_user_delete", (userId) => {
        this.emit("user_deleted", userId);
      });

      this.socket.on("on_asset_delete", (assetId) => {
        this.emit("asset_deleted", assetId);
      });

      // Room participants realtime updates
      this.socket.on(
        "participants_list",
        (payload: { roomId: string; participants: unknown[] }) => {
          try {
            this.emit("participants_list", payload);
            const roomId = payload?.roomId as string;
            if (roomId && this.participantsRoomHandlers.has(roomId)) {
              const handlers = this.participantsRoomHandlers.get(roomId)!;
              handlers.forEach((cb) => cb(payload));
            }
          } catch (e) {
            console.warn("⚠️ Failed to dispatch participants_list:", e);
          }
        }
      );
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
    this.currentToken = null;
    this.connectionAttempts = 0; // Reset connection attempts
    this.stopHeartbeat();
    this.clearReconnectTimeout();

    // Clear connection timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
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
      this.socket.emit(event as string, ...args);
      return;
    }
    // Queue emit until connection is available
    this.pendingEmits.push({ event: event as string, args });
    // Try to reconnect soon
    this.scheduleReconnect(100);
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getIsConnecting(): boolean {
    return this.isConnecting;
  }

  getCurrentToken(): string | null {
    return this.currentToken;
  }

  // Method để force reconnect với token mới
  async reconnectWithNewToken(token: string): Promise<void> {
    // Force reconnecting with new token
    this.disconnect();

    // Đợi một chút để đảm bảo disconnect hoàn toàn
    await new Promise((resolve) => setTimeout(resolve, 100));

    await this.connect(token);
  }

  hasListeners(): boolean {
    return this.eventCallbacks.size > 0;
  }

  clearListeners(): void {
    // Clearing WebSocket listeners
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
        // Scheduled reconnect triggered
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
    // Force setting up WebSocket listeners
    this.clearListeners();
    // This will be called from middleware
    return true;
  }

  // =============== ROOM HELPERS ===============
  joinRoom(roomId: string): void {
    if (!roomId) return;
    if (!this.joinedRooms.has(roomId)) {
      this.send("join_room", { roomId });
      this.joinedRooms.add(roomId);
    }
  }

  leaveRoom(roomId: string): void {
    if (!roomId) return;
    if (this.joinedRooms.has(roomId)) {
      this.send("leave_room", { roomId });
      this.joinedRooms.delete(roomId);
    }
  }

  subscribeParticipants(
    roomId: string,
    callback: (payload: { roomId: string; participants: unknown[] }) => void,
    options: { immediateFetch?: boolean } = { immediateFetch: true }
  ): () => void {
    if (!roomId || !callback) return () => {};
    // Ensure joined for realtime
    this.joinRoom(roomId);
    // Register handler
    if (!this.participantsRoomHandlers.has(roomId)) {
      this.participantsRoomHandlers.set(roomId, new Set());
    }
    const set = this.participantsRoomHandlers.get(roomId)!;
    set.add(callback);
    // Optionally request current list immediately
    if (options.immediateFetch) {
      this.send("get_participants", { roomId });
    }
    // Return unsubscribe
    return () => {
      const handlers = this.participantsRoomHandlers.get(roomId);
      if (!handlers) return;
      handlers.delete(callback);
      if (handlers.size === 0) {
        this.participantsRoomHandlers.delete(roomId);
      }
    };
  }
}

export const wsManager = new WebSocketManager();
