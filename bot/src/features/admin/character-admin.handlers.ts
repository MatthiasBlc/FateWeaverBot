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
export interface Character {
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

export interface Town {
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
      logger.warn(
        "Utilisateur non admin tente d'utiliser la commande character-admin",
        {
          userId: interaction.user.id,
          guildId: interaction.guildId,
        }
      );
      return;
    }

    logger.info("Utilisateur vérifié comme admin", {
      userId: interaction.user.id,
      guildId: interaction.guildId,
    });

    // Récupérer la ville du serveur
    const town = (await apiService.getTownByGuildId(
      interaction.guildId!
    )) as Town | null;

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
    const characters = (await apiService.getTownCharacters(
      town.id
    )) as Character[];

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
              `Actif: ${character.isActive ? "✅" : "❌"} | Mort: ${
                character.isDead ? "💀" : "❤️"
              } | Reroll: ${character.canReroll ? "✅" : "❌"}`
            )
            .setValue(character.id)
        )
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      selectMenu
    );

    await interaction.reply({
      content:
        "👤 **Administration des Personnages**\nSélectionnez un personnage à gérer :",
      components: [row],
      flags: ["Ephemeral"],
    });

    // Créer un event listener pour gérer la sélection du personnage
    const filter = (i: any) =>
      i.customId === "character_select" && i.user.id === interaction.user.id;

    try {
      const selectInteraction =
        await interaction.channel?.awaitMessageComponent({
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
      const selectedCharacter = characters.find(
        (c: Character) => c.id === selectedCharacterId
      );

      if (!selectedCharacter) {
        await selectInteraction.reply({
          content: "❌ Personnage non trouvé.",
          flags: ["Ephemeral"],
        });
        return;
      }

      // Créer les boutons d'action
      const buttons: ButtonBuilder[] = [
        // Bouton pour modifier les stats de base (PA et faim)
        new ButtonBuilder()
          .setCustomId("character_stats")
          .setLabel("Modifier Stats")
          .setStyle(ButtonStyle.Primary),
          
        // Bouton pour les stats avancées (isDead, canReroll, isActive)
        new ButtonBuilder()
          .setCustomId("character_advanced")
          .setLabel("Stats Avancées")
          .setStyle(ButtonStyle.Secondary)
      ];
      
      // Bouton pour tuer le personnage (uniquement si pas déjà mort)
      if (!selectedCharacter.isDead) {
        buttons.push(
          new ButtonBuilder()
            .setCustomId("character_kill")
            .setLabel("Tuer Personnage")
            .setStyle(ButtonStyle.Danger)
        );
      }
      
      // Bouton pour gérer le reroll (uniquement si canReroll est false)
      buttons.push(
        new ButtonBuilder()
          .setCustomId("character_reroll")
          .setLabel(
            selectedCharacter.canReroll 
              ? "Interdire Reroll" 
              : "Autoriser Reroll"
          )
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(selectedCharacter.isDead) // Désactiver si le personnage est mort
      );
      
      const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);

      await selectInteraction.reply({
        content:
          `**${selectedCharacter.name}**\n` +
          `Actif: ${selectedCharacter.isActive ? "✅" : "❌"}\n` +
          `Mort: ${selectedCharacter.isDead ? "💀" : "❤️"}\n` +
          `Reroll autorisé: ${selectedCharacter.canReroll ? "✅" : "❌"}\n` +
          `PA: ${selectedCharacter.paTotal} | Faim: ${getHungerLevelText(
            selectedCharacter.hungerLevel
          )}\n\n` +
          `Choisissez une action :`,
        components: [actionRow],
        flags: ["Ephemeral"],
      });

      // Gérer les actions sur le personnage
      const buttonFilter = (i: any) =>
        [
          "character_stats",
          "character_kill",
          "character_reroll",
          "character_switch",
        ].includes(i.customId) && i.user.id === interaction.user.id;

      const buttonInteraction =
        await selectInteraction.channel?.awaitMessageComponent({
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
        case "character_advanced":
          await handleAdvancedStats(buttonInteraction, selectedCharacter);
          break;
        case "character_kill":
          await handleKillCharacter(buttonInteraction, selectedCharacter);
          break;
        case "character_reroll":
          await handleRerollPermission(buttonInteraction, selectedCharacter);
          break;
        case "character_switch":
          await handleSwitchActive(
            buttonInteraction,
            selectedCharacter,
            town.id
          );
          break;
      }
    } catch (error) {
      logger.error("Erreur lors de la sélection ou action sur le personnage:", {
        error,
      });
      if (error && typeof error === "object" && "code" in error) {
        if (error.code === 10062) {
          // Unknown interaction
          logger.warn("Interaction expirée");
          return; // Ne pas répondre si l'interaction est déjà expirée
        }
        if (error.code === "InteractionCollectorError") {
          logger.warn("Timeout d'interaction");
          if (!interaction.replied) {
            await interaction
              .followUp({
                content: "❌ Temps écoulé. Veuillez relancer la commande.",
                flags: ["Ephemeral"],
              })
              .catch(() => {});
          }
          return;
        }
      }

      if (!interaction.replied) {
        await interaction
          .followUp({
            content:
              "❌ Erreur lors de la sélection/modification du personnage.",
            flags: ["Ephemeral"],
          })
          .catch(() => {});
      }
    }
  } catch (error) {
    logger.error(
      "Erreur lors de la préparation de la commande character-admin:",
      {
        guildId: interaction.guildId,
        userId: interaction.user.id,
        error:
          error instanceof Error
            ? {
                message: error.message,
                stack: error.stack,
                name: error.name,
              }
            : error,
      }
    );
    await interaction.reply({
      content:
        "❌ Une erreur est survenue lors de la préparation de la commande.",
      flags: ["Ephemeral"],
    });
  }
}

