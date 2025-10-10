/**
 * Common error messages used across the application
 * Centralizes error strings to maintain consistency
 */

export const ERROR_MESSAGES = {
  // Guild/Server errors
  GUILD_ONLY: "Cette commande ne peut être utilisée que dans une guilde",
  TOWN_NOT_FOUND: "Aucune ville trouvée pour ce serveur",
  GUILD_NOT_FOUND: "Guilde non trouvée",

  // Character errors
  CHARACTER_NOT_FOUND: "Personnage non trouvé",
  NO_ACTIVE_CHARACTER: "Vous devez d'abord créer un personnage avec la commande `/profil`",
  CHARACTER_CREATION_REQUIRED: "Vous devez créer un personnage pour utiliser cette commande",

  // User errors
  USER_NOT_FOUND: "Utilisateur non trouvé",

  // Generic errors
  UNKNOWN_ERROR: "Une erreur inconnue est survenue",
  INTERACTION_FAILED: "Erreur lors du traitement de l'interaction",
} as const;
