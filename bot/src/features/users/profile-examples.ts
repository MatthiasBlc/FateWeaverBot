import { EmbedBuilder } from "discord.js";

/**
 * Exemple d'affichage visuel avancé du profil avec l'état de faim
 */
export function createAdvancedProfileExample(): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(0xffa500) // Orange pour un personnage affamé (niveau 2)
    .setTitle("📋 Profil de JeanRPG")
    .setThumbnail("https://example.com/avatar.jpg")
    .addFields({
      name: "🎭 **INFORMATIONS DU PERSONNAGE**",
      value: "",
      inline: false,
    })
    .setFooter({
      text: "Profil de: JeanRPG",
      iconURL: "https://example.com/avatar.jpg",
    })
    .setTimestamp();

  // Ajout des champs avec l'état de faim avancé
  embed.addFields(
    {
      name: "Nom",
      value: "JeanRPG",
      inline: true,
    },
    {
      name: "Rôles",
      value: "@Guerrier, @Artisan",
      inline: true,
    },
    {
      name: "Points d'Action (PA)",
      value: "⚡ **2/4**",
      inline: true,
    },
    {
      name: "État de Faim",
      value: "😰 **Affamé** - Régénération PA réduite",
      inline: true,
    },
    {
      name: "Prochaine mise à jour",
      value: "dans 3h 45min",
      inline: true,
    }
  );

  // Barre de progression de la faim (niveau 2/4)
  embed.addFields({
    name: "Progression de la Faim",
    value: "🔴🔴⚫⚫ **50%** vers la mort",
    inline: false,
  });

  return embed;
}

/**
 * Exemple pour un personnage en bonne santé (niveau 0)
 */
export function createHealthyProfileExample(): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(0x00ff00) // Vert pour bonne santé
    .setTitle("📋 Profil de MarieHeureuse")
    .setThumbnail("https://example.com/avatar2.jpg")
    .addFields({
      name: "🎭 **INFORMATIONS DU PERSONNAGE**",
      value: "",
      inline: false,
    })
    .setFooter({
      text: "Profil de: MarieHeureuse",
      iconURL: "https://example.com/avatar2.jpg",
    })
    .setTimestamp();

  embed.addFields(
    {
      name: "Nom",
      value: "MarieHeureuse",
      inline: true,
    },
    {
      name: "Rôles",
      value: "@Mage, @Soigneur",
      inline: true,
    },
    {
      name: "Points d'Action (PA)",
      value: "⚡ **3/4**",
      inline: true,
    },
    {
      name: "État de Faim",
      value: "😊 **En bonne santé** - Parfait état !",
      inline: true,
    },
    {
      name: "Prochaine mise à jour",
      value: "dans 1h 15min",
      inline: true,
    }
  );

  // Pas de barre de progression pour la faim (niveau 0)
  return embed;
}

/**
 * Exemple pour un personnage mourant (niveau 4)
 */
export function createDyingProfileExample(): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(0x000000) // Noir pour la mort
    .setTitle("📋 Profil de PierreAffame")
    .setThumbnail("https://example.com/avatar3.jpg")
    .addFields({
      name: "🎭 **INFORMATIONS DU PERSONNAGE**",
      value: "",
      inline: false,
    })
    .setFooter({
      text: "Profil de: PierreAffame",
      iconURL: "https://example.com/avatar3.jpg",
    })
    .setTimestamp();

  embed.addFields(
    {
      name: "Nom",
      value: "PierreAffame",
      inline: true,
    },
    {
      name: "Rôles",
      value: "@Voleur, @Eclaireur",
      inline: true,
    },
    {
      name: "Points d'Action (PA)",
      value: "⚡ **0/4**",
      inline: true,
    },
    {
      name: "État de Faim",
      value: "💀 **Mort** - Incapable d'agir",
      inline: true,
    },
    {
      name: "Prochaine mise à jour",
      value: "Aucune (mort)",
      inline: true,
    }
  );

  // Barre de progression complète (niveau 4/4)
  embed.addFields({
    name: "Progression de la Faim",
    value: "🔴🔴🔴🔴 **100%** vers la mort",
    inline: false,
  });

  return embed;
}
