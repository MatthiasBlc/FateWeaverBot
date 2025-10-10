import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../../types/command";
import { handleHelpCommand } from "./help.handlers";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Affiche la liste des commandes utilisateur disponibles"),

  execute: handleHelpCommand,
};

export default command;
