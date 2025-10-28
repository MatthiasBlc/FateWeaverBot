import { ChatInputCommandInteraction } from "discord.js";
import { getActiveCharacterFromCommand } from "../../utils/character";
import { logger } from "../../services/logger";

/**
 * Middleware qui garantit qu'une commande utilisateur utilise exclusivement le personnage actif
 * @param handler Le handler de commande à envelopper
 * @returns Un handler qui récupère automatiquement le personnage actif
 */
export function withActiveCharacter(
  handler: (interaction: ChatInputCommandInteraction, character: unknown) => Promise<void>
) {
  return async (interaction: ChatInputCommandInteraction) => {
    try {
      // Récupérer le personnage actif de l'utilisateur
      const character = await getActiveCharacterFromCommand(interaction);

      // Ajouter le personnage à l'interaction pour qu'il soit accessible dans le handler
      (interaction as { activeCharacter?: unknown }).activeCharacter = character;

      // Appeler le handler avec le personnage actif
      return await handler(interaction, character);
    } catch (error) {
      logger.error("Erreur dans le middleware withActiveCharacter:", {
        error: error instanceof Error ? error.message : error,
        userId: interaction.user.id,
        guildId: interaction.guildId,
      });

      // Répondre avec l'erreur si elle n'a pas déjà été gérée
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: error instanceof Error ? error.message : "Une erreur inconnue est survenue.",
          flags: ["Ephemeral"],
        });
      }
      throw error;
    }
  };
}
