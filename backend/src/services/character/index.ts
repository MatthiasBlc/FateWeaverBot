// Export all character services
export { CharacterService, type CreateCharacterData, type CharacterWithDetails } from './character.service';
export { CharacterCapabilityService, type CharacterWithCapabilities, type CapabilityResult } from './character-capability.service';
export { CharacterStatsService } from './character-stats.service';
export { CharacterInventoryService } from './character-inventory.service';

// For backward compatibility - re-export the main service as the original CharacterService
export { CharacterService as CharacterServiceCompat } from './character.service';
