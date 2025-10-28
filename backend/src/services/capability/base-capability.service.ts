import { PrismaClient } from "@prisma/client";
import { CapabilityRepository } from "../../domain/repositories/capability.repository";
import { CapabilityExecutionResult } from "../types/capability-result.types";

/**
 * Classe de base abstraite pour toutes les capacités
 * Fournit les dépendances communes et définit le contrat d'exécution
 */
export abstract class BaseCapability {
  constructor(
    protected readonly prisma: PrismaClient,
    protected readonly capabilityRepo: CapabilityRepository
  ) {}

  /**
   * Méthode abstraite que chaque capacité doit implémenter
   * @param characterId ID du personnage qui utilise la capacité
   * @param capabilityId ID de la capacité
   * @param params Paramètres spécifiques à la capacité
   * @returns Résultat standardisé de l'exécution
   */
  abstract execute(
    characterId: string,
    capabilityId: string,
    params?: Record<string, any>
  ): Promise<CapabilityExecutionResult>;

  /**
   * Nom de la capacité (pour logging et debugging)
   */
  abstract readonly name: string;

  /**
   * Catégorie de la capacité
   */
  abstract readonly category: "HARVEST" | "CRAFT" | "SCIENCE" | "SPECIAL";
}
