import { createActionButtons, createConfirmationButtons } from "../../utils/discord-components";
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
  CAPABILITIES_BUTTON_PREFIX: "character_admin_capabilities_btn_",
  CAPABILITIES_MODAL_PREFIX: "character_admin_capabilities_modal_",
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
          .setLabel(
            `${char.name}${
              char.user?.globalName
                ? ` - ${char.user.globalName}`
                : char.user?.username
                ? ` - ${char.user.username}`
                : ""
            }`
          )
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
  const buttons = [];

  // Bouton Modifier Stats
  buttons.push({
    customId: `${CHARACTER_ADMIN_CUSTOM_IDS.STATS_BUTTON_PREFIX}${character.id}`,
    label: "Modifier Stats",
    style: ButtonStyle.Primary,
    disabled: character.isDead,
  });

  // Bouton Stats Avancées
  buttons.push({
    customId: `${CHARACTER_ADMIN_CUSTOM_IDS.ADVANCED_STATS_BUTTON_PREFIX}${character.id}`,
    label: "Stats Avancées",
    style: ButtonStyle.Secondary,
    disabled: false,
  });

  // Bouton Toggle Reroll
  buttons.push({
    customId: `${CHARACTER_ADMIN_CUSTOM_IDS.TOGGLE_REROLL_BUTTON_PREFIX}${character.id}`,
    label: character.canReroll ? "Interdire Reroll" : "Autoriser Reroll",
    style: ButtonStyle.Secondary,
    disabled: false,
  });

  // Bouton Tuer Personnage (seulement si pas mort)
  if (!character.isDead) {
    buttons.push({
      customId: `${CHARACTER_ADMIN_CUSTOM_IDS.KILL_BUTTON_PREFIX}${character.id}`,
      label: "Tuer Personnage",
      style: ButtonStyle.Danger,
    });
  }

  // Bouton Gérer Capacités
  buttons.push({
    customId: `${CHARACTER_ADMIN_CUSTOM_IDS.CAPABILITIES_BUTTON_PREFIX}${character.id}`,
    label: "Gérer Capacités",
    style: ButtonStyle.Secondary,
    emoji: "🔮",
  });

  return createActionButtons(buttons);
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

  const hpInput = new TextInputBuilder()
    .setCustomId("hp_input")
    .setLabel("Points de vie (0-5)")
    .setStyle(TextInputStyle.Short)
    .setValue(character.hp.toString())
    .setRequired(true);

  const pmInput = new TextInputBuilder()
    .setCustomId("pm_input")
    .setLabel("Points mentaux (0-5)")
    .setStyle(TextInputStyle.Short)
    .setValue(character.pm.toString())
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(paInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(hungerInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(hpInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(pmInput)
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
    )} | PV: ${character.hp} | PM: ${character.pm}\n\n` +
    `Choisissez une action :`
  );
}

/**
 * Interface pour la gestion des capacités d'un personnage.
 */
export interface Capability {
  id: string;
  name: string;
  description?: string;
  costPA: number;
}

/**
 * Crée l'interface de sélection multiple des capacités disponibles.
 * @param availableCapabilities Liste des capacités disponibles
 * @param currentCapabilities Liste des capacités actuelles (pour marquer les sélections)
 * @param placeholder Texte du placeholder (optionnel)
 */
export function createCapabilitySelectMenu(
  availableCapabilities: Capability[],
  currentCapabilities: Capability[] = [],
  placeholder: string = "Sélectionnez les capacités à ajouter/retirer",
  characterId?: string
): ActionRowBuilder<StringSelectMenuBuilder> {
  const currentIds = new Set(currentCapabilities.map((cap) => cap.id));

  // Créer un ID personnalisé qui inclut l'ID du personnage s'il est fourni
  const customId = characterId 
    ? `capability_admin_select:${characterId}` 
    : "capability_admin_select";

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(customId)
    .setPlaceholder(placeholder)
    .setMinValues(0)
    .setMaxValues(availableCapabilities.length)
    .addOptions(
      availableCapabilities.map((capability) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(`${capability.name} (${capability.costPA} PA)`)
          .setDescription(
            capability.description
              ? capability.description.substring(0, 100)
              : "Aucune description"
          )
          .setValue(capability.id)
          .setDefault(currentIds.has(capability.id))
      )
    );

  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    selectMenu
  );
}

/**
 * Crée les boutons d'action pour la gestion des capacités.
 * @param characterId L'ID du personnage
 */
export function createCapabilityActionButtons(
  characterId: string
): ActionRowBuilder<ButtonBuilder> {
  return createConfirmationButtons(`capability_admin:${characterId}`, {
    confirmLabel: "➕ Ajouter Capacités",
    cancelLabel: "➖ Retirer Capacités",
    confirmStyle: ButtonStyle.Success,
    cancelStyle: ButtonStyle.Danger,
  });
}
