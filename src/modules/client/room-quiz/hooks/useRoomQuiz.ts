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
    dispatch(clearRoomData());
  }, [dispatch]);

  const leaveRoom = useCallback((roomId: string) => {
    // Leave room via WebSocket
    wsManager.leaveRoom(roomId);
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
      // Optimistic append for instant UX; server echo will follow
      dispatch(
        addMessage({
          id: `temp_${Date.now()}`,
          room_id: roomId,
          user_id: "me",
          username: "You",
          message,
          message_type: "text",
          created_at: new Date().toISOString(),
        })
      );

      if (wsManager.isConnected()) {
        wsManager.send("send_message", { roomId, message });
      }
    },
    [dispatch]
  );

  const getParticipants = useCallback(
    (roomId: string) => {
      console.log("🔍 getParticipants called with roomId:", roomId);
      console.log("🔌 WebSocket connected:", wsManager.isConnected());

      // Request participants via WebSocket
      if (wsManager.isConnected()) {
        console.log("📡 Sending get_participants via WebSocket");
        wsManager.send("get_participants", { roomId });
      } else {
        console.log("⚠️ WebSocket not connected, using API fallback");
      }

      // Fallback to API if WebSocket not connected
      const action = dispatch(fetchParticipants(roomId));
      action.then((res: any) => {
        try {
          console.log("🧾 API fetchParticipants result:", res);
          const payload = res?.payload as any;
          if (payload) {
            console.log(
              "📥 API participants payload keys:",
              Object.keys(payload)
            );
            const apiParticipants = (payload as any).participants ?? payload;
            console.log(
              "📊 API participants length:",
              Array.isArray(apiParticipants) ? apiParticipants.length : "n/a"
            );
          }
        } catch (e) {
          console.log("⚠️ Unable to inspect API payload:", e);
        }
      });
      return action;
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
  const wsBoundRef: { current: boolean } = (globalThis as any)
    .__roomQuizWsBoundRef || { current: false };
  (globalThis as any).__roomQuizWsBoundRef = wsBoundRef;

  useEffect(() => {
    if (wsBoundRef.current) return;
    wsBoundRef.current = true;
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

    const handleParticipantsList = (
      data: { participants: Participant[] } & any
    ) => {
      console.log("👤 Participants list event payload:", data);
      const list = (data && (data as any).participants) || [];
      console.log("📊 Total participants (WS):", list.length);
      dispatch(setParticipants(list));
    };

    const handleRoomUpdate = (roomData: RoomData) => {
      console.log("🏠 Room updated:", roomData);
      // TODO: Update room data
    };

    const handleRoomJoined = (data: RoomJoinedPayload) => {
      console.log("✅ Room joined successfully:", data);
      const joinedRoomId = (data as any)?.room_id || (data as any)?.roomId;
      if (joinedRoomId) {
        console.log("🔄 Fetching participants after join for:", joinedRoomId);
        getParticipants(joinedRoomId);
        console.log("🔄 Fetching messages after join for:", joinedRoomId);
        getChatMessages(joinedRoomId);
      }
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
    console.log("🔌 Setting up WebSocket listeners...");
    console.log("🔌 WebSocket connected:", wsManager.isConnected());

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
  }, [addMessageAction, dispatch, getParticipants]);

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
