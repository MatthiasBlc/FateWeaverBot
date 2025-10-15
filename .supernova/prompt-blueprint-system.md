# Supernova Task: Système Blueprint pour les projets

## Contexte

Actuellement, quand un projet est terminé, il est marqué comme COMPLETED et c'est tout. Le nouveau système doit permettre qu'une fois terminé, un projet devienne un "blueprint" (modèle) qui peut être recommencé autant de fois qu'on veut, avec des coûts différents (généralement inférieurs) de la première fabrication.

## Objectif

Implémenter :
1. Nouveaux champs en base de données pour les coûts blueprint
2. Conversion automatique d'un projet en blueprint à sa complétion
3. Possibilité de redémarrer un blueprint (créer un nouveau projet basé sur le blueprint)
4. Interface Discord pour afficher et recommencer les blueprints

## Étape 1: Schéma de base de données

**Fichier:** `/home/thorynest/Perso/2-Projects/FateWeaverBot/backend/prisma/schema.prisma`

**Action 1:** Modifier le modèle Project (trouver le modèle Project, lignes ~147-165) :

Ajouter ces champs AVANT le closing brace :

```prisma
  isBlueprint               Boolean   @default(false)
  originalProjectId         Int?
  paBlueprintRequired       Int?
  blueprintResourceCosts    ProjectBlueprintResourceCost[]

  originalProject           Project?  @relation("ProjectBlueprint", fields: [originalProjectId], references: [id], onDelete: SetNull)
  blueprintCopies           Project[] @relation("ProjectBlueprint")
```

**Action 2:** Créer un nouveau modèle APRÈS le modèle ProjectResourceCost (après la ligne ~192) :

```prisma
model ProjectBlueprintResourceCost {
  id               Int          @id @default(autoincrement())
  projectId        Int
  resourceTypeId   Int
  quantityRequired Int
  quantityProvided Int          @default(0)

  project      Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  resourceType ResourceType @relation(fields: [resourceTypeId], references: [id])

  @@unique([projectId, resourceTypeId])
  @@map("project_blueprint_resource_costs")
}
```

**Action 3:** Dans le modèle ResourceType, ajouter la relation (trouver le modèle ResourceType et ajouter avant le closing brace) :

```prisma
  blueprintCosts ProjectBlueprintResourceCost[]
```

**Après modification, exécuter:**
```bash
cd /home/thorynest/Perso/2-Projects/FateWeaverBot/backend
npx prisma migrate dev --name add_blueprint_system
npx prisma generate
```

## Étape 2: Backend - Mise à jour du service projets

**Fichier:** `/home/thorynest/Perso/2-Projects/FateWeaverBot/backend/src/services/project.service.ts`

**Action 1:** Modifier l'interface de création (début du fichier, après les imports) :

Trouver `interface CreateProjectData` et ajouter les champs blueprint :

```typescript
interface CreateProjectData {
  name: string;
  paRequired: number;
  craftTypes: string[];
  outputResourceTypeId: number;
  outputQuantity: number;
  townId: string;
  createdBy: string;
  resourceCosts?: Array<{
    resourceTypeId: number;
    quantityRequired: number;
  }>;
  // Blueprint fields
  paBlueprintRequired?: number;
  blueprintResourceCosts?: Array<{
    resourceTypeId: number;
    quantityRequired: number;
  }>;
}
```

**Action 2:** Dans la méthode `createProject()` (ligne ~30-84), après la création du projet, ajouter la création des coûts blueprint :

Trouver le bloc qui crée les `ProjectResourceCost` (lignes ~60-75 environ) et après ce bloc, ajouter :

```typescript
      // Create blueprint resource costs if provided
      if (data.blueprintResourceCosts && data.blueprintResourceCosts.length > 0) {
        await tx.projectBlueprintResourceCost.createMany({
          data: data.blueprintResourceCosts.map((cost) => ({
            projectId: project.id,
            resourceTypeId: cost.resourceTypeId,
            quantityRequired: cost.quantityRequired,
            quantityProvided: 0,
          })),
        });
      }
```

Et modifier la création du projet pour inclure `paBlueprintRequired` :

