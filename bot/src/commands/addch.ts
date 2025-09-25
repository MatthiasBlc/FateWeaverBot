import {
  SlashCommandBuilder,
  type CommandInteraction,
  GuildMember,
  type ChatInputCommandInteraction,
} from "discord.js";
import type { Command } from "../types/command";
import { withUser } from "../middleware/ensureUser";
import { apiService } from "../services/api";
import { logger } from "../services/logger";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("addch")
    .setDescription("Ajoute un nouveau chantier")
    .addStringOption((option) =>
      option.setName("nom").setDescription("Nom du chantier").setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("cout")
        .setDescription("Coût total en points d'action")
        .setRequired(true)
        .setMinValue(1)
    ) as unknown as Command["data"],

  execute: withUser(async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guild) {
      await interaction.reply({
        content: "❌ Cette commande ne peut être utilisée que dans un serveur.",
        ephemeral: true,
      });
      return;
    }

    // Vérifier si l'utilisateur est admin
    const isUserAdmin = await checkAdmin(interaction);
    if (!isUserAdmin) return;

    // Utiliser les méthodes getString et getInteger pour accéder aux options
    const nom = interaction.options.getString("nom", true);
    const cout = interaction.options.getInteger("cout", true);

    try {
      await interaction.deferReply({ ephemeral: true });

      const response = await apiService.createChantier(
        {
          name: nom,
          cost: cout,
          serverId: interaction.guild.id,
        },
        interaction.user.id
      );

      await interaction.editReply({
        content:
          `✅ Le chantier "${response.name}" a été créé avec succès !\n` +
          `Coût total : ${response.cost} PA\n` +
          `Statut : ${getStatusText(response.status)}`,
      });
    } catch (error: unknown) {
      logger.error("Erreur lors de la création du chantier :", { error });
      let errorMessage =
        "❌ Une erreur est survenue lors de la création du chantier.";

      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: { data?: { error?: string } };
        };
        if (axiosError.response?.data?.error) {
          errorMessage += `\nErreur: ${axiosError.response.data.error}`;
        }
      }

      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.editReply({
            content: errorMessage,
          });
        } else {
          await interaction.reply({
            content: errorMessage,
            ephemeral: true,
          });
        }
      } catch (e) {
        logger.error("Erreur lors de l'envoi du message d'erreur :", {
          error: e,
        });
      }
    }
  }),
};

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

async function checkAdmin(interaction: CommandInteraction): Promise<boolean> {
  if (!interaction.guild || !(interaction.member instanceof GuildMember)) {
    return false;
  }

  // Vérifier si l'utilisateur a le rôle admin
  const hasAdminRole = interaction.member.roles.cache.some(
    (role) => role.id === process.env.ADMIN_ROLE
  );

  // Vérifier si l'utilisateur est propriétaire du serveur
  const isOwner = interaction.guild.ownerId === interaction.user.id;

  if (!hasAdminRole && !isOwner) {
    try {
      await interaction.reply({
        content: "❌ Seuls les administrateurs peuvent effectuer cette action.",
        ephemeral: true,
      });
    } catch (e) {
      logger.error("Erreur lors de l'envoi du message d'erreur :", {
        error: e,
      });
    }
    return false;
  }

  return true;
}

export default command;
