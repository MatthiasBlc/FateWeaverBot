/**
 * Entry point pour toutes les fonctions d'admin character
 * Re-exporte les handlers depuis les modules spécialisés
 */

// Select & Actions
export { handleCharacterSelect, handleCharacterAction } from "./character-admin/character-select";

// Stats
export { handleStatsModalSubmit, handleAdvancedStatsModalSubmit } from "./character-admin/character-stats";

// Capabilities
export {
  handleCapabilitiesButton,
  handleAddCapabilities,
  handleRemoveCapabilities,
  handleViewCapabilities,
  handleCapabilitySelect
} from "./character-admin/character-capabilities";
