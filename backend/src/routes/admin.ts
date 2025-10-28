import { Router } from "express";
import { requireAuthOrInternal } from "../middleware/auth";
import {
  createEmojiConfig,
  listEmojis,
  deleteEmoji,
  getAvailableEmojis,
} from "../controllers/emojis";
import { validate } from "../api/middleware/validation.middleware";
import {
  CreateEmojiSchema,
  DeleteEmojiSchema,
  ListEmojiSchema,
} from "../api/validators/emoji.schema";

const router = Router();

// Get available emojis for UI picker (public)
router.get("/emojis/available", requireAuthOrInternal, getAvailableEmojis);

// List all emojis with optional type filter
router.get(
  "/emojis/list",
  requireAuthOrInternal,
  validate(ListEmojiSchema),
  listEmojis
);

// Create emoji config
router.post(
  "/emojis",
  requireAuthOrInternal,
  validate(CreateEmojiSchema),
  createEmojiConfig
);

// Delete emoji config
router.delete(
  "/emojis/:type/:key",
  requireAuthOrInternal,
  validate(DeleteEmojiSchema),
  deleteEmoji
);

export default router;
