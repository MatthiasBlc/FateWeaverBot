/**
 * Expedition DTOs - Data Transfer Objects for Expedition operations
 */

export interface CreateExpeditionDto {
  name: string;
  townId: string;
  initialResources: { resourceTypeName: string; quantity: number }[];
  duration: number; // in days
  createdBy: string;
  characterId: string;
}
