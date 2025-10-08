import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  TextChannel,
  type GuildMember,
  type ModalSubmitInteraction,
  type ChatInputCommandInteraction,
} from "discord.js";
import { logger } from "../../../services/logger";
import { apiService } from "../../../services/api";
import { sendLogMessage } from "../../../utils/channels";
import { getActiveCharacterFromCommand, getActiveCharacterFromModal } from "../../../utils/character";
import { createExpeditionCreationModal } from "../../../modals/expedition-modals";
import { getTownByGuildId } from "../../../services/towns.service";
import { createInfoEmbed, createSuccessEmbed, createErrorEmbed } from "../../../utils/embeds";
import { createActionButtons } from "../../../utils/discord-components";

/**
 * Gestionnaire pour le bouton "Créer une nouvelle expédition"
 * Version adaptée pour les boutons (convertit ButtonInteraction en ChatInputCommandInteraction)
 */
export async function handleExpeditionCreateNewButton(interaction: any) {
  try {
    // Créer une interaction de commande complète à partir de l'interaction de bouton
    const commandInteraction = {
      ...interaction,
      isChatInputCommand: () => true,
      options: {
        getSubcommand: () => 'start',
        getString: (name: string) => {
          // Pour les boutons, pas de paramètres à récupérer
          return null;
        }
      },
      guildId: interaction.guildId,
      guild: interaction.guild,
      channelId: interaction.channelId,
      channel: interaction.channel,
      user: interaction.user,
      member: interaction.member,
      client: interaction.client,
      createdAt: interaction.createdAt,
      reply: interaction.reply.bind(interaction),
      deferReply: interaction.deferReply?.bind(interaction),
      editReply: interaction.editReply?.bind(interaction),
      followUp: interaction.followUp?.bind(interaction),
      deferUpdate: interaction.deferUpdate?.bind(interaction),
      update: interaction.update?.bind(interaction),
      showModal: interaction.showModal?.bind(interaction)
    } as ChatInputCommandInteraction;

    await handleExpeditionStartCommand(commandInteraction);
  } catch (error) {
    logger.error("Error in expedition create new button:", { error });
    await interaction.reply({
      content: "❌ Erreur lors de l'ouverture du formulaire de création d'expédition.",
      flags: ["Ephemeral"],
    });
  }
}

