import { io, Socket } from "socket.io-client";
import { BehaviorSubject, Subject, Observable, of } from "rxjs";
import { switchMap, distinctUntilChanged, takeUntil } from "rxjs/operators";
import type { ServerEventMap } from "@/common/types/websocket-event.type";

class WebSocketManager {
  private static readonly MAX_PENDING_EMITS = 100;
  private socket: Socket | null = null;
  private eventCallbacks = new Map<string, ((...args: unknown[]) => void)[]>();
  
  // RxJS State
  private tokenSubject$ = new BehaviorSubject<string | null>(null);
  private statusSubject$ = new BehaviorSubject<'connected' | 'disconnected' | 'connecting' | 'error'>('disconnected');
  private socketSubject$ = new BehaviorSubject<Socket | null>(null);
  private destroy$ = new Subject<void>();

  public status$ = this.statusSubject$.asObservable().pipe(distinctUntilChanged());
  public socket$ = this.socketSubject$.asObservable();

  private joinedRooms = new Set<string>();
  private participantsRoomHandlers = new Map<
    string,
    Set<(payload: { roomId: string; participants: unknown[] }) => void>
  >();
  private pendingEmits: Array<{ event: string; args: unknown[] }> = [];
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  private getRoomIdFromArgs(args: unknown[]): string | null {
    const payload = args[0] as { roomId?: unknown } | undefined;
    if (!payload || typeof payload.roomId !== "string") {
      return null;
    }
    return payload.roomId;
  }

  private enqueueEmit(event: string, args: unknown[]): void {
    const roomId = this.getRoomIdFromArgs(args);

    if (!roomId) {
      if (this.pendingEmits.length >= WebSocketManager.MAX_PENDING_EMITS) {
        this.pendingEmits.shift();
      }
      this.pendingEmits.push({ event, args });
      return;
    }

    // Keep only the latest event per room for high-frequency room-scoped events.
    if (
      event === "join_room" ||
      event === "leave_room" ||
      event === "get_participants" ||
      event === "get_messages"
    ) {
      this.pendingEmits = this.pendingEmits.filter((item) => {
        const pendingRoomId = this.getRoomIdFromArgs(item.args);
        if (pendingRoomId !== roomId) {
          return true;
        }

        if (event === "leave_room") {
          return !(item.event === "join_room" || item.event === "get_participants" || item.event === "get_messages");
        }

        return item.event !== event;
      });
    }

    if (this.pendingEmits.length >= WebSocketManager.MAX_PENDING_EMITS) {
      this.pendingEmits.shift();
    }
    this.pendingEmits.push({ event, args });
  }

  constructor() {
    this.setupAutoConnection();
  }

  private setupAutoConnection() {
    this.tokenSubject$.pipe(
      distinctUntilChanged(),
      switchMap(token => {
        if (!token) {
          this.cleanupSocket();
          return of(null);
        }

        return new Observable<Socket>(observer => {
          console.log("🔌 Attempting WebSocket connection...");
          this.statusSubject$.next('connecting');
          this.emit("connecting");

          const socket = io(
            process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3333",
            {
              auth: { token },
              transports: ["websocket"],
              path: "/api/socket.io",
              reconnection: true,
              reconnectionAttempts: Infinity,
              reconnectionDelay: 1000,
              reconnectionDelayMax: 30000,
              randomizationFactor: 0.5,
              timeout: 10000,
            }
          );

          socket.on("connect", () => {
            console.log("✅ WebSocket connected");
            this.socket = socket;
            this.socketSubject$.next(socket);
            this.statusSubject$.next('connected');
            this.emit("connected");
            if (this.reconnectTimer) {
              clearTimeout(this.reconnectTimer);
              this.reconnectTimer = null;
            }
            
            // Handle post-connection logic
            this.handlePostConnect();
            
            observer.next(socket);
          });

          socket.on("disconnect", (reason) => {
            console.log("🔌 WebSocket disconnected:", reason);
            this.statusSubject$.next('disconnected');
            this.emit("disconnected", reason);
            this.socket = null;
            this.socketSubject$.next(null);

            if (!this.tokenSubject$.value) observer.complete();
          });

          socket.on("connect_error", (error) => {
            console.error("🚨 WebSocket connection error:", error.message);
            this.statusSubject$.next('error');
            this.emit("error", error);
          });

          socket.io.on("reconnect_attempt", (attempt) => {
            this.statusSubject$.next('connecting');
            this.emit("reconnect_attempt", attempt);
          });
          socket.io.on("reconnect", () => {
            this.statusSubject$.next('connected');
          });

          // Register all listeners from eventCallbacks
          this.registerEventListeners(socket);

          return () => {
            console.log("🧹 Cleaning up WebSocket connection");
            socket.disconnect();
            this.socket = null;
            this.socketSubject$.next(null);
          };
        });
      }),
      takeUntil(this.destroy$)
    ).subscribe();
  }

