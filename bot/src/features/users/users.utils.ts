import type { ProfileData } from "./users.types";

export function calculateTimeUntilNextUpdate(): number {
  const now = new Date();
  const nextUpdate = new Date(now);
  nextUpdate.setHours(24, 0, 0, 0); // Minuit prochain

  if (now >= nextUpdate) {
    nextUpdate.setDate(nextUpdate.getDate() + 1); // Si on est après minuit, prendre minuit du lendemain
  }

  return Math.floor((nextUpdate.getTime() - now.getTime()) / 1000);
}

export function formatTimeUntilUpdate(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `Dans ${hours}h ${minutes}m`;
}

export function getActionPointsEmoji(points: number): string {
  return points === 0 || points === 3 || points === 4 ? "⚠️" : "";
}