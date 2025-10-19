"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { useRoomQuiz } from "@/modules/client/room-quiz/hooks/useRoomQuiz";
import { RoomInfo } from "@/modules/client/room-quiz/components/RoomInfo";
import { RoomLoading } from "@/modules/client/room-quiz/components/RoomLoading";
import { RoomError } from "@/modules/client/room-quiz/components/RoomError";
import { ChatSection } from "@/modules/client/room-quiz/components/ChatSection";
import { ParticipantsSection } from "@/modules/client/room-quiz/components/ParticipantsSection";

const RoomQuizPage = () => {
  const params = useParams();
  const roomId = params?.id as string;

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
      getChatMessages(roomId);
      getParticipants(roomId);
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

  const handleRetry = () => {
    if (roomId) {
      console.log("Retrying fetch room with ID:", roomId);
      getRoomById(roomId);
      getChatMessages(roomId);
      getParticipants(roomId);
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

  if (loading) {
    return <RoomLoading message="Loading room information..." />;
  }

  if (error) {
    return <RoomError error={error} onRetry={handleRetry} />;
  }

  if (!roomData) {
    return <RoomError error="Room not found" onRetry={handleRetry} />;
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground text-center mb-8">
            Room Information
          </h1>

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
                <div className="bg-card border border-border p-6 rounded-lg h-80">
                  <h2 className="text-xl font-bold text-foreground mb-4">
                    Quiz Details
                  </h2>
                  {roomData.quiz ? (
                    <div className="space-y-4">
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
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      No quiz information available
                    </p>
                  )}
                </div>
              </div>

              {/* Chat Section */}
              <div className="h-80">
                <ChatSection
                  messages={messages}
                  loading={messagesLoading}
                  error={messagesError}
                  sendMessageLoading={sendMessageLoading}
                  onSendMessage={handleSendMessage}
                />
              </div>
            </div>

            {/* Right Side - 40% */}
            <div className="lg:col-span-2">
              {/* Participants Section */}
              <div className="h-full">
                <ParticipantsSection
                  participants={participants}
                  loading={participantsLoading}
                  error={participantsError}
                  onInviteFriends={handleInviteFriends}
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
