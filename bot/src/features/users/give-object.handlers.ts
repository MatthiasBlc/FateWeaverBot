import {
  StringSelectMenuInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonInteraction,
  Client,
  TextChannel,
} from "discord.js";
import { logger } from "../../services/logger.js";
import { apiService } from "../../services/api/index.js";
import { httpClient } from "../../services/httpClient.js";
import { STATUS } from "../../constants/emojis.js";
import { formatErrorForLog } from "../../utils/errors.js";
import { sendLogMessage } from "../../utils/channels.js";

/**
 * Handle the initial "Give Object" button click
 * Shows a select menu to choose the recipient
 */
export async function handleGiveObjectButton(interaction: ButtonInteraction) {
  const customId = interaction.customId;
  const [, characterId, userId] = customId.split(":");

  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    // Vérifier que l'utilisateur est le propriétaire du personnage
    if (interaction.user.id !== userId) {
      await interaction.editReply({
        content: `${STATUS.ERROR} Vous ne pouvez donner que les objets de votre propre personnage.`,
      });
      return;
    }

    // Récupérer le personnage
    const character = await apiService.characters.getCharacterById(characterId);
    if (!character) {
      await interaction.editReply({
        content: `${STATUS.ERROR} Personnage non trouvé.`,
      });
      return;
    }

    // Récupérer la ville pour obtenir le townId correct
    const guildResponse = await httpClient.get(
      `/towns/guild/${interaction.guildId}`
    );
    const guild = guildResponse.data;

    if (!guild || !guild.id) {
      await interaction.editReply({
        content: `${STATUS.ERROR} Ville non trouvée pour ce serveur.`,
      });
      return;
    }

    // Récupérer les destinataires possibles
    const recipients = await getAvailableRecipients(character, guild.id, interaction);

    if (!recipients || recipients.length === 0) {
      await interaction.editReply({
        content: `${STATUS.ERROR} Aucune personne disponible pour recevoir un objet.`,
      });
      return;
    }

    // Créer le select menu pour choisir le destinataire
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`select_give_recipient:${characterId}:${userId}`)
      .setPlaceholder("Choisissez une personne...")
      .addOptions(recipients);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      selectMenu
    );

    await interaction.editReply({
      content: "🎁 **Donner un objet** - Choisissez le destinataire :",
      components: [row],
    });
  } catch (error) {
    logger.error("Erreur lors du clic sur le bouton donner un objet:", {
      error: formatErrorForLog(error),
      characterId,
      userId: interaction.user.id,
    });

    let errorMessage = "Une erreur est survenue";
    if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      (error as any).response?.data?.error
    ) {
      errorMessage = (error as any).response.data.error;
    }

    await interaction.editReply({
      content: `${STATUS.ERROR} ${errorMessage}`,
    });
  }
}

/**
 * Get available recipients (characters in same town or departed expedition)
 */
async function getAvailableRecipients(
  character: any,
  townId: string,
  interaction: any
): Promise<Array<{ label: string; value: string; description?: string }>> {
  const recipients: Array<{
    label: string;
    value: string;
    description?: string;
  }> = [];

  try {
    logger.info("Récupération des destinataires pour:", {
      characterId: character.id,
      townId,
      expeditionId: character.expeditionId,
    });

    // Récupérer les personnages de la même ville
    const charactersInTown = await httpClient.get(
      `/characters/town/${townId}`
    );
    const townCharacters = charactersInTown.data || [];

    logger.info("Personnages de la ville récupérés:", {
      count: townCharacters.length,
      characters: townCharacters.map((c: any) => ({
        id: c.id,
        name: c.name,
        isDead: c.isDead,
      })),
    });

    // Ajouter les personnages de la ville (sauf soi-même)
    townCharacters.forEach((townChar: any) => {
      if (townChar.id !== character.id && !townChar.isDead) {
        recipients.push({
          label: `${townChar.name} (Ville)`,
          value: `town:${townChar.id}`,
          description: `${townChar.user?.username || "Joueur inconnu"}`,
        });
      }
    });

    // Vérifier si le personnage est dans une expédition en status DEPARTED
    if (character.expeditionId) {
      try {
        const expedition = await httpClient.get(
          `/expeditions/${character.expeditionId}`
        );
        const exp = expedition.data;

        logger.info("Expédition récupérée:", {
          expeditionId: character.expeditionId,
          status: exp?.status,
        });

        if (exp && exp.status === "DEPARTED") {
          // Récupérer les membres de l'expédition
          const members = exp.characters || [];
          members.forEach((member: any) => {
            if (member.id !== character.id && !member.isDead) {
              recipients.push({
                label: `${member.name} (Expédition)`,
                value: `expedition:${member.id}`,
                description: `${member.user?.username || "Joueur inconnu"}`,
              });
            }
          });
        }
      } catch (expError) {
        logger.warn("Erreur lors de la récupération de l'expédition:", {
          error: formatErrorForLog(expError),
        });
      }
    }

    logger.info("Destinataires finaux:", {
      count: recipients.length,
      recipients: recipients.map((r) => ({ label: r.label, value: r.value })),
    });
  } catch (error) {
    logger.error("Erreur lors de la récupération des destinataires:", {
      error: formatErrorForLog(error),
    });
  }

  return recipients.slice(0, 25); // Discord limit: 25 options max
}

