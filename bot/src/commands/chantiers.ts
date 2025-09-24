import {
  SlashCommandBuilder,
  EmbedBuilder,
  type GuildMember,
  time,
  TimestampStyles,
} from "discord.js";
import type { Command } from "../types/command";
import { withUser } from "../middleware/ensureUser";
import { apiService } from "../services/api";
export const data = new SlashCommandBuilder()
  .setName("chantiers")
  .setDescription("Affiche la liste des chantiers du serveur");

export async function execute(interaction: CommandInteraction) {
  if (!interaction.guild) {
    return interaction.reply({
      content: "❌ Cette commande ne peut être utilisée que dans un serveur.",
      ephemeral: true,
    });
  }

  try {
    await interaction.deferReply();

    const response = await api.get(`/chantiers/server/${interaction.guild.id}`);
    const chantiers = response.data;

    if (chantiers.length === 0) {
      return interaction.editReply({
        content: "Aucun chantier n'a encore été créé sur ce serveur.",
      });
    }

    // Grouper les chantiers par statut
    const chantiersParStatut = chantiers.reduce((acc: any, chantier: any) => {
      if (!acc[chantier.status]) {
        acc[chantier.status] = [];
      }
      acc[chantier.status].push(chantier);
      return acc;
    }, {});

    const embed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle("📋 Liste des chantiers")
      .setTimestamp()
      .setFooter({
        text: `Demandé par ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL(),
      });

    // Ajouter une section pour chaque statut
    for (const [statut, listeChantiers] of Object.entries(chantiersParStatut)) {
      const chantiersText = (listeChantiers as any[])
        .map(
          (chantier) =>
            `**${chantier.name}** - ${chantier.spendOnIt}/${chantier.cost} PA`
        )
        .join("\n");

      embed.addFields({
        name: `🛠️ ${getStatusEmoji(statut)} ${getStatusText(statut)}`,
        value: chantiersText || "Aucun chantier",
        inline: false,
      });
    }

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("Error fetching chantiers:", error);
    await interaction
      .editReply({
        content:
          "❌ Une erreur est survenue lors de la récupération des chantiers.",
      })
      .catch(console.error);
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case "PLAN":
      return "En planification";
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
