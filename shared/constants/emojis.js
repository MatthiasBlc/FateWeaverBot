"use strict";
/**
 * Centralized emoji constants shared between bot and backend
 * Single source of truth for all emojis used across the application
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DIRECTION = exports.CONFIG = exports.RESOURCES_EXTENDED = exports.RESOURCES = exports.LOCATION = exports.PROJECT = exports.CHANTIER = exports.EXPEDITION = exports.CAPABILITIES = exports.ACTIONS = exports.HUNGER = exports.CHARACTER = exports.SEASON = exports.ADMIN = exports.STATUS = exports.SYSTEM = exports.UI = void 0;
// UI Elements
// UNUSED - All UI constants are currently not being used in the codebase
exports.UI = {
// TIME: "⏱️", // UNUSED
// LOCATION_PIN: "📍", // UNUSED
// FIRST: "⏮️", // UNUSED
// PREVIOUS: "◀️", // UNUSED
// NEXT: "▶️", // UNUSED
// LAST: "⏭️", // UNUSED
};
// System & Admin
exports.SYSTEM = {
    WARNING: "⚠️",
    // DELETE: "🗑️", // UNUSED (use ACTIONS.DELETE instead)
    // STATS: "📊", // UNUSED (duplicate of STATUS.STATS)
    // TARGET: "🎯", // UNUSED
    SPARKLES: "✨", // Used in character-modals.ts for new character creation
};
// Status & Feedback
exports.STATUS = {
    SUCCESS: "✅",
    ERROR: "❌",
    WARNING: "⚠️",
    INFO: "ℹ️",
    STATS: "📊", // Used in chantier-creation.ts and project-creation.ts for displaying stats
};
// Admin Actions
// UNUSED - All ADMIN constants are currently not being used in the codebase
exports.ADMIN = {
// SETTINGS: "⚙️", // UNUSED
// INFO: "ℹ️", // UNUSED (use STATUS.INFO instead)
// EDIT: "✍️", // UNUSED
// ROCKET: "🚀", // UNUSED
// EMERGENCY: "🚨", // UNUSED
};
// Seasons
// UNUSED - All SEASON constants are currently not being used in the codebase
exports.SEASON = {
// SUMMER: "☀️", // UNUSED
// WINTER: "❄️", // UNUSED
// WEATHER: "🌤️", // UNUSED
};
// Character Stats
exports.CHARACTER = {
    HP_FULL: "❤️",
    HP_EMPTY: "🖤",
    HP_BANDAGED: "❤️‍🩹",
    MP_FULL: "💜",
    MP_EMPTY: "🖤",
    MP_DEPRESSION: "😶‍🌫️",
    MP_DEPRESSED: "🥺",
    PA: "⚡",
    PA_ALT: "🎯",
    PROFILE: "📋",
    STATUS: "❗",
    // PERSON: "👤", // UNUSED
    // GROUP: "👥", // UNUSED
    LINK: "🔗", // Used for linked skills display
};
// Hunger Levels
exports.HUNGER = {
    DEAD: "💀",
    AGONY: "😰",
    STARVATION: "😫",
    STARVING: " 😰",
    HUNGRY: " 😕",
    APPETITE: "🤤",
    FED: "😊",
    UNKNOWN: "❓",
    ICON: "🍞", // Used for hunger section title
};
// Actions
exports.ACTIONS = {
    // EDIT: "✏️", // UNUSED
    // DELETE: "🗑️", // UNUSED
    // REFRESH: "🔄", // UNUSED
    ADD: "➕",
    REMOVE: "➖", // Used in character-admin.components.ts for removing capabilities/objects/skills
    // CANCEL: "❌", // UNUSED (use STATUS.ERROR instead)
    // CONFIRM: "✅", // UNUSED (use STATUS.SUCCESS instead)
};
// Capabilities
exports.CAPABILITIES = {
    HUNT: "🏹",
    GATHER: "🌿",
    FISH: "🎣",
    CHOPPING: "🪓",
    MINING: "⛏️",
    WEAVING: "🧵",
    FORGING: "🔨",
    WOODWORKING: "🪚",
    COOKING: "🫕",
    HEALING: "⚕️",
    RESEARCHING: "🔎",
    CARTOGRAPHING: "🗺️",
    AUGURING: "🌦️",
    ENTERTAIN: "🎭",
    GENERIC: "💪", // Used for generic capability display
};
// Expeditions
// NOTE: Expedition emojis are currently hardcoded in expedition files
// These constants should be used once hardcoded emojis are refactored
exports.EXPEDITION = {
    // PLANNING: "📝", // UNUSED (hardcoded in expedition-create.ts)
    // LOCKED: "🔒", // UNUSED
    // DEPARTED: "🚶‍♀️‍➡️", // UNUSED
    // RETURNED: "🏘️", // UNUSED
    ICON: "🧭", // TODO: Should be used (currently hardcoded in expedition-display.ts:450)
    // CAMP: "🏕️", // UNUSED
};
// Chantiers
exports.CHANTIER = {
    PLAN: "📝",
    IN_PROGRESS: "🚧",
    COMPLETED: "✅",
    ICON: "🛖",
    CELEBRATION: "🎉", // Used in chantiers.handlers.ts for completion celebration
};
// Projects (Artisanat)
exports.PROJECT = {
    ACTIVE: "🔧",
    COMPLETED: "✅",
    ICON: "🛠️",
    CELEBRATION: "🎉",
    UNKNOWN: "❓", // Used for unknown project status
};
// Locations
exports.LOCATION = {
    // CITY: "🏘️", // UNUSED
    // CITY_ALT: "🏘️", // UNUSED (duplicate)
    TOWN: "🏘️", // Used for stock display
    // EXPEDITION: "🏕️", // UNUSED (use EXPEDITION.CAMP instead)
};
// Resources
exports.RESOURCES = {
    GENERIC: "📦",
    FOOD: "🌾",
    PREPARED_FOOD: "🥞",
    // LIST: "📋", // UNUSED
    WOOD: "🪵",
    MINERAL: "⚙️",
    CATAPLASM: "🩹",
    // METAL: "⚙️", // UNUSED (duplicate of MINERAL)
    FABRIC: "🧵", // Used in seed data for "Tissu"
    // PLANKS: "🪵", // UNUSED (duplicate of WOOD)
};
// Extended Resources
exports.RESOURCES_EXTENDED = {
    // GENERIC: "📦", // UNUSED (duplicate of RESOURCES.GENERIC)
    // BREAD: "🍞", // UNUSED (duplicate of HUNGER.ICON)
    // FOOD: "🌾", // UNUSED (duplicate of RESOURCES.FOOD)
    FORK_KNIFE: "🍴",
    BANDAGE: "🩹", // Used for cataplasm button
};
// Config & UI
exports.CONFIG = {
    SUCCESS: "✅",
    DISABLED: "🚫",
    LIST: "📋",
    SUNRISE: "🌅", // Used for sunrise/morning config
};
// Directions (for expeditions)
exports.DIRECTION = {
    NORTH: "⬆️",
    NORTHEAST: "↗️",
    EAST: "➡️",
    SOUTHEAST: "↘️",
    SOUTH: "⬇️",
    SOUTHWEST: "↙️",
    WEST: "⬅️",
    NORTHWEST: "↖️",
    UNKNOWN: "❓", // Unknown direction
};
