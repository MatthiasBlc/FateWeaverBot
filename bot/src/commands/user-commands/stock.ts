import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../../types/command";
import { withUser } from "../../core/middleware/ensureUserClean";
import { handleViewStockCommand } from "../../features/stock/stock.handlers";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("stock")
    .setDescription("Voir le stock actuel de toutes les ressources de la ville"),

  execute: withUser(handleViewStockCommand),
};

export default command;
