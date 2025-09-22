import type {
  Client,
  Message,
  Collection,
  ApplicationCommandType,
  CommandInteraction,
} from "discord.js";

export interface Command {
  name: string;
  description: string;
  type: ApplicationCommandType;
  run: (interaction: CommandInteraction) => Promise<void>;

  // Pour la rétrocompatibilité avec les anciennes commandes de message
  execute?: (
    client: Client,
    message: Message,
    args: string[]
  ) => Promise<void> | void;
}

declare module "discord.js" {
  interface Client {
    commands: Collection<string, Command>;
  }
}