```typescript
      const project = await tx.project.create({
        data: {
          name: data.name,
          paRequired: data.paRequired,
          paContributed: 0,
          outputResourceTypeId: data.outputResourceTypeId,
          outputQuantity: data.outputQuantity,
          status: ProjectStatus.ACTIVE,
          townId: data.townId,
          createdBy: data.createdBy,
          paBlueprintRequired: data.paBlueprintRequired,
        },
      });
```

**Action 3:** Ajouter une nouvelle méthode `convertToBlueprint()` après `createProject()` :

```typescript
  async convertToBlueprint(projectId: number): Promise<void> {
    await prisma.project.update({
      where: { id: projectId },
      data: { isBlueprint: true },
    });
  }
```

**Action 4:** Ajouter une nouvelle méthode `restartBlueprint()` après `convertToBlueprint()` :

```typescript
  async restartBlueprint(
    blueprintId: number,
    createdBy: string
  ): Promise<any> {
    return await prisma.$transaction(async (tx) => {
      // Get the blueprint project
      const blueprint = await tx.project.findUnique({
        where: { id: blueprintId },
        include: {
          outputResourceType: true,
          craftTypes: {
            include: { craftType: true },
          },
          blueprintResourceCosts: {
            include: { resourceType: true },
          },
        },
      });

      if (!blueprint) {
        throw new Error("Blueprint not found");
      }

      if (!blueprint.isBlueprint) {
        throw new Error("This project is not a blueprint");
      }

      // Use blueprint costs if available, otherwise use original costs
      const paRequired = blueprint.paBlueprintRequired ?? blueprint.paRequired;

      // Create new project from blueprint
      const newProject = await tx.project.create({
        data: {
          name: blueprint.name,
          paRequired,
          paContributed: 0,
          outputResourceTypeId: blueprint.outputResourceTypeId,
          outputQuantity: blueprint.outputQuantity,
          status: ProjectStatus.ACTIVE,
          townId: blueprint.townId,
          createdBy,
          originalProjectId: blueprintId,
          paBlueprintRequired: blueprint.paBlueprintRequired,
        },
      });

      // Copy craft types
      await tx.projectCraftType.createMany({
        data: blueprint.craftTypes.map((ct) => ({
          projectId: newProject.id,
          craftTypeId: ct.craftTypeId,
        })),
      });

      // Use blueprint resource costs if available
      if (blueprint.blueprintResourceCosts.length > 0) {
        // Copy blueprint costs as regular costs
        await tx.projectResourceCost.createMany({
          data: blueprint.blueprintResourceCosts.map((cost) => ({
            projectId: newProject.id,
            resourceTypeId: cost.resourceTypeId,
            quantityRequired: cost.quantityRequired,
            quantityProvided: 0,
          })),
        });

        // Also create blueprint costs for the new project
        await tx.projectBlueprintResourceCost.createMany({
          data: blueprint.blueprintResourceCosts.map((cost) => ({
            projectId: newProject.id,
            resourceTypeId: cost.resourceTypeId,
            quantityRequired: cost.quantityRequired,
            quantityProvided: 0,
          })),
        });
      } else {
        // No blueprint costs defined, use original costs from ProjectResourceCost
        const originalCosts = await tx.projectResourceCost.findMany({
          where: { projectId: blueprintId },
        });

        if (originalCosts.length > 0) {
          await tx.projectResourceCost.createMany({
            data: originalCosts.map((cost) => ({
              projectId: newProject.id,
              resourceTypeId: cost.resourceTypeId,
              quantityRequired: cost.quantityRequired,
              quantityProvided: 0,
            })),
          });
        }
      }

      return newProject;
    });
  }
```

**Action 5:** Dans la méthode `contributeToProject()`, trouver la section où le projet est marqué comme COMPLETED (ligne ~246-272 environ, chercher `status: ProjectStatus.COMPLETED`).

Après le bloc qui marque le projet comme COMPLETED et log l'événement, ajouter :

```typescript
        // Convert to blueprint
        await this.convertToBlueprint(projectId);
```

**Action 6:** Modifier la méthode `getProjectById()` pour inclure les blueprintResourceCosts :

Trouver le `include` dans `getProjectById()` (ligne ~113-131 environ) et ajouter :

```typescript
        blueprintResourceCosts: {
          include: {
            resourceType: true,
          },
        },
```

