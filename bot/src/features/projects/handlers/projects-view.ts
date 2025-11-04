/**
 * Handler pour afficher les projets depuis le profil utilisateur
 * Réutilise la logique d'affichage avec vérification de propriété
 */

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type ButtonInteraction,
} from "discord.js";

import type { Project } from "../projects.types.js";
import { apiService } from "../../../services/api/index.js";
import { logger } from "../../../services/logger.js";
import {
  getStatusEmoji,
  getCraftTypeEmoji,
  toCraftEnum,
} from "../projects.utils.js";
import type { CraftEnum } from "../projects.utils.js";
import { createInfoEmbed } from "../../../utils/embeds.js";
import { STATUS } from "../../../constants/emojis.js";
import type { Town, ActiveCharacter } from "./projects-common.js";
import { normalizeCapabilities, getProjectOutputText } from "./projects-helpers.js";

/**
 * Handler pour le bouton "Voir les projets" depuis le profil
 * Réutilise la logique de handleProjectsCommand
 */
export async function handleViewProjectsFromProfile(
  interaction: ButtonInteraction
) {
  try {
    // Extraire les IDs du customId
    const [, characterId, userId] = interaction.customId.split(":");

    // Vérifier que l'utilisateur qui clique est bien le propriétaire
    if (interaction.user.id !== userId) {
      await interaction.reply({
        content: `${STATUS.ERROR} Vous ne pouvez voir que vos propres projets.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    // Récupérer l'utilisateur
    const user = await apiService.getOrCreateUser(
      interaction.user.id,
      interaction.user.username,
      interaction.user.discriminator
    );

    if (!user) {
      throw new Error("Impossible de créer ou récupérer l'utilisateur");
    }

    // Récupérer la ville du serveur
    const townResponse = await apiService.guilds.getTownByGuildId(
      interaction.guildId!
    );
    const town = townResponse as unknown as Town;

    if (!town || !town.id) {
      throw new Error("Ville non trouvée pour cette guilde");
    }

    // Récupérer le personnage actif
    const townCharacters = (await apiService.characters.getTownCharacters(
      town.id
    )) as any[];
    const userCharacters = townCharacters.filter(
      (char: any) => char.user?.discordId === interaction.user.id
    );
    const activeCharacter = userCharacters.find(
      (char: any) => char.isActive
    ) as ActiveCharacter | undefined;

    if (!activeCharacter) {
      return interaction.reply({
        content: `${STATUS.ERROR} Vous devez avoir un personnage actif pour voir les projets artisanaux.`,
        flags: ["Ephemeral"],
      });
    }

    // Récupérer les capacités du personnage
    const rawCapabilities =
      (await apiService.characters.getCharacterCapabilities(
        activeCharacter.id
      )) as any[];
    const capabilities = normalizeCapabilities(rawCapabilities);

    // Filtrer les capacités craft
    const craftsFromCapabilities = capabilities
      .map((cap) => ({ cap, craft: toCraftEnum(cap.name) }))
      .filter((entry) => entry.craft !== undefined);

    if (craftsFromCapabilities.length === 0) {
      return interaction.reply({
        content:
          "🛠️ Vous n'avez aucune capacité artisanale. Les projets sont réservés aux artisans !",
        flags: ["Ephemeral"],
      });
    }

    const uniqueCraftEnums = Array.from(
      new Set(craftsFromCapabilities.map((entry) => entry.craft as CraftEnum))
    );

    // Récupérer tous les projets pour chaque craft type
    let allProjects: Project[] = [];
    for (const craftType of uniqueCraftEnums) {
      const projects = await apiService.projects.getProjectsByCraftType(
        town.id,
        craftType
      );
      allProjects = allProjects.concat(projects);
    }

    // Dédupliquer (un projet peut avoir plusieurs craft types)
    const uniqueProjects = Array.from(
      new Map(allProjects.map((p) => [p.id, p])).values()
    );

    if (uniqueProjects.length === 0) {
      return interaction.reply({
        content:
          "Aucun projet artisanal n'a encore été créé pour vos capacités.",
        flags: ["Ephemeral"],
      });
    }

    const embed = createInfoEmbed(
      `🛠️ Projets artisanaux`,
      "Voici les projets disponibles pour vos capacités :"
    );

    // Séparer les projets en 3 catégories
    const activeProjects = uniqueProjects.filter(
      (p) => p.status === "ACTIVE" && !(p as any).isBlueprint
    );
    const blueprintProjects = uniqueProjects.filter(
      (p) => (p as any).isBlueprint
    );
    const completedProjects = uniqueProjects.filter(
      (p) => p.status === "COMPLETED"
    );

    // Fonction helper pour formater un projet
    // Format: 🔨🧵 • Nom optionnel • 10x🥞 - 0/2PA⚡|0/1🪵
    const formatProject = (project: Project) => {
      const craftEmojis = project.craftTypes
        .map((ct: any) => getCraftTypeEmoji(ct.craftType || ct))
        .join("");
      const outputText = getProjectOutputText(project);

      let text = `${craftEmojis} •`;

      // Nom optionnel (si présent, ajouter avec séparateur)
      if (project.name && project.name.trim()) {
        text += ` ${project.name} •`;
      }

      // Output
      text += ` ${outputText}`;

      // PA avec emoji
      text += ` - ${project.paContributed}/${project.paRequired}PA⚡`;

      // Ressources requises
      if (project.resourceCosts && project.resourceCosts.length > 0) {
        const resourcesText = project.resourceCosts
          .map(
            (rc) =>
              `${rc.quantityContributed}/${rc.quantityRequired}${rc.resourceType.emoji}`
          )
          .join("|");
        text += `|${resourcesText}`;
      }

      return text;
    };

    // Fonction helper pour trier par type d'output puis par métier (sans sous-titres)
    const sortByCraftAndOutputType = (projects: Project[]) => {
      return projects.sort((a, b) => {
        // D'abord par type d'output (ressources avant objets)
        const aIsResource =
          a.outputResourceTypeId !== null &&
          a.outputResourceTypeId !== undefined;
        const bIsResource =
          b.outputResourceTypeId !== null &&
          b.outputResourceTypeId !== undefined;

        if (aIsResource !== bIsResource) {
          return aIsResource ? -1 : 1; // ressources en premier
        }

        // Ensuite par craft type (tri alphabétique des emojis craft)
        const aCraftKey = a.craftTypes
          .map((ct: any) => getCraftTypeEmoji(ct.craftType || ct))
          .join("");
        const bCraftKey = b.craftTypes
          .map((ct: any) => getCraftTypeEmoji(ct.craftType || ct))
          .join("");

        return aCraftKey.localeCompare(bCraftKey);
      });
    };

    // Field vide initial pour espacement
    embed.addFields({ name: " ", value: " ", inline: false });

    // Section 1: Projets Actifs
    if (activeProjects.length > 0) {
      const sortedProjects = sortByCraftAndOutputType(activeProjects);
      const sectionText = sortedProjects.map(formatProject).join("\n");

      embed.addFields({
        name: `${getStatusEmoji("ACTIVE")} Projets Actifs`,
        value: sectionText || "Aucun projet actif",
        inline: false,
      });

      // Field vide pour espacement
      embed.addFields({ name: " ", value: " ", inline: false });
    }

    // Section 2: Blueprints Disponibles
    if (blueprintProjects.length > 0) {
      const sortedProjects = sortByCraftAndOutputType(blueprintProjects);
      const sectionText = sortedProjects.map(formatProject).join("\n");

      embed.addFields({
        name: `📋 Blueprints Disponibles`,
        value: sectionText || "Aucun blueprint disponible",
        inline: false,
      });

      // Field vide pour espacement
      embed.addFields({ name: " ", value: " ", inline: false });
    }

    // Section 3: Projets Terminés
    if (completedProjects.length > 0) {
      const sortedProjects = sortByCraftAndOutputType(completedProjects);
      const sectionText = sortedProjects
        .map((p) => `${STATUS.SUCCESS} **${p.name}**`)
        .join("\n");

      embed.addFields({
        name: `${getStatusEmoji("COMPLETED")} Projets Terminés`,
        value: sectionText || "Aucun projet terminé",
        inline: false,
      });

      // Field vide final pour espacement
      embed.addFields({ name: " ", value: " ", inline: false });
    }

    // Boutons d'interaction
    const components = [];
    const buttonRow = new ActionRowBuilder<ButtonBuilder>();

    if (activeProjects.length > 0) {
      buttonRow.addComponents(
        new ButtonBuilder()
          .setCustomId("project_participate")
          .setLabel("🛠️ Participer Projets")
          .setStyle(ButtonStyle.Primary)
      );
    }

    if (blueprintProjects.length > 0) {
      buttonRow.addComponents(
        new ButtonBuilder()
          .setCustomId("blueprint_participate")
          .setLabel("📋 Participer Blueprints")
          .setStyle(ButtonStyle.Success)
      );
    }

    if (buttonRow.components.length > 0) {
      components.push(buttonRow);
    }

    await interaction.reply({
      embeds: [embed],
      components,
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Erreur lors de l'affichage des projets depuis le profil :", {
      error,
    });
    await interaction.reply({
      content: `${STATUS.ERROR} Erreur lors de l'affichage des projets.`,
      flags: ["Ephemeral"],
    });
  }
}
