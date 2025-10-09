/**
 * Centralized emoji constants for Discord bot
 * Single source of truth for all emojis used across the application
 */

// Status & Feedback
export const STATUS = {
  SUCCESS: '✅',
  ERROR: '❌',
  WARNING: '⚠️',
  INFO: 'ℹ️',
  STATS: '📊',
} as const;

// Character Stats
export const CHARACTER = {
  HP_FULL: '❤️',
  HP_EMPTY: '🖤',
  HP_BANDAGED: '❤️‍🩹',
  MP_FULL: '💜',
  MP_EMPTY: '🖤',
  MP_DEPRESSION: '🌧️',
  MP_DEPRESSED: '😔',
  PA: '⚡',
  PA_ALT: '🎯',
  PROFILE: '📋',
  PERSON: '👤',
  GROUP: '👥',
} as const;

// Hunger Levels
export const HUNGER = {
  DEAD: '💀',
  AGONY: '😰',
  STARVING: '😕',
  HUNGRY: '🤤',
  FED: '😊',
  UNKNOWN: '❓',
  ICON: '🍖',
} as const;

// Actions
export const ACTIONS = {
  EDIT: '✏️',
  DELETE: '🗑️',
  REFRESH: '🔄',
  ADD: '➕',
  REMOVE: '➖',
  CANCEL: '❌',
  CONFIRM: '✅',
} as const;

// Capabilities
export const CAPABILITIES = {
  HUNT: '🏹',
  GATHER: '🌿',
  FISH: '🎣',
  ENTERTAIN: '🎭',
  GENERIC: '🔮',
} as const;

// Expeditions
export const EXPEDITION = {
  PLANNING: '🔄',
  LOCKED: '🔒',
  DEPARTED: '✈️',
  RETURNED: '🏠',
  ICON: '🚀',
  CAMP: '🏕️',
} as const;

// Chantiers
export const CHANTIER = {
  PLAN: '📝',
  IN_PROGRESS: '🚧',
  COMPLETED: '✅',
  ICON: '🏗️',
  CELEBRATION: '🎉',
} as const;

// Locations
export const LOCATION = {
  CITY: '🏛️',
  CITY_ALT: '🏙️',
  CAMP: '⛺',
} as const;

// Resources
export const RESOURCES = {
  GENERIC: '📦',
  FOOD: '🍞',
  PREPARED_FOOD: '🍖',
  LIST: '📋',
} as const;

// UI Elements
export const UI = {
  TIME: '⏱️',
  LOCATION_PIN: '📍',
  FIRST: '⏮️',
  PREVIOUS: '◀️',
  NEXT: '▶️',
  LAST: '⏭️',
} as const;
