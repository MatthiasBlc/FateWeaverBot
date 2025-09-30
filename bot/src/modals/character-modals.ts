import {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  type ModalSubmitInteraction,
} from "discord.js";
import { apiService } from "../services/api";
import { logger } from "../services/logger";
import { Town, Character } from "../types/api-types";

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
        content: "❌ Le nom du personnage ne peut pas être vide.",
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

    // Get or create town
    const town = (await apiService.getTownByGuildId(interaction.guildId!)) as Town;

    if (!town) {
      await interaction.reply({
        content: "❌ Impossible de trouver ou créer la ville pour ce serveur.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Create character
    const character = (await apiService.createCharacter({
      name: characterName.trim(),
      userId: user.id,
      townId: town.id,
    })) as Character;

    logger.info("Character created successfully", {
      characterId: character.id,
      userId: user.id,
      townId: town.id,
      characterName: character.name,
    });

    await interaction.reply({
      content: `✅ Bienvenue **${character.name}** !\nVotre personnage a été créé avec succès dans **${town.name}**.\n\n**Statistiques initiales :**\n❤️ Vie : Sain\n⚡ PA : 2/4\n\nVous pouvez maintenant utiliser toutes les commandes du bot !`,
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Error creating character:", {
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
      content:
        "❌ Une erreur est survenue lors de la création de votre personnage. Veuillez réessayer.",
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
        content: "❌ Le nom du personnage ne peut pas être vide.",
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
    const town = (await apiService.getTownByGuildId(interaction.guildId!)) as Town;

    if (!town) {
      await interaction.reply({
        content: "❌ Impossible de trouver la ville pour ce serveur.",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Create reroll character
    const newCharacter = (await apiService.createRerollCharacter({
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
      content: `✨ **${newCharacter.name}** est né(e) !\n\nVotre nouveau personnage est maintenant actif.\n\n**Statistiques initiales :**\n❤️ Vie : Sain\n⚡ PA : 2/4\n\nVous pouvez continuer votre aventure !`,
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Error creating reroll character:", {
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

    if (
      error instanceof Error &&
      error.message.includes("No reroll permission")
    ) {
      await interaction.reply({
        content:
          "❌ Vous n'avez pas l'autorisation de créer un nouveau personnage. Contactez un administrateur pour obtenir l'autorisation de reroll.",
        flags: ["Ephemeral"],
      });
    } else {
      await interaction.reply({
        content:
          "❌ Une erreur est survenue lors de la création de votre nouveau personnage. Veuillez réessayer.",
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
    const town = await apiService.getTownByGuildId(interaction.guildId!);

    if (!town) {
      await interaction.reply({
        content: "❌ Impossible de trouver ou créer la ville pour ce serveur.",
        flags: ["Ephemeral"],
      });
      return false;
    }

    // Check if user needs character creation
    const needsCreation = await apiService.needsCharacterCreation(
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
    const town = await apiService.getTownByGuildId(interaction.guildId!);

    if (!town) {
      await interaction.reply({
        content: "❌ Impossible de trouver la ville pour ce serveur.",
        flags: ["Ephemeral"],
      });
      return false;
    }

    // Check if user has rerollable characters
    const rerollableCharacters = (await apiService.getRerollableCharacters(
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
