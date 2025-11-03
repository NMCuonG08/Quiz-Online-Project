import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface BackendUnavailableProps {
  onRetry?: () => void;
  message?: string;
}

export const BackendUnavailable: React.FC<BackendUnavailableProps> = ({
  onRetry,
  message = "Backend service is currently unavailable. Please try again later.",
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
      <AlertTriangle className="w-12 h-12 text-yellow-600 mb-4" />

      <h3 className="text-lg font-semibold text-yellow-800 mb-2">
        Service Unavailable
      </h3>

      <p className="text-yellow-700 text-center mb-4 max-w-md">{message}</p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      )}

      <div className="mt-4 text-sm text-yellow-600">
        <p>This might be because:</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Backend server is starting up</li>
          <li>Database connection issues</li>
          <li>Network connectivity problems</li>
        </ul>
      </div>
    </div>
  );
};
