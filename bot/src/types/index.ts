// Common types used across the application

export interface Town {
  id: string;
  name: string;
  foodStock: number;
  // Add other town properties as needed
}

export interface Guild {
  id: string;
  logChannelId?: string;
  // Add other guild properties as needed
}

// Re-export other types from services
export * from '../services/api/character-api.service';

// Add other type exports as needed
