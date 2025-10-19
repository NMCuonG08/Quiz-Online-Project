"use client";

import { useCallback, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import { wsManager } from "@/lib/websocket";
import {
  fetchRoomById,
  fetchRoomByCode,
  joinRoom,
  sendMessage,
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
} from "../slices/room-quiz.slice";
import {
  type JoinRoomPayload,
  type ChatMessage,
  type Participant,
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

  const getRoomById = useCallback(
    (roomId: string) => {
      // Join room via WebSocket
      console.log("Joining room via WebSocket:", roomId);
      wsManager.send("join_room", { roomId });

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
    dispatch(clearRoomData());
  }, [dispatch]);

  const leaveRoom = useCallback((roomId: string) => {
    // Leave room via WebSocket
    if (wsManager.isConnected()) {
      wsManager.send("leave_room", { roomId });
    }
  }, []);

  const clearJoinErrorAction = useCallback(() => {
    dispatch(clearJoinError());
  }, [dispatch]);

  const getChatMessages = useCallback((roomId: string) => {
    // Chỉ lấy qua WebSocket, không gọi API nữa
    if (wsManager.isConnected()) {
      wsManager.send("get_messages", { roomId });
    }
  }, []);

  const sendMessageAction = useCallback(
    (roomId: string, message: string) => {
      // Send via WebSocket for real-time
      if (wsManager.isConnected()) {
        wsManager.send("send_message", { roomId, message });
      }
      // Also send via API for persistence
      return dispatch(sendMessage({ roomId, message }));
    },
    [dispatch]
  );

  const getParticipants = useCallback(
    (roomId: string) => {
      // Request participants via WebSocket
      if (wsManager.isConnected()) {
        wsManager.send("get_participants", { roomId });
      }
      // Fallback to API if WebSocket not connected
      return dispatch(fetchParticipants(roomId));
    },
    [dispatch]
  );

  const inviteFriendsAction = useCallback(
    (roomId: string, friendIds: string[]) => {
      // Send via WebSocket for real-time
      if (wsManager.isConnected()) {
        wsManager.send("invite_friends", { roomId, friendIds });
      }
      // Also send via API for persistence
      // TODO: Add inviteFriends API call
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
  useEffect(() => {
    const handleNewMessage = (message: ChatMessage) => {
      console.log("📨 New message received:", message);
      addMessageAction(message);
    };

    const handleMessagesList = (messages: ChatMessage[]) => {
      console.log("📨 Messages list received:", messages);
      dispatch(setMessages(messages));
    };

    const handleParticipantJoined = (participant: Participant) => {
      console.log("👤 Participant joined:", participant);
      dispatch(addParticipant(participant));
    };

    const handleParticipantLeft = (participantId: string) => {
      console.log("👤 Participant left:", participantId);
      dispatch(removeParticipant(participantId));
    };

    const handleParticipantsList = (data: { participants: Participant[] }) => {
      console.log("👤 Participants list received:", data.participants);
      dispatch(setParticipants(data.participants));
    };

    const handleRoomUpdate = (roomData: RoomData) => {
      console.log("🏠 Room updated:", roomData);
      // TODO: Update room data
    };

    const handleRoomJoined = (data: RoomJoinedPayload) => {
      console.log("✅ Room joined successfully:", data);
      // Show success notification if needed
      // TODO: Update room data or show success message
    };

    const handleRoomLeft = (data: RoomLeftPayload) => {
      console.log("👋 Room left successfully:", data);
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
      console.log("👤 User joined room:", data);
      // Optionally refresh participants list or show notification
      // TODO: Show notification "User X joined the room"
    };

    const handleUserLeft = (data: UserRoomPayload) => {
      console.log("👋 User left room:", data);
      // Optionally refresh participants list or show notification
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
  }, [addMessageAction, dispatch]);

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
