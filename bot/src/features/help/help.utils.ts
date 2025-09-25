import { EmbedBuilder } from "discord.js";
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

export function getUserCommandsHelp(): HelpSection[] {
  return [
    {
      name: "⚙️ Commandes de base",
      value:
        "```\n" +
        "/ping - Vérifie que le bot est en ligne\n" +
        "/profil - Affiche votre profil utilisateur\n" +
        "/help - Affiche ce message d'aide" +
        "\n```",
      inline: false,
    },
    {
      name: "🏗️ Commandes des chantiers",
      value:
        "```\n" +
        "/chantiers liste - Affiche la liste des chantiers\n" +
        "/chantiers build - Investir des points dans un chantier" +
        "\n```",
      inline: false,
    },
    {
      name: "❓ Besoin d'aide supplémentaire ?",
      value:
        "Contactez un administrateur du serveur pour toute question ou problème.",
      inline: false,
    }
  ];
}

export function getAdminCommandsHelp(): HelpSection[] {
  return [
    {
      name: "🏗️ Gestion des chantiers",
      value:
        "```\n" +
        "/chantiers add - Ajoute un nouveau chantier\n" +
        "/chantiers delete - Supprime un chantier existant\n" +
        "/helpadmin - Affiche ce message d'aide" +
        "\n```",
      inline: false,
    },
    {
      name: "🔧 Commandes administrateur",
      value:
        "```\n" +
        "/helpadmin - Affiche les commandes admin disponibles" +
        "\n```",
      inline: false,
    }
  ];
}