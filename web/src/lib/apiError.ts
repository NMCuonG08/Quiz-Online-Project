/*
  Centralized API error parsing utilities for consistent UX across modules.
  - extractErrorMessage: returns a human-readable message string
  - extractFieldErrors: returns a map of field -> message(s) for form setting
*/

type UnknownRecord = Record<string, unknown>;

export const extractErrorMessage = (
  err: unknown,
  fallback = "An unexpected error occurred"
): string => {
  try {
    if (!err) return fallback;

    // If backend responds with { error: { message, ... } }
    if (typeof err === "object" && err !== null) {
      const e = err as UnknownRecord;
      const errorObj = (e.error || (e.data as UnknownRecord)?.error) as
        | UnknownRecord
        | undefined;
      if (
        errorObj &&
        typeof errorObj.message === "string" &&
        errorObj.message.trim()
      ) {
        return errorObj.message as string;
      }

      // Common Axios error shape
      const response = (e as UnknownRecord).response as
        | UnknownRecord
        | undefined;
      const responseData = response?.data as UnknownRecord | undefined;
      const responseError = responseData?.error as UnknownRecord | undefined;
      const responseMessage = responseError?.message ?? responseData?.message;
      if (typeof responseMessage === "string" && responseMessage.trim()) {
        return responseMessage as string;
      }

      // Stringifiable error
      const msg = (e as { message?: unknown }).message;
      if (typeof msg === "string" && msg.trim()) return msg;
    }

    if (typeof err === "string" && err.trim()) return err;
    return fallback;
  } catch {
    return fallback;
  }
};

export const extractFieldErrors = (err: unknown): Record<string, string> => {
  try {
    if (!err || typeof err !== "object") return {};
    const e = err as UnknownRecord;

    // Try multiple common locations for validation errors
    const errorObj = (e.error || (e.data as UnknownRecord)?.error) as
      | UnknownRecord
      | undefined;
    const details = (errorObj?.details || (e as UnknownRecord).details) as
      | UnknownRecord
      | Array<UnknownRecord>
      | undefined;

    // Case 1: object with fieldErrors/errors map
    const fieldErrorsMap =
      (details as UnknownRecord)?.fieldErrors ||
      (details as UnknownRecord)?.errors ||
      (e as UnknownRecord).fieldErrors;

    const result: Record<string, string> = {};
    if (fieldErrorsMap && typeof fieldErrorsMap === "object") {
      Object.entries(fieldErrorsMap as Record<string, unknown>).forEach(
        ([field, value]) => {
          if (Array.isArray(value)) {
            result[field] = value.map((v) => String(v)).join("; ");
          } else if (value != null) {
            result[field] = String(value);
          }
        }
      );
    }

    // Case 2: array of { field, message }
    if (Array.isArray(details)) {
      details.forEach((item) => {
        const field = String((item as UnknownRecord).field ?? "");
        const message = String((item as UnknownRecord).message ?? "");
        if (field && message) {
          result[field] = message;
        }
      });
    }
    return result;
  } catch {
    return {};
  }
};

// Optional: map server snake_case fields to client form fields
export const mapServerFieldToForm = (field: string): string => {
  const mapping: Record<string, string> = {
    is_active: "isActive",
    parent_id: "parentId",
    icon_url: "iconFile", // best-effort mapping
  };
  if (mapping[field]) return mapping[field];
  // snake_case -> camelCase
  return field.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
};

// Build a single message string that includes details, suitable for toasts
export const formatErrorMessageWithDetails = (
  err: unknown,
  fallback = "An unexpected error occurred"
): string => {
  const base = extractErrorMessage(err, fallback);
  const fieldErrors = extractFieldErrors(err);
  const keys = Object.keys(fieldErrors);
  if (keys.length === 0) return base;
  const lines = keys
    .sort()
    .map((k) => `${mapServerFieldToForm(k)}: ${fieldErrors[k]}`);
  const detailsText = lines.join("\n");
  return `${base}\n${detailsText}`;
};
