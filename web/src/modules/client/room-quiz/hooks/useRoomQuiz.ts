"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import { wsManager } from "@/lib/websocket";
import {
  fetchRoomById,
  fetchRoomByCode,
  joinRoom,
  fetchParticipants,
  clearRoomData,
  clearJoinError,
  addMessage,
  setMessages,
  addParticipant,
  removeParticipant,
  setParticipants,
  clearMessagesError,
  clearParticipantsError,
  removeParticipantByUserId,
} from "../slices/room-quiz.slice";
import {
  type JoinRoomPayload,
  type ChatMessage,
  type Participant,
  RoomQuizService,
} from "../services/room-quiz.service";
import type {
  RoomJoinedPayload,
  RoomLeftPayload,
  RoomErrorPayload,
  UserRoomPayload,
  RoomData,
} from "@/common/types/websocket-event.type";

export function useRoomQuiz() {
  const dispatch = useAppDispatch();
  const {
    data,
    loading,
    error,
    joinLoading,
    joinError,
    messages,
    messagesLoading,
    messagesError,
    sendMessageLoading,
    participants,
    participantsLoading,
    participantsError,
  } = useAppSelector((state) => state.roomQuiz);

  // Store current roomId in ref để check trong handlers
  const currentRoomIdRef = useRef<string | null>(null);

  const getRoomById = useCallback(
    (roomId: string) => {
      currentRoomIdRef.current = roomId; // Store current roomId
      // Join room via WebSocket
      if (!wsManager.isConnected() && !wsManager.getIsConnecting()) {
        wsManager.scheduleReconnect(0);
      }
      wsManager.joinRoom(roomId);

      // Also fetch room data via API
      return dispatch(fetchRoomById(roomId));
    },
    [dispatch]
  );

  const getRoomByCode = useCallback(
    (roomCode: string) => {
      return dispatch(fetchRoomByCode(roomCode));
    },
    [dispatch]
  );

  const joinRoomAction = useCallback(
    (roomId: string, payload: JoinRoomPayload) => {
      return dispatch(joinRoom({ roomId, payload }));
    },
    [dispatch]
  );

  const clearData = useCallback(() => {
    currentRoomIdRef.current = null;
    dispatch(clearRoomData());
  }, [dispatch]);

  const leaveRoom = useCallback((roomId: string) => {
    // Leave room via WebSocket
    wsManager.leaveRoom(roomId);
  }, []);

  const clearJoinErrorAction = useCallback(() => {
    dispatch(clearJoinError());
  }, [dispatch]);

  const getCurrentUserId = useCallback(() => {
    try {
      const token = wsManager.getCurrentToken();
      if (!token) return undefined;
      const payload = JSON.parse(atob(token.split(".")[1] || ""));
      return payload?.sub || payload?.userId || payload?.id;
    } catch {
      return undefined;
    }
  }, []);

  const getChatMessages = useCallback((roomId: string) => {
    wsManager.send("get_messages", { roomId });
  }, []);

  const sendMessageAction = useCallback(
    (roomId: string, message: string) => {
      const currentUserId = getCurrentUserId() || "me";
      // Optimistic append for instant UX; server echo will follow
      dispatch(
        addMessage({
          id: `temp_${Date.now()}`,
          room_id: roomId,
          user_id: currentUserId,
          username: "",
          message,
          message_type: "text",
          created_at: new Date().toISOString(),
        })
      );

      wsManager.send("send_message", { roomId, message });
    },
    [dispatch, getCurrentUserId]
  );

  const getParticipants = useCallback(
    (roomId: string) => {

      // Request participants via WebSocket
      if (wsManager.isConnected()) {
        wsManager.send("get_participants", { roomId });
        return;
      }

      return dispatch(fetchParticipants(roomId));
    },
    [dispatch]
  );

  const inviteFriendsAction = useCallback(
    async (roomId: string, friendIds: string[]) => {
      try {
        await RoomQuizService.inviteFriends(roomId, friendIds);
      } catch {
        // Realtime delivery remains best effort; HTTP errors are surfaced by the room UI.
      }
    },
    []
  );

  const addMessageAction = useCallback(
    (message: ChatMessage) => {
      dispatch(addMessage(message));
    },
    [dispatch]
  );

  const clearMessagesErrorAction = useCallback(() => {
    dispatch(clearMessagesError());
  }, [dispatch]);

  const clearParticipantsErrorAction = useCallback(() => {
    dispatch(clearParticipantsError());
  }, [dispatch]);

  // WebSocket event handlers
  const wsBoundRef: { current: boolean } = (globalThis as any)
    .__roomQuizWsBoundRef || { current: false };
  (globalThis as any).__roomQuizWsBoundRef = wsBoundRef;

  useEffect(() => {
    if (wsBoundRef.current) return;
    wsBoundRef.current = true;
    const handleNewMessage = (message: ChatMessage) => {
      addMessageAction(message);
    };

    const handleMessagesList = (messages: ChatMessage[]) => {
      dispatch(setMessages(messages));
    };

    const handleParticipantJoined = (participant: Participant) => {
      dispatch(addParticipant(participant));
    };

    const handleParticipantLeft = (participantId: string) => {
      dispatch(removeParticipant(participantId));
    };

    const handleParticipantsList = (
      data: { participants: Participant[]; roomId: string } & any
    ) => {

      // Check if this event is for the current room
      const eventRoomId = data?.roomId;
      if (
        currentRoomIdRef.current &&
        eventRoomId !== currentRoomIdRef.current
      ) {
        return;
      }

      dispatch(setParticipants(data));
    };

    const handleRoomUpdate = (roomData: RoomData) => {
      // TODO: Update room data
    };

    const handleRoomJoined = (data: RoomJoinedPayload) => {
      const joinedRoomId = (data as any)?.room_id || (data as any)?.roomId;
      if (joinedRoomId) {
        getChatMessages(joinedRoomId);
      }
    };

    const handleRoomLeft = (data: RoomLeftPayload) => {
      // TODO: Clear room data or show message
    };

    const handleRoomJoinError = (data: RoomErrorPayload) => {
      console.error("❌ Failed to join room:", data.error);
      // TODO: Show error notification
    };

    const handleRoomLeaveError = (data: RoomErrorPayload) => {
      console.error("❌ Failed to leave room:", data.error);
      // TODO: Show error notification
    };

    const handleUserJoined = (data: UserRoomPayload) => {

      // Chỉ xử lý nếu đúng phòng hiện tại
      if (
        currentRoomIdRef.current &&
        data.roomId !== currentRoomIdRef.current
      ) {
        return;
      }

      // Rely on backend 'participants_list' event; tránh load lại để UX mượt hơn
      // TODO: Show notification "User X joined the room"
    };

    const handleUserLeft = (data: UserRoomPayload) => {

      // Check if this event is for the current room
      if (
        currentRoomIdRef.current &&
        data.roomId !== currentRoomIdRef.current
      ) {
        return;
      }

      // Optimistically remove by userId for immediate UI update
      if (data.userId) {
        dispatch(removeParticipantByUserId(data.userId));
      }

      // Tránh gọi getParticipants để UX không bị giật; backend sẽ gửi participants_list
      // TODO: Show notification "User X left the room"
    };

    // Listen for WebSocket events

    wsManager.on("room_message", handleNewMessage);
    wsManager.on("messages_list", handleMessagesList);
    wsManager.on("participant_joined", handleParticipantJoined);
    wsManager.on("participant_left", handleParticipantLeft);
    wsManager.on("participants_list", handleParticipantsList);
    wsManager.on("room_updated", handleRoomUpdate);

    // Room join/leave events
    wsManager.on("room_joined", handleRoomJoined);
    wsManager.on("room_left", handleRoomLeft);
    wsManager.on("room_join_error", handleRoomJoinError);
    wsManager.on("room_leave_error", handleRoomLeaveError);
    wsManager.on("user_joined", handleUserJoined);
    wsManager.on("user_left", handleUserLeft);

    return () => {
      wsBoundRef.current = false;
      wsManager.off("room_message", handleNewMessage);
      wsManager.off("messages_list", handleMessagesList);
      wsManager.off("participant_joined", handleParticipantJoined);
      wsManager.off("participant_left", handleParticipantLeft);
      wsManager.off("participants_list", handleParticipantsList);
      wsManager.off("room_updated", handleRoomUpdate);

      // Cleanup room events
      wsManager.off("room_joined", handleRoomJoined);
      wsManager.off("room_left", handleRoomLeft);
      wsManager.off("room_join_error", handleRoomJoinError);
      wsManager.off("room_leave_error", handleRoomLeaveError);
      wsManager.off("user_joined", handleUserJoined);
      wsManager.off("user_left", handleUserLeft);
    };
  }, [addMessageAction, dispatch, getChatMessages]);

  return {
    // State
    roomData: data,
    loading,
    error,
    joinLoading,
    joinError,
    // Chat state
    messages,
    messagesLoading,
    messagesError,
    sendMessageLoading,
    // Participants state
    participants,
    participantsLoading,
    participantsError,
    // Actions
    getRoomById,
    getRoomByCode,
    joinRoom: joinRoomAction,
    getChatMessages,
    sendMessage: sendMessageAction,
    getParticipants,
    inviteFriends: inviteFriendsAction,
    addMessage: addMessageAction,
    clearData,
    leaveRoom,
    clearJoinError: clearJoinErrorAction,
    clearMessagesError: clearMessagesErrorAction,
    clearParticipantsError: clearParticipantsErrorAction,
  };
}
