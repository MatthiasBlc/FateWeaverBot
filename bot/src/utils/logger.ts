import winston from "winston";
import path from "node:path";
import fs from "node:fs";

// Utiliser un chemin absolu pour les logs
const logsDir = "/app/logs";
const logFile = path.join(logsDir, "bot.log");
const maxLogSize = 5 * 1024 * 1024; // 5MB
const maxLogFiles = 5;

// Créer le dossier logs s'il n'existe pas
if (!fs.existsSync(logsDir)) {
  try {
    fs.mkdirSync(logsDir, { recursive: true, mode: 0o777 });
  } catch (error) {
    console.error(`Impossible de créer le dossier de logs: ${error}`);
  }
}

/**
 * Rotation des fichiers de log
 */
function rotateLogs() {
  try {
    if (fs.existsSync(logFile)) {
      const stats = fs.statSync(logFile);
      if (stats.size >= maxLogSize) {
        // Supprimer le plus ancien fichier de log s'il existe
        const oldestLog = path.join(logsDir, `bot-${maxLogFiles}.log`);
        if (fs.existsSync(oldestLog)) {
          fs.unlinkSync(oldestLog);
        }

        // Renommer les fichiers existants (bot.log -> bot-1.log, etc.)
        for (let i = maxLogFiles - 1; i >= 1; i--) {
          const oldPath =
            i === 1 ? logFile : path.join(logsDir, `bot-${i - 1}.log`);
          const newPath = path.join(logsDir, `bot-${i}.log`);

          if (fs.existsSync(oldPath)) {
            if (fs.existsSync(newPath)) {
              fs.unlinkSync(newPath);
            }
            fs.renameSync(oldPath, newPath);
          }
        }
      }
    }
  } catch (error) {
    console.error(`Erreur lors de la rotation des logs: ${error}`);
  }
}

// Configuration des transports
const transports: winston.transport[] = [
  // Transport pour la console avec mise en forme colorée
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      winston.format.printf(
        ({ level, message, timestamp }) => `${timestamp} [${level}]: ${message}`
      )
    ),
  }),
  // Transport pour le fichier de log
  new winston.transports.File({
    filename: logFile,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    options: { flags: "a" }, // Pour s'assurer que les logs sont ajoutés au fichier
  }),
];

// Créer le logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "debug",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  transports,
  exitOnError: false,
});

// Rotation des logs au démarrage
rotateLogs();

// Vérifier périodiquement la taille du fichier de log
setInterval(rotateLogs, 3600000); // Toutes les heures

// Log le démarrage du logger
logger.info("Logger initialisé avec succès dans /app/logs");

export { logger };