export async function handleExpeditionStartCommand(
  interaction: ChatInputCommandInteraction
) {
  const member = interaction.member as GuildMember;
  const user = interaction.user;

  try {
    // Get town info
    const town = await getTownByGuildId(interaction.guildId!);
    if (!town) {
      await interaction.reply({
        content: "❌ Aucune ville trouvée pour ce serveur.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Get user's active character FIRST, before showing modal
    let character;
    try {
      character = await getActiveCharacterFromCommand(interaction);
    } catch (error: any) {
      // Handle specific error cases
      if (
        error?.status === 404 ||
        error?.message?.includes("Request failed with status code 404")
      ) {
        await interaction.reply({
          content:
            "❌ Aucun personnage vivant trouvé. Si votre personnage est mort, un mort ne peut pas rejoindre une expédition.",
          flags: ["Ephemeral"],
        });
        return;
      }
      // Re-throw other errors
      throw error;
    }

    if (!character) {
      await interaction.reply({
        content: "❌ Aucun personnage actif trouvé.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Check if character is dead
    if (character.isDead) {
      await interaction.reply({
        content: "❌ Un mort ne peut pas démarrer une expédition.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Check if character is already on an expedition
    const activeExpeditions =
      await apiService.expeditions.getActiveExpeditionsForCharacter(
        character.id
      );
    if (activeExpeditions && activeExpeditions.length > 0) {
      await interaction.reply({
        content: `❌ Votre personnage est déjà sur une expédition active: **${activeExpeditions[0].name}**.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Show modal for expedition creation
    const modal = createExpeditionCreationModal();
    await interaction.showModal(modal);
  } catch (error) {
    logger.error("Error in expedition start command:", { error });
    await interaction.reply({
      content: `❌ Erreur lors de la création de l'expédition: ${error instanceof Error ? error.message : "Erreur inconnue"
        }`,
      flags: ["Ephemeral"],
    });
  }
}

export async function handleExpeditionCreationModal(
  interaction: ModalSubmitInteraction
) {
  const member = interaction.member as GuildMember;
  const user = interaction.user;

  try {
    const name = interaction.fields.getTextInputValue("expedition_name_input");

    // Récupérer les valeurs des champs séparés pour vivres et nourriture
    const vivresValue = interaction.fields.getTextInputValue("expedition_vivres_input") || "0";
    const nourritureValue = interaction.fields.getTextInputValue("expedition_nourriture_input") || "0";

    const duration = interaction.fields.getTextInputValue("expedition_duration_input");

    // Convertir en nombres et calculer le total
    const vivresAmount = parseInt(vivresValue, 10) || 0;
    const nourritureAmount = parseInt(nourritureValue, 10) || 0;
    const foodStock = vivresAmount + nourritureAmount;

    // Validate inputs
    const durationDays = parseInt(duration, 10);

    // Get character ID from modal interaction
    const character = await getActiveCharacterFromModal(interaction);
    if (!character) {
      await interaction.reply({
        content: "❌ Aucun personnage actif trouvé.",
        flags: ["Ephemeral"],
      });
      return;
    }

    if (isNaN(foodStock) || foodStock <= 0) {
      await interaction.reply({
        content: "❌ Le stock de nourriture total (vivres + nourriture) doit être un nombre positif.",
        flags: ["Ephemeral"],
      });
      return;
    }

    if (isNaN(durationDays) || durationDays < 1) {
      await interaction.reply({
        content: "❌ La durée doit être d'au moins 1 jour.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Get town info
    const townResponse = await apiService.guilds.getTownByGuildId(
      interaction.guildId!
    );
    if (!townResponse) {
      await interaction.reply({
        content: "❌ Aucune ville trouvée pour ce serveur.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Create expedition
    logger.debug("Creating expedition", {
      name,
      vivresAmount,
      nourritureAmount,
      totalFoodStock: foodStock,
      duration: durationDays,
      townId: townResponse.id,
      characterId: character.id,
      createdBy: interaction.user.id,
    });

    // Construire le tableau des ressources initiales
    const initialResources = [];

    if (vivresAmount > 0) {
      initialResources.push({ resourceTypeName: "Vivres", quantity: vivresAmount });
    }

    if (nourritureAmount > 0) {
      initialResources.push({ resourceTypeName: "Nourriture", quantity: nourritureAmount });
    }

    const newExpedition = await apiService.expeditions.createExpedition({
      name,
      initialResources,
      duration: durationDays,
      townId: townResponse.id,
      characterId: character.id, // Add character ID for auto-joining
      createdBy: interaction.user.id, // Discord user ID
    });

    logger.debug("Expedition created successfully", {
      expeditionId: newExpedition.data?.id,
      expeditionName: newExpedition.data?.name,
    });

    // Join the creator to the expedition
    let joinSuccess = false;
    try {
      const joinResponse = await apiService.expeditions.joinExpedition(
        newExpedition.data.id,
        character.id
      );
      joinSuccess = true;
      logger.info("Expedition creator auto-joined expedition", {
        expeditionId: newExpedition.data.id,
        characterId: character.id,
        createdBy: interaction.user.id,
        response: joinResponse,
      });
    } catch (error) {
      logger.error("Error auto-joining expedition creator:", {
        error,
        expeditionId: newExpedition.data.id,
        characterId: character.id,
        createdBy: interaction.user.id,
      });
      // Continue anyway, expedition is created
    }

    // Get updated expedition data with correct member count
    let memberCount = 0;
    let expeditionMembers: any[] = [];
    try {
      const updatedExpedition = await apiService.expeditions.getExpeditionById(
        newExpedition.data.id
      );
      memberCount = updatedExpedition?.members?.length || 0;
      expeditionMembers = updatedExpedition?.members || [];

      // Log detailed member information
      logger.info("Expedition members after creation:", {
        expeditionId: newExpedition.data.id,
        memberCount,
        members: expeditionMembers.map((m) => ({
          id: m.id,
          characterId: m.character?.id,
          characterName: m.character?.name,
          userId: m.character?.user?.discordId,
        })),
      });

      // If no members but join was successful, set to 1
      if (memberCount === 0 && joinSuccess) {
        memberCount = 1;
      }
    } catch (error) {
      logger.error("Error fetching updated expedition data:", {
        error,
        expeditionId: newExpedition.data.id,
      });
      memberCount = joinSuccess ? 1 : 0; // Set to 1 only if join was successful
    }

    // Récupérer les ressources détaillées de la nouvelle expédition
    let expeditionResources: any[] = [];
    try {
      expeditionResources = await apiService.getResources("EXPEDITION", newExpedition.data.id);
    } catch (error) {
      logger.warn("Could not fetch expedition resources after creation:", error);
      // Continue without detailed resources if API call fails
    }

    // Create embed
    const embed = createSuccessEmbed(
      `🏕️ Expédition créée : ${newExpedition.data.name}`,
      `Vous avez créé une nouvelle expédition avec succès !`
    )
    .addFields(
      {
        name: "⏱️ Durée",
        value: `${durationDays} jours`,
        inline: true,
      },
      {
        name: "📍 Statut",
        value: "🔄 PLANIFICATION",
        inline: true,
      },
      {
        name: "👥 Membres",
        value: memberCount.toString(),
        inline: true,
      },
      { name: " ", value: " ", inline: true }
    );

    // Add detailed resources if available
    if (expeditionResources && expeditionResources.length > 0) {
      const resourceDetails = expeditionResources
        .filter(resource => resource.quantity > 0)
        .map(resource => `${resource.resourceType.emoji} ${resource.resourceType.name}: ${resource.quantity}`)
        .join("\n");

      if (resourceDetails) {
        embed.addFields({
          name: "📦 Ressources détaillées",
          value: resourceDetails,
          inline: false,
        });
      }
    }

    await interaction.reply({
      embeds: [embed],
      flags: ["Ephemeral"],
    });

    // Send public log message to configured log channel
    const publicEmbed = createSuccessEmbed(
      `🏕️ Nouvelle expédition créée`,
      `**${newExpedition.data.name}** créée par **${character.name}**`
    )
    .addFields(
      {
        name: "⏱️ Durée",
        value: `${durationDays} jours`,
        inline: true,
      },
      { name: " ", value: " ", inline: true }
    );

    // Add detailed resources to public message if available
    if (expeditionResources && expeditionResources.length > 0) {
      const resourceDetails = expeditionResources
        .filter(resource => resource.quantity > 0)
        .map(resource => `${resource.resourceType.emoji} ${resource.resourceType.name}: ${resource.quantity}`)
        .join("\n");

      if (resourceDetails) {
        publicEmbed.addFields({
          name: "📦 Ressources détaillées",
          value: resourceDetails,
          inline: false,
        });
      }
    }

    // Send public embed to log channel
    try {
      const guild = await apiService.getGuildByDiscordId(interaction.guildId!) as { logChannelId?: string } | null;
      if (guild?.logChannelId) {
        const logChannel = interaction.client.channels.cache.get(guild.logChannelId) as TextChannel;
        if (logChannel) {
          await logChannel.send({ embeds: [publicEmbed] });
        }
      }
    } catch (error) {
      logger.warn("Could not send public embed to log channel:", error);
    }

    // Send old format log message for backward compatibility
    const logMessage = `🏕️ Nouvelle expédition créée : "**${newExpedition.data.name}**" par **${character.name}**\n📦 Stock nourriture : ${foodStock}\n⏱️ Durée : ${durationDays} jours\n🏛️ Ville : ${townResponse.name}`;

    logger.info("Expedition created via Discord", {
      expeditionId: newExpedition.data.id,
      name: newExpedition.data.name,
      createdBy: interaction.user.id,
      guildId: interaction.guildId,
      characterId: character.id,
      characterName: character.name,
      townId: townResponse.id,
      townName: townResponse.name,
      foodStock: foodStock,
      duration: durationDays,
      memberCount: memberCount,
      autoJoinSuccess: joinSuccess,
    });
  } catch (error) {
    logger.error("Error in expedition creation modal:", { error });
    await interaction.reply({
      content: `❌ Erreur lors de la création de l'expédition: ${error instanceof Error ? error.message : "Erreur inconnue"
        }`,
      flags: ["Ephemeral"],
    });
  }
}
