import { httpClient } from "./httpClient";
import axios from "axios";
import { getErrorMessage } from "./errors";

export async function getOrCreateGuild(
  discordId: string,
  name: string,
  memberCount: number
) {
  try {
    // Backend handles upsert on POST /guilds
    const response = await httpClient.post("/guilds", {
      discordId,
      name,
      memberCount,
    });

    const guild = response.data;

    // Vérifier si la guilde a une ville, sinon en créer une automatiquement
    try {
      await httpClient.get(`/towns/guild/${discordId}`);
    } catch (townError: any) {
      // Si la ville n'existe pas (404), en créer une
      if (townError.response?.status === 404) {
        console.log(`Création automatique d'une ville pour la guilde ${name} (${discordId})`);
        await httpClient.post("/towns", {
          name: name,
          guildId: guild.id,
        });
      }
    }

    return guild;
  } catch (error) {
    // Provide detailed error while keeping behavior simple
    const message = axios.isAxiosError(error)
      ? error.response?.data?.message || error.message
      : getErrorMessage(error);
    throw new Error(
      `Erreur lors de la récupération/création de la guild: ${message}`
    );
  }
}
