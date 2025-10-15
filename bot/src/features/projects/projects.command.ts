import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
} from "discord.js";
import type { Command } from "../../types/command";
import { logger } from "../../services/logger";
import { withUser } from "../../core/middleware/ensureUserClean";
import { withCharacterCheck } from "../../core/middleware/ensureCharacter";
import {
  handleProjectsCommand,
} from "./projects.handlers";

// Commande utilisateur (sans permissions admin)
const projectsUserCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("projets")
    .setDescription("🛠️ Voir et participer aux projets artisanaux"),

  execute: withUser(withCharacterCheck(async (interaction: ChatInputCommandInteraction) => {
    try {
      await handleProjectsCommand(interaction);
    } catch (error) {
      logger.error("Error in projets command:", { error });
      await interaction.reply({
        content: "Une erreur est survenue lors de l'exécution de la commande.",
        flags: ["Ephemeral"],
      });
    }
  })),
};

export default projectsUserCommand;
