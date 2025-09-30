import {
  EmbedBuilder,
  type ChatInputCommandInteraction,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ComponentType,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { apiService } from "../../services/api";
import { logger } from "../../services/logger";
import { checkAdmin } from "../../utils/roles";
import { getHungerLevelText } from "../../utils/hunger";

// Interfaces pour typer les données
interface Character {
  id: string;
  name: string;
  paTotal: number;
  hungerLevel: number;
  isDead: boolean;
  canReroll: boolean;
  isActive: boolean;
  userId: string;
  townId: string;
  user?: {
    id: string;
    discordId: string;
    username: string;
    discriminator: string;
    globalName: string;
    avatar: string;
  };
  town?: {
    id: string;
    name: string;
    foodStock: number;
    guildId: string;
  };
}

interface Town {
  id: string;
  name: string;
  foodStock: number;
  guildId: string;
  guild?: {
    id: string;
    discordGuildId: string;
    name: string;
  };
  chantiers?: any[];
}

export async function handleCharacterAdminCommand(
  interaction: ChatInputCommandInteraction
) {
  try {
    logger.info("Début de handleCharacterAdminCommand", {
      guildId: interaction.guildId,
      userId: interaction.user.id,
    });

    // Vérifier que l'utilisateur est admin
    const isUserAdmin = await checkAdmin(interaction);
    if (!isUserAdmin) {
      logger.warn("Utilisateur non admin tente d'utiliser la commande character-admin", {
        userId: interaction.user.id,
        guildId: interaction.guildId,
      });
      return;
    }

    logger.info("Utilisateur vérifié comme admin", {
      userId: interaction.user.id,
      guildId: interaction.guildId,
    });

    // Récupérer la ville du serveur
    const town = await apiService.getTownByGuildId(interaction.guildId!) as Town | null;

    if (!town || !town.id) {
      logger.warn("Aucune ville trouvée pour le serveur", {
        guildId: interaction.guildId,
      });
      await interaction.reply({
        content: "❌ Aucune ville trouvée pour ce serveur.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Récupérer tous les personnages de la ville
    const characters = await apiService.getTownCharacters(town.id) as Character[];

    if (!characters || characters.length === 0) {
      await interaction.reply({
        content: "❌ Aucun personnage trouvé dans cette ville.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Créer le menu de sélection des personnages
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("character_select")
      .setPlaceholder("Choisissez un personnage à gérer")
      .addOptions(
        characters.map((character: any) =>
          new StringSelectMenuOptionBuilder()
            .setLabel(`${character.name}`)
            .setDescription(
              `Actif: ${character.isActive ? '✅' : '❌'} | Mort: ${character.isDead ? '💀' : '❤️'} | Reroll: ${character.canReroll ? '✅' : '❌'}`
            )
            .setValue(character.id)
        )
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    await interaction.reply({
      content: "👤 **Administration des Personnages**\nSélectionnez un personnage à gérer :",
      components: [row],
      flags: ["Ephemeral"],
    });

    // Créer un event listener pour gérer la sélection du personnage
    const filter = (i: any) =>
      i.customId === "character_select" && i.user.id === interaction.user.id;

    try {
      const selectInteraction = await interaction.channel?.awaitMessageComponent({
        filter,
        componentType: ComponentType.StringSelect,
        time: 60000, // 1 minute au lieu de 5
      });

      if (!selectInteraction) {
        await interaction.followUp({
          content: "❌ Temps écoulé lors de la sélection du personnage.",
          flags: ["Ephemeral"],
        });
        return;
      }

      const selectedCharacterId = selectInteraction.values[0];
      const selectedCharacter = characters.find((c: Character) => c.id === selectedCharacterId);

      if (!selectedCharacter) {
        await selectInteraction.reply({
          content: "❌ Personnage non trouvé.",
          flags: ["Ephemeral"],
        });
        return;
      }

      // Créer les boutons d'action
      const actionRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId("character_stats")
            .setLabel("Modifier Stats")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId("character_kill")
            .setLabel("Tuer Personnage")
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId("character_reroll")
            .setLabel(`${selectedCharacter.canReroll ? 'Révoquer' : 'Autoriser'} Reroll`)
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId("character_switch")
            .setLabel(`${selectedCharacter.isActive ? 'Désactiver' : 'Activer'}`)
            .setStyle(ButtonStyle.Success)
        );

      await selectInteraction.reply({
        content: `**${selectedCharacter.name}**\n` +
          `Actif: ${selectedCharacter.isActive ? '✅' : '❌'}\n` +
          `Mort: ${selectedCharacter.isDead ? '💀' : '❤️'}\n` +
          `Reroll autorisé: ${selectedCharacter.canReroll ? '✅' : '❌'}\n` +
          `PA: ${selectedCharacter.paTotal} | Faim: ${getHungerLevelText(selectedCharacter.hungerLevel)}\n\n` +
          `Choisissez une action :`,
        components: [actionRow],
        flags: ["Ephemeral"],
      });

      // Gérer les actions sur le personnage
      const buttonFilter = (i: any) =>
        ["character_stats", "character_kill", "character_reroll", "character_switch"].includes(i.customId) &&
        i.user.id === interaction.user.id;

      const buttonInteraction = await selectInteraction.channel?.awaitMessageComponent({
        filter: buttonFilter,
        componentType: ComponentType.Button,
        time: 60000, // 1 minute au lieu de 5
      });

      if (!buttonInteraction) {
        await selectInteraction.followUp({
          content: "❌ Temps écoulé lors du choix de l'action.",
          flags: ["Ephemeral"],
        });
        return;
      }

      switch (buttonInteraction.customId) {
        case "character_stats":
          await handleStatsUpdate(buttonInteraction, selectedCharacter);
          break;
        case "character_kill":
          await handleKillCharacter(buttonInteraction, selectedCharacter);
          break;
        case "character_reroll":
          await handleRerollPermission(buttonInteraction, selectedCharacter);
          break;
        case "character_switch":
          await handleSwitchActive(buttonInteraction, selectedCharacter, town.id);
          break;
      }

    } catch (error) {
      logger.error("Erreur lors de la sélection ou action sur le personnage:", { error });
      if (error && typeof error === 'object' && 'code' in error) {
        if (error.code === 10062) { // Unknown interaction
          logger.warn("Interaction expirée");
          return; // Ne pas répondre si l'interaction est déjà expirée
        }
        if (error.code === 'InteractionCollectorError') {
          logger.warn("Timeout d'interaction");
          if (!interaction.replied) {
            await interaction.followUp({
              content: "❌ Temps écoulé. Veuillez relancer la commande.",
              flags: ["Ephemeral"],
            }).catch(() => {});
          }
          return;
        }
      }

      if (!interaction.replied) {
        await interaction.followUp({
          content: "❌ Erreur lors de la sélection/modification du personnage.",
          flags: ["Ephemeral"],
        }).catch(() => {});
      }
    }
  } catch (error) {
    logger.error("Erreur lors de la préparation de la commande character-admin:", {
      guildId: interaction.guildId,
      userId: interaction.user.id,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
    });
    await interaction.reply({
      content: "❌ Une erreur est survenue lors de la préparation de la commande.",
      flags: ["Ephemeral"],
    });
  }
}

async function handleStatsUpdate(interaction: any, character: Character) {
  try {
    const modal = createCharacterStatsModal(character);

    // Afficher la modale
    await interaction.showModal(modal);

    const modalFilter = (i: any) =>
      i.customId === "character_stats_modal" && i.user.id === interaction.user.id;
    const modalInteraction = await interaction.awaitModalSubmit({
      filter: modalFilter,
      time: 120000, // 2 minutes au lieu de 5
    });

    if (!modalInteraction) {
      await interaction.followUp({
        content: "❌ Temps écoulé lors de la saisie des statistiques.",
        flags: ["Ephemeral"],
      });
      return;
    }

    const paValue = modalInteraction.fields.getTextInputValue("pa_input");
    const hungerValue = modalInteraction.fields.getTextInputValue("hunger_input");
    const isDeadValue = modalInteraction.fields.getTextInputValue("is_dead_input");
    const canRerollValue = modalInteraction.fields.getTextInputValue("can_reroll_input");
    const isActiveValue = modalInteraction.fields.getTextInputValue("is_active_input");

    const paNumber = parseInt(paValue, 10);
    const hungerNumber = parseInt(hungerValue, 10);
    const isDeadBool = isDeadValue.toLowerCase() === 'true';
    const canRerollBool = canRerollValue.toLowerCase() === 'true';
    const isActiveBool = isActiveValue.toLowerCase() === 'true';

    // Validation des valeurs
    const errors = [];
    if (isNaN(paNumber) || paNumber < 0 || paNumber > 4) {
      errors.push("Les PA doivent être un nombre entre 0 et 4");
    }
    if (isNaN(hungerNumber) || hungerNumber < 0 || hungerNumber > 4) {
      errors.push("Le niveau de faim doit être un nombre entre 0 et 4");
    }

    if (errors.length > 0) {
      await modalInteraction.reply({
        content: `❌ ${errors.join(", ")}`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Préparer les données de mise à jour
    const updateData: any = {};
    if (!isNaN(paNumber)) updateData.paTotal = paNumber;
    if (!isNaN(hungerNumber)) updateData.hungerLevel = hungerNumber;
    if (isDeadValue !== '') updateData.isDead = isDeadBool;
    if (canRerollValue !== '') updateData.canReroll = canRerollBool;
    if (isActiveValue !== '') updateData.isActive = isActiveBool;

    // Mettre à jour le personnage
    const updatedCharacter = await apiService.updateCharacterStats(character.id, updateData) as Character;

    // Créer l'embed de confirmation
    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle("✅ Personnage Modifié")
      .setDescription(`**${character.name}** a été modifié avec succès.`)
      .addFields(
        {
          name: "PA",
          value: `${character.paTotal || 0} → ${paNumber}`,
          inline: true,
        },
        {
          name: "Faim",
          value: `${getHungerLevelText(character.hungerLevel || 0)} → ${getHungerLevelText(hungerNumber)}`,
          inline: true,
        },
        {
          name: "État",
          value: `${character.isDead ? '💀' : '❤️'} → ${isDeadBool ? '💀' : '❤️'}`,
          inline: true,
        }
      )
      .setTimestamp();

    await modalInteraction.reply({ embeds: [embed], flags: ["Ephemeral"] });
  } catch (error) {
    logger.error("Erreur lors de la modification des stats:", { error });
    if (error && typeof error === 'object' && 'code' in error && error.code === 10062) { // Unknown interaction
      logger.warn("Interaction expirée lors de la modification des stats");
      // L'utilisateur verra probablement l'erreur côté Discord
      return;
    } else {
      // Essayer de répondre si l'interaction n'est pas expirée
      try {
        await interaction.followUp({
          content: "❌ Erreur lors de la modification des statistiques.",
          flags: ["Ephemeral"],
        });
      } catch (followUpError) {
        logger.error("Impossible de répondre à l'interaction expirée:", { followUpError });
      }
    }
  }
}

async function handleKillCharacter(interaction: any, character: any) {
  try {
    if (character.isDead) {
      await interaction.reply({
        content: "❌ Ce personnage est déjà mort.",
        flags: ["Ephemeral"],
      });
      return;
    }

    await apiService.killCharacter(character.id);

    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle("💀 Personnage Tué")
      .setDescription(`**${character.name}** a été tué.`)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], flags: ["Ephemeral"] });
  } catch (error) {
    logger.error("Erreur lors de la suppression du personnage:", { error });
    if (error && typeof error === 'object' && 'code' in error && error.code === 10062) {
      logger.warn("Interaction expirée lors de la suppression du personnage");
      return; // Interaction expirée
    }
    // Essayer de répondre si l'interaction n'est pas expirée
    try {
      await interaction.reply({
        content: "❌ Erreur lors de la suppression du personnage.",
        flags: ["Ephemeral"],
      });
    } catch (replyError) {
      logger.error("Impossible de répondre à l'interaction expirée:", { replyError });
    }
  }
}

async function handleRerollPermission(interaction: any, character: any) {
  try {
    if (!character.isDead) {
      await interaction.reply({
        content: "❌ Seul un personnage mort peut avoir l'autorisation de reroll.",
        flags: ["Ephemeral"],
      });
      return;
    }

    const newCanReroll = !character.canReroll;
    await apiService.updateCharacterStats(character.id, { canReroll: newCanReroll });

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle(`🔄 Autorisation de Reroll ${newCanReroll ? 'Accordée' : 'Révoquée'}`)
      .setDescription(`**${character.name}** ${newCanReroll ? 'peut maintenant' : 'ne peut plus'} créer un nouveau personnage.`)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], flags: ["Ephemeral"] });
  } catch (error) {
    logger.error("Erreur lors de la gestion du reroll:", { error });
    if (error && typeof error === 'object' && 'code' in error && error.code === 10062) {
      logger.warn("Interaction expirée lors de la gestion du reroll");
      return; // Interaction expirée
    }
    // Essayer de répondre si l'interaction n'est pas expirée
    try {
      await interaction.reply({
        content: "❌ Erreur lors de la gestion du reroll.",
        flags: ["Ephemeral"],
      });
    } catch (replyError) {
      logger.error("Impossible de répondre à l'interaction expirée:", { replyError });
    }
  }
}

async function handleSwitchActive(interaction: any, character: any, townId: string) {
  try {
    if (character.isDead) {
      await interaction.reply({
        content: "❌ Un personnage mort ne peut pas être activé.",
        flags: ["Ephemeral"],
      });
      return;
    }

    const newIsActive = !character.isActive;

    if (newIsActive) {
      // Activer ce personnage (désactivera automatiquement les autres)
      await apiService.switchActiveCharacter(character.userId, townId, character.id);
    } else {
      // Désactiver ce personnage (mais garder au moins un actif)
      await apiService.updateCharacterStats(character.id, { isActive: false });
    }

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle(`⚡ Personnage ${newIsActive ? 'Activé' : 'Désactivé'}`)
      .setDescription(`**${character.name}** est maintenant ${newIsActive ? 'actif' : 'inactif'}.`)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], flags: ["Ephemeral"] });
  } catch (error) {
    logger.error("Erreur lors du changement de statut actif:", { error });
    if (error && typeof error === 'object' && 'code' in error && error.code === 10062) {
      logger.warn("Interaction expirée lors du changement de statut actif");
      return; // Interaction expirée
    }
    // Essayer de répondre si l'interaction n'est pas expirée
    try {
      await interaction.reply({
        content: "❌ Erreur lors du changement de statut actif.",
        flags: ["Ephemeral"],
      });
    } catch (replyError) {
      logger.error("Impossible de répondre à l'interaction expirée:", { replyError });
    }
  }
}

function createCharacterStatsModal(character: any) {
  const modal = new ModalBuilder()
    .setCustomId("character_stats_modal")
    .setTitle(`Modifier ${character.name}`);

  const paInput = new TextInputBuilder()
    .setCustomId("pa_input")
    .setLabel("Points d'Action (0-4)")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder("Entrez un nombre entre 0 et 4")
    .setValue((character.paTotal || 0).toString())
    .setMinLength(1)
    .setMaxLength(1);

  const hungerInput = new TextInputBuilder()
    .setCustomId("hunger_input")
    .setLabel("Niveau de Faim (0-4)")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder("Entrez un nombre entre 0 et 4")
    .setValue((character.hungerLevel || 0).toString())
    .setMinLength(1)
    .setMaxLength(1);

  const isDeadInput = new TextInputBuilder()
    .setCustomId("is_dead_input")
    .setLabel("Mort (true/false)")
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setPlaceholder("true ou false")
    .setValue(character.isDead ? 'true' : 'false')
    .setMinLength(1)
    .setMaxLength(5);

  const canRerollInput = new TextInputBuilder()
    .setCustomId("can_reroll_input")
    .setLabel("Autoriser Reroll (true/false)")
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setPlaceholder("true ou false")
    .setValue(character.canReroll ? 'true' : 'false')
    .setMinLength(1)
    .setMaxLength(5);

  const isActiveInput = new TextInputBuilder()
    .setCustomId("is_active_input")
    .setLabel("Actif (true/false)")
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setPlaceholder("true ou false")
    .setValue(character.isActive ? 'true' : 'false')
    .setMinLength(1)
    .setMaxLength(5);

  const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(paInput);
  const secondRow = new ActionRowBuilder<TextInputBuilder>().addComponents(hungerInput);
  const thirdRow = new ActionRowBuilder<TextInputBuilder>().addComponents(isDeadInput);
  const fourthRow = new ActionRowBuilder<TextInputBuilder>().addComponents(canRerollInput);
  const fifthRow = new ActionRowBuilder<TextInputBuilder>().addComponents(isActiveInput);

  modal.addComponents([firstRow, secondRow, thirdRow, fourthRow, fifthRow]);

  return modal;
}

// Fonction supprimée - maintenant dans utils/hunger.ts

/**
 * Gestionnaire pour les soumissions de modal d'administration de personnages
 * Utilisé par le système centralisé de gestion des modals
 */
export async function handleCharacterStatsModal(interaction: any) {
  const paValue = interaction.fields.getTextInputValue("pa_input");
  const hungerValue = interaction.fields.getTextInputValue("hunger_input");
  const isDeadValue = interaction.fields.getTextInputValue("is_dead_input");
  const canRerollValue = interaction.fields.getTextInputValue("can_reroll_input");
  const isActiveValue = interaction.fields.getTextInputValue("is_active_input");

  const paNumber = parseInt(paValue, 10);
  const hungerNumber = parseInt(hungerValue, 10);
  const isDeadBool = isDeadValue.toLowerCase() === 'true';
  const canRerollBool = canRerollValue.toLowerCase() === 'true';
  const isActiveBool = isActiveValue.toLowerCase() === 'true';

  // Validation des valeurs
  const errors = [];
  if (isNaN(paNumber) || paNumber < 0 || paNumber > 4) {
    errors.push("Les PA doivent être un nombre entre 0 et 4");
  }
  if (isNaN(hungerNumber) || hungerNumber < 0 || hungerNumber > 4) {
    errors.push("Le niveau de faim doit être un nombre entre 0 et 4");
  }

  if (errors.length > 0) {
    await interaction.reply({
      content: `❌ ${errors.join(", ")}`,
      flags: ["Ephemeral"],
    });
    return;
  }

  // Préparer les données de mise à jour
  const updateData: any = {};
  if (!isNaN(paNumber)) updateData.paTotal = paNumber;
  if (!isNaN(hungerNumber)) updateData.hungerLevel = hungerNumber;
  if (isDeadValue !== '') updateData.isDead = isDeadBool;
  if (canRerollValue !== '') updateData.canReroll = canRerollBool;
  if (isActiveValue !== '') updateData.isActive = isActiveBool;

  // Mettre à jour le personnage
  const updatedCharacter = await apiService.updateCharacterStats(interaction.customId.split('_')[0], updateData) as Character;

  // Créer l'embed de confirmation
  const embed = new EmbedBuilder()
    .setColor(0x00ff00)
    .setTitle("✅ Personnage Modifié")
    .setDescription(`**${updatedCharacter.name}** a été modifié avec succès.`)
    .addFields(
      {
        name: "PA",
        value: `${paNumber}`,
        inline: true,
      },
      {
        name: "Faim",
        value: `${getHungerLevelText(hungerNumber)}`,
        inline: true,
      },
      {
        name: "État",
        value: `${isDeadBool ? '💀' : '❤️'}`,
        inline: true,
      }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed], flags: ["Ephemeral"] });
}
