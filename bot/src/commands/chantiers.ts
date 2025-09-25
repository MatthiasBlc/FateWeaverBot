import {
  SlashCommandBuilder,
  EmbedBuilder,
  type CommandInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import type { Command } from "../types/command";
import { withUser } from "../middleware/ensureUser";
import { apiService } from "../services/api";

interface Chantiers {
  id: string;
  name: string;
  cost: number;
  spendOnIt: number;
  status: "PLAN" | "IN_PROGRESS" | "COMPLETED";
  serverId: string;
  createdBy: string;
  startDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("chantiers")
    .setDescription("Gère les chantiers du serveur")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("liste")
        .setDescription("Affiche la liste des chantiers")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("investir")
        .setDescription("Investir des points dans un chantier")
    ),

  async execute(interaction: CommandInteraction) {
    if (!interaction.isChatInputCommand()) return;

    const subcommand = interaction.options.getSubcommand();

    try {
      if (subcommand === "liste") {
        await handleListCommand(interaction);
      } else if (subcommand === "investir") {
        await handleInvestCommand(interaction);
      }
    } catch (error) {
      console.error("Error in chantiers command:", error);
      await interaction.reply({
        content: "Une erreur est survenue lors de l'exécution de la commande.",
        ephemeral: true,
      });
    }
  },
};

async function handleListCommand(interaction: CommandInteraction) {
  try {
    const chantiers: Chantiers[] = await apiService.getChantiersByServer(
      interaction.guildId!
    );

    if (chantiers.length === 0) {
      return interaction.reply({
        content: "Aucun chantier n'a encore été créé sur ce serveur.",
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle("🏗️ Liste des chantiers")
      .setDescription("Voici la liste des chantiers en cours sur ce serveur :");

    // Grouper les chantiers par statut
    const chantiersParStatut = chantiers.reduce<Record<string, Chantiers[]>>(
      (acc, chantiers) => {
        if (!acc[chantiers.status]) {
          acc[chantiers.status] = [];
        }
        acc[chantiers.status].push(chantiers);
        return acc;
      },
      {}
    );

    // Ajouter une section pour chaque statut
    for (const [statut, listeChantiers] of Object.entries(chantiersParStatut)) {
      const chantiersText = listeChantiers
        .map(
          (chantiers) =>
            `**${chantiers.name}** - ${chantiers.spendOnIt}/${chantiers.cost} PA`
        )
        .join("\n");

      embed.addFields({
        name: `${getStatusEmoji(statut)} ${getStatusText(statut)}`,
        value: chantiersText || "Aucun chantier dans cette catégorie",
        inline: false,
      });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (error) {
    console.error("Erreur lors de la récupération des chantiers :", error);
    await interaction.reply({
      content: "Une erreur est survenue lors de la récupération des chantiers.",
      ephemeral: true,
    });
  }
}

async function handleInvestCommand(interaction: CommandInteraction) {
  try {
    // Récupérer les chantiers du serveur
    const response = await apiService.getChantiersByServer(
      interaction.guildId!
    );
    const chantiers: Chantiers[] = response.data.filter(
      (c: Chantiers) => c.status !== "COMPLETED"
    );

    if (chantiers.length === 0) {
      return interaction.reply({
        content: "Aucun chantier n'est disponible pour l'instant.",
        ephemeral: true,
      });
    }

    // Créer un menu de sélection
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("select_chantier")
      .setPlaceholder("Sélectionnez un chantier")
      .addOptions(
        chantiers.map((chantier) => ({
          label: chantier.name,
          description: `${chantier.spendOnIt}/${
            chantier.cost
          } PA - ${getStatusText(chantier.status)}`,
          value: chantier.id,
        }))
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      selectMenu
    );

    await interaction.reply({
      content: "Choisissez un chantier dans lequel investir :",
      components: [row],
      ephemeral: true,
    });
  } catch (error) {
    console.error("Erreur lors de la préparation de l'investissement :", error);
    await interaction.reply({
      content:
        "Une erreur est survenue lors de la préparation de l'investissement.",
      ephemeral: true,
    });
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case "PLAN":
      return "En projet";
    case "IN_PROGRESS":
      return "En cours de construction";
    case "COMPLETED":
      return "Terminé";
    default:
      return status;
  }
}

function getStatusEmoji(status: string): string {
  switch (status) {
    case "PLAN":
      return "📝";
    case "IN_PROGRESS":
      return "🚧";
    case "COMPLETED":
      return "✅";
    default:
      return "❓";
  }
}

export default command;
