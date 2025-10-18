/**
 * Centralized emoji constants shared between bot and backend
 * Single source of truth for all emojis used across the application
 */

// UI Elements
export const UI = {
  TIME: "⏱️",
  LOCATION_PIN: "📍",
  FIRST: "⏮️",
  PREVIOUS: "◀️",
  NEXT: "▶️",
  LAST: "⏭️",
} as const;

// System & Admin
export const SYSTEM = {
  WARNING: "⚠️",
  DELETE: "🗑️",
  STATS: "📊",
  TARGET: "🎯",
  SPARKLES: "✨",
} as const;

// Status & Feedback
export const STATUS = {
  SUCCESS: "✅",
  ERROR: "❌",
  WARNING: "⚠️",
  INFO: "ℹ️",
  STATS: "📊",
} as const;

// Admin Actions
export const ADMIN = {
  SETTINGS: "⚙️",
  INFO: "ℹ️",
  EDIT: "✍️",
  ROCKET: "🚀",
  EMERGENCY: "🚨",
} as const;

// Seasons
export const SEASON = {
  SUMMER: "☀️",
  WINTER: "❄️",
  WEATHER: "🌤️",
} as const;

// Character Stats
export const CHARACTER = {
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
  PERSON: "👤",
  GROUP: "👥",
  LINK: "🔗",
} as const;

// Hunger Levels
export const HUNGER = {
  DEAD: "💀",
  AGONY: "😰",
  STARVATION: "😫",
  STARVING: " 😰",
  HUNGRY: " 😕",
  APPETITE: "🤤",
  FED: "😊",
  UNKNOWN: "❓",
  ICON: "🍞",
} as const;

// Actions
export const ACTIONS = {
  EDIT: "✏️",
  DELETE: "🗑️",
  REFRESH: "🔄",
  ADD: "➕",
  REMOVE: "➖",
  CANCEL: "❌",
  CONFIRM: "✅",
} as const;

// Capabilities
export const CAPABILITIES = {
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
  GENERIC: "💪",
} as const;

// Expeditions
export const EXPEDITION = {
  PLANNING: "📝",
  LOCKED: "🔒",
  DEPARTED: "🚶‍♀️‍➡️",
  RETURNED: "🏘️",
  ICON: "🧭",
  CAMP: "🏕️",
} as const;

// Chantiers
export const CHANTIER = {
  PLAN: "📝",
  IN_PROGRESS: "🏗️",
  COMPLETED: "✅",
  ICON: "🛖",
  CELEBRATION: "🎉",
} as const;

// Projects (Artisanat)
export const PROJECT = {
  ACTIVE: "🔧",
  COMPLETED: "✅",
  ICON: "🛠️",
  CELEBRATION: "🎉",
} as const;

// Locations
export const LOCATION = {
  CITY: "🏘️",
  CITY_ALT: "🏘️",
  TOWN: "🏘️",
  EXPEDITION: "🏕️",
} as const;

// Resources
export const RESOURCES = {
  GENERIC: "📦",
  FOOD: "🌾",
  PREPARED_FOOD: "🥞",
  LIST: "📋",
  WOOD: "🪵",
  MINERAL: "⚙️",
  CATAPLASM: "🩹",
  METAL: "⚙️",
  FABRIC: "🧵",
  PLANKS: "🪵",
} as const;

// Extended Resources
export const RESOURCES_EXTENDED = {
  GENERIC: "📦",
  BREAD: "🍞",
  FOOD: "🌾",
  FORK_KNIFE: "🍴",
  BANDAGE: "🩹",
} as const;
