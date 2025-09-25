import {
  SlashCommandBuilder,
  type CommandInteraction,
  type ChatInputCommandInteraction,
  type MessageComponentInteraction,
  GuildMember,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} from "discord.js";
import { withUser } from "../middleware/ensureUser";
import { apiService } from "../services/api";

// Interface pour le type Chantier
interface Chantier {
  id: string;
  name: string;
  cost: number;
  status: string;
  serverId: string;
}

// Fonction utilitaire pour obtenir le texte du statut
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

// Fonction pour vérifier si l'utilisateur est admin
async function checkAdmin(interaction: CommandInteraction): Promise<boolean> {
  if (!(interaction.member instanceof GuildMember)) {
    await interaction.reply({
      content: "❌ Impossible de vérifier les permissions.",
      ephemeral: true,
    });
    return false;
  }

  if (!interaction.member.permissions.has("Administrator")) {
    await interaction.reply({
      content:
        "❌ Vous devez être administrateur pour utiliser cette commande.",
      ephemeral: true,
    });
    return false;
  }
  return true;
}

// Exporter la commande au format attendu
export default {
  data: new SlashCommandBuilder()
    .setName("delch")
    .setDescription("Supprime un chantier existant"),
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

    try {
      // Récupérer la liste des chantiers du serveur
      const chantiers = await apiService.getChantiersByServer(
        interaction.guild.id
      );

      if (chantiers.length === 0) {
        await interaction.reply({
          content: "❌ Aucun chantier trouvé sur ce serveur.",
          ephemeral: true,
        });
        return;
      }

      // Créer un menu déroulant avec les chantiers
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("deleteChantier")
        .setPlaceholder("Sélectionnez un chantier à supprimer")
        .addOptions(
          chantiers.map((chantier: Chantier) => ({
            label: chantier.name,
            description: `Coût: ${chantier.cost} PA | Statut: ${getStatusText(
              chantier.status
            )}`,
            value: chantier.id,
          }))
        );

      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        selectMenu
      );

      // Envoyer le message avec le menu déroulant
      const response = await interaction.reply({
        content: "Choisissez un chantier à supprimer :",
        components: [row],
        ephemeral: true,
      });

      // Attendre la sélection de l'utilisateur
      try {
        const collectorFilter = (i: MessageComponentInteraction) =>
          i.user.id === interaction.user.id;

        const confirmation = await response.awaitMessageComponent({
          filter: collectorFilter,
          time: 60_000, // 1 minute pour répondre
        });

        if (confirmation.isStringSelectMenu()) {
          const chantierId = confirmation.values[0];
          const chantier = chantiers.find((c: Chantier) => c.id === chantierId);

          if (!chantier) {
            await confirmation.update({
              content: "❌ Erreur: Chantier introuvable.",
              components: [],
            });
            return;
          }

          // Supprimer le chantier
          await apiService.deleteChantier(chantierId);

          await confirmation.update({
            content: `✅ Le chantier "${chantier.name}" a été supprimé avec succès.`,
            components: [],
          });
        }
      } catch (error) {
        console.error("Erreur lors de la sélection du chantier:", error);
        await interaction.editReply({
          content: "Temps écoulé ou erreur lors de la sélection.",
          components: [],
        });
      }
    } catch (error) {
      console.error("Erreur lors de la suppression du chantier :", error);
      let errorMessage =
        "❌ Une erreur est survenue lors de la suppression du chantier.";

      if (error && typeof error === "object" && "message" in error) {
        errorMessage += `\nErreur: ${(error as Error).message}`;
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
        console.error("Erreur lors de l'envoi du message d'erreur :", e);
      }
    }
  }),
};
