import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../types/command.js";
import { logger } from "../services/logger";

const command: Command = {
  // Configuration de la commande
  data: new SlashCommandBuilder()
    .setName("nom-de-la-commande")
    .setDescription("Description de la commande"),
  // Ajouter des options si nécessaire
  // .addStringOption(option =>
  //   option.setName('option')
  //     .setDescription('Description de l\'option')
  //     .setRequired(true)
  // ),
  // Ne pas appeler toJSON() ici, il sera appelé automatiquement lors du déploiement
  /**
   * Exécute la commande slash Discord
   * @param interaction - L'interaction de commande reçue de Discord
   * @returns Une promesse qui se résout lorsque l'exécution est terminée
   *
   * @example
   * ```typescript
   * // Exemple d'utilisation dans une commande simple
   * await interaction.reply({ content: 'Réponse de la commande' });
   *
   * // Pour une réponse éphémère (visible uniquement par l'utilisateur)
   * await interaction.reply({
   *   content: 'Réponse éphémère',
   *   ephemeral: true
   * });
   * ```
   */
  async execute(interaction) {
    try {
      // Récupérer les options si nécessaire
      // const option = interaction.options.getString('option');

      // Logique de la commande
      await interaction.reply({
        content: "Réponse de la commande",
        // ephemeral: true, // Décommentez pour une réponse visible uniquement par l'utilisateur
      });
    } catch (error) {
      logger.error("Error in command:", { error });

      // Répondre avec un message d'erreur
      const errorMessage =
        "❌ Une erreur est survenue lors de l'exécution de la commande.";

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: errorMessage,
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: errorMessage,
          ephemeral: true,
        });
      }
    }
  },
};

export default command;
