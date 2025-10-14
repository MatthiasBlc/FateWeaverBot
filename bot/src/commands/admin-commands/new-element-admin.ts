import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
} from "discord.js";
import type { Command } from "../../types/command";
import { logger } from "../../services/logger";
import { handleNewElementAdminCommand } from "../../features/admin/new-element-admin.handlers";

const newElementAdminCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("new-element-admin")
    .setDescription("⚙️ [ADMIN] Ajouter une nouvelle capacité ou ressource")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("capability")
        .setDescription("Ajouter une nouvelle capacité")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("Nom de la capacité")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("emoji_tag")
            .setDescription("Tag emoji (ex: HUNT, GATHER)")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("category")
            .setDescription("Catégorie de la capacité")
            .setRequired(true)
            .addChoices(
              { name: "Récolte (HARVEST)", value: "HARVEST" },
              { name: "Artisanat (CRAFT)", value: "CRAFT" },
              { name: "Science (SCIENCE)", value: "SCIENCE" },
              { name: "Spécial (SPECIAL)", value: "SPECIAL" }
            )
        )
        .addIntegerOption((option) =>
          option
            .setName("cost_pa")
            .setDescription("Coût en PA")
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(4)
        )
        .addStringOption((option) =>
          option
            .setName("description")
            .setDescription("Description de la capacité")
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("resource")
        .setDescription("Ajouter un nouveau type de ressource")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("Nom de la ressource")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("emoji")
            .setDescription("Emoji de la ressource (ex: 🌲)")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("category")
            .setDescription("Catégorie de la ressource")
            .setRequired(true)
            .addChoices(
              { name: "Base", value: "base" },
              { name: "Transformé", value: "transformé" },
              { name: "Science", value: "science" }
            )
        )
        .addStringOption((option) =>
          option
            .setName("description")
            .setDescription("Description de la ressource")
            .setRequired(false)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.isChatInputCommand()) return;

    try {
      await handleNewElementAdminCommand(interaction);
    } catch (error) {
      logger.error("Error in new-element-admin command:", { error });
      await interaction.reply({
        content: "Une erreur est survenue lors de l'exécution de la commande.",
        flags: ["Ephemeral"],
      });
    }
  },
};

export default newElementAdminCommand;
