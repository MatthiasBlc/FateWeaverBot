import express from "express";
import {
  getAllSkills,
  getSkillById,
  createSkill,
} from "../controllers/skills";
import { requireAuthOrInternal } from "../middleware/auth";

const router = express.Router();

// Récupère toutes les compétences disponibles
router.get("/", requireAuthOrInternal, getAllSkills);

// Récupère une compétence par son ID
router.get("/:id", requireAuthOrInternal, getSkillById);

// Crée une nouvelle compétence
router.post("/", requireAuthOrInternal, createSkill);

export default router;
