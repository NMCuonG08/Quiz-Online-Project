import { useWebSocketContext } from "@/common/contexts/WebSocketProvider";
import type {
  ServerEventMap,
  ClientEventMap,
} from "@/common/types/websocket-event.type";

/**
 * Main hook to access WebSocket functionality
 *
 * @example
 * ```tsx
 * const { isConnected, send, joinRoom } = useWebSocket();
 *
 * useEffect(() => {
 *   if (isConnected) {
 *     joinRoom('room-123');
 *   }
 * }, [isConnected, joinRoom]);
 * ```
 */
export function useWebSocket() {
  return useWebSocketContext();
}

/**
 * Hook to send WebSocket events
 *
 * @example
 * ```tsx
 * const sendMessage = useWebSocketSend();
 *
 * const handleSend = () => {
 *   sendMessage('send_message', { roomId: '123', message: 'Hello' });
 * };
 * ```
 */
export function useWebSocketSend() {
  const { send } = useWebSocketContext();
  return send;
}

/**
 * Hook to get WebSocket connection state
 *
 * @example
 * ```tsx
 * const { isConnected, isConnecting, error } = useWebSocketState();
 *
 * if (isConnecting) return <Spinner />;
 * if (!isConnected) return <ConnectionError error={error} />;
 * ```
 */
export function useWebSocketState() {
  const { isConnected, isConnecting, error, reconnectAttempts } =
    useWebSocketContext();
  return { isConnected, isConnecting, error, reconnectAttempts };
}

/**
 * Hook to manage WebSocket connection
 *
 * @example
 * ```tsx
 * const { connect, disconnect, reconnect } = useWebSocketConnection();
 *
 * const handleConnect = async () => {
 *   await connect(token);
 * };
 * ```
 */
export function useWebSocketConnection() {
  const { connect, disconnect, reconnect } = useWebSocketContext();
  return { connect, disconnect, reconnect };
}

/**
 * Hook to manage rooms
 *
 * @example
 * ```tsx
 * const { joinRoom, leaveRoom } = useWebSocketRooms();
 *
 * useEffect(() => {
 *   joinRoom(roomId);
 *   return () => leaveRoom(roomId);
 * }, [roomId]);
 * ```
 */
export function useWebSocketRooms() {
  const { joinRoom, leaveRoom, subscribeParticipants } = useWebSocketContext();
  return { joinRoom, leaveRoom, subscribeParticipants };
}
