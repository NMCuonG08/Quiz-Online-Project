"use client";

import { useCallback, useEffect, useState } from "react";
import { RoomService } from "../services/room.service";

export interface RoomItem {
  id: string;
  quiz_id: string;
  owner_id: string;
  room_code: string;
  status: string;
  is_private: boolean;
  password_hash: string | null;
  max_participants: number;
  current_participants: number;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function useListRooms(quizId?: string, status: string = "OPEN") {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<RoomItem[]>([]);

  const fetchRooms = useCallback(async () => {
    if (!quizId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await RoomService.listByQuiz(quizId, status);
      if (res.success) {
        setItems(res.data.items || []);
      } else {
        setError(res.message || "Tải danh sách phòng thất bại");
      }
    } catch (e) {
      setError(
        (e as { message?: string })?.message || "Tải danh sách phòng thất bại"
      );
    } finally {
      setLoading(false);
    }
  }, [quizId, status]);

  useEffect(() => {
    void fetchRooms();
  }, [fetchRooms]);

  return { loading, error, items, refetch: fetchRooms };
}
