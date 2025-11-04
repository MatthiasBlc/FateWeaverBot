/**
 * Fonctions utilitaires réutilisables pour le module chantiers
 */

import { EmbedBuilder } from "discord.js";
import type { Chantier } from "./chantiers-common.js";
import { getStatusText, getStatusEmoji } from "../chantiers.utils.js";
import { createInfoEmbed } from "../../../utils/embeds.js";
import { CHANTIER } from "../../../constants/emojis.js";

/**
 * Groupe les chantiers par statut
 */
export function groupChantiersByStatus(chantiers: Chantier[]): Record<string, Chantier[]> {
  return chantiers.reduce<Record<string, Chantier[]>>(
    (acc, chantier) => {
      if (!acc[chantier.status]) {
        acc[chantier.status] = [];
      }
      acc[chantier.status].push(chantier);
      return acc;
    },
    {}
  );
}

/**
 * Filtre et trie les chantiers disponibles (non complétés)
 * Ordre: IN_PROGRESS en premier, puis par PA manquants croissants
 */
export function getAvailableChantiersSorted(chantiers: Chantier[]): Chantier[] {
  return chantiers
    .filter((c) => c.status !== "COMPLETED")
    .sort((a, b) => {
      // Trier d'abord par statut (EN_COURS avant PLAN)
      if (a.status === "IN_PROGRESS" && b.status !== "IN_PROGRESS") return -1;
      if (a.status !== "IN_PROGRESS" && b.status === "IN_PROGRESS") return 1;

      // Ensuite par nombre de PA manquants (du plus petit au plus grand)
      const aRemaining = a.cost - a.spendOnIt;
      const bRemaining = b.cost - b.spendOnIt;
      return aRemaining - bRemaining;
    });
}

/**
 * Crée un embed affichant la liste des chantiers groupés par statut
 * @param title Titre de l'embed
 * @param description Description de l'embed
 * @param chantiers Liste des chantiers à afficher
 * @param includeResources Afficher les ressources dans la liste (défaut: false)
 */
export function createChantiersListEmbed(
  title: string,
  description: string,
  chantiers: Chantier[],
  includeResources: boolean = false
): EmbedBuilder {
  const embed = createInfoEmbed(title, description);

  const chantiersParStatut = groupChantiersByStatus(chantiers);

  for (const [statut, listeChantiers] of Object.entries(chantiersParStatut)) {
    const chantiersText = listeChantiers
      .map((chantier) => {
        let text = `**${chantier.name}** - ${chantier.spendOnIt}/${chantier.cost} PA`;

        // Ajouter les ressources si demandé et présentes
        if (includeResources && chantier.resourceCosts && chantier.resourceCosts.length > 0) {
          const resourcesText = chantier.resourceCosts
            .map(
              (rc) =>
                `${rc.resourceType.emoji} ${rc.quantityContributed}/${rc.quantityRequired}`
            )
            .join(" ");
          text += ` | ${resourcesText}`;
        }

        return text;
      })
      .join("\n");

    embed.addFields({
      name: `${getStatusEmoji(statut)} ${getStatusText(statut)}`,
      value: chantiersText || "Aucun chantier dans cette catégorie",
      inline: false,
    });
  }

  return embed;
}
