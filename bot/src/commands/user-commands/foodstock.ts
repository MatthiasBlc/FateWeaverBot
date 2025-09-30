import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../../types/command";
import { withUser } from "../../core/middleware/ensureUserClean";
import { handleViewFoodStockCommand } from "../../features/foodstock/foodstock.handlers";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("foodstock")
    .setDescription("Voir le stock actuel de foodstock de la ville"),

  execute: withUser(handleViewFoodStockCommand),
};

export default command;
