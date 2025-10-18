import {
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
  SlashCommandOptionsOnlyBuilder,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
} from "discord.js";

export type Command = {
  data:
    | SlashCommandBuilder
    | SlashCommandSubcommandsOnlyBuilder
    | SlashCommandOptionsOnlyBuilder
    | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">
    | ReturnType<SlashCommandBuilder["toJSON"]>;
  execute(interaction: ChatInputCommandInteraction): Promise<void>;
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
  useCapacity?: (interaction: ChatInputCommandInteraction, character: any, capacityName: string) => Promise<void>;
  showCapacityMenu?: (interaction: ChatInputCommandInteraction, characterId: string) => Promise<void>;
};
