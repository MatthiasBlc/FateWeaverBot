# Supernova Task: Système de direction pour les expéditions

## Contexte

Les expéditions doivent maintenant avoir un système de direction. Lors de la création, le joueur choisit une direction initiale (Nord, Sud-Est, etc.). Une fois l'expédition en statut DEPARTED, chaque jour un membre doit choisir la direction du lendemain. Le chemin complet (suite de directions) est stocké en base.

## Objectif

Implémenter :
1. Enum Direction et champs dans la base de données
2. Choix de direction initiale lors de la création d'expédition
3. Choix quotidien de direction pendant l'expédition (DEPARTED)
4. Mise à jour du cron pour gérer les directions
5. Interface Discord pour afficher et choisir les directions

## Étape 1: Schéma de base de données

**Fichier:** `/home/thorynest/Perso/2-Projects/FateWeaverBot/backend/prisma/schema.prisma`

**Action 1:** Ajouter l'enum Direction (après l'enum DailyEventType, à la fin du fichier) :

```prisma
enum Direction {
  NORD
  NORD_EST
  EST
  SUD_EST
  SUD
  SUD_OUEST
  OUEST
  NORD_OUEST
  UNKNOWN
}
```

**Action 2:** Modifier le modèle Expedition (trouver le modèle Expedition et ajouter ces champs avant le closing brace) :

```prisma
  initialDirection    Direction   @default(UNKNOWN)
  path                Direction[]
  currentDayDirection Direction?
  directionSetBy      String?
  directionSetAt      DateTime?
```

**Après modification, exécuter:**
```bash
cd /home/thorynest/Perso/2-Projects/FateWeaverBot/backend
npx prisma migrate dev --name add_expedition_directions
npx prisma generate
```

## Étape 2: Backend - Mise à jour du service expéditions

**Fichier:** `/home/thorynest/Perso/2-Projects/FateWeaverBot/backend/src/services/expedition.service.ts`

**Action 1:** Modifier l'interface CreateExpeditionData (ligne 7-13) pour ajouter :

```typescript
export interface CreateExpeditionData {
  name: string;
  townId: string;
  initialResources: { resourceTypeName: string; quantity: number }[];
  duration: number;
  createdBy: string;
  initialDirection?: string; // "NORD", "SUD_EST", etc.
}
```

**Action 2:** Dans la méthode `createExpedition()`, modifier la création de l'expédition (ligne ~290-298) pour inclure la direction :

```typescript
      // Create expedition
      const expedition = await tx.expedition.create({
        data: {
          name: data.name,
          townId: data.townId,
          duration: data.duration,
          createdBy: data.createdBy,
          status: ExpeditionStatus.PLANNING,
          returnAt: null,
          initialDirection: data.initialDirection || "UNKNOWN",
        },
      });
```

**Action 3:** Ajouter une nouvelle méthode `setNextDirection()` à la fin de la classe ExpeditionService (avant le closing brace) :

```typescript
  async setNextDirection(
    expeditionId: string,
    direction: string,
    characterId: string
  ): Promise<void> {
    return await prisma.$transaction(async (tx) => {
      const expedition = await tx.expedition.findUnique({
        where: { id: expeditionId },
        select: {
          id: true,
          status: true,
          currentDayDirection: true,
          townId: true
        },
      });

      if (!expedition) {
        throw new Error("Expedition not found");
      }

      if (expedition.status !== ExpeditionStatus.DEPARTED) {
        throw new Error("Can only set direction for DEPARTED expeditions");
      }

      if (expedition.currentDayDirection) {
        throw new Error("Direction already set for today");
      }

      // Verify character is member of expedition
      const member = await tx.expeditionMember.findFirst({
        where: {
          expeditionId,
          characterId,
        },
      });

      if (!member) {
        throw new Error("Character is not a member of this expedition");
      }

      // Set direction
      await tx.expedition.update({
        where: { id: expeditionId },
        data: {
          currentDayDirection: direction as any,
          directionSetBy: characterId,
          directionSetAt: new Date(),
        },
      });

      logger.info("expedition_event", {
        event: "direction_set",
        expeditionId,
        direction,
        setBy: characterId,
      });
    });
  }
```

