import axios from "axios";
import { httpClient } from "./httpClient";
import { getErrorMessage } from "./errors";

export async function getOrCreateUser(
  discordId: string,
  username: string,
  discriminator: string
) {
  try {
    const response = await httpClient.get(`/users/discord/${discordId}`);
    if (response.data) return response.data;

    const createResponse = await httpClient.post("/users", {
      discordId,
      username,
      discriminator,
    });
    return createResponse.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      try {
        const createResponse = await httpClient.post("/users", {
          discordId,
          username,
          discriminator,
        });
        return createResponse.data;
      } catch (createError) {
        throw new Error(
          `Impossible de créer l'utilisateur: ${getErrorMessage(createError)}`
        );
      }
    }
    throw new Error(
      `Erreur lors de la récupération de l'utilisateur: ${getErrorMessage(
        error
      )}`
    );
  }
}

export async function updateUser(
  discordId: string,
  userData: {
    username: string;
    discriminator: string;
    globalName?: string | null;
    avatar?: string | null;
    email?: string | null;
  }
) {
  try {
    const response = await httpClient.put(
      `/users/discord/${discordId}`,
      userData
    );
    return response.data;
  } catch (error) {
    throw new Error(
      `Impossible de mettre à jour l'utilisateur: ${getErrorMessage(error)}`
    );
  }
}
