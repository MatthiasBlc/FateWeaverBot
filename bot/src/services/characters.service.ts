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
  character?: any;
  rerollableCharacters?: any[];
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

    // Vérifier si l'utilisateur a besoin de créer un personnage
    const needsCreationResponse = await httpClient.get(`/characters/needs-creation/${user.id}/${townId}`)
      .then(response => response.data)
      .catch(() => ({ needsCreation: true }));

    const needsCreation = needsCreationResponse.needsCreation;

    // Vérifier si l'utilisateur a AU MOINS un personnage (mort ou vivant)
    const userCharacters = await httpClient.get(`/characters/town/${townId}`)
      .then(response => response.data?.filter((char: any) => char.userId === user.id))
      .catch(() => []);

    if (needsCreation && userCharacters.length === 0) {
      // L'utilisateur n'a vraiment aucun personnage - afficher le modal de création
      return {
        needsCreation: true,
        canReroll: false,
        hasActiveCharacter: false
      };
    }

    // Récupérer les personnages rerollables
    const rerollableCharacters = await httpClient.get(`/characters/rerollable/${user.id}/${townId}`)
      .then(response => response.data)
      .catch(() => []);

    // Vérifier si l'utilisateur a un personnage actif (vivant et actif)
    const activeCharacter = await httpClient.get(`/characters/town/${townId}`)
      .then(response => response.data?.find((char: any) => char.userId === user.id && char.isActive && !char.isDead))
      .catch(() => null);

    // Vérifier si l'utilisateur a un personnage mort avec permission de reroll
    const deadCharacterWithReroll = userCharacters.find((char: any) => char.isDead && char.canReroll);

    // Si l'utilisateur a un personnage mort avec permission de reroll, afficher le modal de reroll
    if (deadCharacterWithReroll) {
      return {
        needsCreation: false,
        canReroll: true,
        hasActiveCharacter: false,
        character: deadCharacterWithReroll,
        rerollableCharacters: [deadCharacterWithReroll]
      };
    }

    // Vérifier si l'utilisateur a un personnage mort sans permission de reroll
    const deadCharacter = userCharacters.find((char: any) => char.isDead);
    if (deadCharacter) {
      return {
        needsCreation: false,
        canReroll: false,
        hasActiveCharacter: false,
        character: deadCharacter,
        rerollableCharacters: []
      };
    }

    // Si l'utilisateur a un personnage actif, tout va bien
    if (activeCharacter) {
      return {
        needsCreation: false,
        canReroll: false,
        hasActiveCharacter: true,
        character: activeCharacter,
        rerollableCharacters: []
      };
    }

    // Si on arrive ici, l'utilisateur n'a pas de personnage actif ni de personnage mort avec reroll
    // On vérifie s'il a des personnages rerollables
    const hasRerollable = rerollableCharacters && rerollableCharacters.length > 0;
    
    return {
      needsCreation: false,
      canReroll: hasRerollable,
      hasActiveCharacter: false,
      character: hasRerollable ? rerollableCharacters[0] : null,
      rerollableCharacters: hasRerollable ? rerollableCharacters : []
    };

  } catch (error) {
    logger.error("Error checking character status:", {
      userId,
      guildId,
      error: error instanceof Error ? error.message : error
    });
    throw error;
  }
}

// NOTE: La fonction getOrCreateCharacter a été supprimée car elle créait automatiquement
// les personnages et n'est plus utilisée dans le nouveau système de vérification automatique.
// Cette fonctionnalité est maintenant gérée par le backend via les endpoints appropriés.
