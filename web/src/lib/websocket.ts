import { io, Socket } from "socket.io-client";
import { BehaviorSubject, Subject, Observable, of, timer, fromEvent, merge } from "rxjs";
import { switchMap, retry, tap, map, distinctUntilChanged, catchError, takeUntil, filter, share } from "rxjs/operators";
import type { ServerEventMap, ClientEventMap } from "@/common/types/websocket-event.type";

class WebSocketManager {
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
          console.log("🔌 Attempting WebSocket connection with RxJS...");
          this.statusSubject$.next('connecting');

          const socket = io(
            process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3333",
            {
              auth: { token },
              transports: ["websocket"],
              path: "/api/socket.io",
              reconnection: false, // Let RxJS handle reconnection logic
            }
          );

          socket.on("connect", () => {
            console.log("✅ WebSocket connected via RxJS");
            this.socket = socket;
            this.socketSubject$.next(socket);
            this.statusSubject$.next('connected');
            
            // Handle post-connection logic
            this.handlePostConnect();
            
            observer.next(socket);
          });

          socket.on("disconnect", (reason) => {
            console.log("🔌 WebSocket disconnected:", reason);
            this.statusSubject$.next('disconnected');
            this.socket = null;
            this.socketSubject$.next(null);

            if (reason === "io client disconnect" || reason === "transport close") {
              // Intentional or normal close
              if (this.tokenSubject$.value) {
                observer.error(new Error(reason)); // Trigger retry if we still have a token
              } else {
                observer.complete();
              }
            } else {
              observer.error(new Error(reason));
            }
          });

          socket.on("connect_error", (error) => {
            console.error("🚨 WebSocket connection error:", error.message);
            this.statusSubject$.next('error');
            observer.error(error);
          });

          // Register all listeners from eventCallbacks
          this.registerEventListeners(socket);

          return () => {
            console.log("🧹 Cleaning up WebSocket connection");
            socket.disconnect();
            this.socket = null;
            this.socketSubject$.next(null);
          };
        }).pipe(
          retry({
            delay: (error, retryCount) => {
              const delayTime = Math.min(Math.pow(2, retryCount - 1) * 1000, 30000);
              console.log(`⏳ Reconnecting in ${delayTime}ms (attempt ${retryCount})...`);
              return timer(delayTime);
            }
          }),
          catchError(err => {
            console.error("❌ Max retries reached or fatal error:", err);
            return of(null);
          })
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe();
  }

  private cleanupSocket() {
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
    };

    setupCommonListeners(socket);
  }

  async connect(token: string): Promise<void> {
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
    this.pendingEmits.push({ event: event as string, args });
    // Try to reconnect soon
    this.scheduleReconnect(100);
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
    // This is now managed by the retry logic in setupAutoConnection
  }

  // Debug method để kiểm tra trạng thái
  getDebugInfo() {
    return {
      isConnected: this.isConnected(),
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
