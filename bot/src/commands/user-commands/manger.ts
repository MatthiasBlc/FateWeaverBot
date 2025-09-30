import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../../types/command.js";
import { withUser } from "../../core/middleware/ensureUserClean";
import { withCharacterCheck } from "../../core/middleware/ensureCharacter";
import { handleEatCommand } from "../../features/hunger/hunger.handlers";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("manger")
    .setDescription(
      "Permet à votre personnage de manger (consomme 1 vivre de la ville)"
    ),

  execute: withUser(withCharacterCheck(handleEatCommand)),
};

export default command;