## Étape 3: Backend - Mise à jour du cron expeditions

**Fichier:** `/home/thorynest/Perso/2-Projects/FateWeaverBot/backend/src/cron/expedition.cron.ts`

**Action 1:** Dans la fonction `lockExpeditionsDue()` (ligne ~9-41), après avoir verrouillé les expéditions, ajouter la logique pour mettre UNKNOWN si pas de direction :

Trouver le bloc `await expedition.lockExpedition(exp.id);` et après ce bloc, ajouter :

```typescript
      // Set UNKNOWN direction if not set
      if (!exp.initialDirection || exp.initialDirection === "UNKNOWN") {
        await prisma.expedition.update({
          where: { id: exp.id },
          data: { initialDirection: "UNKNOWN" },
        });
      }
```

**Action 2:** Dans la fonction `departExpeditionsDue()` (ligne ~43-71), après avoir fait partir les expéditions, ajouter la logique pour initialiser le path :

Trouver le bloc `await expedition.departExpedition(exp.id);` et après ce bloc, ajouter :

```typescript
      // Initialize path with initial direction
      await prisma.expedition.update({
        where: { id: exp.id },
        data: {
          path: [exp.initialDirection],
        },
      });
```

**Action 3:** Créer une nouvelle fonction `appendDailyDirections()` après `returnExpeditionsDue()` :

```typescript
async function appendDailyDirections() {
  try {
    const expeditions = await prisma.expedition.findMany({
      where: {
        status: ExpeditionStatus.DEPARTED,
        currentDayDirection: { not: null },
      },
      select: { id: true, name: true, path: true, currentDayDirection: true },
    });

    for (const exp of expeditions) {
      if (exp.currentDayDirection) {
        // Append direction to path
        const newPath = [...exp.path, exp.currentDayDirection];

        await prisma.expedition.update({
          where: { id: exp.id },
          data: {
            path: newPath,
            currentDayDirection: null,
            directionSetBy: null,
            directionSetAt: null,
          },
        });

        console.log(
          `Appended direction ${exp.currentDayDirection} to expedition ${exp.name}`
        );
      }
    }

    console.log(
      `Appended directions for ${expeditions.length} expedition(s)`
    );
  } catch (error) {
    console.error("Error appending daily directions:", error);
  }
}
```

**Action 4:** Modifier `setupExpeditionJobs()` pour ajouter le nouveau cron (ligne ~120-143) :

Ajouter ce nouveau job AVANT le lock job (qui tourne à 00:00) :

```typescript
  // Append daily directions (runs at 00:00:05 - after PA consumption, before lock)
  const appendDirectionsJob = new CronJob(
    "5 0 * * *", // 00:00:05 every day
    appendDailyDirections,
    null,
    true,
    "Europe/Paris"
  );
```

Et retourner aussi ce job à la fin :

```typescript
  return { lockJob, departJob, returnJob, emergencyJob, appendDirectionsJob };
```

## Étape 4: Backend - Ajouter l'endpoint API

**Fichier:** `/home/thorynest/Perso/2-Projects/FateWeaverBot/backend/src/controllers/expedition.ts`

**Action:** Ajouter un nouveau controller à la fin du fichier (avant les exports) :

```typescript
export const setExpeditionDirection = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { direction, characterId } = req.body;

    if (!direction) {
      res.status(400).json({ error: "Direction is required" });
      return;
    }

    if (!characterId) {
      res.status(400).json({ error: "Character ID is required" });
      return;
    }

    const validDirections = [
      "NORD",
      "NORD_EST",
      "EST",
      "SUD_EST",
      "SUD",
      "SUD_OUEST",
      "OUEST",
      "NORD_OUEST",
    ];

    if (!validDirections.includes(direction)) {
      res.status(400).json({ error: "Invalid direction" });
      return;
    }

    const expedition = new ExpeditionService();
    await expedition.setNextDirection(id, direction, characterId);

    res.status(200).json({ message: "Direction set successfully" });
  } catch (error: any) {
    console.error("Error setting expedition direction:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};
```

