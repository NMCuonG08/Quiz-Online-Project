"use client";

import React from "react";
import { useRoomQuiz } from "../hooks/useRoomQuiz";

interface SimpleParticipantsProps {
  roomId: string;
}

export function SimpleParticipants({ roomId }: SimpleParticipantsProps) {
  const { participants, getParticipants } = useRoomQuiz();

  // Gọi getParticipants khi component mount
  React.useEffect(() => {
    if (roomId) {
      console.log("🚀 Getting participants for room:", roomId);
      getParticipants(roomId);
    }
  }, [roomId, getParticipants]);

  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-bold mb-2">
        Players ({participants.length})
      </h3>

      <div className="mb-4">
        <button
          onClick={() => getParticipants(roomId)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Refresh Participants
        </button>
      </div>

      {participants.length === 0 ? (
        <p className="text-gray-500">No players in room</p>
      ) : (
        <div className="space-y-2">
          {participants.map((participant, index) => (
            <div
              key={participant.user_id || index}
              className="p-2 bg-gray-100 rounded"
            >
              <p>
                <strong>User ID:</strong> {participant.user_id}
              </p>
              <p>
                <strong>Username:</strong> {participant.username || "N/A"}
              </p>
              <p>
                <strong>Status:</strong> {participant.status || "N/A"}
              </p>
              <p>
                <strong>Joined:</strong> {participant.joined_at || "N/A"}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Debug section */}
      <div className="mt-4 p-2 bg-yellow-100 rounded text-xs">
        <p>
          <strong>Debug:</strong>
        </p>
        <p>Room ID: {roomId}</p>
        <p>Participants: {participants.length}</p>
        <pre className="mt-2 text-xs overflow-auto">
          {JSON.stringify(participants, null, 2)}
        </pre>
      </div>
    </div>
  );
}
