"use client";

import { useState, useCallback } from "react";
import {
  RoomService,
  type CreateRoomPayload,
  type CreateRoomResponse,
} from "../services/room.service";

export function useCreateRoom() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateRoomResponse | null>(null);

  const createRoom = useCallback(async (payload: CreateRoomPayload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await RoomService.create(payload);
      setResult(res);
      if (!res.success) {
        setError(res.message || res.error?.message || "Tạo phòng thất bại");
      }
      return res;
    } catch (e) {
      const msg = (e as { message?: string })?.message || "Tạo phòng thất bại";
      setError(msg);
      return {
        success: false,
        statusCode: 500,
        message: msg,
      } as CreateRoomResponse;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createRoom, loading, error, result };
}
