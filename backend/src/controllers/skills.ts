import { RequestHandler } from "express";
import createHttpError from "http-errors";
import { prisma } from "../util/db";

export const getAllSkills: RequestHandler = async (req, res, next) => {
  try {
    const skills = await prisma.skill.findMany({
      orderBy: { name: 'asc' }
    });
    res.status(200).json(skills);
  } catch (error) {
    next(error);
  }
};

export const getSkillById: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw createHttpError(400, "id requis");
    }

    const skill = await prisma.skill.findUnique({
      where: { id }
    });

    if (!skill) {
      throw createHttpError(404, "Compétence non trouvée");
    }

    res.status(200).json(skill);
  } catch (error) {
    next(error);
  }
};

export const createSkill: RequestHandler = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name || !description) {
      throw createHttpError(400, "name et description sont requis");
    }

    // Vérifier si une compétence avec ce nom existe déjà
    const existingSkill = await prisma.skill.findFirst({
      where: { name }
    });

    if (existingSkill) {
      throw createHttpError(400, `Une compétence nommée "${name}" existe déjà`);
    }

    const skill = await prisma.skill.create({
      data: {
        name,
        description,
      },
    });

    res.status(201).json(skill);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/characters/:id/skills
 * Récupère les compétences d'un personnage
 */
export const getCharacterSkills: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw createHttpError(400, "Character ID requis");
    }

    const characterSkills = await prisma.characterSkill.findMany({
      where: { characterId: id },
      include: {
        skill: true
      }
    });

    // Retourner uniquement les données des compétences
    const skills = characterSkills.map(cs => cs.skill);

    res.status(200).json(skills);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/characters/:id/skills/:skillId
 * Ajoute une compétence à un personnage
 */
export const addCharacterSkill: RequestHandler = async (req, res, next) => {
  try {
    const { id, skillId } = req.params;

    if (!id || !skillId) {
      throw createHttpError(400, "Character ID et Skill ID requis");
    }

    // Vérifier si le personnage existe
    const character = await prisma.character.findUnique({
      where: { id }
    });

    if (!character) {
      throw createHttpError(404, "Personnage non trouvé");
    }

    // Vérifier si la compétence existe
    const skill = await prisma.skill.findUnique({
      where: { id: skillId }
    });

    if (!skill) {
      throw createHttpError(404, "Compétence non trouvée");
    }

    // Vérifier si le personnage possède déjà cette compétence
    const existing = await prisma.characterSkill.findUnique({
      where: {
        characterId_skillId: {
          characterId: id,
          skillId: skillId
        }
      }
    });

    if (existing) {
      throw createHttpError(400, "Le personnage possède déjà cette compétence");
    }

    // Ajouter la compétence
    const characterSkill = await prisma.characterSkill.create({
      data: {
        characterId: id,
        skillId: skillId
      },
      include: {
        skill: true
      }
    });

    res.status(201).json(characterSkill.skill);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/characters/:id/skills/:skillId
 * Retire une compétence d'un personnage
 */
export const removeCharacterSkill: RequestHandler = async (req, res, next) => {
  try {
    const { id, skillId } = req.params;

    if (!id || !skillId) {
      throw createHttpError(400, "Character ID et Skill ID requis");
    }

    // Vérifier si le personnage possède cette compétence
    const existing = await prisma.characterSkill.findUnique({
      where: {
        characterId_skillId: {
          characterId: id,
          skillId: skillId
        }
      }
    });

    if (!existing) {
      throw createHttpError(404, "Le personnage ne possède pas cette compétence");
    }

    // Retirer la compétence
    await prisma.characterSkill.delete({
      where: {
        characterId_skillId: {
          characterId: id,
          skillId: skillId
        }
      }
    });

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};
