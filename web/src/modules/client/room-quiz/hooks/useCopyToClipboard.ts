"use client";

import { useState, useCallback } from "react";

export function useCopyToClipboard() {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copyToClipboard = useCallback(async (text: string) => {
    setError(null);
    setCopied(false);

    try {
      if (!navigator.clipboard) {
        throw new Error("Clipboard API not supported");
      }

      await navigator.clipboard.writeText(text);
      setCopied(true);

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);

      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to copy to clipboard";
      setError(errorMessage);

      // Fallback for older browsers
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);

        if (successful) {
          setCopied(true);
          setTimeout(() => {
            setCopied(false);
          }, 2000);
          return true;
        } else {
          throw new Error("Copy command failed");
        }
      } catch (fallbackErr) {
        const fallbackError =
          fallbackErr instanceof Error ? fallbackErr.message : "Copy failed";
        setError(fallbackError);
        return false;
      }
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    copied,
    error,
    copyToClipboard,
    clearError,
  };
}