**Action 7:** Modifier la méthode `getAllProjectsForTown()` pour inclure les blueprintResourceCosts :

Même chose, ajouter dans le `include` :

```typescript
        blueprintResourceCosts: {
          include: {
            resourceType: true,
          },
        },
```

## Étape 3: Backend - Nouveaux controllers

**Fichier:** `/home/thorynest/Perso/2-Projects/FateWeaverBot/backend/src/controllers/projects.ts`

**Action:** Ajouter un nouveau controller à la fin du fichier (avant les exports) :

```typescript
export const restartBlueprint = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { createdBy } = req.body;

    if (!createdBy) {
      res.status(400).json({ error: "Created by is required" });
      return;
    }

    const projectService = new ProjectService();
    const newProject = await projectService.restartBlueprint(
      parseInt(projectId),
      createdBy
    );

    res.status(201).json(newProject);
  } catch (error: any) {
    console.error("Error restarting blueprint:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};
```

**Fichier:** `/home/thorynest/Perso/2-Projects/FateWeaverBot/backend/src/routes/projects.ts`

**Action:** Ajouter la nouvelle route (trouver les autres routes POST et ajouter) :

```typescript
router.post("/:projectId/restart", restartBlueprint);
```

Et ajouter l'import dans les imports du controller :

```typescript
import {
  createProject,
  getProjectsByCraftType,
  getProjectById,
  contributeToProject,
  getAllProjectsForTown,
  deleteProject,
  restartBlueprint, // NOUVEAU
} from "../controllers/projects";
```

## Étape 4: Bot - Types et API service

**Fichier:** `/home/thorynest/Perso/2-Projects/FateWeaverBot/bot/src/features/projects/projects.types.ts`

**Action 1:** Modifier l'interface Project (ligne ~13-32) pour ajouter les champs blueprint :

```typescript
export interface Project {
  id: number;
  name: string;
  paRequired: number;
  paContributed: number;
  outputResourceTypeId: number;
  outputQuantity: number;
  status: ProjectStatus;
  townId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  outputResourceType: { id: number; name: string };
  resourceCosts: ResourceCost[];
  craftTypes: { craftType: { id: number; name: string } }[];
  // Blueprint fields
  isBlueprint?: boolean;
  originalProjectId?: number;
  paBlueprintRequired?: number;
  blueprintResourceCosts?: ResourceCost[];
}
```

**Action 2:** Modifier l'interface CreateProjectData (ligne ~34-42) :

```typescript
export interface CreateProjectData {
  name: string;
  paRequired: number;
  craftTypeIds: number[];
  outputResourceTypeId: number;
  outputQuantity: number;
  resourceCosts?: {
    resourceTypeId: number;
    quantityRequired: number;
  }[];
  // Blueprint fields
  paBlueprintRequired?: number;
  blueprintResourceCosts?: {
    resourceTypeId: number;
    quantityRequired: number;
  }[];
}
```

**Fichier:** `/home/thorynest/Perso/2-Projects/FateWeaverBot/bot/src/services/api/project-api.service.ts`

**Action:** Ajouter une nouvelle méthode à la fin (avant le closing brace) :

```typescript
  async restartBlueprint(
    projectId: number,
    createdBy: string
  ): Promise<Project> {
    const response = await apiClient.post(
      `/projects/${projectId}/restart`,
      { createdBy }
    );
    return response.data;
  }
```

## Étape 5: Bot - Mise à jour de la création de projet

**Fichier:** `/home/thorynest/Perso/2-Projects/FateWeaverBot/bot/src/features/projects/project-creation.ts`

**Action 1:** Modifier l'interface ProjectDraft (ligne ~22-31) :

```typescript
interface ProjectDraft {
  name: string;
  paRequired: number;
  outputQuantity: number;
  craftTypeIds?: number[];
  outputResourceTypeId?: number;
  resourceCosts?: { resourceTypeId: number; resourceTypeName: string; quantityRequired: number }[];
  // Blueprint fields
  paBlueprintRequired?: number;
  blueprintResourceCosts?: { resourceTypeId: number; resourceTypeName: string; quantityRequired: number }[];
}
```

**Action 2:** Modifier le modal initial `handleAddProjectCommand()` pour ajouter le champ PA blueprint :

