import { Collection, EmbedBuilder } from "discord.js";
import type { Command } from "../../types/command";
import type { HelpEmbedData, HelpSection } from "./help.types";

export function createHelpEmbed(data: HelpEmbedData): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(data.color as any) // Type assertion temporaire
    .setTitle(data.title)
    .setDescription(data.description)
    .setTimestamp()
    .setFooter({
      text: `Demandé par ${data.username}`,
      iconURL: data.avatarUrl,
    });

  // Ajouter les sections d'aide
  data.sections.forEach(section => {
    embed.addFields({
      name: section.name,
      value: section.value,
      inline: section.inline ?? false,
    });
  });

  return embed;
}

/**
 * Génère dynamiquement les sections d'aide basées sur les commandes disponibles
 * @param commands Collection des commandes chargées
 * @param isAdmin Si true, inclut les commandes admin
 * @returns Array des sections d'aide générées dynamiquement
 */
export function generateDynamicHelpSections(
  commands: Collection<string, Command>,
  isAdmin: boolean = false
): HelpSection[] {
  const sections: HelpSection[] = [];

  // Grouper les commandes par catégorie
  const commandGroups: { [key: string]: string[] } = {};

  commands.forEach((command) => {
    // Vérifier si la commande nécessite des permissions admin
    const hasAdminPermissions = (command.data as any).default_member_permissions;

    // Nouvelle logique de filtrage basée sur les sous-commandes
    const options = (command.data as any).options || [];
    const subcommands = options.filter((option: any) => option.name && option.type === undefined);

    // Déterminer si cette commande est "admin" basée sur ses sous-commandes
    const hasAdminSubcommands = subcommands.some((sub: any) =>
      ['add', 'delete', 'admin'].includes(sub.name)
    );

    // Filtrer selon le contexte - mais maintenant on filtre au niveau des sous-commandes
    // Donc on traite toutes les commandes et on filtre les sous-commandes individuellement
    if (subcommands.length === 0) {
      // Si pas de sous-commandes, vérifier les permissions admin
      if (isAdmin && !hasAdminPermissions) {
        return;
      } else if (!isAdmin && hasAdminPermissions) {
        return;
      }
    }

    // Déterminer la catégorie basée sur le nom de la commande
    let category = "⚙️ Commandes de base";

    if (command.data.name.includes("chantier")) {
      category = "🏗️ Commandes des chantiers";
    } else if (hasAdminSubcommands) {
      category = "🔧 Commandes administrateur";
    }

    if (!commandGroups[category]) {
      commandGroups[category] = [];
    }

    // Vérifier si la commande a des sous-commandes
    const commandOptions = (command.data as any).options || [];
    const commandSubcommands = commandOptions.filter((option: any) => option.name && option.type === undefined);

    if (commandSubcommands.length > 0) {
      // La commande a des sous-commandes, les lister individuellement en filtrant par contexte
      commandSubcommands.forEach((subcommand: any) => {
        const subcommandName = subcommand.name;
        const isAdminSubcommand = ['add', 'delete', 'admin'].includes(subcommandName);

        // Filtrer selon le contexte
        if (isAdmin && !isAdminSubcommand) {
          // Dans le contexte admin, ignorer les sous-commandes utilisateur
          return;
        } else if (!isAdmin && isAdminSubcommand) {
          // Dans le contexte utilisateur, ignorer les sous-commandes admin
          return;
        }

        const subcommandDescription = subcommand.description || "Aucune description disponible";
        commandGroups[category].push(`/${command.data.name} ${subcommandName} - ${subcommandDescription}`);
      });
    } else {
      // Commande simple sans sous-commandes
      const description = command.data.description || "Aucune description disponible";
      commandGroups[category].push(`/${command.data.name} - ${description}`);
    }
  });

  // Convertir les groupes en sections d'aide
  Object.entries(commandGroups).forEach(([categoryName, commandsList]) => {
    sections.push({
      name: categoryName,
      value: "```\n" + commandsList.join("\n") + "\n```",
      inline: false,
    });
  });

  // Ajouter une section d'information générale (seulement pour les utilisateurs)
  if (!isAdmin) {
    sections.push({
      name: "❓ Besoin d'aide supplémentaire ?",
      value: "Contactez un administrateur du serveur pour toute question ou problème.",
      inline: false,
    });
  }

  return sections;
}