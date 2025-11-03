import { useCallback } from "react";
import { useAppDispatch } from "@/hooks/useRedux";
import { forceReconnectWebSocket } from "@/common/middlewares/websocket.middleware";

/**
 * Hook để dễ dàng reconnect WebSocket khi cần
 */
export const useWebSocketReconnect = () => {
  const dispatch = useAppDispatch();

  const reconnect = useCallback(() => {
    console.log("🔌 Manual WebSocket reconnect triggered");
    dispatch(forceReconnectWebSocket());
  }, [dispatch]);

  return { reconnect };
};