Trouver le modal builder (ligne ~35-84 environ) et ajouter un nouveau champ :

```typescript
      new TextInputBuilder()
        .setCustomId("paBlueprintRequired")
        .setLabel("PA requis pour les blueprints (optionnel)")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("Ex: 5 (si vide, même coût que l'original)")
        .setRequired(false)
```

Et l'ajouter à une nouvelle row dans le modal.

**Action 3:** Dans `handleProjectCreateModal()`, parser le nouveau champ (ligne ~86-137) :

```typescript
    const paBlueprintRequired = interaction.fields.getTextInputValue("paBlueprintRequired");
    const paBlueprintRequiredNum = paBlueprintRequired ? parseInt(paBlueprintRequired) : undefined;

    const draft: ProjectDraft = {
      name,
      paRequired: paRequiredNum,
      outputQuantity: outputQuantityNum,
      paBlueprintRequired: paBlueprintRequiredNum,
    };
```

**Action 4:** Ajouter un bouton "Ajouter Coûts Blueprint" dans `createProjectButtons()` (ligne ~489-511) :

```typescript
    // Add blueprint costs button (only if not already added)
    if (draft.blueprintResourceCosts === undefined || draft.blueprintResourceCosts.length === 0) {
      buttons.push(
        new ButtonBuilder()
          .setCustomId("project_add_blueprint_costs")
          .setLabel("Ajouter Coûts Blueprint")
          .setEmoji("📋")
          .setStyle(ButtonStyle.Secondary)
      );
    }
```

**Action 5:** Créer le handler pour ajouter des coûts blueprint (nouvelle fonction après `handleAddResourceButton`) :

```typescript
export async function handleAddBlueprintCostButton(
  interaction: ButtonInteraction
): Promise<void> {
  try {
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

    // Get available resources
    const resources = await apiService.resources.getAllResourceTypes();

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("project_blueprint_cost_select")
      .setPlaceholder("Choisissez une ressource pour le blueprint...")
      .addOptions(
        resources.map((r) => ({
          label: r.name,
          value: r.id.toString(),
        }))
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      selectMenu
    );

    await interaction.reply({
      content: "Quelle ressource sera nécessaire pour le blueprint ?",
      components: [row],
      ephemeral: true,
    });
  } catch (error: any) {
    console.error("Error showing blueprint cost menu:", error);
    await interaction.reply({
      content: `❌ Erreur : ${error.message}`,
      ephemeral: true,
    });
  }
}

export async function handleBlueprintCostSelect(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  try {
    const resourceTypeId = parseInt(interaction.values[0]);

    const resources = await apiService.resources.getAllResourceTypes();
    const selectedResource = resources.find((r) => r.id === resourceTypeId);

    if (!selectedResource) {
      await interaction.reply({
        content: "❌ Ressource non trouvée.",
        ephemeral: true,
      });
      return;
    }

    const modal = new ModalBuilder()
      .setCustomId(`project_blueprint_cost_quantity:${resourceTypeId}`)
      .setTitle(`Quantité - ${selectedResource.name} (Blueprint)`);

    const quantityInput = new TextInputBuilder()
      .setCustomId("quantity")
      .setLabel("Quantité requise pour le blueprint")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("Ex: 10")
      .setRequired(true);

    const row = new ActionRowBuilder<TextInputBuilder>().addComponents(
      quantityInput
    );

    modal.addComponents(row);

    await interaction.showModal(modal);
  } catch (error: any) {
    console.error("Error showing blueprint quantity modal:", error);
    await interaction.reply({
      content: `❌ Erreur : ${error.message}`,
      ephemeral: true,
    });
  }
}

export async function handleBlueprintCostQuantityModal(
  interaction: ModalSubmitInteraction
): Promise<void> {
  try {
    const resourceTypeId = parseInt(interaction.customId.split(":")[1]);
    const quantity = parseInt(
      interaction.fields.getTextInputValue("quantity")
    );

    if (isNaN(quantity) || quantity <= 0) {
      await interaction.reply({
        content: "❌ La quantité doit être un nombre positif.",
        ephemeral: true,
      });
      return;
    }

    const resources = await apiService.resources.getAllResourceTypes();
    const selectedResource = resources.find((r) => r.id === resourceTypeId);

    if (!selectedResource) {
      await interaction.reply({
        content: "❌ Ressource non trouvée.",
        ephemeral: true,
      });
      return;
    }

    // Update draft (stored in message components metadata or state)
    const draft = getDraftFromState(); // You'll need to implement state management

    if (!draft.blueprintResourceCosts) {
      draft.blueprintResourceCosts = [];
    }

    draft.blueprintResourceCosts.push({
      resourceTypeId,
      resourceTypeName: selectedResource.name,
      quantityRequired: quantity,
    });

    await interaction.reply({
      content: `✅ Coût blueprint ajouté : ${quantity} ${selectedResource.name}`,
      ephemeral: true,
    });

    // Update the main message with new draft
    await updateProjectDraftMessage(interaction, draft);
  } catch (error: any) {
    console.error("Error adding blueprint cost:", error);
    await interaction.reply({
      content: `❌ Erreur : ${error.message}`,
      ephemeral: true,
    });
  }
}
```

