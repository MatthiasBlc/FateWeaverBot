import express from "express";
import {
  getAllSkills,
  getSkillById,
  createSkill,
} from "../controllers/skills";
import { requireAuthOrInternal } from "../middleware/auth";
import { validate } from "../api/middleware/validation.middleware";
import {
  GetSkillByIdSchema,
  CreateSkillSchema
} from "../api/validators/skill.schema";

const router = express.Router();

// Récupère toutes les compétences disponibles
router.get("/", requireAuthOrInternal, getAllSkills);

// Récupère une compétence par son ID
router.get("/:id", requireAuthOrInternal, validate(GetSkillByIdSchema), getSkillById);

// Crée une nouvelle compétence
router.post("/", requireAuthOrInternal, validate(CreateSkillSchema), createSkill);

export default router;
