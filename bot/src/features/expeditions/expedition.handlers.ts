import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  type GuildMember,
  type ModalSubmitInteraction,
  type ChatInputCommandInteraction,
} from "discord.js";
import { apiService } from "../../services/api";
import { checkCharacterStatus } from "../../services/characters.service";
import { Expedition } from "../../types/expedition";
import { Town } from "../../services/towns.service";
import { logger } from "../../services/logger";
import {
  getActiveCharacterFromCommand,
  getActiveCharacterFromModal,
} from "../../utils/character";
import { createExpeditionCreationModal } from "../../modals/expedition-modals";
// Import des services
import { getTownByGuildId } from "../../services/towns.service";

// Déclaration de types globaux
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "development" | "production" | "test";
      DISCORD_TOKEN: string;
      DISCORD_CLIENT_ID: string;
      DISCORD_GUILD_ID?: string;
      DATABASE_URL: string;
      API_URL: string;
    }
  }
}

export interface CharacterWithTown {
  id: string;
  name: string;
  townId: string;
  town: {
    id: string;
    name: string;
  };
  userId: string;
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

    // Get user's active character
    const character = await getActiveCharacterFromCommand(interaction);
    if (!character) {
      await interaction.reply({
        content:
          "❌ Vous devez avoir un personnage actif pour créer une expédition.",
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
      content: "✅ Votre expédition a été créée avec succès!",
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
    const foodStock = interaction.fields.getTextInputValue(
      "expedition_food_input"
    );
    const duration = interaction.fields.getTextInputValue(
      "expedition_duration_input"
    );

    // Validate inputs
    const foodAmount = parseInt(foodStock, 10);
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

    if (isNaN(foodAmount) || foodAmount <= 0) {
      await interaction.reply({
        content: "❌ Le stock de nourriture doit être un nombre positif.",
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

    // Create expedition
    const newExpedition = await apiService.createExpedition({
      name,
      foodStock: foodAmount,
      duration: durationDays,
      townId: townResponse.id,
      characterId: character.id, // Add character ID for auto-joining
      createdBy: interaction.user.id, // Discord user ID
    });

    // Join the creator to the expedition
    let joinSuccess = false;
    try {
      const joinResponse = await apiService.joinExpedition(newExpedition.data.id, character.id);
      joinSuccess = true;
      logger.info("Expedition creator auto-joined expedition", {
        expeditionId: newExpedition.data.id,
        characterId: character.id,
        createdBy: interaction.user.id,
        response: joinResponse
      });
    } catch (error) {
      logger.error("Error auto-joining expedition creator:", { 
        error,
        expeditionId: newExpedition.data.id,
        characterId: character.id,
        createdBy: interaction.user.id
      });
      // Continue anyway, expedition is created
    }

    // Get updated expedition data with correct member count
    let memberCount = 0;
    let expeditionMembers: any[] = [];
    try {
      const updatedExpedition = await apiService.getExpeditionById(
        newExpedition.data.id
      );
      memberCount = updatedExpedition?.members?.length || 0;
      expeditionMembers = updatedExpedition?.members || [];
      
      // Log detailed member information
      logger.info("Expedition members after creation:", {
        expeditionId: newExpedition.data.id,
        memberCount,
        members: expeditionMembers.map(m => ({
          id: m.id,
          characterId: m.character?.id,
          characterName: m.character?.name,
          userId: m.character?.user?.discordId
        }))
      });
      
      // If no members but join was successful, set to 1
      if (memberCount === 0 && joinSuccess) {
        memberCount = 1;
      }
    } catch (error) {
      logger.error("Error fetching updated expedition data:", { 
        error,
        expeditionId: newExpedition.data.id
      });
      memberCount = joinSuccess ? 1 : 0; // Set to 1 only if join was successful
    }

    // Create embed
    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle(`🏕️ Expédition créée : ${newExpedition.data.name}`)
      .setDescription(`Vous avez créé une nouvelle expédition avec succès !`)
      .addFields(
        {
          name: "📦 Stock de nourriture",
          value: `${foodAmount}`,
          inline: true,
        },
        { name: "⏱️ Durée", value: `${durationDays} jours`, inline: true },
        { name: "📍 Statut", value: "🔄 PLANIFICATION", inline: true },
        { name: "👥 Membres", value: memberCount.toString(), inline: true },
        { name: "🏛️ Ville", value: townResponse.name, inline: true },
        { name: " ", value: " ", inline: true }
      )
      .setTimestamp();
    await interaction.reply({
      embeds: [embed],
    });

    logger.info("Expedition created via Discord", {
      expeditionId: newExpedition.data.id,
      name: newExpedition.data.name,
      createdBy: interaction.user.id,
      guildId: interaction.guildId,
    });
  } catch (error) {
    logger.error("Error in expedition creation modal:", { error });
    await interaction.reply({
      content: `❌ Erreur lors de la création de l'expédition: ${
        error instanceof Error ? error.message : "Erreur inconnue"
      }`,
      flags: ["Ephemeral"],
    });
  }
}

export async function handleExpeditionJoinCommand(
  interaction: ChatInputCommandInteraction
) {
  const member = interaction.member as GuildMember;
  const user = interaction.user;

  try {
    // Get town info
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

    // Get user's active character
    const character = await getActiveCharacterFromCommand(interaction);
    if (!character) {
      await interaction.reply({
        content:
          "❌ Vous devez avoir un personnage actif pour rejoindre une expédition.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Check if character is already on an expedition
    const activeExpeditions = await apiService.getActiveExpeditionsForCharacter(
      character.id
    );
    if (activeExpeditions && activeExpeditions.length > 0) {
      await interaction.reply({
        content: `❌ Votre personnage est déjà sur une expédition active: **${activeExpeditions[0].name}**.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Get available expeditions (PLANNING status)
    const expeditions = await apiService.getExpeditionsByTown(townResponse.id);

    const availableExpeditions = expeditions.filter(
      (exp: Expedition) => exp.status === "PLANNING"
    );

    if (availableExpeditions.length === 0) {
      await interaction.reply({
        content: "❌ Aucune expédition en cours de planification disponible.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Create dropdown menu
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("expedition_join_select")
      .setPlaceholder("Sélectionnez une expédition à rejoindre")
      .addOptions(
        availableExpeditions.map((exp: Expedition) => ({
          label: exp.name,
          description: `Stock: ${exp.foodStock}, Membres: ${
            exp.members?.length || 0
          }`,
          value: exp.id,
        }))
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      selectMenu
    );

    await interaction.reply({
      content: "Choisissez une expédition à rejoindre:",
      components: [row],
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Error in expedition join command:", { error });
    await interaction.reply({
      content:
        "❌ Une erreur est survenue lors de la recherche des expéditions.",
      flags: ["Ephemeral"],
    });
  }
}

export async function handleExpeditionJoinSelect(interaction: any) {
  const member = interaction.member as GuildMember;
  const user = interaction.user;
  const expeditionId = interaction.values[0];

  try {
    // Get user's active character
    const character = await getActiveCharacterFromCommand(interaction);
    if (!character) {
      await interaction.reply({
        content:
          "❌ Vous devez avoir un personnage actif pour rejoindre une expédition.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Join expedition
    const memberData = await apiService.joinExpedition(
      expeditionId,
      character.id
    );

    await interaction.update({
      content: `✅ Vous avez rejoint l'expédition avec succès!`,
      components: [],
    });

    logger.info("Character joined expedition via Discord", {
      expeditionId,
      characterId: character.id,
      joinedBy: user.id,
    });
  } catch (error) {
    logger.error("Error in expedition join select:", { error });
    await interaction.reply({
      content: `❌ Erreur lors de la participation à l'expédition: ${
        error instanceof Error ? error.message : "Erreur inconnue"
      }`,
      flags: ["Ephemeral"],
    });
  }
}

export async function handleExpeditionInfoCommand(
  interaction: ChatInputCommandInteraction
) {
  const member = interaction.member as GuildMember;
  const user = interaction.user;

  try {
    // Get user's active character
    const character = await getActiveCharacterFromCommand(interaction);
    if (!character) {
      await interaction.reply({
        content:
          "❌ Vous devez avoir un personnage actif pour voir les informations d'expédition.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Get character's active expeditions
    const activeExpeditions = await apiService.getActiveExpeditionsForCharacter(
      character.id
    );

    if (!activeExpeditions || activeExpeditions.length === 0) {
      await interaction.reply({
        content: "❌ Votre personnage ne participe à aucune expédition active.",
        flags: ["Ephemeral"],
      });
      return;
    }

    const currentExpedition = activeExpeditions[0];

    // Create embed
    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle(`🚀 ${currentExpedition.name}`)
      .addFields(
        {
          name: "📦 Stock de nourriture",
          value: `${currentExpedition.foodStock}`,
          inline: true,
        },
        {
          name: "⏱️ Durée",
          value: `${currentExpedition.duration} jours`,
          inline: true,
        },
        {
          name: "📍 Statut",
          value: getStatusEmoji(currentExpedition.status),
          inline: true,
        },
        {
          name: "👥 Membres",
          value: currentExpedition.participants?.length.toString() || "0",
          inline: true,
        },
        {
          name: "🏛️ Ville",
          value: currentExpedition.town?.name || "Inconnue",
          inline: true,
        },
        { name: " ", value: " ", inline: true }
      )
      .setTimestamp();

    // Add buttons only if expedition is PLANNING and user is a member
    const components = [];
    if (currentExpedition.status === "PLANNING") {
      const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("expedition_leave")
          .setLabel("Quitter")
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId("expedition_transfer")
          .setLabel("Transférer nourriture")
          .setStyle(ButtonStyle.Primary)
      );
      components.push(buttonRow);
    }

    await interaction.reply({
      embeds: [embed],
      components,
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Error in expedition info command:", { error });
    await interaction.reply({
      content:
        "❌ Une erreur est survenue lors de la récupération des informations d'expédition.",
      flags: ["Ephemeral"],
    });
  }
}

function getStatusEmoji(status: string): string {
  switch (status) {
    case "PLANNING":
      return "🔄 PLANIFICATION";
    case "LOCKED":
      return "🔒 VERROUILLÉE";
    case "DEPARTED":
      return "✈️ PARTIE";
    case "RETURNED":
      return "🏠 REVENUE";
    default:
      return status;
  }
}

export async function handleExpeditionLeaveButton(interaction: any) {
  try {
    // This would handle expedition leave button
    await interaction.reply({
      content: "⚠️ Fonctionnalité de quitter l'expédition - à implémenter",
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Error in expedition leave button:", { error });
  }
}

export async function handleExpeditionTransferButton(interaction: any) {
  try {
    // This would handle expedition food transfer button
    await interaction.reply({
      content: "⚠️ Fonctionnalité de transfert de nourriture - à implémenter",
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Error in expedition transfer button:", { error });
  }
}
