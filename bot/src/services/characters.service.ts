import { Client } from "discord.js";
import { httpClient } from "./httpClient";
import { getErrorMessage } from "./errors";
import { getOrCreateUser as getOrCreateUserSvc } from "./users.service";
import { getOrCreateGuild as getOrCreateGuildSvc } from "./guilds.service";
import { upsertRole as upsertRoleSvc } from "./roles.service";
import { logger } from "./logger";

export async function getOrCreateCharacter(
  userId: string,
  guildId: string,
  guildName: string,
  characterData: {
    nickname?: string | null;
    roles: string[];
    username?: string;
  },
  client: Client
) {
  try {
    const user = await getOrCreateUserSvc(
      userId,
      characterData.username || "",
      "0000"
    );
    if (!user) throw new Error("Utilisateur non trouvé");

    const characterName = characterData.nickname || characterData.username;

    // Get the guild from the client first
    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      throw new Error("Guild not found in client cache");
    }

    // Then handle the database guild
    let dbGuild;
    try {
      dbGuild = await getOrCreateGuildSvc(guildId, guildName, 0);
    } catch (guildError) {
      throw new Error("Impossible de vérifier ou créer la guild");
    }

    if (!dbGuild?.id) {
      throw new Error("ID de la guild non valide");
    }

    await Promise.all(
      characterData.roles.map(async (roleId) => {
        const role = guild.roles.cache.get(roleId);
        if (role) {
          try {
            await upsertRoleSvc(dbGuild.id, role.id, role.name, role.hexColor);
          } catch (error) {
            logger.error(
              `[characters.service] Erreur lors de la synchronisation du rôle ${role.id}: ${getErrorMessage(error)}`
            );
          }
        }
      })
    );

    const response = await httpClient.post("/characters", {
      userId: user.id,
      guildId: dbGuild.id,
      name: characterName,
      roleIds: characterData.roles,
    });

    return response.data;
  } catch (error) {
    throw new Error(
      `Impossible de récupérer ou créer le personnage: ${getErrorMessage(
        error
      )}`
    );
  }
}
