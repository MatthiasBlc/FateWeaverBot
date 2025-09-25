import { httpClient } from "./httpClient";
import { getErrorMessage } from "./errors";

export async function upsertRole(
  serverId: string,
  discordRoleId: string,
  name: string,
  color?: string
) {
  try {
    const response = await httpClient.post("/roles", {
      discordId: discordRoleId,
      name,
      color,
      serverId,
    });
    return response.data;
  } catch (error) {
    throw new Error(
      `Impossible de créer/mettre à jour le rôle: ${getErrorMessage(error)}`
    );
  }
}
