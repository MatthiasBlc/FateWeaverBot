import { logger } from "../../services/logger";
import { createHelpEmbed, generateDynamicHelpSections } from "./help.utils";

export async function handleHelpCommand(interaction: any) {
  try {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "admin") {
      // Récupérer les commandes du client via l'interaction
      const client = interaction.client;
      const sections = client.commands
        ? generateDynamicHelpSections(client.commands, true)
        : [];

      const embed = createHelpEmbed({
        title: "🛠️ Aide - Commandes Administrateur",
        description: "Voici la liste des commandes réservées aux administrateurs :",
        color: "#ff0000",
        sections: sections,
        username: interaction.user.username,
        avatarUrl: interaction.user.displayAvatarURL(),
      });

      await interaction.reply({
        embeds: [embed],
        flags: ["Ephemeral"],
      });
    } else {
      // Sous-commande "user" ou commande directe (par défaut)
      // Récupérer les commandes du client via l'interaction
      const client = interaction.client;
      const sections = client.commands
        ? generateDynamicHelpSections(client.commands, false)
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
    }
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