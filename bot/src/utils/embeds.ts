import { EmbedBuilder, ColorResolvable } from "discord.js";

/**
 * Utilitaires pour créer des embeds Discord réutilisables
 * Centralise la création des embeds pour réduire la duplication de code
 */

// Couleurs standardisées pour les embeds
export const EMBED_COLORS = {
  SUCCESS: 0x00ff00,   // Vert
  ERROR: 0xff0000,     // Rouge
  WARNING: 0xffa500,   // Orange
  INFO: 0x0099ff,      // Bleu
  NEUTRAL: 0x808080,   // Gris
  DEATH: 0x000000,     // Noir
  HUNGER: {
    HEALTHY: 0x00ff00,   // Niveau 4
    HUNGRY: 0xffff00,    // Niveau 3
    STARVING: 0xffa500,  // Niveau 2
    AGONY: 0xff4500,     // Niveau 1
    DEAD: 0x000000,      // Niveau 0
  },
  STOCK: {
    HIGH: 0x00ff00,      // > 100
    MEDIUM: 0xffff00,    // > 50
    LOW: 0xffa500,       // > 20
    CRITICAL: 0xff0000,  // <= 20
  }
} as const;

/**
 * Interface pour les champs d'un embed
 */
export interface EmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

/**
 * Options pour créer un embed
 */
export interface EmbedOptions {
  color?: ColorResolvable;
  title?: string;
  description?: string;
  fields?: EmbedField[];
  footer?: { text: string; iconURL?: string };
  thumbnail?: string;
  image?: string;
  timestamp?: boolean;
  author?: { name: string; iconURL?: string };
}

/**
 * Crée un embed de succès standardisé
 */
export function createSuccessEmbed(
  title: string,
  description?: string,
  fields?: EmbedField[]
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.SUCCESS)
    .setTitle(`✅ ${title}`)
    .setTimestamp();

  if (description) {
    embed.setDescription(description);
  }

  if (fields && fields.length > 0) {
    embed.addFields(fields);
  }

  return embed;
}

/**
 * Crée un embed d'erreur standardisé
 */
export function createErrorEmbed(
  message: string,
  details?: string
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.ERROR)
    .setTitle("❌ Erreur")
    .setDescription(message)
    .setTimestamp();

  if (details) {
    embed.addFields({ name: "Détails", value: details, inline: false });
  }

  return embed;
}

/**
 * Crée un embed d'information standardisé
 */
export function createInfoEmbed(
  title: string,
  description: string,
  fields?: EmbedField[]
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.INFO)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();

  if (fields && fields.length > 0) {
    embed.addFields(fields);
  }

  return embed;
}

/**
 * Crée un embed d'avertissement standardisé
 */
export function createWarningEmbed(
  title: string,
  description: string,
  fields?: EmbedField[]
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.WARNING)
    .setTitle(`⚠️ ${title}`)
    .setDescription(description)
    .setTimestamp();

  if (fields && fields.length > 0) {
    embed.addFields(fields);
  }

  return embed;
}

/**
 * Crée un embed personnalisé avec toutes les options
 */
export function createCustomEmbed(options: EmbedOptions): EmbedBuilder {
  const embed = new EmbedBuilder();

  if (options.color !== undefined) {
    embed.setColor(options.color);
  }

  if (options.title) {
    embed.setTitle(options.title);
  }

  if (options.description) {
    embed.setDescription(options.description);
  }

  if (options.fields && options.fields.length > 0) {
    embed.addFields(options.fields);
  }

  if (options.footer) {
    embed.setFooter(options.footer);
  }

  if (options.thumbnail) {
    embed.setThumbnail(options.thumbnail);
  }

  if (options.image) {
    embed.setImage(options.image);
  }

  if (options.timestamp) {
    embed.setTimestamp();
  }

  if (options.author) {
    embed.setAuthor(options.author);
  }

  return embed;
}

/**
 * Obtient la couleur correspondant au niveau de faim
 */
export function getHungerColor(hungerLevel: number): number {
  switch (hungerLevel) {
    case 0: return EMBED_COLORS.HUNGER.DEAD;
    case 1: return EMBED_COLORS.HUNGER.AGONY;
    case 2: return EMBED_COLORS.HUNGER.STARVING;
    case 3: return EMBED_COLORS.HUNGER.HUNGRY;
    case 4: return EMBED_COLORS.HUNGER.HEALTHY;
    default: return EMBED_COLORS.NEUTRAL;
  }
}

/**
 * Obtient la couleur correspondant au stock de nourriture
 */
export function getStockColor(stock: number): number {
  if (stock > 100) return EMBED_COLORS.STOCK.HIGH;
  if (stock > 50) return EMBED_COLORS.STOCK.MEDIUM;
  if (stock > 20) return EMBED_COLORS.STOCK.LOW;
  return EMBED_COLORS.STOCK.CRITICAL;
}

/**
 * Crée un embed de statut de personnage
 */
export interface CharacterStatus {
  name: string;
  hungerLevel: number;
  hp: number;
  pm: number;
  paTotal: number;
  isDead?: boolean;
}

export function createCharacterStatusEmbed(
  character: CharacterStatus,
  options?: {
    showDetails?: boolean;
    additionalFields?: EmbedField[];
  }
): EmbedBuilder {
  const color = character.isDead
    ? EMBED_COLORS.DEATH
    : getHungerColor(character.hungerLevel);

  const fields: EmbedField[] = [];

  if (options?.showDetails !== false) {
    fields.push(
      { name: "Points d'Action", value: `${character.paTotal}/4`, inline: true },
      { name: "Points de Vie", value: `${character.hp}/5`, inline: true },
      { name: "Points Mentaux", value: `${character.pm}/5`, inline: true }
    );
  }

  if (options?.additionalFields) {
    fields.push(...options.additionalFields);
  }

  return createCustomEmbed({
    color,
    title: `📋 ${character.name}`,
    fields,
    timestamp: true,
  });
}

/**
 * Crée un embed de liste générique
 */
export function createListEmbed(
  title: string,
  items: string[],
  options?: {
    color?: ColorResolvable;
    emptyMessage?: string;
    footer?: string;
  }
): EmbedBuilder {
  const description = items.length > 0
    ? items.join("\n")
    : (options?.emptyMessage || "Aucun élément");

  const embed = createCustomEmbed({
    color: options?.color || EMBED_COLORS.INFO,
    title,
    description,
    timestamp: true,
  });

  if (options?.footer) {
    embed.setFooter({ text: options.footer });
  }

  return embed;
}
