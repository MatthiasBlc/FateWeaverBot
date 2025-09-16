import { logger as baseLogger, formatObject } from "../utils/logger";

// Types pour les métadonnées des logs
type LogMetadata = Record<string, any>;

// Configuration des niveaux de log
export const LogLevel = {
  ERROR: "error",
  WARN: "warn",
  INFO: "info",
  HTTP: "http",
  DEBUG: "debug",
  VERBOSE: "verbose",
  EVENT: "event", // Niveau personnalisé pour les événements
} as const;

// Filtre pour éviter les logs verbeux
const filterVerboseLogs = winston.format((info) => {
  // Ignorer les logs trop verbeux
  if (
    info.message?.includes("Événement déclenché") ||
    info.message?.includes("Event triggered")
  ) {
    return false;
  }
  return info;
});

// Méthodes pratiques pour logger avec différents niveaux
const log = {
  // ... (contenu existant)

  // Log d'événement personnalisé (moins verbeux que debug)
  event: (eventName: string, meta?: LogMetadata) => {
    if (
      process.env.LOG_LEVEL === "debug" ||
      process.env.LOG_LEVEL === "event"
    ) {
      baseLogger.log("event", `[${eventName}]`, meta || {});
    }
  },

  // ... (reste du contenu existant)
};

export default log;
