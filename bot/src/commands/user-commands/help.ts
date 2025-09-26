import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import type { Command } from "../../types/command";
import { handleHelpCommand } from "../../features/help/help.handlers";

// Commande help pour afficher les commandes utilisateur
const helpCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Affiche la liste des commandes utilisateur disponibles"),

  execute: handleHelpCommand,
};

export default helpCommand;
