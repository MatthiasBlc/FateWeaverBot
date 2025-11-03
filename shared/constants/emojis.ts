/**
 * Centralized emoji constants shared between bot and backend
 * Single source of truth for all emojis used across the application
 */

// UI Elements
// UNUSED - All UI constants are currently not being used in the codebase
export const UI = {
  // TIME: "⏱️", // UNUSED
  // LOCATION_PIN: "📍", // UNUSED
  // FIRST: "⏮️", // UNUSED
  // PREVIOUS: "◀️", // UNUSED
  // NEXT: "▶️", // UNUSED
  // LAST: "⏭️", // UNUSED
} as const;

// System & Admin
export const SYSTEM = {
  WARNING: "⚠️", // Used in modals
  SPARKLES: "✨", // Used in character-modals.ts for new character creation
  FORWARD: "⏩", // Used in deploy-commands for skipped commands
  SEARCH: "🔍", // Used in deploy-commands for loading commands
  INBOX: "📥", // Used in deploy-commands for fetching deployed commands
  PLUS: "➕", // Used in deploy-commands for new commands
  REFRESH: "🔄", // Used in deploy-commands for modified commands
  TRASH: "🗑️", // Used in deploy-commands for deleted commands
  CHART: "📊", // Used in deploy-commands for summary
  ROCKET: "🚀", // Used in deploy-commands for deployment
  BULB: "💡", // Used in deploy-commands for tips
} as const;

// Status & Feedback
export const STATUS = {
  SUCCESS: "✅", // Used in admin components
  ERROR: "❌", // Used extensively for error messages
  WARNING: "⚠️", // Used for high PA warnings
  INFO: "ℹ️", // Used in eat-more handlers
  STATS: "📊", // Used in chantier-creation.ts and project-creation.ts for displaying stats
} as const;

// Admin Actions
// UNUSED - All ADMIN constants are currently not being used in the codebase
export const ADMIN = {
  // SETTINGS: "⚙️", // UNUSED
  // INFO: "ℹ️", // UNUSED (use STATUS.INFO instead)
  // EDIT: "✍️", // UNUSED
  // ROCKET: "🚀", // UNUSED
  // EMERGENCY: "🚨", // UNUSED
} as const;

// Seasons
// UNUSED - All SEASON constants are currently not being used in the codebase
export const SEASON = {
  SUMMER: "☀️", // UNUSED
  WINTER: "❄️", // UNUSED
  // WEATHER: "🌤️", // UNUSED
} as const;

// Character Stats
export const CHARACTER = {
  HP_FULL: "❤️", // Used for HP display
  HP_EMPTY: "🖤", // Used for HP display
  HP_BANDAGED: "❤️‍🩹", // Used for special HP state
  MP_FULL: "💜", // Used for PM display
  MP_EMPTY: "🖤", // Used for PM display
  MP_DEPRESSION: "😶‍🌫️", // Used for PM depression state
  MP_DEPRESSED: "🥺", // Used for PM depressed state
  PA: "⚡", // Used for PA display
  PA_ALT: "🎯", // Used for PA display (alternative)
  PROFILE: "📋", // Used for profile header
  STATUS: "❗", // Used for status section
  // PERSON: "👤", // UNUSED
  GROUP: "👥", // UNUSED
  LINK: "🔗", // Used for linked skills display
} as const;

// Hunger Levels
export const HUNGER = {
  DEAD: "💀", // Used for dead character indicator
  AGONY: "😰", // Used in hunger display
  STARVATION: "😫", // Used in eat-more.handlers.ts and users.handlers.ts
  STARVING: " 😰", // Used for hunger level 1
  HUNGRY: " 😕", // Used for hunger level 2
  APPETITE: "🤤", // Used for hunger level 3
  FED: "😊", // Used for hunger level 4 (satiety)
  UNKNOWN: "❓", // Used for unknown hunger state
  ICON: "🍞", // Used for hunger section title
} as const;