async function handleStatsUpdate(interaction: any, character: Character) {
  try {
    // Créer un ID unique pour cette modale avec l'ID du personnage
    const modalId = `stats_${character.id}`;
    
    const modal = new ModalBuilder()
      .setCustomId(modalId)
      .setTitle('Modifier les statistiques du personnage');

    // Champ pour les PA
    const paInput = new TextInputBuilder()
      .setCustomId('pa_input')
      .setLabel('Points d\'Actions (0-4)')
      .setStyle(TextInputStyle.Short)
      .setValue(character.paTotal?.toString() || '0')
      .setRequired(true);

    // Champ pour le niveau de faim
    const hungerInput = new TextInputBuilder()
      .setCustomId('hunger_input')
      .setLabel('Niveau de faim (0-4)')
      .setStyle(TextInputStyle.Short)
      .setValue(character.hungerLevel?.toString() || '0')
      .setRequired(true);

    const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(paInput);
    const secondActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(hungerInput);

    modal.addComponents(firstActionRow, secondActionRow);

    // Afficher la modale
    await interaction.showModal(modal);
    
    // Stocker les informations du personnage pour le gestionnaire de modale
    interaction.client.modalData = interaction.client.modalData || {};
    interaction.client.modalData[modalId] = {
      character,
      timestamp: Date.now()
    };
    
    // Nettoyer les anciennes entrées après 5 minutes
    setTimeout(() => {
      if (interaction.client.modalData[modalId]) {
        delete interaction.client.modalData[modalId];
      }
    }, 5 * 60 * 1000);
    
  } catch (error) {
    logger.error("Erreur lors de l'affichage de la modale:", { error });
    
    if (!interaction.replied) {
      try {
        await interaction.reply({
          content: "❌ Une erreur est survenue lors de l'affichage du formulaire.",
          flags: ["Ephemeral"],
        });
      } catch (replyError) {
        logger.error("Impossible d'envoyer le message d'erreur:", { replyError });
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

    // Créer l'embed pour la réponse à l'utilisateur
    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle("💀 Personnage Tué")
      .setDescription(`**${character.name}** a été tué.`)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], flags: ["Ephemeral"] });

    // Envoyer une notification dans le canal de logs
    try {
      const { sendLogMessage } = await import("../../utils/channels");
      const guildId = interaction.guildId;
      const client = interaction.client;

      if (guildId && client) {
        const logMessage = `💀 **Mort d'un personnage**
Le personnage **${character.name}**, <@${
          character.user?.discordId || "Inconnu"
        }> est mort.

*${new Date().toLocaleString()}*`;

        await sendLogMessage(guildId, client, logMessage);
      }
    } catch (logError) {
      logger.error("Erreur lors de l'envoi du log de mort du personnage:", {
        error: logError,
      });
    }
  } catch (error) {
    logger.error("Erreur lors de la suppression du personnage:", { error });
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 10062
    ) {
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
      logger.error("Impossible de répondre à l'interaction expirée:", {
        replyError,
      });
    }
  }
}

