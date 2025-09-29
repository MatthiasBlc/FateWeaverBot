import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../../types/command";
import { withUser } from "../../core/middleware/ensureUser";
import { handleEatCommand } from "../../features/hunger/hunger.handlers";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("manger")
    .setDescription("Permet à votre personnage de manger (consomme 1 vivre de la ville)"),

  execute: withUser(handleEatCommand),
};

export default command;
