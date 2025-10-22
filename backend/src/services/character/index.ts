// Export all character services
export { CharacterService, characterService, type CreateCharacterData, type CharacterWithDetails } from './character.service';
export { CharacterCapabilityService, characterCapabilityService, type CharacterWithCapabilities, type CapabilityResult } from './character-capability.service';
export { CharacterStatsService, characterStatsService } from './character-stats.service';
export { CharacterInventoryService, characterInventoryService } from './character-inventory.service';

// For backward compatibility - re-export the main service as the original CharacterService
export { CharacterService as CharacterServiceCompat } from './character.service';
