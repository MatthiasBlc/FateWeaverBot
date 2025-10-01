import {
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import type { Character } from "./character-admin.types";
import { getHungerLevelText } from "../../utils/hunger";

// --- Custom IDs --- //
export const CHARACTER_ADMIN_CUSTOM_IDS = {
  SELECT_MENU: "character_admin_select",
  // Using prefixes for buttons and modals to include characterId
  STATS_BUTTON_PREFIX: "character_admin_stats_btn_",
  ADVANCED_STATS_BUTTON_PREFIX: "character_admin_advanced_btn_",
  KILL_BUTTON_PREFIX: "character_admin_kill_btn_",
  TOGGLE_REROLL_BUTTON_PREFIX: "character_admin_reroll_btn_",
  STATS_MODAL_PREFIX: "character_admin_stats_modal_",
  ADVANCED_STATS_MODAL_PREFIX: "character_admin_advanced_modal_",
};

// --- Component Builders --- //

/**
 * Crée le menu de sélection de personnage.
 */
export function createCharacterSelectMenu(characters: Character[]) {
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(CHARACTER_ADMIN_CUSTOM_IDS.SELECT_MENU)
    .setPlaceholder("Choisissez un personnage à gérer")
    .addOptions(
      characters.map((char) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(char.name)
          .setDescription(
            `Actif: ${char.isActive ? "✅" : "❌"} | Mort: ${
              char.isDead ? "💀" : "❤️"
            } | Reroll: ${char.canReroll ? "✅" : "❌"}`
          )
          .setValue(char.id)
      )
    );

  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    selectMenu
  );
}

/**
 * Crée les boutons d'action pour un personnage sélectionné.
 */
export function createCharacterActionButtons(character: Character) {
  const buttons = [
    new ButtonBuilder()
      .setCustomId(
        `${CHARACTER_ADMIN_CUSTOM_IDS.STATS_BUTTON_PREFIX}${character.id}`
      )
      .setLabel("Modifier Stats")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(
        `${CHARACTER_ADMIN_CUSTOM_IDS.ADVANCED_STATS_BUTTON_PREFIX}${character.id}`
      )
      .setLabel("Stats Avancées")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(
        `${CHARACTER_ADMIN_CUSTOM_IDS.TOGGLE_REROLL_BUTTON_PREFIX}${character.id}`
      )
      .setLabel(character.canReroll ? "Interdire Reroll" : "Autoriser Reroll")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(character.isDead),
  ];

  if (!character.isDead) {
    buttons.push(
      new ButtonBuilder()
        .setCustomId(
          `${CHARACTER_ADMIN_CUSTOM_IDS.KILL_BUTTON_PREFIX}${character.id}`
        )
        .setLabel("Tuer Personnage")
        .setStyle(ButtonStyle.Danger)
    );
  }

  return new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);
}

/**
 * Crée la modale pour modifier les statistiques de base (PA, Faim).
 */
export function createStatsModal(character: Character) {
  const modal = new ModalBuilder()
    .setCustomId(
      `${CHARACTER_ADMIN_CUSTOM_IDS.STATS_MODAL_PREFIX}${character.id}`
    )
    .setTitle("Modifier les statistiques du personnage");

  const paInput = new TextInputBuilder()
    .setCustomId("pa_input")
    .setLabel("Points d'Actions (0-4)")
    .setStyle(TextInputStyle.Short)
    .setValue(character.paTotal.toString())
    .setRequired(true);

  const hungerInput = new TextInputBuilder()
    .setCustomId("hunger_input")
    .setLabel("Niveau de faim (0-4)")
    .setStyle(TextInputStyle.Short)
    .setValue(character.hungerLevel.toString())
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(paInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(hungerInput)
  );

  return modal;
}

/**
 * Crée la modale pour modifier les statistiques avancées (Mort, Actif, Reroll).
 */
export function createAdvancedStatsModal(character: Character) {
  const modal = new ModalBuilder()
    .setCustomId(
      `${CHARACTER_ADMIN_CUSTOM_IDS.ADVANCED_STATS_MODAL_PREFIX}${character.id}`
    )
    .setTitle("Statistiques avancées du personnage");

  const isDeadInput = new TextInputBuilder()
    .setCustomId("is_dead_input")
    .setLabel("Mort (true/false)")
    .setStyle(TextInputStyle.Short)
    .setValue(character.isDead.toString())
    .setRequired(true);

  const isActiveInput = new TextInputBuilder()
    .setCustomId("is_active_input")
    .setLabel("Actif (true/false)")
    .setStyle(TextInputStyle.Short)
    .setValue(character.isActive.toString())
    .setRequired(true);

  const canRerollInput = new TextInputBuilder()
    .setCustomId("can_reroll_input")
    .setLabel("Reroll autorisé (true/false)")
    .setStyle(TextInputStyle.Short)
    .setValue(character.canReroll.toString())
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(isDeadInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(isActiveInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(canRerollInput)
  );

  return modal;
}

/**
 * Génère le contenu du message affichant les détails d'un personnage.
 */
export function createCharacterDetailsContent(character: Character): string {
  return (
    `**${character.name}**\n` +
    `Actif: ${character.isActive ? "✅" : "❌"}\n` +
    `Mort: ${character.isDead ? "💀" : "❤️"}\n` +
    `Reroll autorisé: ${character.canReroll ? "✅" : "❌"}\n` +
    `PA: ${character.paTotal} | Faim: ${getHungerLevelText(
      character.hungerLevel
    )}\n\n` +
    `Choisissez une action :`
  );
}