// Actions
export const ACTIONS = {
  // EDIT: "✏️", // UNUSED
  // DELETE: "🗑️", // UNUSED
  // REFRESH: "🔄", // UNUSED
  ADD: "➕", // Used in character-admin.components.ts for adding capabilities/objects/skills
  REMOVE: "➖", // Used in character-admin.components.ts for removing capabilities/objects/skills
  // CANCEL: "❌", // UNUSED (use STATUS.ERROR instead)
  // CONFIRM: "✅", // UNUSED (use STATUS.SUCCESS instead)
} as const;

// Capabilities
export const CAPABILITIES = {
  HUNT: "🏹", // Used for hunting actions (seed: Chasser)
  GATHER: "🌿", // Used for gathering actions (seed: Cueillir)
  FISH: "🎣", // Used for fishing actions (seed: Pêcher)
  CHOPPING: "🪓", // Used for wood chopping actions (seed: Couper du bois)
  MINING: "⛏️", // Used for mining actions (seed: Miner)
  WEAVING: "🧵", // Used in project creation (hardcoded, needs refactor) (seed: Tisser)
  FORGING: "🔨", // Used in project creation (hardcoded, needs refactor) (seed: Forger)
  WOODWORKING: "🪚", // Used in project creation (hardcoded, needs refactor) (seed: Travailler le bois)
  COOKING: "🫕", // Used for cooking actions (seed: Cuisiner)
  HEALING: "⚕️", // Used for healing actions (seed: Soigner)
  RESEARCHING: "🔎", // Used for research actions (seed: Rechercher)
  CARTOGRAPHING: "🗺️", // Used for cartography actions (seed: Cartographier)
  AUGURING: "🌦️", // Used for auspice actions (seed: Auspice)
  ENTERTAIN: "🎭", // Used for entertainment actions (seed: Divertir)
  GENERIC: "💪", // Used for generic capability display
} as const;

// Expeditions
// NOTE: Expedition emojis are currently hardcoded in expedition files
// These constants should be used once hardcoded emojis are refactored
export const EXPEDITION = {
  PLANNING: "📝", // UNUSED (hardcoded in expedition-create.ts)
  LOCKED: "🔒", // UNUSED
  DEPARTED: "🚶‍♀️‍➡️", // UNUSED
  RETURNED: "🏘️", // UNUSED
  ICON: "🧭", // TODO: Should be used (currently hardcoded in expedition-display.ts:450)
  // CAMP: "🏕️", // UNUSED
  DURATION: "⌛", // 
  LOCATION: "📍", // 
} as const;

// Chantiers
export const CHANTIER = {
  PLAN: "📝", // Used for planning status
  IN_PROGRESS: "🚧", // Used for in-progress status (fixed from 🏗️)
  COMPLETED: "✅", // Used for completed status
  ICON: "🛖", // Used for chantier section header
  CELEBRATION: "🎉", // Used in chantiers.handlers.ts for completion celebration
} as const;

// Projects (Artisanat)
export const PROJECT = {
  ACTIVE: "🔧", // Used for active project status
  COMPLETED: "✅", // Used for completed project status
  ICON: "🛠️", // Used for project display
  CELEBRATION: "🎉", // Used in projects.handlers.ts for completion celebration
  UNKNOWN: "❓", // Used for unknown project status
} as const;

// Locations
export const LOCATION = {
  // CITY: "🏘️", // UNUSED
  // CITY_ALT: "🏘️", // UNUSED (duplicate)
  TOWN: "🏘️", // Used for stock display
  // EXPEDITION: "🏕️", // UNUSED (use EXPEDITION.CAMP instead)
} as const;

