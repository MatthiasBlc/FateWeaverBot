import {
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
} from "discord.js";

export type Command = {
  data:
    | SlashCommandBuilder
    | SlashCommandSubcommandsOnlyBuilder
    | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">
    | ReturnType<SlashCommandBuilder["toJSON"]>;
  execute(interaction: ChatInputCommandInteraction): Promise<void>;
  // Ajoutez cette ligne si vous prévoyez d'utiliser l'autocomplétion
  // autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
};
