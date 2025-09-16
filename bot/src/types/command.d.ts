import type { Client, Message, Collection } from "discord.js";

export interface Command {
  name: string;
  description?: string;
  execute(
    client: Client,
    message: Message,
    args: string[]
  ): Promise<void> | void;
}

declare module "discord.js" {
  interface Client {
    commands: Collection<string, Command>;
  }
}
