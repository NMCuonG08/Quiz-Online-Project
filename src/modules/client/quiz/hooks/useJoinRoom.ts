"use client";

import { useCallback, useState } from "react";
import { RoomService } from "../services/room.service";

export function useJoinRoom() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const join = useCallback(async (roomId: string, password?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await RoomService.join(roomId, { password });
      if (!res.success) {
        setError(
          res.message || res.error?.message || "Tham gia phòng thất bại"
        );
      }
      return res;
    } catch (e) {
      const msg =
        (e as { message?: string })?.message || "Tham gia phòng thất bại";
      setError(msg);
      return { success: false, statusCode: 500, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  return { join, loading, error };
}
