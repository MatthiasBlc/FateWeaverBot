/* eslint-disable @typescript-eslint/no-explicit-any */
import { StringSelectMenuBuilder, ActionRowBuilder } from "discord.js";
import { httpClient } from "../../services/httpClient";
import { logger } from "../../services/logger";
import { sendLogMessageWithExpeditionContext } from "../../utils/channels";
import { CAPABILITIES, STATUS } from "../../constants/emojis";
import { handleCapabilityAdminLog } from "../../utils/capability-helpers";

/**
 * Gère le choix du mode de soins (1 PA = Soigner, 2 PA = Cataplasme)
 */
export async function handleHealingPAChoice(interaction: any) {
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

  await interaction.deferReply({ flags: ["Ephemeral"] });

  try {
    if (paToUse === 1) {
      // Mode Soigner : afficher la liste des personnages à soigner
      await showHealTargetSelection(interaction, characterId, userId);
    } else if (paToUse === 2) {
      // Mode Cataplasme : fabriquer directement
      await executeCraftCataplasme(interaction, characterId);
    } else {
      await interaction.editReply(`${STATUS.ERROR} Choix invalide.`);
    }
  } catch (error: any) {
    logger.error("Error handling healing PA choice:", { error });
    await interaction.editReply(
      `${STATUS.ERROR} ${error.response?.data?.error || error.message || "Une erreur est survenue"}`
    );
  }
}

/**
 * Affiche la sélection du personnage à soigner
 */
async function showHealTargetSelection(
  interaction: any,
  characterId: string,
  userId: string
) {
  try {
    // Récupérer le personnage et le guild pour obtenir le townId
    const characterResponse = await httpClient.get(`/characters/${characterId}`);
    const character = characterResponse.data;

    if (!character) {
      await interaction.editReply(`${STATUS.ERROR} Personnage non trouvé.`);
      return;
    }

    // Récupérer le guild pour obtenir le townId
    const guildResponse = await httpClient.get(`/guilds/discord/${interaction.guildId}`);
    const guild = guildResponse.data;

    if (!guild || !guild.town) {
      await interaction.editReply(`${STATUS.ERROR} Ville non trouvée pour ce serveur.`);
      return;
    }

    const townId = guild.town.id;

    // Récupérer tous les personnages de la ville (pas en expédition DEPARTED)
    const charactersResponse = await httpClient.get(`/characters/town/${townId}`);
    const allCharacters = charactersResponse.data;

    // Filtrer : seulement les personnages vivants avec HP < 5
    // Et exclure les personnages en expédition DEPARTED
    const healableCharacters = allCharacters.filter((char: any) => {
      if (char.isDead || char.hp >= 5) return false;

      // Vérifier si en agonie affamé (hungerLevel=0 ET hp=1)
      if (char.hungerLevel === 0 && char.hp === 1) return false;

      // Exclure les personnages en expédition DEPARTED
      if (char.expeditionMembers && Array.isArray(char.expeditionMembers)) {
        const inDepartedExpedition = char.expeditionMembers.some(
          (member: any) => member.expedition?.status === "DEPARTED"
        );
        if (inDepartedExpedition) return false;
      }

      return true;
    });

    if (healableCharacters.length === 0) {
      await interaction.editReply(
        `${STATUS.ERROR} Aucun personnage ne nécessite de soins dans la ville.`
      );
      return;
    }

    // Créer la liste déroulante avec max 25 options
    const options = healableCharacters.slice(0, 25).map((char: any) => ({
      label: `${char.name} (${char.hp}/5 PV)`,
      value: char.id,
      description: `HP: ${char.hp}/5 - Faim: ${char.hungerLevel}/4`,
    }));

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`healing_target:${characterId}:${userId}`)
      .setPlaceholder("Choisissez un personnage à soigner")
      .addOptions(options);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    await interaction.editReply({
      content: `${CAPABILITIES.HEALING} **Soigner (1 PA)** - Choisissez qui soigner :\n\n${healableCharacters.length} personnage(s) soignable(s)`,
      components: [row],
    });
  } catch (error: any) {
    logger.error("Error showing heal target selection:", { error });
    throw error;
  }
}

/**
 * Gère la sélection du personnage à soigner
 */
export async function handleHealingTargetChoice(interaction: any) {
  if (!interaction.isStringSelectMenu()) return;

  const [, characterId, userId] = interaction.customId.split(":");
  const targetCharacterId = interaction.values[0];

  // Vérifier que l'utilisateur qui clique est bien le propriétaire
  if (interaction.user.id !== userId) {
    await interaction.reply({
      content: `${STATUS.ERROR} Vous ne pouvez utiliser que vos propres capacités.`,
      flags: ["Ephemeral"],
    });
    return;
  }

  await interaction.deferUpdate();

  try {
    await executeHeal(interaction, characterId, targetCharacterId);
  } catch (error: any) {
    logger.error("Error handling healing target choice:", { error });
    await interaction.editReply({
      content: `${STATUS.ERROR} ${error.response?.data?.error || error.message || "Une erreur est survenue"}`,
      components: [],
    });
  }
}

/**
 * Exécute le soin sur un personnage cible
 */
async function executeHeal(
  interaction: any,
  characterId: string,
  targetCharacterId: string
) {
  try {
    const response = await httpClient.post(`/capabilities/${characterId}/soigner`, {
      mode: "heal",
      targetCharacterId,
    });

    const result = response.data;

    // Afficher le résultat
    if (result.publicMessage && interaction.guildId) {
      await sendLogMessageWithExpeditionContext(interaction.guildId, interaction.client, result.publicMessage, characterId);
    }

    await interaction.editReply({
      content: `${CAPABILITIES.HEALING} **Soigner**\n${result.message || ""}`,
      components: [],
    });

    // Log admin - Récupérer le nom du personnage soigneur
    if (interaction.guildId && result.success) {
      const characterResponse = await httpClient.get(`/characters/${characterId}`);
      const character = characterResponse.data;
      await handleCapabilityAdminLog(
        interaction.guildId,
        interaction.client,
        character.name,
        "Soigner",
        CAPABILITIES.HEALING,
        1, // Soigner coûte toujours 1 PA
        result
      );
    }
  } catch (error: any) {
    logger.error("Error executing heal:", { error });
    throw error;
  }
}

/**
 * Exécute la fabrication d'un cataplasme
 */
async function executeCraftCataplasme(interaction: any, characterId: string) {
  try {
    const response = await httpClient.post(`/capabilities/${characterId}/soigner`, {
      mode: "craft",
    });

    const result = response.data;

    // Afficher le résultat
    if (result.publicMessage && interaction.guildId) {
      await sendLogMessageWithExpeditionContext(interaction.guildId, interaction.client, result.publicMessage, characterId);
    }

    await interaction.editReply({
      content: `${CAPABILITIES.HEALING} **Cataplasme**\n${result.message || ""}`,
      components: [],
    });
  } catch (error: any) {
    logger.error("Error crafting cataplasme:", { error });
    throw error;
  }
}
