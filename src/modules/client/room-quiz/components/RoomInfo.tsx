"use client";

import React from "react";
import { RoomQuizData } from "../services/room-quiz.service";
import { PinCodeDisplay } from "./PinCodeDisplay";
import { QRCodeDisplay } from "./QRCodeDisplay";
import { RoomQuizService } from "../services/room-quiz.service";

interface RoomInfoProps {
  roomData: RoomQuizData;
  className?: string;
}

export function RoomInfo({ roomData, className = "" }: RoomInfoProps) {
  const roomUrl = RoomQuizService.generateRoomUrl(roomData.room_code);

  return (
    <div
      className={`bg-card border border-border p-8 rounded-lg h-full ${className}`}
    >
      <div className="flex flex-col gap-6 h-full">
        {/* PIN Code Section */}
        <div className="flex-1">
          <PinCodeDisplay pinCode={roomData.room_code} />
        </div>

        {/* QR Code Section */}
        <div className="flex justify-center">
          <QRCodeDisplay roomUrl={roomUrl} size={150} />
        </div>
      </div>
    </div>
  );
}