/**
 * Handle recipient selection
 * Shows object multi-select menu
 */
export async function handleSelectGiveRecipient(
  interaction: StringSelectMenuInteraction
) {
  const customId = interaction.customId;
  const [, characterId, userId] = customId.split(":");
  const recipientValue = interaction.values[0]; // Format: "town:characterId" ou "expedition:characterId"

  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    // Vérifier propriété
    if (interaction.user.id !== userId) {
      await interaction.editReply({
        content: `${STATUS.ERROR} Vous ne pouvez donner que vos propres objets.`,
      });
      return;
    }

    // Récupérer l'inventaire
    const inventoryResponse = await httpClient.get(
      `/characters/${characterId}/inventory`
    );
    const inventory = inventoryResponse.data;

    if (!inventory || !inventory.slots || inventory.slots.length === 0) {
      await interaction.editReply({
        content: `${STATUS.ERROR} Vous n'avez aucun objet à donner.`,
      });
      return;
    }

    // Créer le select menu pour choisir les objets
    const objectOptions = inventory.slots.map((slot: any, index: number) => ({
      label: slot.objectType.name.substring(0, 100), // Discord limit: 100 chars
      value: `${slot.id}`,
      description: slot.objectType.description?.substring(0, 100),
    }));

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(
        `select_give_objects:${characterId}:${userId}:${recipientValue}`
      )
      .setPlaceholder("Choisissez les objets à donner...")
      .setMinValues(1)
      .setMaxValues(Math.min(objectOptions.length, 25)) // Discord limit: 25 max
      .addOptions(objectOptions);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      selectMenu
    );

    await interaction.editReply({
      content:
        "🎁 **Donner un objet** - Sélectionnez les objets à donner (vous pouvez en choisir plusieurs) :",
      components: [row],
    });
  } catch (error) {
    logger.error("Erreur lors de la sélection du destinataire:", {
      error: formatErrorForLog(error),
    });

    let errorMessage = "Une erreur est survenue";
    if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      (error as any).response?.data?.error
    ) {
      errorMessage = (error as any).response.data.error;
    }

    await interaction.editReply({
      content: `${STATUS.ERROR} ${errorMessage}`,
    });
  }
}

/**
 * Handle object selection and process the transfer
 */
