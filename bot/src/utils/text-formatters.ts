import type { Character } from "../types/entities";

/**
 * Formate les statistiques d'un personnage pour affichage
 */
export function formatCharacterStats(character: Character): string {
  const lines = [
    `❤️ **PV:** ${character.hp}/5`,
    `⚡ **PM:** ${character.pm}/5`,
    `🎯 **PA:** ${character.paTotal}/4`,
  ];

  if (character.hungerLevel !== undefined) {
    lines.push(`🍖 **Faim:** ${getHungerLevelText(character.hungerLevel)}`);
  }

  return lines.join("\n");
}

/**
 * Retourne le texte correspondant au niveau de faim
 */
function getHungerLevelText(hungerLevel: number): string {
  switch (hungerLevel) {
    case 0:
      return "💀 Mort de faim";
    case 1:
      return "😰 Agonisant";
    case 2:
      return "😟 Affamé";
    case 3:
      return "😐 Faim";
    case 4:
      return "😊 Rassasié";
    default:
      return "❓ Inconnu";
  }
}

/**
 * Formate une liste de ressources
 */
export function formatResourceList(resources: Array<{ name: string; quantity: number; emoji?: string }>): string {
  if (resources.length === 0) {
    return "Aucune ressource";
  }

  return resources
    .map((r) => `${r.emoji || "📦"} **${r.name}**: ${r.quantity}`)
    .join("\n");
}

/**
 * Formate une durée en millisecondes en texte lisible
 */
export function formatDuration(milliseconds: number): string {
  const days = Math.floor(milliseconds / (24 * 60 * 60 * 1000));
  const hours = Math.floor((milliseconds % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((milliseconds % (60 * 60 * 1000)) / (60 * 1000));

  if (days > 0) {
    return `${days}j ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}min`;
  } else {
    return `${minutes}min`;
  }
}

/**
 * Formate une liste de membres avec leur personnage
 */
export function formatMemberList(
  members: Array<{ character: { name: string; user?: { username: string } } }>
): string {
  if (members.length === 0) {
    return "Aucun membre";
  }

  return members
    .map(
      (member) =>
        `• ${member.character.name} (${member.character.user?.username || "Inconnu"})`
    )
    .join("\n");
}

/**
 * Tronque un texte à une longueur maximale
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + "...";
}

/**
 * Formate un nombre avec séparateurs de milliers
 */
export function formatNumber(num: number): string {
  return num.toLocaleString("fr-FR");
}
