/**
 * Barrel exports for chantiers handlers
 * Exports all chantiers-related handlers from a single entry point
 */

// Types and interfaces
export type {
  Town,
  ActiveCharacter,
  ResourceCost,
  Chantier,
  InvestResult,
} from "./chantiers-common.js";

// Helpers
export {
  groupChantiersByStatus,
  getAvailableChantiersSorted,
  createChantiersListEmbed,
} from "./chantiers-helpers.js";

// Display handlers
export {
  handleChantiersCommand,
  handleListCommand,
  handleChantiersAdminCommand,
} from "./chantiers-display.js";

// Participation handlers
export {
  handleParticipateButton,
  handleInvestCommand,
} from "./chantiers-participate.js";

// Investment handlers
export {
  handleInvestModalSubmit,
} from "./chantiers-invest.js";

// Admin handlers
export {
  handleAddChantierCommand,
  handleDeleteCommand,
  handleAdminAddButton,
  handleAdminDeleteButton,
} from "./chantiers-admin.js";