**Note:** Les fonctions `getDraftFromState()` et `updateProjectDraftMessage()` doivent être adaptées au système existant de gestion du draft.

**Action 6:** Dans `handleCreateFinalButton()`, inclure les coûts blueprint lors de la création (ligne ~358-415) :

Trouver où on appelle `createProject()` et modifier pour inclure les nouveaux champs :

```typescript
    const projectData = {
      name: draft.name,
      paRequired: draft.paRequired,
      craftTypeIds: draft.craftTypeIds!,
      outputResourceTypeId: draft.outputResourceTypeId!,
      outputQuantity: draft.outputQuantity,
      resourceCosts: draft.resourceCosts?.map((rc) => ({
        resourceTypeId: rc.resourceTypeId,
        quantityRequired: rc.quantityRequired,
      })),
      paBlueprintRequired: draft.paBlueprintRequired,
      blueprintResourceCosts: draft.blueprintResourceCosts?.map((rc) => ({
        resourceTypeId: rc.resourceTypeId,
        quantityRequired: rc.quantityRequired,
      })),
    };
```

## Étape 6: Bot - Affichage et redémarrage des blueprints

**Fichier:** `/home/thorynest/Perso/2-Projects/FateWeaverBot/bot/src/features/projects/projects.handlers.ts`

**Action 1:** Dans la fonction qui affiche les projets (ligne ~85-251), ajouter l'affichage des blueprints :

Trouver où les projets COMPLETED sont affichés et ajouter un badge blueprint + coûts blueprint :

```typescript
        // Show blueprint info if applicable
        if (project.isBlueprint) {
          const blueprintPA = project.paBlueprintRequired ?? project.paRequired;
          projectInfo += `\n📋 **Blueprint** - Peut être recommencé pour ${blueprintPA} PA`;

          if (project.blueprintResourceCosts && project.blueprintResourceCosts.length > 0) {
            projectInfo += "\n**Coûts Blueprint:**\n";
            project.blueprintResourceCosts.forEach((cost) => {
              projectInfo += `  • ${cost.quantityRequired} ${cost.resourceType.name}\n`;
            });
          }
        }
```

**Action 2:** Ajouter un bouton "Recommencer" pour les blueprints :

Dans la section où les boutons sont créés pour les projets COMPLETED, ajouter :

```typescript
      // Add restart button for blueprints
      if (project.isBlueprint) {
        actionRow.addComponents(
          new ButtonBuilder()
            .setCustomId(`project_restart:${project.id}`)
            .setLabel("Recommencer")
            .setEmoji("🔄")
            .setStyle(ButtonStyle.Success)
        );
      }
```

**Action 3:** Créer le handler pour recommencer un blueprint (nouvelle fonction) :

```typescript
export async function handleRestartBlueprintButton(
  interaction: ButtonInteraction
): Promise<void> {
  try {
    const projectId = parseInt(interaction.customId.split(":")[1]);

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

    // Restart blueprint
    const newProject = await apiService.projects.restartBlueprint(
      projectId,
      interaction.user.id
    );

    await interaction.reply({
      content: `✅ Blueprint **${newProject.name}** redémarré avec succès !`,
      ephemeral: true,
    });

    // Optionally refresh the project list
    await interaction.message.edit({
      content: "🔄 Projet redémarré ! Utilisez `/projets` pour voir la liste mise à jour.",
    });
  } catch (error: any) {
    console.error("Error restarting blueprint:", error);
    await interaction.reply({
      content: `❌ Erreur : ${error.message}`,
      ephemeral: true,
    });
  }
}
```

