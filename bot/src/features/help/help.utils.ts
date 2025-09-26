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
  commands: any,
  isAdmin: boolean = false
): HelpSection[] {
  const sections: HelpSection[] = [];

  // Grouper les commandes par catégorie
  const commandGroups: { [key: string]: string[] } = {};

  commands.forEach((command: any) => {
    // Exclure les commandes admin (celles qui contiennent "-admin" ou ont des permissions admin)
    const hasAdminPermissions = (command.data as any).default_member_permissions;
    const isAdminCommand = command.data.name.includes("-admin") || hasAdminPermissions;

    // Filtrer selon le contexte
    if (isAdmin && !isAdminCommand) {
      return;
    } else if (!isAdmin && isAdminCommand) {
      return;
    }

    // Déterminer la catégorie basée sur le nom de la commande
    let category = "⚙️ Commandes de base";

    if (command.data.name.includes("chantier")) {
      category = "🏗️ Commandes des chantiers";
    } else if (isAdminCommand) {
      category = "🔧 Commandes administrateur";
    }

    if (!commandGroups[category]) {
      commandGroups[category] = [];
    }

    // Vérifier si la commande a des sous-commandes
    const commandOptions = (command.data as any).options || [];

    // Commande simple sans sous-commandes
    if (commandOptions.length === 0) {
      const description = command.data.description || "Aucune description disponible";
      commandGroups[category].push(`/${command.data.name} - ${description}`);
    } else {
      // Commande avec sous-commandes
      const subcommands = commandOptions.filter((option: any) => option.name && option.type === undefined);
      subcommands.forEach((subcommand: any) => {
        const description = subcommand.description || "Aucune description disponible";
        commandGroups[category].push(`/${command.data.name} ${subcommand.name} - ${description}`);
      });
    }
  });

  // Convertir les groupes en sections d'aide avec un ordre cohérent
  const categoryOrder = [
    "⚙️ Commandes de base",
    "🔧 Commandes administrateur",
    "🏗️ Commandes des chantiers"
  ];

  // Trier les catégories selon l'ordre défini
  const sortedEntries = Object.entries(commandGroups).sort(([a], [b]) => {
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);

    // Si les deux catégories sont dans l'ordre défini, les trier selon cet ordre
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }

    // Si une catégorie n'est pas dans l'ordre défini, la mettre à la fin
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;

    // Ordre alphabétique pour les autres catégories
    return a.localeCompare(b);
  });

  sortedEntries.forEach(([categoryName, commandsList]) => {
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