**Fichier:** `/home/thorynest/Perso/2-Projects/FateWeaverBot/backend/src/routes/expedition.ts`

**Action:** Ajouter la nouvelle route (trouver les autres routes POST et ajouter) :

```typescript
router.post("/:id/set-direction", setExpeditionDirection);
```

Et ajouter l'import dans les imports du controller :

```typescript
import {
  createExpedition,
  getExpeditionById,
  getExpeditionsByTown,
  joinExpedition,
  leaveExpedition,
  getActiveExpeditionsForCharacter,
  getAllExpeditions,
  getExpeditionResources,
  transferExpeditionResource,
  toggleEmergencyVote,
  setExpeditionDirection, // NOUVEAU
} from "../controllers/expedition";
```

## Étape 5: Bot - Types et API service

**Fichier:** `/home/thorynest/Perso/2-Projects/FateWeaverBot/bot/src/types/entities/expedition.ts`

**Action:** Ajouter les nouveaux champs à l'interface Expedition (ligne ~4-23) :

```typescript
export interface Expedition {
  id: string;
  name: string;
  status: ExpeditionStatus;
  duration: number;
  townId: string;
  createdBy: string;
  pendingEmergencyReturn: boolean;
  createdAt: Date;
  updatedAt: Date;
  returnAt: Date | null;
  initialDirection?: string;
  path?: string[];
  currentDayDirection?: string | null;
  directionSetBy?: string | null;
  directionSetAt?: Date | null;
}
```

**Fichier:** `/home/thorynest/Perso/2-Projects/FateWeaverBot/bot/src/types/dto/expedition.dto.ts`

**Action:** Ajouter le champ direction au DTO (ligne ~5-12) :

```typescript
export interface CreateExpeditionDto {
  name: string;
  townId: string;
  initialResources: { resourceTypeName: string; quantity: number }[];
  duration: number;
  createdBy: string;
  initialDirection?: string;
}
```

**Fichier:** `/home/thorynest/Perso/2-Projects/FateWeaverBot/bot/src/services/api/expedition-api.service.ts`

**Action:** Ajouter une nouvelle méthode à la fin du fichier (avant le closing brace) :

```typescript
  async setExpeditionDirection(
    expeditionId: string,
    direction: string,
    characterId: string
  ): Promise<void> {
    await apiClient.post(`/expeditions/${expeditionId}/set-direction`, {
      direction,
      characterId,
    });
  }
```

## Étape 6: Bot - Modal de création avec dropdown direction

**Fichier:** `/home/thorynest/Perso/2-Projects/FateWeaverBot/bot/src/features/expeditions/handlers/expedition-create.ts`

**Action 1:** Créer une fonction pour le menu de directions après le modal (ajouter après `handleExpeditionCreationModal`) :

```typescript
export async function handleExpeditionDirectionSelect(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  try {
    const direction = interaction.values[0];
    const expeditionData = JSON.parse(interaction.customId.split(":")[1]);

    const character = await apiService.characters.getActiveCharacter(
      interaction.guildId!
    );

    if (!character) {
      await interaction.reply({
        content: "❌ Vous devez avoir un personnage actif pour créer une expédition.",
        ephemeral: true,
      });
      return;
    }

    // Create expedition with direction
    const createData = {
      ...expeditionData,
      initialDirection: direction,
      createdBy: interaction.user.id,
    };

    const expedition = await apiService.expeditions.createExpedition(createData);

    // Auto-join creator
    await apiService.expeditions.joinExpedition(
      expedition.id,
      character.id,
      interaction.user.id
    );

    await interaction.update({
      content: `✅ Expédition **${expedition.name}** créée avec succès !\nDirection initiale : ${getDirectionEmoji(direction)} ${getDirectionText(direction)}`,
      components: [],
    });
  } catch (error: any) {
    console.error("Error in expedition direction select:", error);
    await interaction.reply({
      content: `❌ Erreur lors de la création : ${error.message}`,
      ephemeral: true,
    });
  }
}
```