## Étape 7: Bot - Enregistrer les nouveaux handlers

**Fichier:** `/home/thorynest/Perso/2-Projects/FateWeaverBot/bot/src/features/projects/project-creation.ts`

**Action:** Ajouter les exports à la fin du fichier :

```typescript
export { handleAddBlueprintCostButton, handleBlueprintCostSelect, handleBlueprintCostQuantityModal };
```

**Fichier:** `/home/thorynest/Perso/2-Projects/FateWeaverBot/bot/src/features/projects/projects.handlers.ts`

**Action:** Ajouter l'export :

```typescript
export { handleRestartBlueprintButton };
```

**Fichier:** `/home/thorynest/Perso/2-Projects/FateWeaverBot/bot/src/events/interactionCreate.ts`

**Action:** Ajouter les handlers dans le switch/if des interactions :

Pour Button :
```typescript
if (interaction.customId === "project_add_blueprint_costs") {
  await projectCreation.handleAddBlueprintCostButton(interaction);
}
if (interaction.customId.startsWith("project_restart:")) {
  await projectHandlers.handleRestartBlueprintButton(interaction);
}
```

Pour StringSelectMenu :
```typescript
if (interaction.customId === "project_blueprint_cost_select") {
  await projectCreation.handleBlueprintCostSelect(interaction);
}
```

Pour Modal :
```typescript
if (interaction.customId.startsWith("project_blueprint_cost_quantity:")) {
  await projectCreation.handleBlueprintCostQuantityModal(interaction);
}
```

## Étape 8: Tests et validation

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

**Fichier:** `/home/thorynest/Perso/2-Projects/FateWeaverBot/.supernova/report-blueprint-system.md`

**Contenu:**

```markdown
# Rapport: Système Blueprint pour les projets

## Statut
[✅ Terminé / ❌ Erreur / ⚠️ Partiel]

## Modifications effectuées

### Base de données
- [ ] Nouveaux champs blueprint dans le modèle Project
- [ ] Nouveau modèle ProjectBlueprintResourceCost
- [ ] Relation ajoutée dans ResourceType
- [ ] Migration exécutée avec succès
- [ ] Prisma generate exécuté avec succès

### Backend
- [ ] Interface CreateProjectData mise à jour
- [ ] Méthode createProject() modifiée pour inclure coûts blueprint
- [ ] Nouvelle méthode convertToBlueprint()
- [ ] Nouvelle méthode restartBlueprint()
- [ ] Conversion automatique en blueprint à la complétion
- [ ] Include blueprintResourceCosts dans getProjectById()
- [ ] Include blueprintResourceCosts dans getAllProjectsForTown()
- [ ] Nouveau controller restartBlueprint()
- [ ] Nouvelle route POST /:projectId/restart

### Bot - Types et API
- [ ] Interface Project mise à jour avec champs blueprint
- [ ] Interface CreateProjectData mise à jour
- [ ] Méthode restartBlueprint() dans API service

### Bot - UI
- [ ] Interface ProjectDraft mise à jour
- [ ] Modal de création modifié (champ PA blueprint)
- [ ] Bouton "Ajouter Coûts Blueprint" ajouté
- [ ] Handler handleAddBlueprintCostButton() créé
- [ ] Handler handleBlueprintCostSelect() créé
- [ ] Handler handleBlueprintCostQuantityModal() créé
- [ ] Affichage des blueprints dans liste projets
- [ ] Bouton "Recommencer" pour les blueprints
- [ ] Handler handleRestartBlueprintButton() créé
- [ ] Exports ajoutés
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

- Les blueprints sont convertis automatiquement à la complétion du projet
- Les coûts blueprint sont optionnels (si non définis, on utilise les coûts originaux)
- Un blueprint peut être recommencé autant de fois qu'on veut
- Chaque redémarrage crée un nouveau projet ACTIVE basé sur le blueprint
- Le PA blueprint est optionnel (si non défini, on utilise le PA original)
- La gestion du draft dans le bot doit être adaptée au système existant
