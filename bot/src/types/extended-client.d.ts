import { Client } from "discord.js";
import { Collection } from "@discordjs/collection";
import { Command } from "./command";

declare module "discord.js" {
  interface Client {
    commands: Collection<string, Command>;
  }
}
