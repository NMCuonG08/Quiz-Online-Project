"use client";

import React, { useEffect } from "react";
import { useQRCode } from "../hooks/useQRCode";
import { Loader2 } from "lucide-react";

interface QRCodeDisplayProps {
  roomUrl: string;
  className?: string;
  size?: number;
}

export function QRCodeDisplay({
  roomUrl,
  className = "",
  size = 200,
}: QRCodeDisplayProps) {
  const { qrCodeDataUrl, loading, error, generateQRCode } = useQRCode();

  useEffect(() => {
    if (roomUrl) {
      generateQRCode(roomUrl, {
        width: size,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });
    }
  }, [roomUrl, size, generateQRCode]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="bg-white rounded-lg p-4">
          <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="bg-white rounded-lg p-4 text-center">
          <p className="text-red-600 text-sm">Failed to generate QR code</p>
        </div>
      </div>
    );
  }

  if (!qrCodeDataUrl) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="bg-white rounded-lg p-4 text-center">
          <p className="text-gray-600 text-sm">No QR code available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="bg-foreground rounded-lg p-4 shadow-lg">
        <img
          src={qrCodeDataUrl}
          alt="Room QR Code"
          className="w-full h-auto"
          style={{ maxWidth: `${size}px`, maxHeight: `${size}px` }}
        />
      </div>
    </div>
  );
}
