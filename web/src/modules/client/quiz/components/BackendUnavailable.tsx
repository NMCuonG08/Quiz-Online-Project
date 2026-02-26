"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";

interface BackendUnavailableProps {
  onRetry?: () => void;
  message?: string;
}

export const BackendUnavailable: React.FC<BackendUnavailableProps> = ({
  onRetry,
  message,
}) => {
  const t = useTranslations("quizDetail");
  const displayMessage = message || t("backendDefaultMessage");

  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
      <AlertTriangle className="w-12 h-12 text-yellow-600 mb-4" />

      <h3 className="text-lg font-semibold text-yellow-800 mb-2">
        {t("serviceUnavailable")}
      </h3>

      <p className="text-yellow-700 text-center mb-4 max-w-md">{displayMessage}</p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          {t("tryAgain")}
        </button>
      )}

      <div className="mt-4 text-sm text-yellow-600">
        <p>{t("mightBecause")}</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>{t("backendStarting")}</li>
          <li>{t("dbIssues")}</li>
          <li>{t("networkIssues")}</li>
        </ul>
      </div>
    </div>
  );
};
