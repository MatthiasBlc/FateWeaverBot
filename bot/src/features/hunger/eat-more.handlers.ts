import { HUNGER, RESOURCES, STATUS } from "../../constants/emojis";
import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type ButtonInteraction,
} from "discord.js";
import { apiService } from "../../services/api";
import { logger } from "../../services/logger";
import { getActiveCharacterForUser } from "../../utils/character";
import { createCustomEmbed, getHungerColor } from "../../utils/embeds";
import { replyEphemeral, replyError } from "../../utils/interaction-helpers.js";

/**
 * Handler pour le bouton "Manger +" qui affiche un menu avancé de gestion de la faim
 */
export async function handleEatMoreButton(interaction: ButtonInteraction) {
  try {
    // Extract characterId from customId: eat_more:{characterId}
    const characterId = interaction.customId.split(":")[1];

    // Récupérer le personnage
    const character = await getActiveCharacterForUser(
      interaction.user.id,
      interaction.guildId!
    );

    if (!character || character.id !== characterId) {
      await replyEphemeral(
        interaction,
        `${STATUS.ERROR} Personnage non trouvé ou invalide.`
      );
      return;
    }

    // Vérifier que le personnage est vivant et a faim
    if (character.hungerLevel === 0) {
      await replyEphemeral(
        interaction,
        `${STATUS.ERROR} Votre personnage est mort. Impossible de manger.`
      );
      return;
    }

    if (character.hungerLevel >= 4) {
      await replyEphemeral(
        interaction,
        `${STATUS.INFO} Vous n'avez pas faim ! (${character.hungerLevel}/4)`
      );
      return;
    }

    // Déterminer la localisation (ville ou expédition) et récupérer les stocks
    let locationType = "CITY";
    let locationId = character.townId;

    // Vérifier si le personnage est en expédition DEPARTED
    try {
      const expeditions = await apiService.expeditions.getExpeditionsByTown(
        character.townId
      );

      const activeExpedition = expeditions.find(
        (exp: any) =>
          exp.status === "DEPARTED" &&
          exp.members?.some((m: any) => m.characterId === character.id)
      );

      if (activeExpedition) {
        locationType = "EXPEDITION";
        locationId = activeExpedition.id;
      }
    } catch (error) {
      logger.error("Erreur lors de la vérification des expéditions:", error);
      // Continue avec la ville par défaut
    }

    // Récupérer les stocks de la localisation
    const resources = await apiService.getResources(locationType, locationId);

    const vivresStock =
      resources.find((r: any) => r.resourceType.name === "Vivres")?.quantity ||
      0;
    const nourritureStock =
      resources.find((r: any) => r.resourceType.name === "Repas")
        ?.quantity || 0;

    // Calculer les besoins
    const hungerNeed = 4 - character.hungerLevel;

    // Créer l'embed informatif
    const embed = createCustomEmbed({
      color: getHungerColor(character.hungerLevel),
      title: `${HUNGER.ICON} Menu de Gestion de la Faim`,
      description: `**État actuel**: ${getHungerEmoji(character.hungerLevel)} ${character.hungerLevel}/4\n**Besoin**: ${hungerNeed} point(s) de faim`,
      timestamp: true,
    });

    embed.addFields(
      {
        name: `📦 Stocks disponibles (${locationType === "CITY" ? "Ville" : "Expédition"})`,
        value: `${RESOURCES.FOOD} Vivres : ${vivresStock}\n${RESOURCES.PREPARED_FOOD} Repas : ${nourritureStock}`,
        inline: false,
      },
      {
        name: `${STATUS.INFO} Rappel`,
        value: `• ${RESOURCES.FOOD} Vivres : +1 faim\n• ${RESOURCES.PREPARED_FOOD} Repas : +1 faim`,
        inline: false,
      }
    );

    // Ajouter des alertes si stocks insuffisants
    const alerts: string[] = [];
    if (vivresStock === 0 && nourritureStock === 0) {
      alerts.push(
        `${STATUS.WARNING} Aucune ressource alimentaire disponible !`
      );
    } else if (vivresStock < hungerNeed && nourritureStock === 0) {
      alerts.push(
        `${STATUS.WARNING} Stocks de vivres insuffisants pour atteindre la satiété !`
      );
    }

    if (alerts.length > 0) {
      embed.addFields({
        name: `${STATUS.WARNING} Alertes`,
        value: alerts.join("\n"),
        inline: false,
      });
    }

    // Créer les boutons dynamiques
    const buttons: ButtonBuilder[] = [];

    // Bouton 1: Manger 1 vivre (si stock > 0)
    if (vivresStock > 0) {
      buttons.push(
        new ButtonBuilder()
          .setCustomId(`eat_vivre_1:${character.id}`)
          .setLabel(`Manger ${RESOURCES.FOOD} (1)`)
          .setStyle(ButtonStyle.Primary)
      );
    }

    // Bouton 2: Manger 1 nourriture (si stock > 0)
    if (nourritureStock > 0) {
      buttons.push(
        new ButtonBuilder()
          .setCustomId(`eat_nourriture_1:${character.id}`)
          .setLabel(`Manger ${RESOURCES.PREPARED_FOOD} (1)`)
          .setStyle(ButtonStyle.Secondary)
      );
    }

    // Bouton 3: À satiété vivres (si besoin > 1 et stock suffisant)
    if (hungerNeed > 1 && vivresStock >= hungerNeed) {
      buttons.push(
        new ButtonBuilder()
          .setCustomId(`eat_vivre_full:${character.id}`)
          .setLabel(`À satiété ${RESOURCES.FOOD} (${hungerNeed})`)
          .setStyle(ButtonStyle.Success)
      );
    }

    // Bouton 4: À satiété nourriture (si besoin > 1, stock >= ceil(besoin/2))
    const nourritureNeed = Math.ceil(hungerNeed / 2);
    if (hungerNeed > 1 && nourritureStock >= nourritureNeed) {
      buttons.push(
        new ButtonBuilder()
          .setCustomId(`eat_nourriture_full:${character.id}`)
          .setLabel(`À satiété ${RESOURCES.PREPARED_FOOD} (${nourritureNeed})`)
          .setStyle(ButtonStyle.Success)
      );
    }

    if (buttons.length === 0) {
      await replyEphemeral(
        interaction,
        `${STATUS.ERROR} Aucune option de nourriture disponible.`
      );
      return;
    }

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      ...buttons.slice(0, 5)
    );

    await interaction.reply({
      embeds: [embed],
      components: [row],
      flags: ["Ephemeral"],
    });
  } catch (error: any) {
    logger.error("Erreur dans handleEatMoreButton:", error);
    await replyError(
      interaction,
      "Erreur lors de l'affichage du menu de gestion de la faim."
    );
  }
}

