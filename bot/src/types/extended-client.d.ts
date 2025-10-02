import { Client } from "discord.js";
import { Collection } from "@discordjs/collection";
import { Command } from "./types/command";

declare module "discord.js" {
  interface Client {
    commands: Collection<string, Command>;
  }
}
