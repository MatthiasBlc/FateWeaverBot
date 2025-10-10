import axios from "axios";

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (
      (error.response?.data as { message?: string })?.message || error.message
    );
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Erreur inconnue";
}