// Resources
export const RESOURCES = {
  GENERIC: "📦", // Used for generic resource display
  FOOD: "🌾", // Used in seed data for "Vivres"
  PREPARED_FOOD: "🥞", // Used in seed data for "Repas"
  // LIST: "📋", // UNUSED
  WOOD: "🪵", // Used in seed data for "Bois"
  MINERAL: "⚙️", // Used in seed data for "Minerai"
  CATAPLASM: "🩹", // Used in seed data for "Cataplasme"
  // METAL: "⚙️", // UNUSED (duplicate of MINERAL)
  FABRIC: "🧵", // Used in seed data for "Tissu"
  // PLANKS: "🪵", // UNUSED (duplicate of WOOD)
  HEAL: "🩸",
  OTHER_RESOURCES: "🪜",
} as const;

// Extended Resources
export const RESOURCES_EXTENDED = {
  // GENERIC: "📦", // UNUSED (duplicate of RESOURCES.GENERIC)
  // BREAD: "🍞", // UNUSED (duplicate of HUNGER.ICON)
  // FOOD: "🌾", // UNUSED (duplicate of RESOURCES.FOOD)
  FORK_KNIFE: "🍴", // Used for eat button
  BANDAGE: "🩹", // Used for cataplasm button
} as const;

// Config & UI
export const CONFIG = {
  SUCCESS: "✅", // Used for config success messages
  DISABLED: "🚫", // Used for disabled config options
  LIST: "📋", // Used for list options
  SUNRISE: "🌅", // Used for sunrise/morning config
} as const;

// Directions (for expeditions)
export const DIRECTION = {
  NORTH: "⬆️", // North direction
  NORTHEAST: "↗️", // Northeast direction
  EAST: "➡️", // East direction
  SOUTHEAST: "↘️", // Southeast direction
  SOUTH: "⬇️", // South direction
  SOUTHWEST: "↙️", // Southwest direction
  WEST: "⬅️", // West direction
  NORTHWEST: "↖️", // Northwest direction
  UNKNOWN: "❓", // Unknown direction
} as const;

/**
 * Returns a curated list of emojis that can be used for custom configurations
 * such as resources, capabilities, etc.
 * @returns Array of emoji strings
 */
export function getAvailableEmojiList(): string[] {
  return [
    // Nature & Plants
    "🌲", "🌳", "🌴", "🌾", "🌿", "🍀", "🌱", "🌵", "🌾", "🪴",
    "🌽", "🥕", "🧅", "🥔", "🍄", "🌰", "🫘", "🌶️",

    // Food & Cooking
    "🥞", "🍖", "🥩", "🍗", "🥓", "🧀", "🍞", "🥖", "🥐", "🫓",
    "🍲", "🥘", "🍱", "🍜", "🥗", "🫕", "🍴",

    // Materials & Resources
    "🪵", "⚙️", "🔩", "🔧", "🔨", "⚒️", "🛠️", "⛏️", "🪓", "🪚",
    "🧰", "🪛", "🔗", "⛓️", "💎", "💍", "🏺", "⚱️",

    // Medical & Healing
    "🩹", "💊", "🧪", "⚕️", "🏥", "💉", "🩺", "🧬",

    // Crafting & Textiles
    "🧵", "🪡", "🧶", "🪢", "👕", "🧥", "👗", "🥼",

    // Tools & Equipment
    "🏹", "🗡️", "🔪", "🪃", "🪤", "🎣", "🕸️", "🪝",

    // Containers & Storage
    "📦", "🎒", "👜", "💼", "🧳", "🗂️", "📋", "📚",

    // Colors & Shapes
    "🟠", "🟡", "🟢", "🔵", "🟣", "🟤", "⚫", "⚪",
    "🔴", "🟥", "🟧", "🟨", "🟩", "🟦", "🟪", "🟫", "⬛", "⬜",

    // Misc Objects
    "🫖", "🍶", "🧉", "🫗", "🪴", "🏮", "🪔", "🕯️",
    "🪙", "💰", "💸", "🧿", "📿", "🗝️", "🔑",
  ];
}
