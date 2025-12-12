import { useEffect, useRef } from "react";
import { useWebSocketContext } from "@/common/contexts/WebSocketProvider";
import type { ClientEventMap } from "@/common/types/websocket-event.type";

/**
 * Hook to subscribe to WebSocket events with automatic cleanup
 *
 * @example
 * ```tsx
 * useWebSocketEvent('room_message', (message) => {
 *   console.log('New message:', message);
 * });
 *
 * // With dependencies
 * useWebSocketEvent('user_joined', (payload) => {
 *   if (payload.roomId === currentRoomId) {
 *     setParticipants(prev => [...prev, payload.userId]);
 *   }
 * }, [currentRoomId]);
 * ```
 */
export function useWebSocketEvent<T extends keyof ClientEventMap>(
  event: T,
  callback: (...args: ClientEventMap[T]) => void,
  deps: React.DependencyList = []
) {
  const { on, off, isConnected } = useWebSocketContext();
  const callbackRef = useRef(callback);

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!isConnected) {
      return;
    }

    // Wrapper to use latest callback
    const handler = (...args: ClientEventMap[T]) => {
      callbackRef.current(...args);
    };

    const unsubscribe = on(event, handler);

    return () => {
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, isConnected, on, ...deps]);
}

/**
 * Hook to subscribe to room messages
 *
 * @example
 * ```tsx
 * useRoomMessages(roomId, (message) => {
 *   setMessages(prev => [...prev, message]);
 * });
 * ```
 */
export function useRoomMessages(
  roomId: string | null,
  callback: (message: ClientEventMap["room_message"][0]) => void
) {
  const { isConnected } = useWebSocketContext();

  useWebSocketEvent(
    "room_message",
    (message) => {
      if (message.room_id === roomId) {
        callback(message);
      }
    },
    [roomId]
  );

  return { isConnected };
}

/**
 * Hook to subscribe to participants updates
 *
 * @example
 * ```tsx
 * useRoomParticipants(roomId, (payload) => {
 *   setParticipants(payload.participants);
 * });
 * ```
 */
export function useRoomParticipants(
  roomId: string | null,
  callback: (payload: { roomId: string; participants: unknown[] }) => void
) {
  const { subscribeParticipants, isConnected } = useWebSocketContext();

  useEffect(() => {
    if (!roomId || !isConnected) {
      return;
    }

    const unsubscribe = subscribeParticipants(roomId, callback, {
      immediateFetch: true,
    });

    return unsubscribe;
  }, [roomId, isConnected, subscribeParticipants, callback]);
}

/**
 * Hook to subscribe to room join/leave events
 *
 * @example
 * ```tsx
 * useRoomEvents({
 *   onJoined: (payload) => console.log('Joined:', payload),
 *   onLeft: (payload) => console.log('Left:', payload),
 *   onError: (error) => console.error('Error:', error),
 * });
 * ```
 */
export function useRoomEvents(handlers: {
  onJoined?: (payload: ClientEventMap["room_joined"][0]) => void;
  onLeft?: (payload: ClientEventMap["room_left"][0]) => void;
  onJoinError?: (payload: ClientEventMap["room_join_error"][0]) => void;
  onLeaveError?: (payload: ClientEventMap["room_leave_error"][0]) => void;
}) {
  useWebSocketEvent("room_joined", (payload) => {
    handlers.onJoined?.(payload);
  });

  useWebSocketEvent("room_left", (payload) => {
    handlers.onLeft?.(payload);
  });

  useWebSocketEvent("room_join_error", (payload) => {
    handlers.onJoinError?.(payload);
  });

  useWebSocketEvent("room_leave_error", (payload) => {
    handlers.onLeaveError?.(payload);
  });
}

/**
 * Hook to subscribe to user join/leave events in a room
 *
 * @example
 * ```tsx
 * useUserRoomEvents(roomId, {
 *   onUserJoined: (payload) => console.log('User joined:', payload),
 *   onUserLeft: (payload) => console.log('User left:', payload),
 * });
 * ```
 */
export function useUserRoomEvents(
  roomId: string | null,
  handlers: {
    onUserJoined?: (payload: ClientEventMap["user_joined"][0]) => void;
    onUserLeft?: (payload: ClientEventMap["user_left"][0]) => void;
  }
) {
  useWebSocketEvent(
    "user_joined",
    (payload) => {
      if (payload.roomId === roomId) {
        handlers.onUserJoined?.(payload);
      }
    },
    [roomId]
  );

  useWebSocketEvent(
    "user_left",
    (payload) => {
      if (payload.roomId === roomId) {
        handlers.onUserLeft?.(payload);
      }
    },
    [roomId]
  );
}
