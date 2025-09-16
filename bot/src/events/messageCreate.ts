import { Events, Message, Client } from "discord.js";
import { config } from "../config/config.js";
import { logger } from "../utils/logger.js";
import { parseCommand } from "../utils/parseCommand.js";

export const event = {
  name: Events.MessageCreate,
  once: false,
  execute: async (client: Client, message: Message) => {
    try {
      // Vérifier si le message est valide
      if (!message || !message.content) {
        logger.debug("Message invalide reçu");
        return;
      }

      logger.debug(
        "Message reçu de %s: %s",
        message.author?.tag,
        message.content
      );

      // Ignorer les messages des bots
      if (message.author?.bot) return;

      // Vérifier le préfixe
      if (!message.content.startsWith(config.prefix)) return;

      logger.debug("Traitement de la commande: %s", message.content);

      // Parser la commande
      const command = parseCommand(message.content, config.prefix);
      if (!command) {
        logger.debug("Échec de l'analyse de la commande");
        return;
      }

      const { name, args } = command;
      logger.debug("Commande analysée - nom: '%s', arguments: %O", name, args);

      // Vérifier si la commande existe
      const cmd = client.commands?.get(name);
      if (!cmd) {
        logger.debug("Commande '%s' non trouvée", name);
        return;
      }

      // Exécuter la commande avec le client et les arguments
      logger.debug("Exécution de la commande: %s", name);
      await cmd.execute(client, message, args);
      logger.debug("Commande exécutée avec succès: %s", name);
    } catch (error) {
      logger.error("Erreur dans messageCreate: %O", error);
    }
  },
};

export default event;