  private cleanupSocket() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.socketSubject$.next(null);
    this.statusSubject$.next('disconnected');
  }

  private handlePostConnect() {
    if (!this.socket) return;

    // Flush pending emits
    if (this.pendingEmits.length) {
      console.log(`🚀 Flushing ${this.pendingEmits.length} pending emits`);
      const toSend = [...this.pendingEmits];
      this.pendingEmits = [];
      toSend.forEach(({ event, args }) => {
        this.socket!.emit(event, ...args);
      });
    }

    // Rejoin rooms
    if (this.joinedRooms.size > 0) {
      console.log(`🏠 Rejoining ${this.joinedRooms.size} rooms`);
      this.joinedRooms.forEach((roomId) => {
        this.socket!.emit("join_room", { roomId });
        this.socket!.emit("get_participants", { roomId });
        this.socket!.emit("get_messages", { roomId });
      });
    }
  }

  private registerEventListeners(socket: Socket) {
    // Forward all events from socket.io to our eventCallbacks
    // This maintains backward compatibility with .on() and .off()
    
    // Internal helper to setup common listeners
    const setupCommonListeners = (s: Socket) => {
      s.on("notification", (data) => this.emit("notification", data));
      s.on("room_message", (msg) => this.emit("room_message", msg));
      s.on("messages_list", (list) => this.emit("messages_list", list));
      s.on("room_joined", (p) => this.emit("room_joined", p));
      s.on("room_left", (p) => this.emit("room_left", p));
      s.on("room_join_error", (p) => this.emit("room_join_error", p));
      s.on("room_leave_error", (p) => this.emit("room_leave_error", p));
      s.on("user_joined", (p) => this.emit("user_joined", p));
      s.on("user_left", (p) => this.emit("user_left", p));
      s.on("on_user_delete", (id) => this.emit("user_deleted", id));
      s.on("on_asset_delete", (id) => this.emit("asset_deleted", id));
      s.on("participants_list", (payload) => {
        this.emit("participants_list", payload);
        const roomId = payload?.roomId;
        if (roomId && this.participantsRoomHandlers.has(roomId)) {
          this.participantsRoomHandlers.get(roomId)!.forEach(cb => cb(payload));
        }
      });
      s.on("score_updated", (payload) => this.emit("score_updated", payload));
      s.on("leaderboard_update", (payload) => this.emit("leaderboard_update", payload));
      s.on("answer_result", (payload) => this.emit("answer_result", payload));
      s.on("answer_error", (payload) => this.emit("answer_error", payload));
      s.on("score_update_rejected", (payload) => this.emit("score_update_rejected", payload));
      s.on("game_state", (payload) => this.emit("game_state", payload));
      s.on("game_error", (payload) => this.emit("game_error", payload));
    };

    setupCommonListeners(socket);
  }

  async connect(token: string): Promise<void> {
    if (this.tokenSubject$.value === token) {
      if (this.socket && !this.socket.connected && !this.socket.active) {
        this.socket.connect();
      }
      return;
    }
    this.tokenSubject$.next(token);
  }

  disconnect(): void {
    this.tokenSubject$.next(null);
    this.joinedRooms.clear();
    this.participantsRoomHandlers.clear();
  }

  // Redundant with RxJS implementation
  disconnectOld(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
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
    this.enqueueEmit(event as string, args as unknown[]);
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getIsConnecting(): boolean {
    return this.statusSubject$.value === 'connecting';
  }

  getCurrentToken(): string | null {
    return this.tokenSubject$.value;
  }

  // Method để force reconnect với token mới
  async reconnectWithNewToken(token: string): Promise<void> {
    // Force a stream transition even when token value is unchanged.
    this.tokenSubject$.next(null);
    this.tokenSubject$.next(token);
  }

  hasListeners(): boolean {
    return this.eventCallbacks.size > 0;
  }

  clearListeners(): void {
    // Clearing WebSocket listeners
    this.eventCallbacks.clear();
  }

  // RxJS handles reconnection now
  scheduleReconnect(delay: number = 3000): void {
    const token = this.tokenSubject$.value;
    if (!token || this.isConnected() || this.getIsConnecting()) {
      return;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    this.reconnectTimer = setTimeout(() => {
      if (this.socket && !this.socket.connected) {
        this.socket.connect();
      } else if (!this.socket) {
        this.reconnectWithNewToken(token).catch((err) => {
          console.error("❌ Forced reconnect failed:", err);
        });
      }
    }, delay);
  }

  // Debug method để kiểm tra trạng thái
  getDebugInfo() {
    return {
      isConnected: this.isConnected(),
      isConnecting: this.getIsConnecting(),
      status: this.statusSubject$.value,
      currentToken: this.tokenSubject$.value,
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
