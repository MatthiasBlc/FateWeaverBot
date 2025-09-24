import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, PermissionFlagsBits } from "discord.js";
import { api } from "../services/api";
import { checkAdmin } from "../utils/roles";

export const data = new SlashCommandBuilder()
  .setName("addch")
  .setDescription("Ajoute un nouveau chantier")
  .addStringOption((option) =>
    option.setName("nom").setDescription("Nom du chantier").setRequired(true)
  )
  .addIntegerOption((option) =>
    option
      .setName("cout")
      .setDescription("Coût total en PA")
      .setRequired(true)
      .setMinValue(1)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: CommandInteraction) {
  if (!interaction.guild) {
    return interaction.reply({
      content: "❌ Cette commande ne peut être utilisée que dans un serveur.",
      ephemeral: true,
    });
  }

  // Vérifier si l'utilisateur est admin
  const isAdmin = await checkAdmin(interaction);
  if (!isAdmin) return;

  const nom = interaction.options.getString("nom", true);
  const cout = interaction.options.getInteger("cout", true);

  try {
    await interaction.deferReply({ ephemeral: true });

    const response = await api.post("/chantiers", {
      name: nom,
      cost: cout,
      serverId: interaction.guild.id,
    });

    await interaction.editReply({
      content:
        `✅ Le chantier "${response.data.name}" a été créé avec succès !\n` +
        `Coût total : ${response.data.cost} PA\n` +
        `Statut : ${getStatusText(response.data.status)}`,
    });
  } catch (error: any) {
    console.error("Error creating chantier:", error);
    let errorMessage =
      "❌ Une erreur est survenue lors de la création du chantier.";

    if (error.response?.data?.error) {
      errorMessage += `\nErreur: ${error.response.data.error}`;
    }

    await interaction
      .editReply({
        content: errorMessage,
      })
      .catch(() => {
        // En cas d'erreur d'édition (par exemple si la réponse a déjà été envoyée)
        interaction
          .followUp({
            content: errorMessage,
            ephemeral: true,
          })
          .catch(console.error);
      });
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
