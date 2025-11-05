/**
 * Helper utilities for aggregating and displaying character skills and objects
 */

import { apiService } from "../services/api";
import { logger } from "../services/logger";
import { OBJECT_BONUS } from "../constants/emojis";

export interface CharacterSkill {
  id: string;
  name: string;
  emojiTag?: string;
  objectId?: string | null; // ID de l'objet si la compétence vient d'un objet
}

export interface CharacterObject {
  id: number;
  name: string;
  description?: string;
  count: number;
  skillBonuses?: Array<{ id: string; skill: { id: string; name: string } }>;
  capacityBonuses?: Array<{ id: string; capability: { id: string; name: string } }>;
}

export interface AggregatedSkill {
  name: string;
  emoji: string;
  owners: Array<{
    characterId: string;
    characterName: string;
    username: string;
    objectName?: string; // Nom de l'objet si la compétence vient d'un objet
  }>;
}

export interface AggregatedObject {
  name: string;
  totalCount: number;
  skillBonusEmoji: string;
  capacityBonusEmoji: string;
  owners: Array<{
    characterId: string;
    characterName: string;
    username: string;
    count: number;
  }>;
}

/**
 * Fetches skills and objects for a list of characters
 * Returns aggregated data grouped by skill/object name
 */
export async function aggregateCharacterInventories(
  characters: Array<{
    id: string;
    name: string;
    user?: { username?: string; globalName?: string | null }
  }>
): Promise<{
  skills: AggregatedSkill[];
  objects: AggregatedObject[];
}> {
  const skillsMap = new Map<string, AggregatedSkill>();
  const objectsMap = new Map<string, AggregatedObject>();

  // Fetch all skills and objects in parallel
  const promises = characters.map(async (character) => {
    try {
      const [skills, objects] = await Promise.all([
        apiService.characters.getCharacterSkills(character.id) as Promise<CharacterSkill[]>,
        apiService.characters.getCharacterObjects(character.id) as Promise<CharacterObject[]>,
      ]);

      const username = character.user?.globalName || character.user?.username || "Inconnu";

      // Create a map of skill names to object names and extract object skills
      const skillToObjectMap = new Map<string, string>();
      const objectSkills: CharacterSkill[] = [];

      if (objects && Array.isArray(objects)) {
        objects.forEach((obj: CharacterObject) => {
          if (obj.skillBonuses && obj.skillBonuses.length > 0) {
            obj.skillBonuses.forEach((bonus) => {
              const skillName = bonus.skill.name;
              skillToObjectMap.set(skillName, obj.name);

              // Add object skill to the list if not already present
              if (!objectSkills.find(s => s.name === skillName)) {
                objectSkills.push({
                  id: bonus.skill.id,
                  name: skillName,
                  emojiTag: undefined, // Object skills don't have emoji tags typically
                });
              }
            });
          }
        });
      }

      // Combine classic skills and object skills
      const allSkills = [...skills, ...objectSkills];

      // Process all skills (classic + object)
      if (allSkills && Array.isArray(allSkills)) {
        allSkills.forEach((skill: CharacterSkill) => {
          const skillName = skill.name;
          const skillEmoji = skill.emojiTag || "";
          const objectName = skillToObjectMap.get(skillName);

          if (!skillsMap.has(skillName)) {
            skillsMap.set(skillName, {
              name: skillName,
              emoji: skillEmoji,
              owners: [],
            });
          }
          skillsMap.get(skillName)!.owners.push({
            characterId: character.id,
            characterName: character.name,
            username,
            objectName: objectName,
          });
        });
      }

      // Process objects
      if (objects && Array.isArray(objects)) {
        objects.forEach((obj: CharacterObject) => {
          if (!objectsMap.has(obj.name)) {
            // Determine bonus emojis
            const hasSkillBonus = obj.skillBonuses && obj.skillBonuses.length > 0;
            const hasCapacityBonus = obj.capacityBonuses && obj.capacityBonuses.length > 0;

            objectsMap.set(obj.name, {
              name: obj.name,
              totalCount: 0,
              skillBonusEmoji: hasSkillBonus ? OBJECT_BONUS.SKILL : "",
              capacityBonusEmoji: hasCapacityBonus ? OBJECT_BONUS.CAPACITY : "",
              owners: [],
            });
          }

          const objData = objectsMap.get(obj.name)!;
          objData.totalCount += obj.count;
          objData.owners.push({
            characterId: character.id,
            characterName: character.name,
            username,
            count: obj.count,
          });
        });
      }
    } catch (error) {
      logger.error(`Error fetching inventory for character ${character.name}:`, { error });
    }
  });

  await Promise.all(promises);

  // Sort by name
  const skills = Array.from(skillsMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const objects = Array.from(objectsMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return { skills, objects };
}

/**
 * Formats aggregated skills for display
 * Format: "skill 1 (CharacterName)" or "skill 3 x2 (CharName1 via Object ➕, CharName2)"
 */
export function formatAggregatedSkills(skills: AggregatedSkill[]): string {
  if (skills.length === 0) {
    return "Aucune compétence";
  }

  return skills
    .map((skill) => {
      const ownersCount = skill.owners.length;
      const ownersList = skill.owners
        .map((o) => {
          if (o.objectName) {
            return `${o.characterName} via ${o.objectName} ${OBJECT_BONUS.SKILL}`;
          }
          return o.characterName;
        })
        .join(", ");
      const multiplier = ownersCount > 1 ? ` x${ownersCount}` : "";
      const emojiPrefix = skill.emoji ? `${skill.emoji} ` : "";
      return `${emojiPrefix}${skill.name}${multiplier} (${ownersList})`;
    })
    .join("\n");
}

/**
 * Formats aggregated objects for display
 * Format: "object 1 (CharacterName)" or "object 2 x4 (CharName1 x2, CharName2, CharName3)"
 */
export function formatAggregatedObjects(objects: AggregatedObject[]): string {
  if (objects.length === 0) {
    return "Aucun objet";
  }

  return objects
    .map((obj) => {
      const totalCount = obj.totalCount;
      const ownersList = obj.owners
        .map((o) => {
          const ownerMultiplier = o.count > 1 ? ` x${o.count}` : "";
          return `${o.characterName}${ownerMultiplier}`;
        })
        .join(", ");

      const multiplier = totalCount > 1 ? ` x${totalCount}` : "";
      const bonuses = [obj.skillBonusEmoji, obj.capacityBonusEmoji].filter(Boolean).join(" ");
      const bonusText = bonuses ? ` ${bonuses}` : "";

      return `${obj.name}${multiplier}${bonusText} (${ownersList})`;
    })
    .join("\n");
}

/**
 * Combines skills and objects into a single formatted string for embed field
 * Splits into multiple fields if content exceeds Discord's 1024 character limit
 */
export function formatInventoryForEmbed(
  skills: AggregatedSkill[],
  objects: AggregatedObject[]
): Array<{ name: string; value: string }> {
  const fields: Array<{ name: string; value: string }> = [];

  const skillText = formatAggregatedSkills(skills);
  const objText = formatAggregatedObjects(objects);

  // Add skills field(s)
  if (skillText.length <= 1024) {
    fields.push({ name: "**Compétences**", value: skillText });
  } else {
    // Split into multiple fields if too long
    const skillLines = skillText.split("\n");
    let currentChunk = "";
    let chunkIndex = 1;

    skillLines.forEach((line) => {
      if ((currentChunk + line + "\n").length > 1024) {
        fields.push({
          name: `**Compétences (${chunkIndex})**`,
          value: currentChunk.trim()
        });
        currentChunk = line + "\n";
        chunkIndex++;
      } else {
        currentChunk += line + "\n";
      }
    });

    if (currentChunk.trim()) {
      fields.push({
        name: `**Compétences (${chunkIndex})**`,
        value: currentChunk.trim()
      });
    }
  }

  // Add objects field(s)
  if (objText.length <= 1024) {
    fields.push({ name: "**Objets**", value: objText });
  } else {
    // Split into multiple fields if too long
    const objLines = objText.split("\n");
    let currentChunk = "";
    let chunkIndex = 1;

    objLines.forEach((line) => {
      if ((currentChunk + line + "\n").length > 1024) {
        fields.push({
          name: `**Objets (${chunkIndex})**`,
          value: currentChunk.trim()
        });
        currentChunk = line + "\n";
        chunkIndex++;
      } else {
        currentChunk += line + "\n";
      }
    });

    if (currentChunk.trim()) {
      fields.push({
        name: `**Objets (${chunkIndex})**`,
        value: currentChunk.trim()
      });
    }
  }

  return fields;
}
