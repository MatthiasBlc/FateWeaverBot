import { getErrorMessage as getErrorMessageFromService } from "../services/errors";

/**
 * Formats an error for structured logging
 * Extracts relevant information from Error objects
 *
 * @param error - The error to format
 * @returns Structured error object for logging
 */
export function formatErrorForLog(error: unknown): {
  message: string;
  name?: string;
  stack?: string;
} {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
    };
  }
  return {
    message: String(error),
  };
}

/**
 * Extracts a user-friendly error message
 * Re-exports the service error handler for convenience
 *
 * @param error - The error to extract message from
 * @returns User-friendly error message string
 */
export function getErrorMessage(error: unknown): string {
  return getErrorMessageFromService(error);
}
