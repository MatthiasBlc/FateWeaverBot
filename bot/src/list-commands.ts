import {
  REST,
  Routes,
  RESTGetAPIApplicationCommandsResult,
  ApplicationCommand,
} from "discord.js";

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!);
const clientId = process.env.DISCORD_CLIENT_ID!;
const guildId = process.env.DISCORD_GUILD_ID!; // facultatif : pour voir les commandes guildées

async function listCommands() {
  try {
    // Commandes globales
    const globalCommands = (await rest.get(
      Routes.applicationCommands(clientId)
    )) as ApplicationCommand[];
    console.log("=== Commandes globales ===");
    console.table(
      globalCommands.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
      }))
    );

    // Commandes guildées (optionnel)
    if (guildId) {
      const guildCommands = (await rest.get(
        Routes.applicationGuildCommands(clientId, guildId)
      )) as ApplicationCommand[];
      console.log("=== Commandes guildées ===");
      console.table(
        guildCommands.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description,
        }))
      );
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des commandes :", error);
  }
}

listCommands();
