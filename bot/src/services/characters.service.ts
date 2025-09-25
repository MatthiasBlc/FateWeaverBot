import { Client } from "discord.js";
import { httpClient } from "./httpClient";
import { getErrorMessage } from "./errors";
import { getOrCreateUser as getOrCreateUserSvc } from "./users.service";
import { getOrCreateServer as getOrCreateServerSvc } from "./servers.service";
import { upsertRole as upsertRoleSvc } from "./roles.service";
import { logger } from "./logger";

export async function getOrCreateCharacter(
  userId: string,
  serverId: string,
  serverName: string,
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

    let server;
    try {
      server = await getOrCreateServerSvc(serverId, serverName, 0);
    } catch (serverError) {
      throw new Error("Impossible de vérifier ou créer le serveur");
    }

    if (!server || !server.id) {
      throw new Error("ID du serveur non valide");
    }

    const guild = client.guilds.cache.get(serverId);
    if (guild) {
      await Promise.all(
        characterData.roles.map(async (roleId) => {
          const role = guild.roles.cache.get(roleId);
          if (role) {
            try {
              await upsertRoleSvc(server.id, role.id, role.name, role.hexColor);
            } catch (error) {
              logger.error(
                `[characters.service] Erreur lors de la synchronisation du rôle ${role.id}:`,
                { error }
              );
            }
          }
        })
      );
    }

    const response = await httpClient.post("/characters", {
      userId: user.id,
      serverId: server.id,
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
