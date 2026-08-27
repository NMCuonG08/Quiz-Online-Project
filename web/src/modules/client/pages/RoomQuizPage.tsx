"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { useRoomQuiz } from "@/modules/client/room-quiz/hooks/useRoomQuiz";
import { RoomInfo } from "@/modules/client/room-quiz/components/RoomInfo";
import { RoomLoading } from "@/modules/client/room-quiz/components/RoomLoading";
import { RoomError } from "@/modules/client/room-quiz/components/RoomError";
import { ChatSection } from "@/modules/client/room-quiz/components/ChatSection";
import { ParticipantsSection } from "@/modules/client/room-quiz/components/ParticipantsSection";
import { useWebSocketState } from "@/common/hooks/useWebSocket";
import GameQuizPage from "@/modules/client/game-quiz/pages/GameQuizPage";
import { QuizService } from "@/modules/client/do-quiz/services/quiz.service";
import { Question } from "@/modules/client/do-quiz/types/quiz.types";
import { useAppSelector } from "@/hooks/useRedux";
import { wsManager } from "@/lib/websocket";
import type { RoomGameStatePayload } from "@/common/types/websocket-event.type";

const RoomQuizPage = () => {
  const params = useParams();
  const roomId = params?.id as string;
  const { isConnected } = useWebSocketState();
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [gameQuestions, setGameQuestions] = useState<Question[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [gameError, setGameError] = useState<string | null>(null);
  const gameVersionRef = useRef(0);
  const questionsLoadingRef = useRef(false);
  const authUserId = useAppSelector((state) => state.auth.user?.id);
  const currentUserId = useMemo(() => {
    if (authUserId) return authUserId;
    if (!isConnected) return undefined;
    try {
      const token = wsManager.getCurrentToken();
      const encoded = token?.split(".")[1];
      if (!encoded) return undefined;
      const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(
        atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")),
      ) as { sub?: string; userId?: string; id?: string };
      return payload.sub || payload.userId || payload.id;
    } catch {
      return undefined;
    }
  }, [authUserId, isConnected]);

  const {
    roomData,
    loading,
    error,
    getRoomById,
    clearData,
    // Chat
    messages,
    messagesLoading,
    messagesError,
    sendMessageLoading,
    getChatMessages,
    sendMessage,
    // Participants
    participants,
    participantsLoading,
    participantsError,
    getParticipants,
    inviteFriends,
    leaveRoom,
  } = useRoomQuiz();

  useEffect(() => {
    if (roomId) {
      console.log("Fetching room with ID:", roomId);
      getRoomById(roomId);
    }

    // Cleanup on unmount
    return () => {
      if (roomId) {
        leaveRoom(roomId);
      }
      clearData();
    };
  }, [
    roomId,
    getRoomById,
    getChatMessages,
    getParticipants,
    leaveRoom,
    clearData,
  ]);

  // Ensure websocket room join even when data is cached or after reconnect
  useEffect(() => {
    if (!roomId) return;
    if (!isConnected) return;
    console.log("Ensuring WebSocket join for room:", roomId);
    getRoomById(roomId);
    getParticipants(roomId);
    getChatMessages(roomId);
  }, [roomId, isConnected, getRoomById, getParticipants, getChatMessages]);

  const handleRetry = () => {
    if (roomId) {
      console.log("Retrying fetch room with ID:", roomId);
      getRoomById(roomId);
    }
  };

  const handleSendMessage = (message: string) => {
    if (roomId) {
      sendMessage(roomId, message);
    }
  };

  const handleInviteFriends = () => {
    if (roomId) {
      // TODO: Get friend IDs from user selection
      const friendIds = ["friend1", "friend2"]; // Placeholder
      inviteFriends(roomId, friendIds);
    }
  };

  const ensureGameQuestions = useCallback(async () => {
    if (gameQuestions.length > 0) return true;
    if (!roomData?.quiz_id || questionsLoadingRef.current) return false;
    questionsLoadingRef.current = true;
    setIsLoadingQuestions(true);
    try {
      const response = await QuizService.getQuizQuestions(roomData.quiz_id);
      if (!response.success || !response.data?.length) {
        setGameError(response.message || "Không thể tải câu hỏi của phòng.");
        return false;
      }
      setGameQuestions(response.data);
      setGameError(null);
      return true;
    } catch (error) {
      console.error("Error fetching room questions:", error);
      setGameError("Không thể tải câu hỏi. Vui lòng thử lại.");
      return false;
    } finally {
      questionsLoadingRef.current = false;
      setIsLoadingQuestions(false);
    }
  }, [gameQuestions.length, roomData?.quiz_id]);

  useEffect(() => {
    if (!isConnected || !roomId) return;
    let active = true;

    const handleGameState = async (snapshot: RoomGameStatePayload) => {
      if (
        snapshot.roomId !== roomId
        || snapshot.version < gameVersionRef.current
      ) return;
      gameVersionRef.current = snapshot.version;
      if (snapshot.status === "QUESTION" || snapshot.status === "FINISHED") {
        const ready = await ensureGameQuestions();
        if (active && ready) setIsGameStarted(true);
      } else if (active) {
        setIsGameStarted(false);
      }
    };
    const handleGameError = (payload: { error: string }) => {
      if (!active) return;
      setIsLoadingQuestions(false);
      setGameError(payload.error || "Không thể đồng bộ trạng thái trò chơi.");
    };

    wsManager.on("game_state", handleGameState);
    wsManager.on("game_error", handleGameError);
    wsManager.joinRoom(roomId);
    wsManager.send("get_game_state", { roomId });

    return () => {
      active = false;
      wsManager.off("game_state", handleGameState);
      wsManager.off("game_error", handleGameError);
    };
  }, [ensureGameQuestions, isConnected, roomId]);

  const handleStartGame = () => {
    if (!roomId || !isConnected) {
      setGameError("WebSocket chưa kết nối. Vui lòng chờ và thử lại.");
      return;
    }
    setGameError(null);
    setIsLoadingQuestions(true);
    wsManager.send("start_game", { roomId });
  };

  const handleExitGame = () => {
    setIsGameStarted(false);
    setGameQuestions([]);
  };

  const isRoomOwner = Boolean(
    currentUserId && roomData?.owner_id === currentUserId,
  );

  if (loading) {
    return <RoomLoading message="Loading room information..." />;
  }

  if (error) {
    return <RoomError error={error} onRetry={handleRetry} />;
  }

  if (!roomData) {
    return <RoomError error="Room not found" onRetry={handleRetry} />;
  }

  // Show game page if game is started
  if (isGameStarted && gameQuestions.length > 0) {
    return (
      <GameQuizPage
        questions={gameQuestions}
        roomCode={roomData.room_code}
        onExit={handleExitGame}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            <h1 className="text-3xl font-bold text-foreground text-center sm:text-left">
              Room Information
            </h1>
            <div className="flex flex-col items-center gap-1 sm:items-end">
              {isRoomOwner ? (
                <button
                  onClick={handleStartGame}
                  disabled={isLoadingQuestions || !roomData.quiz_id || !isConnected}
                  className="inline-flex items-center gap-2 rounded-md border border-primary bg-primary text-primary-foreground px-4 py-2 text-sm font-medium transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingQuestions ? "Đang đồng bộ..." : "🎮 Bắt đầu cho cả phòng"}
                </button>
              ) : (
                <span className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                  Đang chờ chủ phòng bắt đầu…
                </span>
              )}
              {gameError && (
                <span className="max-w-sm text-xs text-destructive">{gameError}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* PIN Code Section - 60% */}
            <div className="lg:col-span-3 space-y-6">
              {/* PIN Code & Quiz Detail - Same Height */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* PIN Code */}
                <div className="h-80">
                  <RoomInfo roomData={roomData} />
                </div>

                {/* Quiz Detail */}
                <div className="bg-card border border-border p-6 rounded-lg h-80 flex flex-col">
                  <h2 className="text-xl font-bold text-foreground mb-4">
                    Quiz Details
                  </h2>
                  {roomData.quiz ? (
                    <div className="space-y-4 flex-1">
                      <div>
                        <h3 className="text-lg font-semibold text-primary mb-2">
                          {roomData.quiz.title}
                        </h3>
                        <p className="text-muted-foreground text-sm mb-3">
                          {roomData.quiz.description}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">
                            Difficulty:
                          </span>
                          <span className="ml-2 text-foreground font-medium">
                            {roomData.quiz.difficulty_level}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Duration:
                          </span>
                          <span className="ml-2 text-foreground font-medium">
                            {roomData.quiz.time_limit} min
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Questions:
                          </span>
                          <span className="ml-2 text-foreground font-medium">
                            {roomData.quiz.questions_count}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Rating:</span>
                          <span className="ml-2 text-foreground font-medium">
                            {roomData.quiz.average_rating?.toFixed(1) || "N/A"}{" "}
                            ⭐
                          </span>
                        </div>
                      </div>

                      {roomData.quiz.thumbnail_url && (
                        <div className="mt-4">
                          <Image
                            src={roomData.quiz.thumbnail_url}
                            alt={roomData.quiz.title}
                            width={200}
                            height={100}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                        </div>
                      )}

                      {/* Start Game Button */}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      No quiz information available
                    </p>
                  )}
                </div>
              </div>

              {/* Participants Section (left, shorter) */}
              <div className="h-96">
                <ParticipantsSection
                  roomId={roomId}
                  participants={participants}
                  loading={participantsLoading}
                  error={participantsError}
                  onInviteFriends={handleInviteFriends}
                />
              </div>
            </div>

            {/* Right Side - 40% */}
            <div className="lg:col-span-2">
              {/* Chat Section (right, taller with scroll) */}
              <div className="h-[700px]">
                <ChatSection
                  messages={messages}
                  loading={messagesLoading}
                  error={messagesError}
                  sendMessageLoading={sendMessageLoading}
                  onSendMessage={handleSendMessage}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomQuizPage;