async function handleRerollPermission(interaction: any, character: any) {
  try {
    if (!character.isDead) {
      await interaction.reply({
        content:
          "❌ Seul un personnage mort peut avoir l'autorisation de reroll.",
        flags: ["Ephemeral"],
      });
      return;
    }

    const newCanReroll = !character.canReroll;
    await apiService.updateCharacterStats(character.id, {
      canReroll: newCanReroll,
    });

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle(
        `🔄 Autorisation de Reroll ${newCanReroll ? "Accordée" : "Révoquée"}`
      )
      .setDescription(
        `**${character.name}** ${
          newCanReroll ? "peut maintenant" : "ne peut plus"
        } créer un nouveau personnage.`
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed], flags: ["Ephemeral"] });
  } catch (error) {
    logger.error("Erreur lors de la gestion du reroll:", { error });
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 10062
    ) {
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
      logger.error("Impossible de répondre à l'interaction expirée:", {
        replyError,
      });
    }
  }
}

async function handleSwitchActive(
  interaction: any,
  character: any,
  townId: string
) {
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
      await apiService.switchActiveCharacter(
        character.userId,
        townId,
        character.id
      );
    } else {
      // Désactiver ce personnage (mais garder au moins un actif)
      await apiService.updateCharacterStats(character.id, { isActive: false });
    }

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle(`⚡ Personnage ${newIsActive ? "Activé" : "Désactivé"}`)
      .setDescription(
        `**${character.name}** est maintenant ${
          newIsActive ? "actif" : "inactif"
        }.`
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed], flags: ["Ephemeral"] });
  } catch (error) {
    logger.error("Erreur lors du changement de statut actif:", { error });
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 10062
    ) {
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
      logger.error("Impossible de répondre à l'interaction expirée:", {
        replyError,
      });
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
    .setValue(character.isDead ? "true" : "false")
    .setMinLength(1)
    .setMaxLength(5);

  const canRerollInput = new TextInputBuilder()
    .setCustomId("can_reroll_input")
    .setLabel("Autoriser Reroll (true/false)")
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setPlaceholder("true ou false")
    .setValue(character.canReroll ? "true" : "false")
    .setMinLength(1)
    .setMaxLength(5);

  const isActiveInput = new TextInputBuilder()
    .setCustomId("is_active_input")
    .setLabel("Actif (true/false)")
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setPlaceholder("true ou false")
    .setValue(character.isActive ? "true" : "false")
    .setMinLength(1)
    .setMaxLength(5);

  const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
    paInput
  );
  const secondRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
    hungerInput
  );
  const thirdRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
    isDeadInput
  );
  const fourthRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
    canRerollInput
  );
  const fifthRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
    isActiveInput
  );

  modal.addComponents([firstRow, secondRow, thirdRow, fourthRow, fifthRow]);

  return modal;
}

