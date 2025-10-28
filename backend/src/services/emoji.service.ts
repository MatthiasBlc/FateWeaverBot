import { PrismaClient } from "@prisma/client";
import { BadRequestError, NotFoundError } from "../shared/errors";

export class EmojiService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Validate if a string is a valid emoji
   */
  isValidEmoji(str: string): boolean {
    // Pattern to match a single emoji
    const emojiPattern = /^(\p{Emoji})$/u;
    return emojiPattern.test(str);
  }

  /**
   * Create a new emoji configuration
   */
  async createEmojiConfig(type: string, key: string, emoji: string) {
    if (!this.isValidEmoji(emoji)) {
      throw new BadRequestError("Invalid emoji format");
    }

    const emojiConfig = await this.prisma.emojiConfig.create({
      data: {
        type,
        key,
        emoji,
      },
    });

    return emojiConfig;
  }

  /**
   * Get all emojis, optionally filtered by type
   */
  async getAllEmojis(type?: string) {
    const where = type ? { type } : undefined;

    const emojis = await this.prisma.emojiConfig.findMany({
      where,
      orderBy: [{ type: "asc" }, { key: "asc" }],
    });

    return emojis;
  }

  /**
   * Get a specific emoji by type and key
   */
  async getEmojiByKey(type: string, key: string) {
    const emoji = await this.prisma.emojiConfig.findUnique({
      where: {
        type_key: {
          type,
          key,
        },
      },
    });

    if (!emoji) {
      throw new NotFoundError("Emoji config", `${type}:${key}`);
    }

    return emoji;
  }

  /**
   * Delete an emoji configuration
   */
  async deleteEmojiConfig(type: string, key: string) {
    // Check if exists
    const emoji = await this.prisma.emojiConfig.findUnique({
      where: {
        type_key: {
          type,
          key,
        },
      },
    });

    if (!emoji) {
      throw new NotFoundError("Emoji config", `${type}:${key}`);
    }

    await this.prisma.emojiConfig.delete({
      where: {
        type_key: {
          type,
          key,
        },
      },
    });

    return emoji;
  }

  /**
   * Get available emojis for the UI picker
   * This is a curated list of commonly used emojis
   */
  getAvailableEmojis() {
    return {
      resources: [
        "🌲", "🪵", "🌾", "🥖", "🐟", "🦀", "🦞", "🦪",
        "🥩", "🍖", "🧱", "⛏️", "🪨", "💎", "⚙️", "🔧",
      ],
      actions: [
        "⚔️", "🛡️", "🏹", "🗡️", "🔨", "🪓", "🎣", "🌾",
        "🍳", "🧪", "📜", "🔍", "🎨", "🎭", "🎪", "🎸",
      ],
      status: [
        "✅", "❌", "⚠️", "🔴", "🟢", "🟡", "⭐", "💫",
        "⏳", "⏰", "🔔", "📢", "💬", "💭", "❤️", "💔",
      ],
      nature: [
        "☀️", "🌙", "⭐", "🌟", "⚡", "🔥", "💧", "❄️",
        "🌸", "🌺", "🌻", "🌹", "🍀", "🌿", "🍃", "🌾",
      ],
      custom: [
        "🎯", "🎲", "🃏", "🎰", "🏆", "🥇", "🥈", "🥉",
        "🎖️", "🏅", "👑", "💰", "💎", "🔑", "🗝️", "🚪",
      ],
    };
  }
}
