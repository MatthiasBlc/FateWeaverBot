import { RequestHandler } from "express";
import { BadRequestError, NotFoundError } from "../shared/errors";
import { prisma } from "../util/db";
import { EmojiService } from "../services/emoji.service";

const emojiService = new EmojiService(prisma);

/**
 * POST /admin/emojis - Create emoji config
 */
export const createEmojiConfig: RequestHandler = async (req, res, next) => {
  try {
    const { type, key, emoji } = req.body;

    if (!type || !key || !emoji) {
      throw new BadRequestError("type, key, and emoji are required");
    }

    const emojiConfig = await emojiService.createEmojiConfig(type, key, emoji);

    res.status(201).json(emojiConfig);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /admin/emojis/list - List all emojis (optional type filter)
 */
export const listEmojis: RequestHandler = async (req, res, next) => {
  try {
    const { type } = req.query;

    const emojis = await emojiService.getAllEmojis(
      type ? String(type) : undefined
    );

    res.status(200).json(emojis);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /admin/emojis/:type/:key - Delete emoji config
 */
export const deleteEmoji: RequestHandler = async (req, res, next) => {
  try {
    const { type, key } = req.params;

    if (!type || !key) {
      throw new BadRequestError("type and key are required");
    }

    const deletedEmoji = await emojiService.deleteEmojiConfig(type, key);

    res.status(200).json(deletedEmoji);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /admin/emojis/available - Get available emojis for UI
 */
export const getAvailableEmojis: RequestHandler = async (req, res, next) => {
  try {
    const availableEmojis = emojiService.getAvailableEmojis();

    res.status(200).json(availableEmojis);
  } catch (error) {
    next(error);
  }
};
