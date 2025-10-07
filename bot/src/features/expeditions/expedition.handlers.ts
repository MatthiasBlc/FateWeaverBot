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
import { logger } from "../../services/logger.js";
import { apiService } from "../../services/api.js";
import { sendLogMessage } from "../../utils/channels.js";
import { Expedition } from "../../types/expedition";
import {
  getActiveCharacterFromCommand,
  getActiveCharacterFromModal,
} from "../../utils/character";
import { createExpeditionCreationModal, createExpeditionTransferModal, createExpeditionTransferAmountModal } from "../../modals/expedition-modals";
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

    // Get user's active character FIRST, before showing modal
    let character;
    try {
      character = await getActiveCharacterFromCommand(interaction);
    } catch (error: any) {
      // Handle specific error cases
      if (error?.status === 404 || error?.message?.includes('Request failed with status code 404')) {
        await interaction.reply({
          content: "❌ Aucun personnage vivant trouvé. Si votre personnage est mort, un mort ne peut pas rejoindre une expédition.",
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
      content: `❌ Erreur lors de la création de l'expédition: ${
        error instanceof Error ? error.message : "Erreur inconnue"
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
    console.log("DEBUG: Envoi de la requête de création d'expédition:", {
      name,
      initialResources: [
        { resourceTypeName: "Vivres", quantity: foodAmount }
      ],
      duration: durationDays,
      townId: townResponse.id,
      characterId: character.id,
      createdBy: interaction.user.id,
    });

    const newExpedition = await apiService.createExpedition({
      name,
      initialResources: [
        { resourceTypeName: "Vivres", quantity: foodAmount }
      ],
      duration: durationDays,
      townId: townResponse.id,
      characterId: character.id, // Add character ID for auto-joining
      createdBy: interaction.user.id, // Discord user ID
    });

    console.log("DEBUG: Réponse de création d'expédition reçue:", newExpedition);

    // Join the creator to the expedition
    let joinSuccess = false;
    try {
      const joinResponse = await apiService.joinExpedition(
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
      const updatedExpedition = await apiService.getExpeditionById(
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
      flags: ["Ephemeral"],
    });

    // Send log message to configured log channel
    const logMessage = `🏕️ Nouvelle expédition créée : "**${newExpedition.data.name}**" par **${character.name}**\n📦 Stock nourriture : ${foodAmount}\n⏱️ Durée : ${durationDays} jours\n🏛️ Ville : ${townResponse.name}`;
    await sendLogMessage(interaction.guildId!, interaction.client, logMessage);

    logger.info("Expedition created via Discord", {
      expeditionId: newExpedition.data.id,
      name: newExpedition.data.name,
      createdBy: interaction.user.id,
      guildId: interaction.guildId,
      characterId: character.id,
      characterName: character.name,
      townId: townResponse.id,
      townName: townResponse.name,
      foodStock: foodAmount,
      duration: durationDays,
      memberCount: memberCount,
      autoJoinSuccess: joinSuccess,
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
    let character;
    try {
      character = await getActiveCharacterFromCommand(interaction);
    } catch (error: any) {
      // Handle specific error cases
      if (error?.status === 404 || error?.message?.includes('Request failed with status code 404')) {
        await interaction.reply({
          content: "❌ Aucun personnage vivant trouvé. Si votre personnage est mort, un mort ne peut pas rejoindre une expédition.",
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
        content: "❌ Un mort ne peut pas rejoindre une expédition.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Check if character is already in an active expedition
    const activeExpeditions = await apiService.getActiveExpeditionsForCharacter(character.id);
    
    if (activeExpeditions && activeExpeditions.length > 0) {
      const activeExpedition = activeExpeditions[0]; // Prend la première expédition active trouvée
      await interaction.reply({
        content: `❌ Vous êtes déjà dans l'expédition **${activeExpedition.name}** (${getStatusEmoji(activeExpedition.status)} ${activeExpedition.status.toLowerCase()}).`,
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
          description: `Durée: ${exp.duration}j, Membres: 0`, // Plus d'accès à foodStock et members
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
    let character;
    try {
      character = await getActiveCharacterFromCommand(interaction);
    } catch (error: any) {
      // Handle specific error cases
      if (error?.status === 404 || error?.message?.includes('Request failed with status code 404')) {
        await interaction.reply({
          content: "❌ Aucun personnage vivant trouvé. Si votre personnage est mort, un mort ne peut pas rejoindre une expédition.",
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
        content: "❌ Un mort ne peut pas rejoindre une expédition.",
        flags: ["Ephemeral"],
      });
      return;
    }

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
    let character;
    try {
      character = await getActiveCharacterFromCommand(interaction);
    } catch (error: any) {
      // Handle specific error cases
      if (error?.status === 404 || error?.message?.includes('Request failed with status code 404')) {
        await interaction.reply({
          content: "❌ Aucun personnage vivant trouvé. Si votre personnage est mort, un mort ne peut pas rejoindre une expédition.",
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
          value: currentExpedition.members?.length.toString() || "0",
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

    // Add member list if there are members
    if (currentExpedition.members && currentExpedition.members.length > 0) {
      const memberList = currentExpedition.members
        .map((member) => {
          const characterName = member.character?.name || "Inconnu";
          const discordUsername = member.character?.user?.username || "Inconnu";
          return `• **${characterName}** - ${discordUsername}`;
        })
        .join("\n");

      embed.addFields({
        name: "📋 Membres inscrits",
        value: memberList,
        inline: false,
      });
    }

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
    // Get user's active character
    let character;
    try {
      character = await getActiveCharacterFromCommand(interaction);
    } catch (error: any) {
      // Handle specific error cases
      if (error?.status === 404 || error?.message?.includes('Request failed with status code 404')) {
        await interaction.reply({
          content: "❌ Vous devez avoir un personnage actif pour quitter une expédition. Utilisez d'abord la commande `/start` pour créer un personnage.",
          flags: ["Ephemeral"],
        });
        return;
      }
      // Re-throw other errors
      throw error;
    }

    if (!character) {
      await interaction.reply({
        content: "❌ Vous devez avoir un personnage actif pour quitter une expédition.",
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

    // Double-check that the character is actually a member
    const isMember = currentExpedition.members?.some(
      (member) => member.character?.id === character.id
    );

    if (!isMember) {
      await interaction.reply({
        content: "❌ Votre personnage n'est pas membre de cette expédition.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Check if expedition is in PLANNING status (only time you can leave)
    if (currentExpedition.status !== "PLANNING") {
      await interaction.reply({
        content: `❌ Vous ne pouvez pas quitter une expédition qui est déjà **${getStatusEmoji(currentExpedition.status).split(' ')[1]}**.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Leave the expedition
    await apiService.leaveExpedition(currentExpedition.id, character.id);

    // Check if expedition was terminated (last member left)
    let expeditionTerminated = false;
    try {
      const updatedExpedition = await apiService.getExpeditionById(currentExpedition.id);
      expeditionTerminated = updatedExpedition?.status === "RETURNED";
    } catch (error) {
      // Expedition might have been deleted if terminated
      expeditionTerminated = true;
    }

    if (expeditionTerminated) {
      // Update the message to show expedition was terminated
      await interaction.update({
        content: `✅ Vous avez quitté l'expédition avec succès!\n\n🏁 **L'expédition a été terminée automatiquement** car vous étiez le dernier membre. Toute la nourriture restante a été restituée à la ville.`,
        embeds: [],
        components: [],
      });

      // Send log message
      const logMessage = `🚪 **${character.name}** a quitté l'expédition "**${currentExpedition.name}**" (dernier membre - expédition terminée)`;
      await sendLogMessage(interaction.guildId!, interaction.client, logMessage);
    } else {
      // Update the message to show successful departure
      await interaction.update({
        content: `✅ Vous avez quitté l'expédition **${currentExpedition.name}** avec succès!`,
        embeds: [],
        components: [],
      });

      // Send log message
      const logMessage = `🚪 **${character.name}** a quitté l'expédition "**${currentExpedition.name}**"`;
      await sendLogMessage(interaction.guildId!, interaction.client, logMessage);
    }

    logger.info("Character left expedition via Discord button", {
      expeditionId: currentExpedition.id,
      characterId: character.id,
      characterName: character.name,
      joinedBy: interaction.user.id,
      expeditionTerminated,
    });

  } catch (error) {
    logger.error("Error in expedition leave button:", { error });
    await interaction.reply({
      content: `❌ Erreur lors du départ de l'expédition: ${
        error instanceof Error ? error.message : "Erreur inconnue"
      }`,
      flags: ["Ephemeral"],
    });
  }
}

export async function handleExpeditionTransferButton(interaction: any) {
  try {
    // Get user's active character
    let character;
    try {
      character = await getActiveCharacterFromCommand(interaction);
    } catch (error: any) {
      // Handle specific error cases
      if (error?.status === 404 || error?.message?.includes('Request failed with status code 404')) {
        await interaction.reply({
          content: "❌ Vous devez avoir un personnage actif pour transférer de la nourriture. Utilisez d'abord la commande `/start` pour créer un personnage.",
          flags: ["Ephemeral"],
        });
        return;
      }
      // Re-throw other errors
      throw error;
    }

    if (!character) {
      await interaction.reply({
        content: "❌ Vous devez avoir un personnage actif pour transférer de la nourriture.",
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

    // Double-check that the character is actually a member
    const isMember = currentExpedition.members?.some(
      (member) => member.character?.id === character.id
    );

    if (!isMember) {
      await interaction.reply({
        content: "❌ Votre personnage n'est pas membre de cette expédition.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Check if expedition is in PLANNING status (only time you can transfer)
    if (currentExpedition.status !== "PLANNING") {
      await interaction.reply({
        content: `❌ Vous ne pouvez pas transférer de nourriture dans une expédition qui est déjà **${getStatusEmoji(currentExpedition.status).split(' ')[1]}**.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Get town information for current food stock
    const townResponse = await apiService.getTownByGuildId(interaction.guildId!);
    if (!townResponse) {
      await interaction.reply({
        content: "❌ Aucune ville trouvée pour ce serveur.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Show direction selection menu instead of modal directly
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("expedition_transfer_direction")
      .setPlaceholder("Sélectionnez la direction du transfert")
      .addOptions([
        {
          label: "Vers la ville",
          description: `Ajouter de la nourriture à la ville (stock actuel: ${townResponse.foodStock})`,
          value: "to_town",
          emoji: "🏛️",
        },
        {
          label: "Vers l'expédition",
          description: `Ajouter de la nourriture à l'expédition (stock actuel: ${currentExpedition.foodStock})`,
          value: "from_town",
          emoji: "⛺",
        },
      ]);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    await interaction.reply({
      content: "Choisissez la direction du transfert de nourriture :",
      components: [row],
      flags: ["Ephemeral"],
    });

    logger.info("Expedition transfer direction selection shown", {
      expeditionId: currentExpedition.id,
      characterId: character.id,
      characterName: character.name,
      expeditionFoodStock: currentExpedition.foodStock,
      townFoodStock: townResponse.foodStock,
    });

  } catch (error) {
    logger.error("Error in expedition transfer button:", { error });
    await interaction.reply({
      content: `❌ Erreur lors de l'ouverture du transfert de nourriture: ${
        error instanceof Error ? error.message : "Erreur inconnue"
      }`,
      flags: ["Ephemeral"],
    });
  }
}

export async function handleExpeditionTransferDirectionSelect(interaction: any) {
  try {
    logger.info("Expedition transfer direction select handler called", {
      customId: interaction.customId,
      values: interaction.values,
    });

    // Get user's active character
    let character;
    try {
      character = await getActiveCharacterFromCommand(interaction);
    } catch (error: any) {
      // Handle specific error cases
      if (error?.status === 404 || error?.message?.includes('Request failed with status code 404')) {
        await interaction.reply({
          content: "❌ Vous devez avoir un personnage actif pour transférer de la nourriture.",
          flags: ["Ephemeral"],
        });
        return;
      }
      // Re-throw other errors
      throw error;
    }

    if (!character) {
      await interaction.reply({
        content: "❌ Vous devez avoir un personnage actif pour transférer de la nourriture.",
        flags: ["Ephemeral"],
      });
      return;
    }

    logger.info("Character found in transfer direction select", {
      characterId: character.id,
      characterName: character.name,
    });

    const selectedDirection = interaction.values[0];

    logger.info("Selected direction", { selectedDirection });

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

    // Double-check that the character is actually a member
    const isMember = currentExpedition.members?.some(
      (member) => member.character?.id === character.id
    );

    logger.info("Expedition membership check", {
      expeditionId: currentExpedition.id,
      characterId: character.id,
      isMember,
      expeditionStatus: currentExpedition.status,
    });

    if (!isMember) {
      await interaction.reply({
        content: "❌ Votre personnage n'est pas membre de cette expédition.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Check if expedition is still in PLANNING status
    if (currentExpedition.status !== "PLANNING") {
      await interaction.reply({
        content: `❌ Cette expédition n'est plus en phase de planification et ne peut plus recevoir de transferts.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Get town information for validation
    const townResponse = await apiService.getTownByGuildId(interaction.guildId!);
    if (!townResponse) {
      await interaction.reply({
        content: "❌ Aucune ville trouvée pour ce serveur.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Show amount input modal with selected direction
    const maxAmount = selectedDirection === "to_town"
      ? currentExpedition.foodStock
      : townResponse.foodStock;

    logger.info("Creating transfer modal", {
      expeditionId: currentExpedition.id,
      selectedDirection,
      maxAmount,
      expeditionFoodStock: currentExpedition.foodStock,
      townFoodStock: townResponse.foodStock,
    });

    const modal = createExpeditionTransferAmountModal(
      currentExpedition.id,
      selectedDirection,
      maxAmount
    );

    await interaction.showModal(modal);

    logger.info("Expedition transfer amount modal shown", {
      expeditionId: currentExpedition.id,
      characterId: character.id,
      characterName: character.name,
      selectedDirection,
      maxAmount,
    });

  } catch (error) {
    logger.error("Error in expedition transfer direction select:", { error });
    await interaction.reply({
      content: `❌ Erreur lors de la sélection de direction: ${
        error instanceof Error ? error.message : "Erreur inconnue"
      }`,
      flags: ["Ephemeral"],
    });
  }
}

export async function handleExpeditionTransferModal(interaction: ModalSubmitInteraction) {
  try {
    // Get user's active character
    let character;
    try {
      character = await getActiveCharacterFromModal(interaction);
    } catch (error: any) {
      // Handle specific error cases
      if (error?.status === 404 || error?.message?.includes('Request failed with status code 404')) {
        await interaction.reply({
          content: "❌ Aucun personnage vivant trouvé. Si votre personnage est mort, un mort ne peut pas transférer de nourriture.",
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

    // Get form inputs
    const amountValue = interaction.fields.getTextInputValue("transfer_amount_input");

    // Get direction from modal custom ID (format: expedition_transfer_amount_modal_{expeditionId}_{direction})
    const modalCustomId = interaction.customId;
    const parts = modalCustomId.split('_');

    logger.info("Modal parsing debug", {
      modalCustomId,
      parts,
      partsLength: parts.length,
    });

    // Extract direction from the end of the ID
    // The direction is either "to_town" or "from_town" (both contain underscores)
    let directionValue = "";
    if (modalCustomId.endsWith("_to_town")) {
      directionValue = "to_town";
    } else if (modalCustomId.endsWith("_from_town")) {
      directionValue = "from_town";
    }

    logger.info("Direction extraction", {
      modalCustomId,
      directionValue,
      endsWith_to_town: modalCustomId.endsWith("_to_town"),
      endsWith_from_town: modalCustomId.endsWith("_from_town"),
    });

    // Validate direction
    if (!["to_town", "from_town"].includes(directionValue)) {
      await interaction.reply({
        content: "❌ Direction de transfert invalide.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Validate amount input
    const amount = parseInt(amountValue, 10);
    if (isNaN(amount) || amount <= 0) {
      await interaction.reply({
        content: "❌ Le montant doit être un nombre positif.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Get expedition ID from modal custom ID (format: expedition_transfer_amount_modal_{expeditionId}_{direction})
    const modalPrefix = "expedition_transfer_amount_modal_";
    const expeditionId = modalCustomId.substring(
      modalPrefix.length,
      modalCustomId.lastIndexOf('_' + directionValue)
    );

    logger.info("Expedition ID parsing debug", {
      modalCustomId,
      modalPrefix,
      directionValue,
      lastIndexOf: modalCustomId.lastIndexOf('_' + directionValue),
      expeditionId,
      expeditionIdLength: expeditionId.length,
    });

    // Get current expedition data
    const expedition = await apiService.getExpeditionById(expeditionId);
    if (!expedition) {
      await interaction.reply({
        content: "❌ Expédition introuvable.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Verify character is a member
    const isMember = expedition.members?.some(
      (member) => member.character?.id === character.id
    );
    if (!isMember) {
      await interaction.reply({
        content: "❌ Votre personnage n'est pas membre de cette expédition.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Check if expedition is still in PLANNING status
    if (expedition.status !== "PLANNING") {
      await interaction.reply({
        content: `❌ Cette expédition n'est plus en phase de planification et ne peut plus recevoir de transferts.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Get town data for validation
    const townResponse = await apiService.getTownByGuildId(interaction.guildId!);
    if (!townResponse) {
      await interaction.reply({
        content: "❌ Aucune ville trouvée pour ce serveur.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Validate transfer based on direction
    if (directionValue === "to_town") {
      // Transferring FROM expedition TO town
      if (amount > expedition.foodStock) {
        await interaction.reply({
          content: `❌ L'expédition n'a que ${expedition.foodStock} nourriture. Vous ne pouvez pas en retirer ${amount}.`,
          flags: ["Ephemeral"],
        });
        return;
      }
    } else {
      // Transferring FROM town TO expedition
      if (amount > townResponse.foodStock) {
        await interaction.reply({
          content: `❌ La ville n'a que ${townResponse.foodStock} nourriture. Vous ne pouvez pas en ajouter ${amount} à l'expédition.`,
          flags: ["Ephemeral"],
        });
        return;
      }
    }

    // Perform the transfer
    let transferSuccess = false;
    try {
      if (directionValue === "to_town") {
        // Transfer from expedition to town
        await apiService.transferExpeditionFood(expeditionId, amount, "to_town");
      } else {
        // Transfer from town to expedition
        await apiService.transferExpeditionFood(expeditionId, amount, "from_town");
      }
      transferSuccess = true;
    } catch (error) {
      logger.error("Error during food transfer:", { error, expeditionId, characterId: character.id, amount, direction: directionValue });
      await interaction.reply({
        content: `❌ Erreur lors du transfert: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
        flags: ["Ephemeral"],
      });
      return;
    }

    if (transferSuccess) {
      // Get updated data for response
      const updatedExpedition = await apiService.getExpeditionById(expeditionId);
      const updatedTown = await apiService.getTownByGuildId(interaction.guildId!);

      // Create response embed
      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle(`✅ Transfert de nourriture réussi`)
        .setDescription(`Le transfert de **${amount}** nourriture a été effectué avec succès !`)
        .addFields(
          {
            name: "📦 Stock de l'expédition",
            value: `${updatedExpedition?.foodStock || expedition.foodStock}`,
            inline: true,
          },
          {
            name: "🏛️ Stock de la ville",
            value: `${updatedTown?.foodStock || townResponse.foodStock}`,
            inline: true,
          },
          {
            name: "📍 Direction",
            value: directionValue === "to_town" ? "Expédition → Ville" : "Ville → Expédition",
            inline: true,
          }
        )
        .setTimestamp();

      await interaction.reply({
        embeds: [embed],
        flags: ["Ephemeral"],
      });

      // Send log message
      const directionText = directionValue === "to_town" ? "vers la ville" : "vers l'expédition";
      const logMessage = `🍖 **${character.name}** a transféré **${amount}** nourriture ${directionText} dans l'expédition "**${expedition.name}**"`;
      await sendLogMessage(interaction.guildId!, interaction.client, logMessage);

      logger.info("Expedition food transfer completed", {
        expeditionId,
        characterId: character.id,
        characterName: character.name,
        amount,
        direction: directionValue,
        previousExpeditionStock: expedition.foodStock,
        previousTownStock: townResponse.foodStock,
        newExpeditionStock: updatedExpedition?.foodStock,
        newTownStock: updatedTown?.foodStock,
      });
    }

  } catch (error) {
    logger.error("Error in expedition transfer modal:", { error });
    await interaction.reply({
      content: `❌ Erreur lors du traitement du transfert: ${
        error instanceof Error ? error.message : "Erreur inconnue"
      }`,
      flags: ["Ephemeral"],
    });
  }
}
