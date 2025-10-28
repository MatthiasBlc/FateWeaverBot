import express from "express";
import {
  getAllSkills,
  getSkillById,
  createSkill,
  updateSkill,
  deleteSkill,
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

// Met à jour une compétence
router.patch("/:id", requireAuthOrInternal, updateSkill);

// Supprime une compétence
router.delete("/:id", requireAuthOrInternal, deleteSkill);

export default router;
