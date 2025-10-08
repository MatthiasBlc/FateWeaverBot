import { createCustomEmbed, getStockColor } from "../../utils/embeds";
import {
  EmbedBuilder,
  type GuildMember,
} from "discord.js";
import { apiService } from "../../services/api";
import { logger } from "../../services/logger";
import { getActiveCharacterForUser } from "../../utils/character";
import { replyEphemeral, replyError } from "../../utils/interaction-helpers.js";
import { validateCharacterExists, validateCharacterAlive } from "../../utils/character-validation.js";

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
    // Récupérer le personnage actif de l'utilisateur
    let character;
    try {
      character = await getActiveCharacterForUser(interaction.user.id, interaction.guildId!);
      validateCharacterAlive(character);
    } catch (error: any) {
      if (error?.status === 404 || error?.message?.includes('Request failed with status code 404')) {
        await replyEphemeral(interaction, "❌ Aucun personnage vivant trouvé. Utilisez d'abord la commande `/start` pour créer un personnage.");
        return;
      }
      await replyEphemeral(interaction, error.message);
      return;
    }

    // Récupérer la ville du personnage (pas forcément celle du serveur)
    const townResponse = await apiService.towns.getTownById(character.townId);

    if (!townResponse) {
      await replyEphemeral(interaction, "❌ Ville de votre personnage introuvable.");
      return;
    }

    // Récupérer le stock de ressources de la ville du personnage
    const resourcesResponse = await apiService.getResources("CITY", character.townId);

    if (!resourcesResponse || !Array.isArray(resourcesResponse)) {
      await replyEphemeral(interaction, "❌ Impossible de récupérer le stock de ressources.");
      return;
    }

    const resources = resourcesResponse as ResourceStock[];

    // Trier les ressources par catégorie : nourriture/vivres d'abord, puis autres
    const sortedResources = [...resources].sort((a, b) => {
      const aName = a.resourceType.name.toLowerCase();
      const bName = b.resourceType.name.toLowerCase();

      // Nourriture et Vivres en premier
      const isAFood = aName.includes('nourriture') || aName.includes('vivres');
      const isBFood = bName.includes('nourriture') || bName.includes('vivres');

      if (isAFood && !isBFood) return -1;
      if (!isAFood && isBFood) return 1;

      // Sinon, ordre alphabétique
      return aName.localeCompare(bName);
    });

    // Créer l'embed d'information
    const totalStock = sortedResources.reduce((sum, resource) => sum + resource.quantity, 0);
    const embed = createCustomEmbed({
      color: getStockColor(totalStock),
      title: `🏙️ Stock de la Ville : ${townResponse.name}`,
      timestamp: true,
    });

    // Ajouter les ressources triées
    const resourceLines: string[] = [];

    for (const resource of sortedResources) {
      resourceLines.push(`${resource.resourceType.emoji} ${resource.resourceType.name} : ${resource.quantity}`);
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

    await replyEphemeral(interaction, errorMessage);
  }
}

