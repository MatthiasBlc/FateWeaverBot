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
  handleChantiersCommand,
} from "./chantiers.handlers";

// Commande utilisateur (sans permissions admin)
const chantiersUserCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("chantiers")
    .setDescription("Affiche les chantiers et permet d'y participer"),

  execute: withUser(withCharacterCheck(async (interaction: ChatInputCommandInteraction) => {
    try {
      await handleChantiersCommand(interaction);
    } catch (error) {
      logger.error("Error in chantiers command:", { error });
      await interaction.reply({
        content: "Une erreur est survenue lors de l'exécution de la commande.",
        flags: ["Ephemeral"],
      });
    }
  })),
};

export default chantiersUserCommand;
