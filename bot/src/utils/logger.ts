import winston from "winston";
import path from "node:path";
import fs from "node:fs";
import util from "node:util";

// Utiliser un chemin absolu pour les logs
const logsDir = "/app/logs";
const logFile = path.join(logsDir, "bot.log");
const maxLogSize = 5 * 1024 * 1024; // 5MB
const maxLogFiles = 5;

// Configuration des niveaux de log personnalisés
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  event: 4, // Niveau personnalisé pour les événements
  debug: 5,
};

// Configuration des couleurs
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  event: "cyan", // Couleur pour les logs d'événements
  debug: "blue",
};

winston.addColors(colors);

// Créer le dossier logs s'il n'existe pas
if (!fs.existsSync(logsDir)) {
  try {
    fs.mkdirSync(logsDir, { recursive: true, mode: 0o777 });
  } catch (error) {
    console.error(`Impossible de créer le dossier de logs: ${error}`);
  }
}

// Formateur personnalisé pour la console
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) =>
      `${info.timestamp} [${info.level}]: ${info.message} ${
        info[Symbol.for("splat")]
          ? util.format("", ...info[Symbol.for("splat")])
          : ""
      }`
  )
);

// Formateur pour les fichiers (JSON structuré)
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

// Configuration des transports
const transports: winston.transport[] = [
  // Transport pour la console
  new winston.transports.Console({
    format: consoleFormat,
    level: process.env.LOG_LEVEL || "info",
  }),
  // Transport pour le fichier de log
  new winston.transports.File({
    filename: logFile,
    format: fileFormat,
    level: "debug", // On garde tout en debug dans le fichier
    maxsize: maxLogSize,
    maxFiles: maxLogFiles,
    tailable: true,
  }),
];

// Créer le logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  levels,
  format: winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  transports,
  exitOnError: false,
});

// Fonction de rotation des logs
function rotateLogs() {
  try {
    if (fs.existsSync(logFile)) {
      const stats = fs.statSync(logFile);
      if (stats.size >= maxLogSize) {
        const oldestLog = path.join(logsDir, `bot-${maxLogFiles}.log`);
        if (fs.existsSync(oldestLog)) {
          fs.unlinkSync(oldestLog);
        }

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
    logger.error(`Erreur lors de la rotation des logs: ${error}`);
  }
}

// Planifier la rotation des logs toutes les heures
setInterval(rotateLogs, 3600000);

// Rotation initiale
rotateLogs();

// Log le démarrage du logger
logger.info("Logger initialisé avec succès dans /app/logs");

export { logger };
