import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from "discord.js";
import { STATUS } from "../constants/emojis.js";


/**
 * Utilitaires pour créer des composants Discord réutilisables
 * Centralise la création des boutons et menus de sélection
 */

/**
 * Interface pour les options de bouton
 */
export interface ButtonOption {
  customId: string;
  label: string;
  style?: ButtonStyle;
  emoji?: string;
  disabled?: boolean;
}

/**
 * Interface pour les options de menu de sélection
 */
export interface SelectMenuOption {
  label: string;
  value: string;
  description?: string;
  emoji?: string;
  default?: boolean;
}

/**
 * Crée une rangée de boutons d'action
 */
export function createActionButtons(
  buttons: ButtonOption[]
): ActionRowBuilder<ButtonBuilder> {
  const buttonComponents = buttons.map((btn) => {
    const button = new ButtonBuilder()
      .setCustomId(btn.customId)
      .setLabel(btn.label)
      .setStyle(btn.style || ButtonStyle.Primary);

    if (btn.emoji) {
      button.setEmoji(btn.emoji);
    }

    if (btn.disabled) {
      button.setDisabled(true);
    }

    return button;
  });

  return new ActionRowBuilder<ButtonBuilder>().addComponents(...buttonComponents);
}

/**
 * Crée des boutons de confirmation (Oui/Non)
 */
export function createConfirmationButtons(
  customIdPrefix: string,
  options?: {
    confirmLabel?: string;
    cancelLabel?: string;
    confirmStyle?: ButtonStyle;
    cancelStyle?: ButtonStyle;
  }
): ActionRowBuilder<ButtonBuilder> {
  return createActionButtons([
    {
      customId: `${customIdPrefix}_confirm`,
      label: options?.confirmLabel || `${STATUS.SUCCESS} Confirmer`,
      style: options?.confirmStyle || ButtonStyle.Success,
    },
    {
      customId: `${customIdPrefix}_cancel`,
      label: options?.cancelLabel || `${STATUS.ERROR} Annuler`,
      style: options?.cancelStyle || ButtonStyle.Danger,
    },
  ]);
}

/**
 * Crée un menu de sélection
 */
export function createSelectMenu(
  customId: string,
  options: SelectMenuOption[],
  placeholder?: string,
  config?: {
    minValues?: number;
    maxValues?: number;
    disabled?: boolean;
  }
): ActionRowBuilder<StringSelectMenuBuilder> {
  const selectMenuOptions = options.map((opt) => {
    const option = new StringSelectMenuOptionBuilder()
      .setLabel(opt.label)
      .setValue(opt.value);

    if (opt.description) {
      option.setDescription(opt.description);
    }

    if (opt.emoji) {
      option.setEmoji(opt.emoji);
    }

    if (opt.default) {
      option.setDefault(true);
    }

    return option;
  });

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(customId)
    .setPlaceholder(placeholder || "Sélectionnez une option")
    .addOptions(selectMenuOptions);

  if (config?.minValues !== undefined) {
    selectMenu.setMinValues(config.minValues);
  }

  if (config?.maxValues !== undefined) {
    selectMenu.setMaxValues(config.maxValues);
  }

  if (config?.disabled) {
    selectMenu.setDisabled(true);
  }

  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
}

/**
 * Crée des boutons de pagination
 */
export function createPaginationButtons(
  customIdPrefix: string,
  currentPage: number,
  totalPages: number
): ActionRowBuilder<ButtonBuilder> {
  const buttons: ButtonOption[] = [
    {
      customId: `${customIdPrefix}_first`,
      label: "⏮️ Premier",
      style: ButtonStyle.Secondary,
      disabled: currentPage === 1,
    },
    {
      customId: `${customIdPrefix}_prev`,
      label: "◀️ Précédent",
      style: ButtonStyle.Primary,
      disabled: currentPage === 1,
    },
    {
      customId: `${customIdPrefix}_page`,
      label: `${currentPage}/${totalPages}`,
      style: ButtonStyle.Secondary,
      disabled: true,
    },
    {
      customId: `${customIdPrefix}_next`,
      label: "Suivant ▶️",
      style: ButtonStyle.Primary,
      disabled: currentPage === totalPages,
    },
    {
      customId: `${customIdPrefix}_last`,
      label: "Dernier ⏭️",
      style: ButtonStyle.Secondary,
      disabled: currentPage === totalPages,
    },
  ];

  return createActionButtons(buttons);
}

/**
 * Crée un bouton unique
 */
export function createSingleButton(
  customId: string,
  label: string,
  options?: {
    style?: ButtonStyle;
    emoji?: string;
    disabled?: boolean;
  }
): ActionRowBuilder<ButtonBuilder> {
  return createActionButtons([
    {
      customId,
      label,
      style: options?.style,
      emoji: options?.emoji,
      disabled: options?.disabled,
    },
  ]);
}

/**
 * Styles de boutons pré-définis pour des actions courantes
 */
export const BUTTON_STYLES = {
  PRIMARY: ButtonStyle.Primary,
  SECONDARY: ButtonStyle.Secondary,
  SUCCESS: ButtonStyle.Success,
  DANGER: ButtonStyle.Danger,
  LINK: ButtonStyle.Link,
} as const;

/**
 * Boutons pré-configurés pour des actions communes
 */
export function createCommonActionButtons(action: "edit" | "delete" | "cancel" | "refresh", customId: string) {
  const configs: Record<string, ButtonOption> = {
    edit: {
      customId,
      label: "✏️ Modifier",
      style: ButtonStyle.Primary,
    },
    delete: {
      customId,
      label: "🗑️ Supprimer",
      style: ButtonStyle.Danger,
    },
    cancel: {
      customId,
      label: `${STATUS.ERROR} Annuler`,
      style: ButtonStyle.Secondary,
    },
    refresh: {
      customId,
      label: "🔄 Actualiser",
      style: ButtonStyle.Secondary,
    },
  };

  return createSingleButton(configs[action].customId, configs[action].label, {
    style: configs[action].style,
  });
}

/**
 * Crée un menu de sélection pour une liste d'objets avec ID et nom
 */
export function createEntitySelectMenu<T extends { id: string; name: string }>(
  customId: string,
  entities: T[],
  options?: {
    placeholder?: string;
    maxValues?: number;
    getDescription?: (entity: T) => string;
    getEmoji?: (entity: T) => string;
  }
): ActionRowBuilder<StringSelectMenuBuilder> {
  const selectOptions: SelectMenuOption[] = entities.map((entity) => ({
    label: entity.name,
    value: entity.id,
    description: options?.getDescription?.(entity),
    emoji: options?.getEmoji?.(entity),
  }));

  return createSelectMenu(customId, selectOptions, options?.placeholder, {
    maxValues: options?.maxValues || 1,
  });
}
