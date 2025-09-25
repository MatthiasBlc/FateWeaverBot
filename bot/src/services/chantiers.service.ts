import { httpClient } from "./httpClient";
import { getErrorMessage } from "./errors";

export async function getChantiersByServer(serverId: string) {
  try {
    const response = await httpClient.get(`/chantiers/server/${serverId}`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to get chantiers: ${getErrorMessage(error)}`);
  }
}

export async function createChantier(
  chantierData: { name: string; cost: number; serverId: string },
  userId: string
) {
  try {
    const { serverId, ...rest } = chantierData;
    const response = await httpClient.post("/chantiers", {
      ...rest,
      discordGuildId: serverId,
      createdBy: userId,
    });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to create chantier: ${getErrorMessage(error)}`);
  }
}

export async function deleteChantier(id: string) {
  try {
    const response = await httpClient.delete(`/chantiers/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to delete chantier: ${getErrorMessage(error)}`);
  }
}

export async function investInChantier(
  characterId: string,
  chantierId: string,
  points: number
) {
  const response = await httpClient.post(
    `/chantiers/${chantierId}/invest`,
    { characterId, points },
    { headers: { "X-Internal-Request": "true" } }
  );
  return response.data;
}
