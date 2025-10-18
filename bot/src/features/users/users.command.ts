import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../../types/command";
import { withUser } from "../../core/middleware/ensureUserClean";
import { withCharacterCheck } from "../../core/middleware/ensureCharacter";
import { handleProfileCommand } from "./users.handlers";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("profil")
    .setDescription("Affiche votre profil et vos informations"),

  execute: withUser(withCharacterCheck(handleProfileCommand)),
};

export default command;