export async function handleSelectGiveObjects(
  interaction: StringSelectMenuInteraction
) {
  const customId = interaction.customId;
  const parts = customId.split(":");
  const characterId = parts[1];
  const userId = parts[2];
  const recipientType = parts[3]; // "town" ou "expedition"
  const targetCharacterId = parts[4];
  const slotIds = interaction.values; // Array of slot IDs to transfer

  try {
    await interaction.deferReply({ flags: ["Ephemeral"] });

    // Vérifier propriété
    if (interaction.user.id !== userId) {
      await interaction.editReply({
        content: `${STATUS.ERROR} Vous ne pouvez donner que vos propres objets.`,
      });
      return;
    }

    // Récupérer les informations du donateur et du destinataire
    let sourceCharacterInfo: any;
    let targetCharacterInfo: any;
    try {
      const sourceResponse = await httpClient.get(
        `/characters/${characterId}`
      );
      sourceCharacterInfo = sourceResponse.data;
    } catch (error) {
      logger.warn("Impossible de récupérer les infos du donateur");
      sourceCharacterInfo = { name: "Donateur inconnu" };
    }

    try {
      const targetResponse = await httpClient.get(
        `/characters/${targetCharacterId}`
      );
      targetCharacterInfo = targetResponse.data;
    } catch (error) {
      logger.warn("Impossible de récupérer les infos du destinataire");
      targetCharacterInfo = { name: "Destinataire inconnu" };
    }

    // Récupérer les infos des objets transférés
    let inventoryData: any;
    try {
      const invResponse = await httpClient.get(
        `/characters/${characterId}/inventory`
      );
      inventoryData = invResponse.data;
    } catch (error) {
      logger.warn("Impossible de récupérer l'inventaire");
      inventoryData = { slots: [] };
    }

    // Créer une map des objets par slot ID
    const objectsMap: Record<string, any> = {};
    if (inventoryData?.slots) {
      inventoryData.slots.forEach((slot: any) => {
        objectsMap[slot.id] = slot.objectType;
      });
    }

    // Transférer chaque objet
    const results = [];
    for (const slotId of slotIds) {
      try {
        const response = await httpClient.post(
          `/characters/${characterId}/inventory/transfer`,
          {
            targetCharacterId,
            slotId,
          }
        );

        if (response.data.success) {
          const objectInfo = objectsMap[slotId];
          const objectName = objectInfo?.name || "Objet inconnu";
          const emoji = objectInfo?.emoji || "🎁";
          results.push(
            `${emoji} **${objectName}** → **${targetCharacterInfo.name}**`
          );
        } else {
          results.push(
            `${STATUS.ERROR} Erreur: ${response.data.message || "Transfert échoué"}`
          );
        }
      } catch (error) {
        const errorMsg = (error as any).response?.data?.error || "Erreur inconnue";
        results.push(`${STATUS.ERROR} ${errorMsg}`);
      }
    }

    const resultText = results.join("\n");
    await interaction.editReply({
      content: `${STATUS.SUCCESS} **Transfert réussi !** Ça lui sera sûrement utile !\n\n${resultText}`,
    });

    // Envoyer un log public
    try {
      const objectNames = results
        .filter((r) => !r.startsWith(`${STATUS.ERROR}`))
        .map((r) => {
          // Extraire le nom de l'objet du message formaté (entre les premiers **)
          const match = r.match(/\*\*(.+?)\*\*/);
          return match ? match[1] : r;
        });

      const logMessage = `📦 **${sourceCharacterInfo.name}** a donné **${objectNames.join(", ")}** à **${targetCharacterInfo.name}**`;

      // Vérifier si le personnage source est en expédition DEPARTED
      let activeExpedition: any = null;
      try {
        const expeditions = await apiService.expeditions.getExpeditionsByTown(
          sourceCharacterInfo.townId
        );

        activeExpedition = expeditions.find(
          (exp: any) =>
            exp.status === "DEPARTED" &&
            exp.members?.some((m: any) => m.characterId === sourceCharacterInfo.id)
        );
      } catch (error: any) {
        logger.error("Erreur lors de la récupération de l'expédition:", {
          message: error?.message,
          status: error?.response?.status,
          data: error?.response?.data
        });
      }

      if (activeExpedition) {
        // Send to expedition's dedicated channel if configured
        if (activeExpedition.expeditionChannelId && activeExpedition.status === "DEPARTED") {
          try {
            const channel = await interaction.client.channels.fetch(activeExpedition.expeditionChannelId);
            if (channel instanceof TextChannel) {
              await channel.send(logMessage);
            }
          } catch (error) {
            logger.error("Error sending give log to expedition channel:", error);
            // Fallback to guild log channel if expedition channel fails
            await sendLogMessage(interaction.guildId!, interaction.client, logMessage);
          }
        } else {
          // No dedicated channel, send to guild log channel
          await sendLogMessage(interaction.guildId!, interaction.client, logMessage);
        }
      } else {
        // Comportement normal (ville)
        await sendLogMessage(interaction.guildId!, interaction.client, logMessage);
      }
    } catch (logError) {
      logger.warn("Impossible d'envoyer le log public:", {
        error: formatErrorForLog(logError),
      });
    }
  } catch (error) {
    logger.error("Erreur lors du transfert des objets:", {
      error: formatErrorForLog(error),
    });

    let errorMessage = "Une erreur est survenue lors du transfert";
    if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      (error as any).response?.data?.error
    ) {
      errorMessage = (error as any).response.data.error;
    }

    await interaction.editReply({
      content: `${STATUS.ERROR} ${errorMessage}`,
    });
  }
}
