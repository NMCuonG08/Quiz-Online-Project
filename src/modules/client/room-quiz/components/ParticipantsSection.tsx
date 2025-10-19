"use client";

import React from "react";
import { Users, UserPlus, Crown, CheckCircle } from "lucide-react";
import { Button } from "@/common/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/common/components/ui/avatar";
import { type Participant } from "../services/room-quiz.service";

interface ParticipantsSectionProps {
  participants: Participant[];
  loading: boolean;
  error: string | null;
  onInviteFriends: () => void;
  className?: string;
}

export function ParticipantsSection({
  participants,
  loading,
  error,
  onInviteFriends,
  className = "",
}: ParticipantsSectionProps) {
  const getInitials = (username: string) => {
    return username
      .split(" ")
      .map((name) => name[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      className={`bg-card border border-border rounded-lg h-full flex flex-col ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">
              Players ({Array.isArray(participants) ? participants.length : 0})
            </h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onInviteFriends}
            className="flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Invite
          </Button>
        </div>
      </div>

      {/* Participants List */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="text-center text-muted-foreground">
            Loading participants...
          </div>
        ) : error ? (
          <div className="text-center text-destructive">{error}</div>
        ) : !Array.isArray(participants) || participants.length === 0 ? (
          <div className="text-center text-muted-foreground">
            No participants yet
          </div>
        ) : (
          <div className="space-y-3">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="relative">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={participant.avatar_url} />
                    <AvatarFallback className="text-sm">
                      {getInitials(participant.username)}
                    </AvatarFallback>
                  </Avatar>
                  {participant.is_host && (
                    <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1">
                      <Crown className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground truncate">
                      {participant.username}
                    </p>
                    {participant.is_ready && (
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Joined{" "}
                    {new Date(participant.joined_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
