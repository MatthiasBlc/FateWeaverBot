import {
  EmbedBuilder,
  type GuildMember,
} from "discord.js";
import { apiService } from "../../services/api";
import { logger } from "../../services/logger";
import { getActiveCharacterForUser } from "../../utils/character";

interface ResourceStock {
  id: number;
  locationType: string;
  locationId: string;
  resourceTypeId: number;
  quantity: number;
  resourceType: {
    id: number;
    name: string;
    emoji: string;
    category: string;
    description?: string;
  };
}

export async function handleViewStockCommand(interaction: any) {
  const member = interaction.member as GuildMember;
  const user = interaction.user;

  try {
    // Récupérer les informations de la ville
    const townResponse = await apiService.getTownByGuildId(
      interaction.guildId!
    );

    if (!townResponse) {
      await interaction.reply({
        content: "❌ Aucune ville trouvée pour ce serveur.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Récupérer le stock de ressources de la ville
    const resourcesResponse = await apiService.getResources("CITY", townResponse.id);

    if (!resourcesResponse || !Array.isArray(resourcesResponse)) {
      await interaction.reply({
        content: "❌ Impossible de récupérer le stock de ressources.",
        flags: ["Ephemeral"],
      });
      return;
    }

    const resources = resourcesResponse as ResourceStock[];

    // Récupérer le personnage de l'utilisateur pour des informations contextuelles
    let character = null;
    try {
      character = await getActiveCharacterForUser(interaction.user.id, interaction.guildId!);
    } catch (error) {
      // Pas grave si on ne peut pas récupérer le personnage
    }

    // Créer l'embed d'information
    const embed = new EmbedBuilder()
      .setColor(getStockColor(resources))
      .setTitle(`🏙️ Stock de la Ville : ${townResponse.name}`)
      .setDescription(`Stock actuel de toutes les ressources de la ville **${townResponse.name}**.`)
      .setTimestamp();

    // Ajouter les ressources au format demandé
    const resourceLines: string[] = [];
    let totalResources = 0;

    for (const resource of resources) {
      resourceLines.push(`${resource.resourceType.emoji} ${resource.resourceType.name} : ${resource.quantity}`);
      totalResources += resource.quantity;
    }

    if (resourceLines.length === 0) {
      embed.addFields({
        name: "📦 Ressources",
        value: "Aucune ressource en stock",
        inline: false,
      });
    } else {
      embed.addFields({
        name: "📦 Ressources",
        value: resourceLines.join('\n'),
        inline: false,
      });

      embed.addFields({
        name: "📊 Total",
        value: `${totalResources} ressources au total`,
        inline: true,
      });
    }

    // Ajouter des informations sur le personnage si disponible
    if (character) {
      embed.addFields({
        name: "👤 Votre Personnage",
        value: `**${character.name}** (Niveau ${character.hungerLevel}/4)`,
        inline: true,
      });
    }

    await interaction.reply({
      embeds: [embed],
      flags: ["Ephemeral"],
    });
  } catch (error: any) {
    logger.error("Erreur lors de la récupération du stock de ressources:", {
      guildId: interaction.guildId,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    let errorMessage =
      "❌ Une erreur est survenue lors de la récupération du stock de ressources.";

    if (error.response?.status === 404) {
      errorMessage =
        "❌ Aucune ville trouvée pour ce serveur. Contactez un administrateur.";
    } else if (
      error.response?.status === 401 ||
      error.response?.status === 403
    ) {
      errorMessage = "❌ Problème d'autorisation. Contactez un administrateur.";
    }

    await interaction.reply({
      content: errorMessage,
      flags: ["Ephemeral"],
    });
  }
}

function getStockColor(resources: ResourceStock[]): number {
  const totalQuantity = resources.reduce((sum, resource) => sum + resource.quantity, 0);

  if (totalQuantity > 200) return 0x00ff00; // Vert - stock élevé
  if (totalQuantity > 100) return 0xffff00; // Jaune - stock moyen
  if (totalQuantity > 50) return 0xffa500; // Orange - stock faible
  return 0xff0000; // Rouge - stock critique
}