// Fonction pour gérer les statistiques avancées du personnage
async function handleAdvancedStats(interaction: any, character: Character) {
  try {
    const modal = new ModalBuilder()
      .setCustomId('character_advanced_modal')
      .setTitle('Statistiques avancées du personnage');

    // Champ pour l'état de mort
    const isDeadInput = new TextInputBuilder()
      .setCustomId('is_dead_input')
      .setLabel('Personnage mort ? (true/false)')
      .setStyle(TextInputStyle.Short)
      .setValue(character.isDead ? 'true' : 'false')
      .setRequired(true);

    // Champ pour l'état actif
    const isActiveInput = new TextInputBuilder()
      .setCustomId('is_active_input')
      .setLabel('Personnage actif ? (true/false)')
      .setStyle(TextInputStyle.Short)
      .setValue(character.isActive ? 'true' : 'false')
      .setRequired(true);

    const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(isDeadInput);
    const secondActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(isActiveInput);

    modal.addComponents(firstActionRow, secondActionRow);

    // Afficher la modale
    await interaction.showModal(modal);

    const modalFilter = (i: any) =>
      i.customId === "character_advanced_modal" &&
      i.user.id === interaction.user.id;
    const modalInteraction = await interaction.awaitModalSubmit({
      filter: modalFilter,
      time: 120000, // 2 minutes
    });

    if (!modalInteraction) {
      await interaction.followUp({
        content: "❌ Temps écoulé lors de la saisie des statistiques avancées.",
        flags: ["Ephemeral"],
      });
      return;
    }

    const isDeadValue = modalInteraction.fields.getTextInputValue("is_dead_input");
    const isActiveValue = modalInteraction.fields.getTextInputValue("is_active_input");

    const isDeadBool = isDeadValue.toLowerCase() === 'true';
    const isActiveBool = isActiveValue.toLowerCase() === 'true';

    // Validation des valeurs
    if (isDeadValue.toLowerCase() !== 'true' && isDeadValue.toLowerCase() !== 'false') {
      await modalInteraction.reply({
        content: "❌ La valeur pour 'Personnage mort' doit être 'true' ou 'false'.",
        flags: ["Ephemeral"],
      });
      return;
    }

    if (isActiveValue.toLowerCase() !== 'true' && isActiveValue.toLowerCase() !== 'false') {
      await modalInteraction.reply({
        content: "❌ La valeur pour 'Personnage actif' doit être 'true' ou 'false'.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Préparer les données de mise à jour
    const updateData: any = {
      isDead: isDeadBool,
      isActive: isActiveBool
    };

    // Mettre à jour le personnage
    try {
      const updatedCharacter = (await apiService.updateCharacterStats(
        character.id,
        updateData
      )) as Character;

      // Créer l'embed de confirmation
      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle("✅ Statistiques avancées mises à jour")
        .setDescription(`**${character.name}** a été modifié avec succès.`)
        .addFields(
          {
            name: "Statut de mort",
            value: isDeadBool ? "💀 Mort" : "❤️ Vivant",
            inline: true,
          },
          {
            name: "Statut d'activité",
            value: isActiveBool ? "✅ Actif" : "❌ Inactif",
            inline: true,
          }
        )
        .setTimestamp();

      await modalInteraction.reply({
        embeds: [embed],
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId("character_stats_modal_confirm")
              .setLabel("Confirmer")
              .setStyle(ButtonStyle.Success)
          ),
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId("character_stats_modal_cancel")
              .setLabel("Annuler")
              .setStyle(ButtonStyle.Danger)
          ),
        ],
        flags: ["Ephemeral"],
      });
    } catch (error) {
      logger.error("Erreur lors de la mise à jour des statistiques du personnage:", {
        error,
      });
      await interaction.followUp({
        content: "❌ Une erreur est survenue lors de la mise à jour des statistiques du personnage.",
        flags: ["Ephemeral"],
      });
    }
  } catch (error) {
    logger.error("Erreur lors de la gestion de la modale de statistiques:", {
      error,
    });
    await interaction.followUp({
      content: "❌ Une erreur est survenue lors de l'affichage de la modale.",
      flags: ["Ephemeral"],
    });
  }
}

// Fonction supprimée - maintenant dans utils/hunger.ts

/**
 * Gestionnaire pour les soumissions de modal d'administration de personnages
 * Utilisé par le système centralisé de gestion des modals
 */
