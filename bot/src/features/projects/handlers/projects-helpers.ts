/**
 * Fonctions utilitaires réutilisables pour le module projects
 */

import type { Project, ProjectReward } from "../projects.types.js";
import type { Capability } from "./projects-common.js";
import { PROJECT, STATUS } from "../../../constants/emojis.js";

/**
 * Normalise les capacités brutes de l'API en objets typés
 */
export function normalizeCapabilities(rawCapabilities: any[]): Capability[] {
  if (!rawCapabilities || rawCapabilities.length === 0) {
    return [];
  }

  return rawCapabilities.map((item) => {
    const capability = item?.capability ?? item ?? {};

    return {
      id: capability.id ?? item?.capabilityId ?? "",
      name: capability.name ?? "",
      emojiTag: capability.emojiTag ?? "",
      category: capability.category ?? "",
      costPA: capability.costPA ?? 0,
      description: capability.description ?? "",
    } as Capability;
  });
}

/**
 * Génère le texte de sortie d'un projet (ressource ou objet)
 */
export function getProjectOutputText(project: Project): string {
  // Ressources : 10x🥞 (quantité + emoji uniquement)
  if (project.outputResourceType && project.outputResourceTypeId !== null) {
    return `${project.outputQuantity}x${project.outputResourceType.emoji}`;
  }

  // Objets : Canari(x1) (nom + parenthèses avec quantité)
  if (project.outputObjectType && project.outputObjectTypeId !== null) {
    return `${project.outputObjectType.name}(x${project.outputQuantity})`;
  }

  // Fallbacks
  if (project.outputResourceTypeId !== null) {
    return `${project.outputQuantity}x${PROJECT.ICON}`;
  }

  if (project.outputObjectTypeId !== null) {
    return `objet(x${project.outputQuantity})`;
  }

  return "";
}

/**
 * Formate le message de récompense selon le type de reward
 */
export function formatRewardMessage(
  project: Project,
  reward: ProjectReward | undefined,
  finisherName?: string
): string {
  if (!reward) {
    const defaultOutput = getProjectOutputText(project);
    return defaultOutput
      ? `✅ ${defaultOutput} ajouté au stock de la ville !`
      : `${STATUS.SUCCESS} Récompense enregistrée !`;
  }

  switch (reward.type) {
    case "RESOURCE": {
      const emoji = project.outputResourceType?.emoji ?? PROJECT.ICON;
      const name = project.outputResourceType?.name ?? "ressource";
      return `✅ ${emoji} ${reward.quantity}x ${name} ajouté au stock de la ville !`;
    }
    case "RESOURCE_CONVERSION": {
      const lines = reward.resources
        .map((res) => `• ${res.quantity}x ${res.resourceName}`)
        .join("\n");
      return `📦 L'objet a été converti en ressources pour la ville :\n${lines}`;
    }
    case "OBJECT": {
      const owner = finisherName ? `à **${finisherName}**` : "à l'artisan";
      const quantityText = reward.quantity > 1 ? `${reward.quantity}x ` : "";
      return `🎁 ${quantityText}${reward.objectType.name} remis ${owner} !`;
    }
    default:
      return `${STATUS.SUCCESS} Récompense enregistrée !`;
  }
}
