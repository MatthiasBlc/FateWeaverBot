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
import { LOCATION, RESOURCES, STATUS } from "@shared/index.js";

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

      // Vérifier si le personnage est en expédition DEPARTED
      const activeExpeditions = await apiService.expeditions.getActiveExpeditionsForCharacter(character.id);
      const inDepartedExpedition = activeExpeditions?.some((exp: any) => exp.status === "DEPARTED");

      if (inDepartedExpedition) {
        await replyEphemeral(interaction, "❌ Vous êtes en expédition et ne pouvez pas voir les stocks de la ville. Utilisez `/expedition` pour voir vos ressources d'expédition.");
        return;
      }
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

    // Définir l'ordre des groupes de ressources (brut, transformation, science)
    const resourceOrder = [
      ['Vivres', 'Nourriture'],
      ['Bois', 'Planches'],
      ['Minerai', 'Métal'],
      ['Tissu'],
      ['Cataplasme'] // Science resources
    ];

    // Créer l'embed d'information
    const totalStock = resources.reduce((sum, resource) => sum + resource.quantity, 0);
    const embed = createCustomEmbed({
      color: getStockColor(totalStock),
      title: `${LOCATION.TOWN} Stock du Village : ${townResponse.name}`,
      timestamp: true,
    });

    // Construire l'affichage avec groupes et séparateurs
    const resourceLines: string[] = [];

    for (let i = 0; i < resourceOrder.length; i++) {
      const group = resourceOrder[i];
      const groupResources: ResourceStock[] = [];

      // Trouver les ressources de ce groupe
      for (const resourceName of group) {
        const found = resources.find(r =>
          r.resourceType.name.toLowerCase() === resourceName.toLowerCase()
        );
        if (found) {
          groupResources.push(found);
        }
      }

      // Ajouter les ressources trouvées
      for (const resource of groupResources) {
        resourceLines.push(`${resource.resourceType.emoji} ${resource.resourceType.name} : ${resource.quantity}`);
      }

      // Ajouter séparateur visuel entre groupes (sauf après le dernier)
      if (i < resourceOrder.length - 1 && groupResources.length > 0) {
        resourceLines.push(''); // Ligne vide pour espacement
      }
    }

    // Ajouter les ressources non catégorisées (au cas où)
    const categorizedNames = resourceOrder.flat().map(n => n.toLowerCase());
    const uncategorized = resources.filter(r =>
      !categorizedNames.includes(r.resourceType.name.toLowerCase())
    );

    if (uncategorized.length > 0) {
      if (resourceLines.length > 0) {
        resourceLines.push(''); // Séparateur avant non-catégorisées
      }
      for (const resource of uncategorized) {
        resourceLines.push(`${resource.resourceType.emoji} ${resource.resourceType.name} : ${resource.quantity}`);
      }
    }

    if (resourceLines.length === 0) {
      embed.addFields({
        name: `${RESOURCES.GENERIC} Ressources`,
        value: "Aucune ressource en stock",
        inline: false,
      });
    } else {
      embed.addFields({
        name: `${RESOURCES.GENERIC} Ressources`,
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
      `${STATUS.ERROR} Une erreur est survenue lors de la récupération du stock de ressources.`;

    if (error.response?.status === 404) {
      errorMessage =
        `${STATUS.ERROR} Aucune ville trouvée pour ce serveur. Contactez un administrateur.`;
    } else if (
      error.response?.status === 401 ||
      error.response?.status === 403
    ) {
      errorMessage = `${STATUS.ERROR} Problème d'autorisation. Contactez un administrateur.`;
    }

    await replyEphemeral(interaction, errorMessage);
  }
}