**Action 2:** Modifier `handleExpeditionCreationModal()` pour afficher un menu de directions au lieu de créer directement :

Remplacer la section où on crée l'expédition (lignes ~200-324 environ) par :

```typescript
    // Show direction selection menu
    const directionMenu = new StringSelectMenuBuilder()
      .setCustomId(`expedition_direction:${JSON.stringify({
        name,
        townId: character.townId,
        initialResources,
        duration: durationInDays,
      })}`)
      .setPlaceholder("Direction initiale...")
      .addOptions([
        {
          label: "Nord",
          value: "NORD",
          emoji: "⬆️",
        },
        {
          label: "Nord-Est",
          value: "NORD_EST",
          emoji: "↗️",
        },
        {
          label: "Est",
          value: "EST",
          emoji: "➡️",
        },
        {
          label: "Sud-Est",
          value: "SUD_EST",
          emoji: "↘️",
        },
        {
          label: "Sud",
          value: "SUD",
          emoji: "⬇️",
        },
        {
          label: "Sud-Ouest",
          value: "SUD_OUEST",
          emoji: "↙️",
        },
        {
          label: "Ouest",
          value: "OUEST",
          emoji: "⬅️",
        },
        {
          label: "Nord-Ouest",
          value: "NORD_OUEST",
          emoji: "↖️",
        },
      ]);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      directionMenu
    );

    await interaction.reply({
      content: `${EXPEDITION.ICON} Dans quelle direction part l'expédition **${name}** :`,
      components: [row],
      ephemeral: true,
    });
```

**Action 3:** Ajouter les fonctions helper (à la fin du fichier) :

```typescript
function getDirectionEmoji(direction: string): string {
  const emojis: Record<string, string> = {
    NORD: "⬆️",
    NORD_EST: "↗️",
    EST: "➡️",
    SUD_EST: "↘️",
    SUD: "⬇️",
    SUD_OUEST: "↙️",
    OUEST: "⬅️",
    NORD_OUEST: "↖️",
    UNKNOWN: "❓",
  };
  return emojis[direction] || "❓";
}

function getDirectionText(direction: string): string {
  const texts: Record<string, string> = {
    NORD: "Nord",
    NORD_EST: "Nord-Est",
    EST: "Est",
    SUD_EST: "Sud-Est",
    SUD: "Sud",
    SUD_OUEST: "Sud-Ouest",
    OUEST: "Ouest",
    NORD_OUEST: "Nord-Ouest",
    UNKNOWN: "Inconnue",
  };
  return texts[direction] || "Inconnue";
}
```

## Étape 7: Bot - Affichage et choix de direction pendant l'expédition

**Fichier:** `/home/thorynest/Perso/2-Projects/FateWeaverBot/bot/src/features/expeditions/handlers/expedition-display.ts`

**Action 1:** Modifier l'affichage pour inclure la direction et le path (dans la fonction qui crée l'embed) :

Ajouter ces champs dans l'embed :

```typescript
    // Direction info
    if (expedition.initialDirection) {
      embed.addFields({
        name: "📍 Direction initiale",
        value: `${getDirectionEmoji(expedition.initialDirection)} ${getDirectionText(expedition.initialDirection)}`,
        inline: true,
      });
    }

    if (expedition.path && expedition.path.length > 0) {
      const pathString = expedition.path
        .map((d) => getDirectionEmoji(d))
        .join(" → ");
      embed.addFields({
        name: "🗺️ Chemin parcouru",
        value: pathString,
        inline: false,
      });
    }

    if (expedition.status === "DEPARTED" && expedition.currentDayDirection) {
      embed.addFields({
        name: "🧭 Direction choisie pour demain",
        value: `${getDirectionEmoji(expedition.currentDayDirection)} ${getDirectionText(expedition.currentDayDirection)}`,
        inline: true,
      });
    }
