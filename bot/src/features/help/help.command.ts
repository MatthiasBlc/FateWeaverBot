import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import type { Command } from "../../types/command";
import { handleHelpCommand, handleHelpAdminCommand } from "./help.handlers";

// Commande help pour les utilisateurs
const helpCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Affiche la liste des commandes utilisateur disponibles"),

  execute: handleHelpCommand,
};

// Commande helpadmin pour les administrateurs
const helpAdminCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("helpadmin")
    .setDescription("Affiche la liste des commandes réservées aux administrateurs")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),

  execute: handleHelpAdminCommand,
};

export default helpCommand;
export { helpAdminCommand };