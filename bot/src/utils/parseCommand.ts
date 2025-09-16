import { logger } from "./logger.js";

export function parseCommand(
  content: string,
  prefix: string
): { name: string; args: string[] } | null {
  try {
    if (!content.startsWith(prefix)) {
      logger.debug("Le message ne commence pas par le préfixe: %s", prefix);
      return null;
    }

    const args = content.slice(prefix.length).trim().split(/\s+/);
    const name = args.shift()?.toLowerCase();

    if (!name) {
      logger.debug("Aucun nom de commande trouvé après le préfixe");
      return null;
    }

    logger.debug("Commande analysée - nom: %s, arguments: %O", name, args);
    return { name, args };
  } catch (error) {
    logger.error("Erreur lors de l'analyse de la commande: %O", error);
    return null;
  }
}