```

**Action 2:** Ajouter un bouton "Choisir Direction" si DEPARTED et pas de direction définie :

Dans la section où les boutons sont créés, ajouter :

```typescript
    // Add direction button if DEPARTED and no direction set
    if (
      expedition.status === "DEPARTED" &&
      !expedition.currentDayDirection
    ) {
      const directionButton = new ButtonBuilder()
        .setCustomId(`expedition_choose_direction:${expedition.id}`)
        .setLabel("Choisir Direction")
        .setEmoji("🧭")
        .setStyle(ButtonStyle.Primary);

      // Add to appropriate row
      actionRows.push(
        new ActionRowBuilder<ButtonBuilder>().addComponents(directionButton)
      );
    }
```

**Action 3:** Créer le handler pour le bouton (nouvelle fonction) :

```typescript
export async function handleExpeditionChooseDirection(
  interaction: ButtonInteraction
): Promise<void> {
  try {
    const expeditionId = interaction.customId.split(":")[1];

    const character = await apiService.characters.getActiveCharacter(
      interaction.guildId!
    );

    if (!character) {
      await interaction.reply({
        content: "❌ Vous devez avoir un personnage actif.",
        ephemeral: true,
      });
      return;
    }

    // Show direction menu
    const directionMenu = new StringSelectMenuBuilder()
      .setCustomId(`expedition_set_direction:${expeditionId}:${character.id}`)
      .setPlaceholder("Choisissez la prochaine direction...")
      .addOptions([
        { label: "Nord", value: "NORD", emoji: "⬆️" },
        { label: "Nord-Est", value: "NORD_EST", emoji: "↗️" },
        { label: "Est", value: "EST", emoji: "➡️" },
        { label: "Sud-Est", value: "SUD_EST", emoji: "↘️" },
        { label: "Sud", value: "SUD", emoji: "⬇️" },
        { label: "Sud-Ouest", value: "SUD_OUEST", emoji: "↙️" },
        { label: "Ouest", value: "OUEST", emoji: "⬅️" },
        { label: "Nord-Ouest", value: "NORD_OUEST", emoji: "↖️" },
      ]);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      directionMenu
    );

    await interaction.reply({
      content: "🧭 Choisissez la prochaine direction de l'expédition :",
      components: [row],
      ephemeral: true,
    });
  } catch (error: any) {
    console.error("Error showing direction menu:", error);
    await interaction.reply({
      content: `❌ Erreur : ${error.message}`,
      ephemeral: true,
    });
  }
}

export async function handleExpeditionSetDirection(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  try {
    const [, expeditionId, characterId] = interaction.customId.split(":");
    const direction = interaction.values[0];

    await apiService.expeditions.setExpeditionDirection(
      expeditionId,
      direction,
      characterId
    );

    await interaction.update({
      content: `✅ Direction définie : ${getDirectionEmoji(direction)} ${getDirectionText(direction)}`,
      components: [],
    });
  } catch (error: any) {
    console.error("Error setting direction:", error);
    await interaction.reply({
      content: `❌ Erreur : ${error.message}`,
      ephemeral: true,
    });
  }
}
```

**N'oublie pas d'importer les helpers depuis expedition-create.ts ou de les redéfinir**

## Étape 8: Bot - Enregistrer les nouveaux handlers

**Fichier:** `/home/thorynest/Perso/2-Projects/FateWeaverBot/bot/src/features/expeditions/expedition.command.ts`

**Action:** Ajouter les exports des nouveaux handlers :

```typescript
export { handleExpeditionDirectionSelect } from "./handlers/expedition-create";
export {
  handleExpeditionChooseDirection,
  handleExpeditionSetDirection,
} from "./handlers/expedition-display";
```

**Fichier:** `/home/thorynest/Perso/2-Projects/FateWeaverBot/bot/src/events/interactionCreate.ts`

**Action:** Ajouter les handlers dans le switch/if des interactions :

Pour StringSelectMenu :
```typescript
if (interaction.customId.startsWith("expedition_direction:")) {
  await expeditionCommand.handleExpeditionDirectionSelect(interaction);
}
if (interaction.customId.startsWith("expedition_set_direction:")) {
  await expeditionCommand.handleExpeditionSetDirection(interaction);
}
```

Pour Button :
```typescript
if (interaction.customId.startsWith("expedition_choose_direction:")) {
  await expeditionCommand.handleExpeditionChooseDirection(interaction);
}
```

## Étape 9: Tests et validation

**Exécuter les commandes suivantes:**

```bash
# Backend
cd /home/thorynest/Perso/2-Projects/FateWeaverBot/backend
npm run build

