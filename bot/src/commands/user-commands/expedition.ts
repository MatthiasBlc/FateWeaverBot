import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../../types/command";
import { withUser } from "../../core/middleware/ensureUserClean";
import {
  handleExpeditionMainCommand,
  handleExpeditionStartCommand,
  handleExpeditionJoinCommand,
  handleExpeditionInfoCommand
} from "@/features/expeditions/expedition.command";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("expedition")
    .setDescription("Gérer les expéditions - commande principale"),

  async execute(interaction: any) {
    await withUser(handleExpeditionMainCommand)(interaction);
  },
};

export default command;
