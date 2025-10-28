// Export all character services
export { CharacterService, type CreateCharacterData, type CharacterWithDetails } from './character.service';
export { CharacterCapabilityService, type CharacterWithCapabilities, type CapabilityResult } from './character-capability.service';

// For backward compatibility - re-export the main service as the original CharacterService
export { CharacterService as CharacterServiceCompat } from './character.service';
