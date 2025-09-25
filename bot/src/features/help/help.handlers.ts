import { PermissionFlagsBits } from "discord.js";
import { logger } from "../../services/logger";
import { createHelpEmbed, getUserCommandsHelp, getAdminCommandsHelp } from "./help.utils";

export async function handleHelpCommand(interaction: any) {
  try {
    const embed = createHelpEmbed({
      title: "📚 Aide - Commandes utilisateur",
      description: "Voici la liste des commandes disponibles :",
      color: "#0099ff",
      sections: getUserCommandsHelp(),
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
      await interaction.followUp({
        content: "❌ Une erreur est survenue lors de l'affichage de l'aide.",
        flags: ["Ephemeral"],
      });
    } else {
      await interaction.reply({
        content: "❌ Une erreur est survenue lors de l'affichage de l'aide.",
        flags: ["Ephemeral"],
      });
    }
  }
}

export async function handleHelpAdminCommand(interaction: any) {
  try {
    // Vérifier si l'utilisateur a les permissions d'administrateur
    if (
      !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)
    ) {
      await interaction.reply({
        content:
          "❌ Vous n'avez pas la permission d'utiliser cette commande.",
        flags: ["Ephemeral"],
      });
      return;
    }

    const embed = createHelpEmbed({
      title: "🛠️ Aide - Commandes Administrateur",
      description: "Voici la liste des commandes réservées aux administrateurs :",
      color: "#ff0000",
      sections: getAdminCommandsHelp(),
      username: interaction.user.username,
      avatarUrl: interaction.user.displayAvatarURL(),
    });

    await interaction.reply({
      embeds: [embed],
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Error in helpadmin command:", { error });

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "❌ Une erreur est survenue lors de l'affichage de l'aide administrateur.",
        flags: ["Ephemeral"],
      });
    } else {
      await interaction.reply({
        content: "❌ Une erreur est survenue lors de l'affichage de l'aide administrateur.",
        flags: ["Ephemeral"],
      });
    }
  }
}