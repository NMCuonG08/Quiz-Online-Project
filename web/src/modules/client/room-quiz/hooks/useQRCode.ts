"use client";

import { useState, useCallback, useEffect } from "react";
import QRCode from "qrcode";

export interface QRCodeOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

export function useQRCode() {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateQRCode = useCallback(
    async (text: string, options: QRCodeOptions = {}) => {
      setLoading(true);
      setError(null);

      try {
        const defaultOptions = {
          width: 256,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
          ...options,
        };

        const dataUrl = await QRCode.toDataURL(text, defaultOptions);
        setQrCodeDataUrl(dataUrl);
        return dataUrl;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to generate QR code";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const clearQRCode = useCallback(() => {
    setQrCodeDataUrl("");
    setError(null);
  }, []);

  return {
    qrCodeDataUrl,
    loading,
    error,
    generateQRCode,
    clearQRCode,
  };
}
