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
