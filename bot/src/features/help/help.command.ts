import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import type { Command } from "../../types/command";
import { handleHelpCommand } from "./help.handlers";

// Commande help avec sous-commandes
const helpCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Affiche la liste des commandes disponibles")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("user")
        .setDescription("Affiche les commandes utilisateur")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("admin")
        .setDescription("Affiche les commandes administrateur")
    ),

  execute: handleHelpCommand,
};

export default helpCommand;