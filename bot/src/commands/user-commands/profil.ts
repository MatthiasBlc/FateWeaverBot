import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../../types/command";
import { withUser } from "../../core/middleware/ensureUser";
import { handleProfileCommand } from "../../features/users/users.handlers";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("profil")
    .setDescription("Affiche votre profil et vos informations"),

  execute: withUser(handleProfileCommand),
};

export default command;
