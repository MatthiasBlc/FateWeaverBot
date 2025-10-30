/**
 * Commands barrel export
 * Centralizes all Discord slash commands
 *
 * Note: Commands are auto-loaded by the bot from this directory.
 * This barrel export is for explicit imports when needed.
 */

// Admin Commands
export { default as characterAdminCommand } from './admin-commands/character-admin.js';
export { default as chantiersAdminCommand } from './admin-commands/chantiers-admin.js';
export { default as expeditionAdminCommand } from './admin-commands/expedition-admin.js';
export { default as helpAdminCommand } from './admin-commands/help-admin.js';
export { default as newElementAdminCommand } from './admin-commands/new-element-admin.js';
export { default as projetsAdminCommand } from './admin-commands/projets-admin.js';
export { default as seasonAdminCommand } from './admin-commands/season-admin.js';
export { default as stockAdminCommand } from './admin-commands/stock-admin.js';

// User Commands
export { default as expeditionCommand } from './user-commands/expedition.js';
export { default as stockCommand } from './user-commands/stock.js';
