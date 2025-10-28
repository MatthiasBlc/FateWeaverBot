import { Request, Response, NextFunction } from "express";
import {
  NotFoundError,
  BadRequestError,
  ValidationError,
} from "../shared/errors";
import { container } from "../infrastructure/container";
import { CraftType } from "@prisma/client";

const craftAliasMap: Record<string, CraftType> = {
  tisser: CraftType.TISSER,
  forger: CraftType.FORGER,
  "travailler le bois": CraftType.MENUISER,
  travailler_le_bois: CraftType.MENUISER,
  "travailler-le-bois": CraftType.MENUISER,
  menuiser: CraftType.MENUISER,
  menuiserie: CraftType.MENUISER,
  menuisiere: CraftType.MENUISER,
  menuisier: CraftType.MENUISER,
};

function normalizeCraftTypes(craftTypes: string[]): CraftType[] {
  return craftTypes.map((raw) => {
    const normalized = craftAliasMap[raw.trim().toLowerCase()];
    if (!normalized) {
      throw new BadRequestError(`Type d'artisanat invalide: ${raw}`);
    }
    return normalized;
  });
}

export const createProject = async (req: Request, res: Response) => {
  try {
    const {
      name,
      paRequired,
      outputResourceTypeId,
      outputObjectTypeId,
      outputQuantity,
      townId,
      createdBy,
      craftTypes,
      resourceCosts,
      paBlueprintRequired,
      blueprintResourceCosts,
    } = req.body;

    if (
      !name ||
      !paRequired ||
      !outputQuantity ||
      !townId ||
      !createdBy ||
      !craftTypes
    ) {
      return res.status(400).json({ error: "Champs manquants" });
    }

    const normalizedCraftTypes = normalizeCraftTypes(craftTypes);

    const hasResourceReward =
      outputResourceTypeId !== undefined && outputResourceTypeId !== null;
    const hasObjectReward =
      outputObjectTypeId !== undefined && outputObjectTypeId !== null;

    if (hasResourceReward === hasObjectReward) {
      throw new BadRequestError(
        "Un projet doit produire soit une ressource, soit un objet"
      );
    }

    const project = await container.projectService.createProject({
      name,
      paRequired,
      outputResourceTypeId: hasResourceReward
        ? Number(outputResourceTypeId)
        : undefined,
      outputObjectTypeId: hasObjectReward
        ? Number(outputObjectTypeId)
        : undefined,
      outputQuantity,
      townId,
      createdBy,
      craftTypes: normalizedCraftTypes,
      resourceCosts,
      paBlueprintRequired,
      blueprintResourceCosts,
    });

    return res.status(201).json(project);
  } catch (error: any) {
    console.error("Error creating project:", error);
    return res.status(400).json({ error: error.message });
  }
};

export const getProjectsByCraftType = async (req: Request, res: Response) => {
  try {
    const { townId, craftType } = req.params;

    let normalizedCraftType: CraftType | undefined;
    if (Object.values(CraftType).includes(craftType as CraftType)) {
      normalizedCraftType = craftType as CraftType;
    } else {
      normalizedCraftType = craftAliasMap[craftType.trim().toLowerCase()];
    }

    if (!normalizedCraftType) {
      return res.status(400).json({ error: "Type d'artisanat invalide" });
    }

    const projects =
      await container.projectService.getActiveProjectsForCraftType(
        townId,
        normalizedCraftType
      );

    return res.status(200).json(projects);
  } catch (error: any) {
    console.error("Error fetching projects:", error);
    return res.status(400).json({ error: error.message });
  }
};

export const getProjectById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { projectId } = req.params;

    const project = await container.projectService.getProjectById(projectId);

    return res.status(200).json(project);
  } catch (error: any) {
    console.error("Error fetching project:", error);
    return res.status(404).json({ error: error.message });
  }
};

export const contributeToProject = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { characterId, projectId } = req.params;
    const { paAmount, resourceContributions } = req.body;

    if (!paAmount && !resourceContributions) {
      return res
        .status(400)
        .json({
          error: "Au moins une contribution (PA ou ressources) est requise",
        });
    }

    const result = await container.projectService.contributeToProject({
      characterId,
      projectId,
      paAmount,
      resourceContributions,
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Error contributing to project:", error);
    return res.status(400).json({ error: error.message });
  }
};

export const getAllProjectsForTown = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { townId } = req.params;

    const projects = await container.projectService.getAllProjectsForTown(
      townId
    );

    return res.status(200).json(projects);
  } catch (error: any) {
    console.error("Error fetching town projects:", error);
    return res.status(400).json({ error: error.message });
  }
};

export const deleteProject = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { projectId } = req.params;

    const result = await container.projectService.deleteProject(projectId);

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Error deleting project:", error);
    return res.status(400).json({ error: error.message });
  }
};

export const restartBlueprint = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { projectId } = req.params;
    const { createdBy } = req.body;

    if (!createdBy) {
      return res.status(400).json({ error: "Created by is required" });
    }

    const newProject = await container.projectService.restartBlueprint(
      projectId,
      createdBy
    );

    return res.status(201).json(newProject);
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error.message || "Internal server error" });
  }
};