/**
 * Handler pour manger 1 vivre
 */
export async function handleEatVivre1Button(interaction: ButtonInteraction) {
  await handleEatResource(interaction, "Vivres", 1);
}

/**
 * Handler pour manger 1 nourriture
 */
export async function handleEatNourriture1Button(
  interaction: ButtonInteraction
) {
  await handleEatResource(interaction, "Repas", 1);
}

/**
 * Handler pour manger vivres à satiété
 */
export async function handleEatVivreFull(interaction: ButtonInteraction) {
  try {
    const characterId = interaction.customId.split(":")[1];
    const character = await getActiveCharacterForUser(
      interaction.user.id,
      interaction.guildId!
    );

    if (!character || character.id !== characterId) {
      await replyEphemeral(
        interaction,
        `${STATUS.ERROR} Personnage non trouvé.`
      );
      return;
    }

    const hungerNeed = 4 - character.hungerLevel;
    await handleEatResource(interaction, "Vivres", hungerNeed);
  } catch (error: any) {
    logger.error("Erreur dans handleEatVivreFull:", error);
    await replyError(interaction, "Erreur lors de la consommation.");
  }
}

/**
 * Handler pour manger nourriture à satiété
 */
export async function handleEatNourritureFull(interaction: ButtonInteraction) {
  try {
    const characterId = interaction.customId.split(":")[1];
    const character = await getActiveCharacterForUser(
      interaction.user.id,
      interaction.guildId!
    );

    if (!character || character.id !== characterId) {
      await replyEphemeral(
        interaction,
        `${STATUS.ERROR} Personnage non trouvé.`
      );
      return;
    }

    const hungerNeed = 4 - character.hungerLevel;
    const nourritureNeed = Math.ceil(hungerNeed / 2);
    await handleEatResource(interaction, "Repas", nourritureNeed);
  } catch (error: any) {
    logger.error("Erreur dans handleEatNourritureFull:", error);
    await replyError(interaction, "Erreur lors de la consommation.");
  }
}

/**
 * Fonction utilitaire pour gérer la consommation d'une ressource
 */
async function handleEatResource(
  interaction: ButtonInteraction,
  resourceName: "Vivres" | "Repas",
  quantity: number
) {
  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    const characterId = interaction.customId.split(":")[1];
    const character = await getActiveCharacterForUser(
      interaction.user.id,
      interaction.guildId!
    );

    if (!character || character.id !== characterId) {
      await interaction.editReply({
        content: `${STATUS.ERROR} Personnage non trouvé.`,
      });
      return;
    }

    // Consommer les ressources
    for (let i = 0; i < quantity; i++) {
      try {
        // Utiliser les méthodes API appropriées selon le type de ressource
        if (resourceName === "Vivres") {
          await apiService.characters.eatFood(character.id);
        } else {
          await apiService.characters.eatFoodAlternative(
            character.id,
            resourceName
          );
        }
      } catch (error: any) {
        logger.error(
          `Erreur lors de la consommation ${i + 1}/${quantity}:`,
          error
        );
        await interaction.editReply({
          content: `${STATUS.ERROR} Erreur après ${i} consommation(s): ${error.message || "Ressources insuffisantes"}`,
        });
        return;
      }
    }

    // Récupérer l'état mis à jour
    const updatedCharacter = await getActiveCharacterForUser(
      interaction.user.id,
      interaction.guildId!
    );

    const emoji = resourceName === "Vivres" ? RESOURCES.FOOD : RESOURCES.PREPARED_FOOD;
    await interaction.editReply({
      content: `${STATUS.SUCCESS} Vous avez mangé ${quantity}x ${emoji} ${resourceName}.\n${HUNGER.ICON} Faim: ${updatedCharacter.hungerLevel}/4 ${getHungerEmoji(updatedCharacter.hungerLevel)}`,
    });
  } catch (error: any) {
    logger.error("Erreur dans handleEatResource:", error);
    await interaction.editReply({
      content: `${STATUS.ERROR} ${error.message || "Erreur lors de la consommation."}`,
    });
  }
}

/**
 * Retourne l'emoji correspondant au niveau de faim
 */
function getHungerEmoji(level: number): string {
  switch (level) {
    case 0:
      return HUNGER.STARVATION;
    case 1:
      return HUNGER.STARVING;
    case 2:
      return HUNGER.HUNGRY;
    case 3:
      return HUNGER.APPETITE;
    case 4:
      return HUNGER.FED;
    default:
      return HUNGER.UNKNOWN;
  }
}
