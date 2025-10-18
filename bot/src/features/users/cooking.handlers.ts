import { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from "discord.js";
import { httpClient } from "../../services/httpClient";
import { logger } from "../../services/logger";
import { sendLogMessage } from "../../utils/channels";
import { CAPABILITIES, STATUS } from "../../constants/emojis";

/**
 * Gère le choix du nombre de PA pour cuisiner
 */
export async function handleCookingPAChoice(interaction: any) {
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

    // Récupérer le stock de vivres
    const stockResponse = await httpClient.get(`/resources/CITY/${townId}`);
    const stock = stockResponse.data;

    const vivresStock = stock.find((r: any) => r.resourceType.name === "Vivres");
    const vivresAvailable = vivresStock?.quantity || 0;

    const maxInput = paToUse === 1 ? 1 : 5;
    const actualMax = Math.min(vivresAvailable, maxInput);

    if (vivresAvailable === 0) {
      await interaction.editReply(
        `${STATUS.ERROR} Il n'y a aucun vivre disponible dans le stock de la ville.`
      );
      return;
    }

    // Si max = 1, exécuter directement
    if (actualMax === 1) {
      await executeCooking(interaction, characterId, paToUse, 1);
      return;
    }

    // Sinon, demander combien de vivres utiliser
    const options = [];
    for (let i = 1; i <= actualMax; i++) {
      const minOutput = i - 1;
      const maxOutput = i * 3;
      options.push({
        label: `${i} vivre${i > 1 ? "s" : ""}`,
        value: `${i}`,
        description: `Peut produire ${minOutput}-${maxOutput} repas`,
      });
    }

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`cooking_quantity:${characterId}:${userId}:${paToUse}`)
      .setPlaceholder("Choisissez combien de vivres utiliser")
      .addOptions(options);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    await interaction.editReply({
      content: `${CAPABILITIES.COOKING} **Cuisiner (${paToUse} PA)** - Choisissez combien de vivres utiliser :\n\nVivres disponibles : **${vivresAvailable}**\nVivres utilisables (max) : **${actualMax}**`,
      components: [row],
    });
  } catch (error: any) {
    logger.error("Error handling cooking PA choice:", { error });
    await interaction.editReply(
      `${STATUS.ERROR} ${error.response?.data?.error || error.message || "Une erreur est survenue"}`
    );
  }
}

/**
 * Gère le choix de la quantité de vivres à utiliser
 */
export async function handleCookingQuantityChoice(interaction: any) {
  if (!interaction.isStringSelectMenu()) return;

  const [, characterId, userId, paStr] = interaction.customId.split(":");
  const paToUse = parseInt(paStr, 10);
  const inputQuantity = parseInt(interaction.values[0], 10);

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
    await executeCooking(interaction, characterId, paToUse, inputQuantity);
  } catch (error: any) {
    logger.error("Error handling cooking quantity choice:", { error });
    await interaction.editReply({
      content: `${STATUS.ERROR} ${error.response?.data?.error || error.message || "Une erreur est survenue"}`,
      components: [],
    });
  }
}

/**
 * Exécute la capacité cuisiner avec les paramètres donnés
 */
async function executeCooking(
  interaction: any,
  characterId: string,
  paToUse: number,
  inputQuantity: number
) {
  try {
    const response = await httpClient.post(`/characters/${characterId}/capabilities/use`, {
      capabilityName: "Cuisiner",
      paToUse,
      inputQuantity,
    });

    const result = response.data;

    // Afficher le résultat
    if (result.publicMessage && interaction.guildId) {
      await sendLogMessage(interaction.guildId, interaction.client, result.publicMessage);
    }

    await interaction.editReply({
      content: `${CAPABILITIES.COOKING} **Cuisiner**\n${result.message || ""}`,
      components: [],
    });
  } catch (error: any) {
    logger.error("Error executing cooking:", { error });
    throw error;
  }
}
