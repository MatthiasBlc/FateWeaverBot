/* eslint-disable @typescript-eslint/no-explicit-any */
import { logger } from "../../services/logger";
import { createHelpEmbed, generateDynamicHelpSections } from "./help.utils";
import { replyEphemeral } from "../../utils/interaction-helpers.js";
import { STATUS } from "../../constants/emojis.js";


export async function handleHelpCommand(interaction: any) {
  try {
    // Récupérer les commandes du client via l'interaction
    const client = interaction.client;
    const commands: any = client.commands;
    const sections = commands
      ? generateDynamicHelpSections(commands, false)
      : [];

    const embed = createHelpEmbed({
      title: "📚 Aide - Commandes utilisateur",
      description: "Voici la liste des commandes disponibles :",
      color: "#0099ff",
      sections: sections,
      username: interaction.user.username,
      avatarUrl: interaction.user.displayAvatarURL(),
    });

    await interaction.reply({
      embeds: [embed],
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Error in help command:", { error });

    if (interaction.replied || interaction.deferred) {
      await replyEphemeral(interaction, `${STATUS.ERROR} Une erreur est survenue lors de l'affichage de l'aide.`);
    } else {
      await replyEphemeral(interaction, `${STATUS.ERROR} Une erreur est survenue lors de l'affichage de l'aide.`);
    }
  }
}
