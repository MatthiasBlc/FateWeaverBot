/* eslint-disable @typescript-eslint/no-explicit-any */
import { STATUS } from "../../constants/emojis";
import { logger } from "../../services/logger";
import { createCartography1PAModal, createCartography2PAModal } from "../../modals/cartography-modals";

/**
 * Gère le choix du nombre de PA pour cartographier
 * Affiche un modal pour demander les coordonnées
 */
export async function handleCartographyPAChoice(interaction: any) {
  if (!interaction.isButton()) return;

  const [, characterId, userId, paStr] = interaction.customId.split(":");
  const paToUse = parseInt(paStr, 10);

  // Vérifier que l'utilisateur qui clique est bien le propriétaire
  if (interaction.user.id !== userId) {
    await interaction.reply({
      content: `${STATUS.ERROR} Vous ne pouvez utiliser que vos propres capacités.`,
      flags: ["Ephemeral"],
    });
    return;
  }

  try {
    // Afficher le modal approprié selon le nombre de PA
    if (paToUse === 1) {
      const modal = createCartography1PAModal(characterId, userId);
      await interaction.showModal(modal);
    } else if (paToUse === 2) {
      const modal = createCartography2PAModal(characterId, userId);
      await interaction.showModal(modal);
    } else {
      await interaction.reply({
        content: `${STATUS.ERROR} Nombre de PA invalide.`,
        flags: ["Ephemeral"],
      });
    }
  } catch (error: any) {
    logger.error("Error showing cartography modal:", { error });
    await interaction.reply({
      content: `${STATUS.ERROR} ${error.message || "Une erreur est survenue"}`,
      flags: ["Ephemeral"],
    });
  }
}