# Bot
cd /home/thorynest/Perso/2-Projects/FateWeaverBot/bot
npm run build
npm run deploy
```

## Rapport demandé

**Fichier:** `/home/thorynest/Perso/2-Projects/FateWeaverBot/.supernova/report-expedition-direction.md`

**Contenu:**

```markdown
# Rapport: Système de direction pour les expéditions

## Statut
[✅ Terminé / ❌ Erreur / ⚠️ Partiel]

## Modifications effectuées

### Base de données
- [ ] Ajout de l'enum Direction dans schema.prisma
- [ ] Ajout des champs direction dans le modèle Expedition
- [ ] Migration exécutée avec succès
- [ ] Prisma generate exécuté avec succès

### Backend
- [ ] Modification de l'interface CreateExpeditionData
- [ ] Méthode createExpedition() mise à jour
- [ ] Nouvelle méthode setNextDirection() ajoutée
- [ ] Cron lockExpeditionsDue() mis à jour
- [ ] Cron departExpeditionsDue() mis à jour
- [ ] Nouvelle fonction appendDailyDirections() créée
- [ ] Nouveau cron job configuré (00:00:05)
- [ ] Nouveau controller setExpeditionDirection()
- [ ] Nouvelle route POST /:id/set-direction

### Bot - Types et API
- [ ] Interface Expedition mise à jour
- [ ] CreateExpeditionDto mis à jour
- [ ] Méthode setExpeditionDirection() dans API service

### Bot - UI
- [ ] Fonction handleExpeditionDirectionSelect() créée
- [ ] Modal de création modifié pour afficher menu directions
- [ ] Helpers getDirectionEmoji() et getDirectionText() ajoutés
- [ ] Affichage des directions dans expedition-display.ts
- [ ] Bouton "Choisir Direction" ajouté (DEPARTED)
- [ ] Handler handleExpeditionChooseDirection() créé
- [ ] Handler handleExpeditionSetDirection() créé
- [ ] Exports ajoutés dans expedition.command.ts
- [ ] Handlers enregistrés dans interactionCreate.ts

### Tests
- [ ] Compilation backend: [✅ OK / ❌ Erreur]
- [ ] Compilation bot: [✅ OK / ❌ Erreur]
- [ ] Deploy commands: [✅ OK / ❌ Erreur]

## Problèmes rencontrés
[Décrire les problèmes rencontrés, s'il y en a]

## Résumé court (< 300 tokens)
[Décris ce qui a été fait, les fichiers modifiés, et si tout fonctionne correctement]
```

## Notes importantes

- Les directions sont des enums Prisma, utiliser les valeurs exactes (NORD, NORD_EST, etc.)
- Le cron appendDailyDirections() doit tourner à 00:00:05 (après PA consumption, avant lock)
- Tous les membres de l'expédition peuvent choisir la direction (premier arrivé)
- Une fois la direction choisie pour la journée, elle ne peut plus être changée
- Si pas de direction initiale à minuit, elle est automatiquement mise à UNKNOWN
