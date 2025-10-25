/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  type ModalSubmitInteraction,
  type StringSelectMenuInteraction,
} from "discord.js";
import { apiService } from "../services/api";
import { logger } from "../services/logger";
import { Town, Character } from "../types/entities";
import { formatErrorForLog } from "../utils/errors";
import { sendLogMessage } from "../utils/channels";
import { JobAPIService } from "../services/api/job-api.service";
import { httpClient } from "../services/httpClient";
import { CHARACTER, STATUS, SYSTEM } from "../constants/emojis";

/**
 * Modal pour créer un nouveau personnage
 */
export function createCharacterCreationModal() {
  const modal = new ModalBuilder()
    .setCustomId("character_creation_modal")
    .setTitle("Créer votre personnage");

  const nameInput = new TextInputBuilder()
    .setCustomId("character_name_input")
    .setLabel("Nom de votre personnage")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder("Entrez le nom de votre personnage")
    .setMinLength(1)
    .setMaxLength(50);

  const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
    nameInput
  );

  modal.addComponents([firstRow]);

  return modal;
}

/**
 * Modal pour créer un personnage reroll après la mort
 */
export function createRerollModal() {
  const modal = new ModalBuilder()
    .setCustomId("reroll_modal")
    .setTitle("Créer un nouveau personnage");

  const nameInput = new TextInputBuilder()
    .setCustomId("reroll_name_input")
    .setLabel("Nom de votre nouveau personnage")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder("Entrez le nom de votre nouveau personnage")
    .setMinLength(1)
    .setMaxLength(50);

  const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
    nameInput
  );

  modal.addComponents([firstRow]);

  return modal;
}

/**
 * Gère la soumission du modal de création de personnage
 * Affiche un select menu pour choisir le métier avant de créer le personnage
 */
