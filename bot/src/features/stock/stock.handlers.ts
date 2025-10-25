import { createCustomEmbed, getStockColor } from "../../utils/embeds";
import { apiService } from "../../services/api";
import { logger } from "../../services/logger";
import { getActiveCharacterForUser } from "../../utils/character";
import { replyEphemeral } from "../../utils/interaction-helpers.js";
import { validateCharacterAlive } from "../../utils/character-validation.js";
import { LOCATION, RESOURCES, STATUS, HUNGER } from "../../constants/emojis";
import { getResourceEmoji } from "../../services/emoji-cache";

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

    // Définir l'ordre des catégories avec leurs ressources
    const categories = [
      {
        name: 'Nourriture',
        icon: HUNGER.ICON,
        resources: ['Vivres', 'Repas']
      },
      {
        name: 'Matériaux',
        icon: RESOURCES.GENERIC,
        resources: ['Bois', 'Planches', 'Minerai', 'Métal', 'Tissu']
      },
      {
        name: 'Soin',
        icon: RESOURCES.CATAPLASM,
        resources: ['Cataplasme']
      }
    ];

    // Créer l'embed d'information
    const totalStock = resources.reduce((sum, resource) => sum + resource.quantity, 0);
    const embed = createCustomEmbed({
      color: getStockColor(totalStock),
      title: `${LOCATION.TOWN} Stock du village`,
      timestamp: true,
    });

    // Construire l'affichage avec catégories dynamiques
    const resourceLines: string[] = [];
    const categorizedNames = categories.flatMap(c => c.resources.map(r => r.toLowerCase()));

    // Traiter chaque catégorie
    for (const category of categories) {
      const categoryResources: ResourceStock[] = [];

      // Trouver les ressources de cette catégorie
      for (const resourceName of category.resources) {
        const found = resources.find(r =>
          r.resourceType.name.toLowerCase() === resourceName.toLowerCase()
        );
        if (found) {
          categoryResources.push(found);
        }
      }

      // Ajouter la catégorie seulement si elle a des ressources
      if (categoryResources.length > 0) {
        resourceLines.push(`**${category.name} ${category.icon}**`);

        for (const resource of categoryResources) {
          const emoji = await getResourceEmoji(resource.resourceType.name, resource.resourceType.emoji);
          resourceLines.push(`${emoji} ${resource.resourceType.name} : ${resource.quantity}`);
        }

        resourceLines.push(''); // Espacement après chaque catégorie
      }
    }

    // Ajouter les ressources non catégorisées (dans "Autres")
    const uncategorized = resources.filter(r =>
      !categorizedNames.includes(r.resourceType.name.toLowerCase())
    );

    if (uncategorized.length > 0) {
      resourceLines.push(`**Autres ${RESOURCES.GENERIC}**`);
      for (const resource of uncategorized) {
        const emoji = await getResourceEmoji(resource.resourceType.name, resource.resourceType.emoji);
        resourceLines.push(`${emoji} ${resource.resourceType.name} : ${resource.quantity}`);
      }
      resourceLines.push('');
    }

    // Nettoyer les lignes vides finales
    while (resourceLines.length > 0 && resourceLines[resourceLines.length - 1] === '') {
      resourceLines.pop();
    }

    if (resourceLines.length === 0) {
      embed.setDescription("Aucune ressource en stock");
    } else {
      embed.setDescription(resourceLines.join('\n'));
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

