import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration des logs
const LOG_DIR = path.join(__dirname, "../../logs");
const MAX_LOG_FILES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Créer le dossier de logs s'il n'existe pas
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Fonction pour gérer la rotation des fichiers de log
function rotateLogs() {
  try {
    const files = fs
      .readdirSync(LOG_DIR)
      .filter((file) => file.startsWith("bot-") && file.endsWith(".log"))
      .sort()
      .reverse();

    // Supprimer les fichiers les plus anciens si nécessaire
    while (files.length >= MAX_LOG_FILES) {
      const fileToDelete = files.pop();
      if (fileToDelete) {
        fs.unlinkSync(path.join(LOG_DIR, fileToDelete));
      }
    }

    // Renommer les fichiers existants (décalage +1)
    for (let i = files.length; i > 0; i--) {
      const oldFile = path.join(LOG_DIR, `bot-${i}.log`);
      const newFile = path.join(LOG_DIR, `bot-${i + 1}.log`);
      if (fs.existsSync(oldFile)) {
        fs.renameSync(oldFile, newFile);
      }
    }
  } catch (error) {
    console.error("Erreur lors de la rotation des logs:", error);
  }
}

// Créer un nouveau fichier de log avec la date actuelle
function getLogFilePath() {
  const date = new Date().toISOString().split("T")[0];
  return path.join(LOG_DIR, "bot-1.log");
}

// Vérifier la taille du fichier de log actuel
function checkLogFileSize() {
  try {
    const logFile = getLogFilePath();
    if (fs.existsSync(logFile)) {
      const stats = fs.statSync(logFile);
      if (stats.size > MAX_FILE_SIZE) {
        rotateLogs();
      }
    }
  } catch (error) {
    console.error(
      "Erreur lors de la vérification de la taille du fichier de log:",
      error
    );
  }
}

// Fonction utilitaire pour formater la date
function formatDate() {
  return new Date().toISOString();
}

// Fonction pour écrire dans le fichier de log
function writeToFile(level: string, ...args: unknown[]) {
  try {
    checkLogFileSize();
    const logFile = getLogFilePath();
    const message = `[${formatDate()}] [${level}] ${args.join(" ")}`;

    fs.appendFileSync(logFile, message + "\n", "utf8");
    console[level === "ERROR" ? "error" : level === "WARN" ? "warn" : "log"](
      message
    );
  } catch (error) {
    console.error("Erreur lors de l'écriture dans le fichier de log:", error);
  }
}

export const logger = {
  info: (...args: unknown[]) => writeToFile("INFO", ...args),
  warn: (...args: unknown[]) => writeToFile("WARN", ...args),
  error: (...args: unknown[]) => writeToFile("ERROR", ...args),
  debug: (...args: unknown[]) => {
    if (process.env.NODE_ENV === "development") {
      writeToFile("DEBUG", ...args);
    }
  },
};

// Initialisation du fichier de log au démarrage
writeToFile("INFO", "Démarrage du service de logs");