export async function handleCharacterCreation(
  interaction: ModalSubmitInteraction
) {
  try {
    const characterName = interaction.fields.getTextInputValue(
      "character_name_input"
    );

    if (!characterName.trim()) {
      await interaction.reply({
        content: `${STATUS.ERROR} Le nom du personnage ne peut pas être vide.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Récupérer les métiers disponibles
    const jobService = new JobAPIService(httpClient);
    const jobs = await jobService.getAllJobs();

    if (jobs.length === 0) {
      await interaction.reply({
        content: `${STATUS.ERROR} Aucun métier disponible. Contactez un administrateur.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Créer le select menu pour les métiers
    const jobSelectMenu = new StringSelectMenuBuilder()
      .setCustomId(`job_select:${characterName.trim()}`)
      .setPlaceholder("Choisissez votre métier")
      .addOptions(
        jobs.map((job) => ({
          label: job.name,
          value: job.id.toString(),
          description: job.description || `Capacité: ${job.startingAbility?.name || 'Aucune'}`,
        }))
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(jobSelectMenu);

    await interaction.reply({
      content: `${SYSTEM.SPARKLES} **Bienvenue ${characterName.trim()} !**\n\nChoisis maintenant ton métier de départ :`,
      components: [row],
      flags: ["Ephemeral"],
    });

  } catch (error) {
    logger.error("Error in character creation modal:", {
      userId: interaction.user.id,
      guildId: interaction.guildId,
      error:
        error instanceof Error
          ? {
            message: error.message,
            stack: error.stack,
            name: error.name,
          }
          : error,
    });

    await interaction.reply({
      content: `${STATUS.ERROR} Une erreur est survenue lors de la création de votre personnage. Veuillez réessayer.`,
      flags: ["Ephemeral"],
    });
  }
}

/**
 * Gère la soumission du modal de reroll
 */
export async function handleReroll(interaction: ModalSubmitInteraction) {
  try {
    const newCharacterName =
      interaction.fields.getTextInputValue("reroll_name_input");

    if (!newCharacterName.trim()) {
      await interaction.reply({
        content: `${STATUS.ERROR} Le nom du personnage ne peut pas être vide.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Get or create user
    const user = await apiService.getOrCreateUser(
      interaction.user.id,
      interaction.user.username,
      interaction.user.discriminator
    );

    // Get town
    const town = (await apiService.guilds.getTownByGuildId(interaction.guildId!)) as Town;

    if (!town) {
      await interaction.reply({
        content: `${STATUS.ERROR} Impossible de trouver la ville pour ce serveur.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Create reroll character
    const newCharacter = (await apiService.characters.createRerollCharacter({
      userId: user.id,
      townId: town.id,
      name: newCharacterName.trim(),
    })) as Character;

    logger.info("Reroll character created successfully", {
      newCharacterId: newCharacter.id,
      userId: user.id,
      townId: town.id,
      characterName: newCharacter.name,
    });

    await interaction.reply({
      content: `${SYSTEM.SPARKLES} **${newCharacter.name}** est né(e) !\n\nVotre nouveau personnage est maintenant actif.\n\n**Statistiques initiales :**\n${CHARACTER.HP_FULL} Vie : Sain\n${CHARACTER.PA} PA : 2/4\n\nVous pouvez continuer votre aventure !`,
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Error creating reroll character:", {
      userId: interaction.user.id,
      guildId: interaction.guildId,
      error: formatErrorForLog(error),
    });

    if (
      error instanceof Error &&
      error.message.includes("No reroll permission")
    ) {
      await interaction.reply({
        content:
          `${STATUS.ERROR} Vous n'avez pas l'autorisation de créer un nouveau personnage. Contactez un administrateur pour obtenir l'autorisation de reroll.`,
        flags: ["Ephemeral"],
      });
    } else {
      await interaction.reply({
        content:
          `${STATUS.ERROR} Une erreur est survenue lors de la création de votre nouveau personnage. Veuillez réessayer.`,
        flags: ["Ephemeral"],
      });
    }
  }
}

/**
 * Vérifie si un utilisateur a besoin de créer un personnage et ouvre le modal si nécessaire
 */
export async function checkAndPromptCharacterCreation(interaction: any) {
  try {
    // Get or create user
    const user = await apiService.getOrCreateUser(
      interaction.user.id,
      interaction.user.username,
      interaction.user.discriminator
    );

    // Get town
    const town = await apiService.guilds.getTownByGuildId(interaction.guildId!);

    if (!town) {
      await interaction.reply({
        content: `${STATUS.ERROR} Impossible de trouver ou créer la ville pour ce serveur.`,
        flags: ["Ephemeral"],
      });
      return false;
    }

    // Check if user needs character creation
    const needsCreation = await apiService.characters.needsCharacterCreation(
      user.id,
      (town as Town).id
    );

    if (needsCreation) {
      const modal = createCharacterCreationModal();
      await interaction.showModal(modal);
      return true;
    }

    return false;
  } catch (error) {
    logger.error("Error checking character creation need:", {
      userId: interaction.user.id,
      guildId: interaction.guildId,
      error:
        error instanceof Error
          ? {
            message: error.message,
            stack: error.stack,
            name: error.name,
          }
          : error,
    });
    return false;
  }
}

/**
 * Vérifie si un utilisateur peut reroll et ouvre le modal si nécessaire
 */
export async function checkAndPromptReroll(interaction: any) {
  try {
    // Get or create user
    const user = await apiService.getOrCreateUser(
      interaction.user.id,
      interaction.user.username,
      interaction.user.discriminator
    );

    // Get town
    const town = await apiService.guilds.getTownByGuildId(interaction.guildId!);

    if (!town) {
      await interaction.reply({
        content: `${STATUS.ERROR} Impossible de trouver la ville pour ce serveur.`,
        flags: ["Ephemeral"],
      });
      return false;
    }

    // Check if user has rerollable characters
    const rerollableCharacters = (await apiService.characters.getRerollableCharacters(
      user.id,
      (town as Town).id
    )) as Character[];

    if (rerollableCharacters && rerollableCharacters.length > 0) {
      const modal = createRerollModal();
      await interaction.showModal(modal);
      return true;
    }

    return false;
  } catch (error) {
    logger.error("Error checking reroll eligibility:", {
      userId: interaction.user.id,
      guildId: interaction.guildId,
      error:
        error instanceof Error
          ? {
            message: error.message,
            stack: error.stack,
            name: error.name,
          }
          : error,
    });
    return false;
  }
}

/**
 * Gère la sélection du métier lors de la création d'un personnage
 */
export async function handleJobSelection(
  interaction: StringSelectMenuInteraction
) {
  try {
    // Extraire le nom du personnage du customId
    const [, characterName] = interaction.customId.split(":");
    const jobId = parseInt(interaction.values[0], 10);

    if (!characterName || isNaN(jobId)) {
      await interaction.reply({
        content: `${STATUS.ERROR} Erreur lors de la sélection du métier. Veuillez réessayer.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    await interaction.deferReply({ flags: ["Ephemeral"] });

    // Get or create user
    const user = await apiService.getOrCreateUser(
      interaction.user.id,
      interaction.user.username,
      interaction.user.discriminator
    );

    // Get or create town
    const town = (await apiService.guilds.getTownByGuildId(interaction.guildId!)) as Town;

    if (!town) {
      await interaction.editReply({
        content: `${STATUS.ERROR} Impossible de trouver ou créer la ville pour ce serveur.`,
      });
      return;
    }

    // Create character with job
    const character = (await apiService.characters.createCharacter({
      name: characterName,
      userId: user.id,
      townId: town.id,
      jobId: jobId,
    })) as Character;

    logger.info("Character created successfully with job", {
      characterId: character.id,
      userId: user.id,
      townId: town.id,
      characterName: character.name,
      jobId: jobId,
    });

    // Récupérer les informations du métier pour l'affichage
    const jobName = character.job?.name || "Métier inconnu";
    const startingAbilityName = character.job?.startingAbility?.name || "Aucune";

    // Envoyer un message dans le canal de logs
    if (interaction.guildId) {
      await sendLogMessage(
        interaction.guildId,
        interaction.client,
        `🎉 **${character.name}** vient d'arriver dans **${town.name}** !\n**Métier:** ${jobName}\n**Capacité de départ:** ${startingAbilityName}`
      );
    }

    await interaction.editReply({
      content: `${SYSTEM.SPARKLES} Bienvenue **${character.name}** !\n\nTon aventure commence maintenant !\n\nTu es **${jobName}**. Tu as les capacités suivantes : **Couper du bois** et **${startingAbilityName}**.\n\nVoici un petit rappel des commandes utilisables :\n- **/profil** te permet d'accéder au profil de ton personnage pour manger, utiliser tes capacités, etc.\n- **/chantier** te permet de participer (avec tes PA) à un chantier\n- **/expedition** te permet de créer une expédition ou rejoindre celle en préparation\n- **/stock** te permet de savoir tout ce que vous avez en stock au camp\n- enfin **/help** te fait un récap de tout ça\n\n${interaction.guild ?
        (() => {
          const veilleurRole = interaction.guild.roles.cache.find(role =>
            role.name.toLowerCase() === 'veilleur' ||
            role.name.toLowerCase() === 'veilleuse' ||
            role.name.toLowerCase() === 'veilleurs'
          );
          return veilleurRole ?
            `En cas de besoin, les **${veilleurRole}** ne sont pas loin.` :
            'En cas de besoin, les **Veilleurs** ne sont pas loin.';
        })() :
        'En cas de besoin, les **Veilleurs** ne sont pas loin.'
        }`,
    });
  } catch (error) {
    logger.error("Error creating character with job:", {
      userId: interaction.user.id,
      guildId: interaction.guildId,
      error: formatErrorForLog(error),
    });

    await interaction.editReply({
      content: `${STATUS.ERROR} Une erreur est survenue lors de la création de votre personnage. Veuillez réessayer.`,
    });
  }
}
