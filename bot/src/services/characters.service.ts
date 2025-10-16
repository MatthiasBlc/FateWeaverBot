import { Client } from "discord.js";
import { httpClient } from "./httpClient";
import { getErrorMessage } from "./errors";
import { getOrCreateUser as getOrCreateUserSvc } from "./users.service";
import { getOrCreateGuild as getOrCreateGuildSvc } from "./guilds.service";
import { upsertRole as upsertRoleSvc } from "./roles.service";
import { logger } from "./logger";

/**
 * Résultat de la vérification de personnage
 */
export interface CharacterCheckResult {
  needsCreation: boolean;
  canReroll: boolean;
  hasActiveCharacter: boolean;
  character?: {
    id: string;
    name: string;
    userId: string;
    townId: string;
    isActive: boolean;
    isDead: boolean;
    canReroll: boolean;
    hungerLevel: number;
    paTotal: number;
    hp: number;
    pm: number;
    roles?: Array<{ discordId: string; name: string }>;
    lastPaUpdate: string;
    createdAt: string;
    updatedAt: string;
  };
  rerollableCharacters?: Array<{
    id: string;
    name: string;
    userId: string;
    townId: string;
    isActive: boolean;
    isDead: boolean;
    canReroll: boolean;
    hungerLevel: number;
    paTotal: number;
    hp: number;
    pm: number;
    roles?: Array<{ discordId: string; name: string }>;
    lastPaUpdate: string;
    createdAt: string;
    updatedAt: string;
  }>;
}

/**
 * Vérifie l'état du personnage d'un utilisateur sans créer automatiquement
 * Cette fonction est utilisée par le middleware ensureCharacter.ts
 */
export async function checkCharacterStatus(
  userId: string,
  guildId: string,
  client: Client
): Promise<CharacterCheckResult> {
  try {
    const user = await getOrCreateUserSvc(userId, "", "0000");
    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }

    // Get the guild from the client first
    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      throw new Error("Guild not found in client cache");
    }

    // Get guild details to get the townId
    const guildResponse = await httpClient.get(`/guilds/discord/${guildId}`);
    const guildWithTown = guildResponse.data;

    if (!guildWithTown?.town?.id) {
      throw new Error("Impossible de trouver la ville associée à cette guilde");
    }

    const townId = guildWithTown.town.id;
    // Récupérer le personnage actif de l'utilisateur (il doit toujours y en avoir un ou aucun)
    const activeCharacter = await httpClient
      .get(`/characters/town/${townId}`)
      .then((response) =>
        response.data?.find(
          (char: any) => char.userId === user.id && char.isActive
        )
      )
      .catch(() => null);

    logger.info("Debug checkCharacterStatus", {
      userId,
      guildId,
      townId,
      activeCharacter: activeCharacter
        ? {
            id: activeCharacter.id,
            name: activeCharacter.name,
            isDead: activeCharacter.isDead,
            isActive: activeCharacter.isActive,
            canReroll: activeCharacter.canReroll,
          }
        : null,
    });

    // CAS 1: Aucun personnage actif -> l'utilisateur doit créer un personnage
    if (!activeCharacter) {
      logger.info("CAS 1: Aucun personnage actif");
      return {
        needsCreation: true,
        canReroll: false,
        hasActiveCharacter: false,
      };
    }

    // CAS 2: Le personnage actif est mort avec permission de reroll -> modal de reroll
    if (activeCharacter.isDead && activeCharacter.canReroll) {
      logger.info("CAS 2: Personnage mort avec permission de reroll");
      return {
        needsCreation: false,
        canReroll: true,
        hasActiveCharacter: true,
        character: activeCharacter,
        rerollableCharacters: [activeCharacter],
      };
    }

    // CAS 3: Le personnage actif est mort sans permission de reroll -> afficher la fiche
    if (activeCharacter.isDead && !activeCharacter.canReroll) {
      logger.info("CAS 3: Personnage mort sans permission de reroll");
      return {
        needsCreation: false,
        canReroll: false,
        hasActiveCharacter: true,
        character: activeCharacter,
        rerollableCharacters: [],
      };
    }

    // CAS 4: Le personnage actif est vivant -> tout va bien
    logger.info("CAS 4: Personnage actif vivant");
    return {
      needsCreation: false,
      canReroll: false,
      hasActiveCharacter: true,
      character: activeCharacter,
      rerollableCharacters: [],
    };
  } catch (error) {
    logger.error("Error checking character status:", {
      userId,
      guildId,
      error: error instanceof Error ? error.message : error,
    });
    throw error;
  }
}

// NOTE: La fonction getOrCreateCharacter a été supprimée car elle créait automatiquement
// les personnages et n'est plus utilisée dans le nouveau système de vérification automatique.
// Cette fonctionnalité est maintenant gérée par le backend via les endpoints appropriés.