export async function handleCharacterStatsModal(interaction: any) {
  try {
    // Vérifier si c'est une modale de statistiques (commence par stats_)
    if (interaction.customId.startsWith('stats_')) {
      const characterId = interaction.customId.replace('stats_', '');
      
      // Récupérer les valeurs des champs
      const paValue = interaction.fields.getTextInputValue("pa_input");
      const hungerValue = interaction.fields.getTextInputValue("hunger_input");
      
      const paNumber = parseInt(paValue, 10);
      const hungerNumber = parseInt(hungerValue, 10);
      
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
      const updateData = {
        paTotal: paNumber,
        hungerLevel: hungerNumber
      };
      
      // Mettre à jour le personnage
      const updatedCharacter = await apiService.updateCharacterStats(
        characterId,
        updateData
      ) as Character;
      
      // Créer l'embed de confirmation
      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle("✅ Statistiques mises à jour")
        .setDescription(`**${updatedCharacter.name}** a été modifié avec succès.`)
        .addFields(
          {
            name: "Points d'Actions",
            value: `${updatedCharacter.paTotal}`,
            inline: true,
          },
          {
            name: "Niveau de faim",
            value: `${getHungerLevelText(updatedCharacter.hungerLevel)}`,
            inline: true,
          }
        )
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed], flags: ["Ephemeral"] });
      return;
    }
    
    // Pour les autres types de modales (gestion avancée)
    const paValue = interaction.fields.getTextInputValue("pa_input") || "";
    const hungerValue = interaction.fields.getTextInputValue("hunger_input") || "";
    const isDeadValue = interaction.fields.getTextInputValue("is_dead_input") || "";
    const canRerollValue = interaction.fields.getTextInputValue("can_reroll_input") || "";
    const isActiveValue = interaction.fields.getTextInputValue("is_active_input") || "";

    const paNumber = paValue !== "" ? parseInt(paValue, 10) : NaN;
    const hungerNumber = hungerValue !== "" ? parseInt(hungerValue, 10) : NaN;
    const isDeadBool = isDeadValue.toLowerCase() === "true";
    const canRerollBool = canRerollValue.toLowerCase() === "true";
    const isActiveBool = isActiveValue.toLowerCase() === "true";

    // Validation des valeurs
    const errors = [];
    if (!isNaN(paNumber) && (paNumber < 0 || paNumber > 4)) {
      errors.push("Les PA doivent être un nombre entre 0 et 4");
    }
    if (!isNaN(hungerNumber) && (hungerNumber < 0 || hungerNumber > 4)) {
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
    if (isDeadValue !== "") updateData.isDead = isDeadBool;
    if (canRerollValue !== "") updateData.canReroll = canRerollBool;
    if (isActiveValue !== "") updateData.isActive = isActiveBool;

    // Récupérer l'ID du personnage depuis l'ID de la modale
    const characterId = interaction.customId;

    // Mettre à jour le personnage
    const updatedCharacter = await apiService.updateCharacterStats(
      characterId,
      updateData
    ) as Character;

    // Créer l'embed de confirmation
    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle("✅ Personnage Modifié")
      .setDescription(`**${updatedCharacter.name}** a été modifié avec succès.`)
      .addFields(
        {
          name: "PA",
          value: `${updatedCharacter.paTotal}`,
          inline: true,
        },
        {
          name: "Faim",
          value: `${getHungerLevelText(updatedCharacter.hungerLevel)}`,
          inline: true,
        },
        {
          name: "État",
          value: `${updatedCharacter.isDead ? "💀" : "❤️"}`,
          inline: true,
        }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed], flags: ["Ephemeral"] });
  } catch (error) {
    logger.error(
      "Erreur lors de la mise à jour des statistiques du personnage:",
      {
        error:
          error instanceof Error
            ? {
                message: error.message,
                stack: error.stack,
                name: error.name,
              }
            : error,
        customId: interaction.customId,
        userId: interaction.user.id,
        guildId: interaction.guildId
      }
    );

    await interaction.reply({
      content: `❌ Une erreur est survenue lors de la mise à jour du personnage: ${
        error instanceof Error ? error.message : "Erreur inconnue"
      }`,
      flags: ["Ephemeral"],
    });
  }
}
