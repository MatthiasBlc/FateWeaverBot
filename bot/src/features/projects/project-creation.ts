import {
  ModalSubmitInteraction,
  ButtonInteraction,
  StringSelectMenuInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalActionRowComponentBuilder,
  ComponentType,
  ChatInputCommandInteraction,
} from "discord.js";
import { logger } from "../../services/logger";
import { apiService } from "../../services/api";
import { STATUS, PROJECT } from "../../constants/emojis";
import { getStatusText, getCraftTypeEmoji } from "./projects.utils";
import { checkAdmin } from "../../utils/roles";

interface ProjectDraft {
  name: string;
  paRequired: number;
  guildId: string;
  userId: string;
  craftTypes: string[];
  outputResourceTypeId: number | null;
  outputObjectTypeId: number | null; // NOUVEAU: Support pour objets en sortie
  outputQuantity: number;
  resourceCosts: { resourceTypeId: number; quantity: number; name: string; emoji: string }[];
  // Blueprint fields
  paBlueprintRequired?: number;
  blueprintResourceCosts?: { resourceTypeId: number; resourceTypeName: string; quantityRequired: number }[];
}

const projectDrafts = new Map<string, ProjectDraft>();

export async function handleAddProjectCommand(interaction: ChatInputCommandInteraction) {
  try {
    const isUserAdmin = await checkAdmin(interaction);
    if (!isUserAdmin) return;

    const modal = new ModalBuilder()
      .setCustomId("project_create_modal")
      .setTitle("Créer un nouveau projet");

    const nameInput = new TextInputBuilder()
      .setCustomId("project_name")
      .setLabel("Nom du projet")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(100)
      .setPlaceholder("Ex: Fabrication de planches");

    const paInput = new TextInputBuilder()
      .setCustomId("project_pa")
      .setLabel("PA requis")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMinLength(1)
      .setMaxLength(4)
      .setPlaceholder("Ex: 50");

    const outputQtyInput = new TextInputBuilder()
      .setCustomId("output_quantity")
      .setLabel("Quantité produite")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMinLength(1)
      .setMaxLength(3)
      .setPlaceholder("Ex: 10");

    const paBlueprintInput = new TextInputBuilder()
      .setCustomId("paBlueprintRequired")
      .setLabel("PA requis pour les blueprints (optionnel)")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("Ex: 5 (si vide, même coût que l'original)")
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(nameInput),
      new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(paInput),
      new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(outputQtyInput),
      new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(paBlueprintInput)
    );

    await interaction.showModal(modal);
  } catch (error) {
    logger.error("Erreur modal création:", { error });
    await interaction.reply({
      content: "❌ Erreur.",
      flags: ["Ephemeral"],
    });
  }
}

export async function handleProjectCreateModal(interaction: ModalSubmitInteraction) {
  try {
    const name = interaction.fields.getTextInputValue("project_name").trim();
    const paInput = interaction.fields.getTextInputValue("project_pa").trim();
    const outputQtyInput = interaction.fields.getTextInputValue("output_quantity").trim();
    const paBlueprintInput = interaction.fields.getTextInputValue("paBlueprintRequired").trim();

    const paRequired = parseInt(paInput, 10);
    if (isNaN(paRequired) || paRequired <= 0) {
      await interaction.reply({
        content: `${STATUS.ERROR} PA invalide.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    const outputQuantity = parseInt(outputQtyInput, 10);
    if (isNaN(outputQuantity) || outputQuantity <= 0) {
      await interaction.reply({
        content: `${STATUS.ERROR} Quantité invalide.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    const paBlueprintRequired = paBlueprintInput ? parseInt(paBlueprintInput, 10) : undefined;
    if (paBlueprintInput && (isNaN(paBlueprintRequired!) || paBlueprintRequired! <= 0)) {
      await interaction.reply({
        content: `${STATUS.ERROR} PA blueprint invalide.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    const draft: ProjectDraft = {
      name,
      paRequired,
      guildId: interaction.guildId!,
      userId: interaction.user.id,
      craftTypes: [],
      outputResourceTypeId: null,
      outputObjectTypeId: null, // NOUVEAU
      outputQuantity,
      resourceCosts: [],
      paBlueprintRequired,
    };

    projectDrafts.set(interaction.user.id, draft);

    const buttons = createProjectButtons(draft);

    await interaction.reply({
      content: formatProjectDraft(draft),
      components: [buttons],
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Erreur création:", { error });
    await interaction.reply({
      content: "❌ Erreur.",
      flags: ["Ephemeral"],
    });
  }
}

export async function handleSelectCraftTypesButton(interaction: ButtonInteraction) {
  try {
    const draft = projectDrafts.get(interaction.user.id);
    if (!draft) {
      await interaction.reply({
        content: `${STATUS.ERROR} Session expirée.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("project_craft_type_select")
      .setPlaceholder("Sélectionnez types d'artisanat")
      .setMinValues(1)
      .setMaxValues(3)
      .addOptions([
        { label: "Tisser", value: "TISSER", emoji: "🧵" },
        { label: "Forger", value: "FORGER", emoji: "🔨" },
        { label: "Menuiser", value: "MENUISER", emoji: "🪚" },
      ]);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    await interaction.reply({
      content: "Sélectionnez les types d'artisanat :",
      components: [row],
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Erreur craft types:", { error });
  }
}

export async function handleCraftTypeSelect(interaction: StringSelectMenuInteraction) {
  try {
    const draft = projectDrafts.get(interaction.user.id);
    if (!draft) return;

    draft.craftTypes = interaction.values;
    projectDrafts.set(interaction.user.id, draft);

    const buttons = createProjectButtons(draft);

    await interaction.update({
      content: formatProjectDraft(draft),
      components: [buttons],
    });
  } catch (error) {
    logger.error("Erreur sélection craft:", { error });
  }
}

export async function handleSelectOutputButton(interaction: ButtonInteraction) {
  try {
    const draft = projectDrafts.get(interaction.user.id);
    if (!draft) return;

    // Choix entre ressource ou objet
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("project_output_type_select")
      .setPlaceholder("Type de sortie")
      .addOptions([
        { label: "Ressource", value: "resource", emoji: "📦" },
        { label: "Objet", value: "object", emoji: "🔧" },
      ]);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    await interaction.reply({
      content: "Que produit ce projet ?",
      components: [row],
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Erreur output:", { error });
  }
}

// Handler pour le choix du type de sortie (ressource ou objet)
export async function handleOutputTypeSelect(interaction: StringSelectMenuInteraction) {
  try {
    const draft = projectDrafts.get(interaction.user.id);
    if (!draft) return;

    const outputType = interaction.values[0];

    if (outputType === "resource") {
      // Afficher la liste des ressources
      const allResources = (await apiService.getAllResourceTypes()) || [];
      if (allResources.length === 0) return;

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("project_output_resource_select")
        .setPlaceholder("Ressource de sortie")
        .addOptions(
          allResources.slice(0, 25).map((resource: any) => ({
            label: resource.name,
            value: resource.id.toString(),
            emoji: resource.emoji || undefined,
          }))
        );

      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

      await interaction.update({
        content: "Sélectionnez la ressource produite :",
        components: [row],
      });
    } else if (outputType === "object") {
      // Afficher la liste des objets
      const allObjects = (await apiService.objects.getAllObjectTypes()) || [];
      if (allObjects.length === 0) {
        await interaction.update({
          content: `${STATUS.ERROR} Aucun objet disponible. Ajoutez des objets d'abord !`,
          components: [],
        });
        return;
      }

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("project_output_object_select")
        .setPlaceholder("Objet de sortie")
        .addOptions(
          allObjects.slice(0, 25).map((object: any) => ({
            label: object.name,
            value: object.id.toString(),
            description: object.description?.substring(0, 100) || undefined,
          }))
        );

      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

      await interaction.update({
        content: "Sélectionnez l'objet produit :",
        components: [row],
      });
    }
  } catch (error) {
    logger.error("Erreur output type select:", { error });
  }
}

// Handler pour la sélection d'une ressource en sortie
export async function handleOutputResourceSelect(interaction: StringSelectMenuInteraction) {
  try {
    const draft = projectDrafts.get(interaction.user.id);
    if (!draft) return;

    draft.outputResourceTypeId = parseInt(interaction.values[0], 10);
    draft.outputObjectTypeId = null; // Reset object si resource sélectionnée
    projectDrafts.set(interaction.user.id, draft);

    const buttons = createProjectButtons(draft);

    await interaction.update({
      content: formatProjectDraft(draft),
      components: [buttons],
    });
  } catch (error) {
    logger.error("Erreur output resource select:", { error });
  }
}

// Handler pour la sélection d'un objet en sortie
export async function handleOutputObjectSelect(interaction: StringSelectMenuInteraction) {
  try {
    const draft = projectDrafts.get(interaction.user.id);
    if (!draft) return;

    draft.outputObjectTypeId = parseInt(interaction.values[0], 10);
    draft.outputResourceTypeId = null; // Reset resource si object sélectionné
    projectDrafts.set(interaction.user.id, draft);

    const buttons = createProjectButtons(draft);

    await interaction.update({
      content: formatProjectDraft(draft),
      components: [buttons],
    });
  } catch (error) {
    logger.error("Erreur output object select:", { error });
  }
}

// DEPRECATED - Gardé pour compatibilité mais ne devrait plus être utilisé
export async function handleOutputSelect(interaction: StringSelectMenuInteraction) {
  try {
    const draft = projectDrafts.get(interaction.user.id);
    if (!draft) return;

    draft.outputResourceTypeId = parseInt(interaction.values[0], 10);
    projectDrafts.set(interaction.user.id, draft);

    const buttons = createProjectButtons(draft);

    await interaction.update({
      content: formatProjectDraft(draft),
      components: [buttons],
    });
  } catch (error) {
    logger.error("Erreur output select:", { error });
  }
}

export async function handleAddResourceButton(interaction: ButtonInteraction) {
  try {
    const draft = projectDrafts.get(interaction.user.id);
    if (!draft) return;

    const allResources = (await apiService.getAllResourceTypes()) || [];
    const addedResourceIds = new Set(draft.resourceCosts.map((rc) => rc.resourceTypeId));
    const availableResources = allResources.filter((r: any) => !addedResourceIds.has(r.id));

    if (availableResources.length === 0) {
      await interaction.reply({
        content: `${STATUS.INFO} Toutes ajoutées.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("project_select_resource")
      .setPlaceholder("Ressource requise")
      .addOptions(
        availableResources.slice(0, 25).map((resource: any) => ({
          label: resource.name,
          value: resource.id.toString(),
          emoji: resource.emoji || undefined,
        }))
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    await interaction.reply({
      content: "Sélectionnez ressource requise :",
      components: [row],
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Erreur add resource:", { error });
  }
}

export async function handleResourceSelect(interaction: StringSelectMenuInteraction) {
  try {
    const draft = projectDrafts.get(interaction.user.id);
    if (!draft) return;

    const resourceId = parseInt(interaction.values[0], 10);
    const allResources = (await apiService.getAllResourceTypes()) || [];
    const resource = allResources.find((r: any) => r.id === resourceId);

    if (!resource) return;

    const modal = new ModalBuilder()
      .setCustomId(`project_resource_quantity_${resourceId}`)
      .setTitle(`Quantité de ${resource.name}`);

    const quantityInput = new TextInputBuilder()
      .setCustomId("resource_quantity")
      .setLabel(`Quantité de ${resource.emoji || ""} ${resource.name}`)
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMinLength(1)
      .setMaxLength(4)
      .setPlaceholder("Ex: 20");

    modal.addComponents(
      new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(quantityInput)
    );

    await interaction.showModal(modal);
  } catch (error) {
    logger.error("Erreur resource select:", { error });
  }
}

export async function handleResourceQuantityModal(interaction: ModalSubmitInteraction) {
  try {
    const draft = projectDrafts.get(interaction.user.id);
    if (!draft) return;

    const resourceId = parseInt(interaction.customId.split("_").pop()!, 10);
    const quantityInput = interaction.fields.getTextInputValue("resource_quantity").trim();

    const quantity = parseInt(quantityInput, 10);
    if (isNaN(quantity) || quantity <= 0) {
      await interaction.reply({
        content: `${STATUS.ERROR} Quantité invalide.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    const allResources = (await apiService.getAllResourceTypes()) || [];
    const resource = allResources.find((r: any) => r.id === resourceId);
    if (!resource) return;

    draft.resourceCosts.push({
      resourceTypeId: resourceId,
      quantity,
      name: resource.name,
      emoji: resource.emoji || "",
    });

    projectDrafts.set(interaction.user.id, draft);

    const buttons = createProjectButtons(draft);

    await interaction.reply({
      content: formatProjectDraft(draft),
      components: [buttons],
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Erreur quantity:", { error });
  }
}

export async function handleCreateFinalButton(interaction: ButtonInteraction) {
  try {
    const draft = projectDrafts.get(interaction.user.id);
    if (!draft) return;

    // Validation: craft types et sortie (ressource OU objet)
    if (draft.craftTypes.length === 0) {
      await interaction.reply({
        content: `${STATUS.ERROR} Sélectionnez au moins un type d'artisanat.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    if (!draft.outputResourceTypeId && !draft.outputObjectTypeId) {
      await interaction.reply({
        content: `${STATUS.ERROR} Sélectionnez une sortie (ressource ou objet).`,
        flags: ["Ephemeral"],
      });
      return;
    }

    await interaction.deferReply({ flags: ["Ephemeral"] });

    const townResponse = await apiService.guilds.getTownByGuildId(draft.guildId);
    const town = townResponse as any;

    if (!town || !town.id) {
      await interaction.editReply({ content: "❌ Ville non trouvée." });
      return;
    }

    const resourceCosts = draft.resourceCosts.map((rc) => ({
      resourceTypeId: rc.resourceTypeId,
      quantityRequired: rc.quantity,
    }));

    const blueprintResourceCosts = draft.blueprintResourceCosts?.map((rc) => ({
      resourceTypeId: rc.resourceTypeId,
      quantityRequired: rc.quantityRequired,
    }));

    const result = await apiService.projects.createProject(
      {
        name: draft.name,
        paRequired: draft.paRequired,
        townId: town.id,
        craftTypes: draft.craftTypes,
        outputResourceTypeId: draft.outputResourceTypeId || undefined,
        outputObjectTypeId: draft.outputObjectTypeId || undefined, // NOUVEAU
        outputQuantity: draft.outputQuantity,
        resourceCosts: resourceCosts.length > 0 ? resourceCosts : undefined,
        paBlueprintRequired: draft.paBlueprintRequired,
        blueprintResourceCosts: blueprintResourceCosts && blueprintResourceCosts.length > 0 ? blueprintResourceCosts : undefined,
      },
      draft.userId
    );

    projectDrafts.delete(interaction.user.id);

    let message = `${STATUS.SUCCESS} Projet "${result.name}" créé !\n`;
    message += `${STATUS.STATS} PA: ${result.paRequired}\n`;
    message += `🛠️ Types: ${draft.craftTypes.map(getCraftTypeEmoji).join(" ")}\n`;

    if (draft.resourceCosts.length > 0) {
      message += `\n📦 Ressources:\n`;
      message += draft.resourceCosts.map((rc) => `  • ${rc.emoji} ${rc.quantity} ${rc.name}`).join("\n");
    }

    await interaction.editReply({ content: message });
  } catch (error) {
    logger.error("Erreur création finale:", { error });
    await interaction.editReply({ content: "❌ Erreur." });
  }
}

export async function handleDeleteProjectCommand(interaction: ChatInputCommandInteraction) {
  try {
    const isUserAdmin = await checkAdmin(interaction);
    if (!isUserAdmin) return;

    const townResponse = await apiService.guilds.getTownByGuildId(interaction.guildId!);
    const town = townResponse as any;

    if (!town || !town.id) {
      await interaction.reply({
        content: "❌ Ville non trouvée.",
        flags: ["Ephemeral"],
      });
      return;
    }

    const projects = await apiService.projects.getProjectsByTown(town.id);

    if (projects.length === 0) {
      await interaction.reply({
        content: "❌ Aucun projet trouvé.",
        flags: ["Ephemeral"],
      });
      return;
    }

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("select_project_delete")
      .setPlaceholder("Projet à supprimer")
      .addOptions(
        projects.slice(0, 25).map((project: any) => ({
          label: project.name,
          description: `${project.paContributed}/${project.paRequired} PA`,
          value: project.id,
        }))
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    await interaction.reply({
      content: "Choisissez un projet à supprimer :",
      components: [row],
      flags: ["Ephemeral"],
    });

    const filter = (i: StringSelectMenuInteraction) =>
      i.customId === "select_project_delete" && i.user.id === interaction.user.id;

    try {
      const response = (await interaction.channel?.awaitMessageComponent({
        filter,
        componentType: ComponentType.StringSelect,
        time: 60000,
      })) as StringSelectMenuInteraction;

      if (!response) return;

      const projectId = response.values[0];
      await apiService.projects.deleteProject(projectId);

      await response.update({
        content: `${STATUS.SUCCESS} Projet supprimé.`,
        components: [],
      });
    } catch (error) {
      logger.error("Erreur suppression:", { error });
    }
  } catch (error) {
    logger.error("Erreur préparation suppression:", { error });
  }
}

function createProjectButtons(draft: ProjectDraft): ActionRowBuilder<ButtonBuilder> {
  // Peut créer si: craft types ET (ressource OU objet)
  const canCreate = draft.craftTypes.length > 0 && (draft.outputResourceTypeId !== null || draft.outputObjectTypeId !== null);

  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("project_select_craft_types")
      .setLabel("🛠️ Types")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("project_select_output")
      .setLabel("📦 Sortie")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("project_add_resource")
      .setLabel("➕ Req")
      .setStyle(ButtonStyle.Secondary),
    // Add blueprint costs button (only if not already added)
    ...(draft.blueprintResourceCosts === undefined || draft.blueprintResourceCosts.length === 0
      ? [
          new ButtonBuilder()
            .setCustomId("project_add_blueprint_costs")
            .setLabel("📋 Blueprint")
            .setEmoji("📋")
            .setStyle(ButtonStyle.Secondary),
        ]
      : []),
    new ButtonBuilder()
      .setCustomId("project_create_final")
      .setLabel("✅ Créer")
      .setStyle(ButtonStyle.Success)
      .setDisabled(!canCreate)
  );
}

function formatProjectDraft(draft: ProjectDraft): string {
  let message = `${PROJECT.ICON} **Nouveau projet**\n\n`;
  message += `📝 **Nom:** ${draft.name}\n`;
  message += `${STATUS.STATS} **PA:** ${draft.paRequired}\n`;
  message += `📦 **Qté produite:** ${draft.outputQuantity}\n`;

  if (draft.paBlueprintRequired) {
    message += `📋 **PA Blueprint:** ${draft.paBlueprintRequired}\n`;
  }

  if (draft.craftTypes.length > 0) {
    message += `\n🛠️ **Types:** ${draft.craftTypes.map(getCraftTypeEmoji).join(" ")}\n`;
  } else {
    message += `\n⚠️ *Aucun type sélectionné*\n`;
  }

  // Sortie (ressource OU objet)
  if (draft.outputResourceTypeId) {
    message += `✅ *Ressource de sortie configurée*\n`;
  } else if (draft.outputObjectTypeId) {
    message += `✅ *Objet de sortie configuré*\n`;
  } else {
    message += `⚠️ *Sortie manquante (ressource ou objet)*\n`;
  }

  if (draft.resourceCosts.length > 0) {
    message += `\n📦 **Ressources requises:**\n`;
    message += draft.resourceCosts.map((rc) => `  • ${rc.emoji} ${rc.quantity} ${rc.name}`).join("\n");
  }

  if (draft.blueprintResourceCosts && draft.blueprintResourceCosts.length > 0) {
    message += `\n📋 **Coûts Blueprint:**\n`;
    message += draft.blueprintResourceCosts.map((rc) => `  • ${rc.quantityRequired} ${rc.resourceTypeName}`).join("\n");
  }

  return message;
}

// Blueprint cost handlers
export async function handleAddBlueprintCostButton(interaction: ButtonInteraction): Promise<void> {
  try {
    const draft = projectDrafts.get(interaction.user.id);
    if (!draft) {
      await interaction.reply({
        content: `${STATUS.ERROR} Session expirée.`,
        flags: ["Ephemeral"],
      });
      return;
    }

    const allResources = (await apiService.getAllResourceTypes()) || [];

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("project_blueprint_cost_select")
      .setPlaceholder("Choisissez une ressource pour le blueprint...")
      .addOptions(
        allResources.map((r: any) => ({
          label: r.name,
          value: r.id.toString(),
        }))
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    await interaction.reply({
      content: "Quelle ressource sera nécessaire pour le blueprint ?",
      components: [row],
      flags: ["Ephemeral"],
    });
  } catch (error: any) {
    console.error("Error showing blueprint cost menu:", error);
    await interaction.reply({
      content: `❌ Erreur : ${error.message}`,
      flags: ["Ephemeral"],
    });
  }
}

export async function handleBlueprintCostSelect(interaction: StringSelectMenuInteraction): Promise<void> {
  try {
    const resourceTypeId = parseInt(interaction.values[0]);

    const resources = (await apiService.getAllResourceTypes()) || [];
    const selectedResource = resources.find((r: any) => r.id === resourceTypeId);

    if (!selectedResource) {
      await interaction.reply({
        content: "❌ Ressource non trouvée.",
        flags: ["Ephemeral"],
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

    const row = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(quantityInput);

    modal.addComponents(row);

    await interaction.showModal(modal);
  } catch (error: any) {
    console.error("Error showing blueprint quantity modal:", error);
    await interaction.reply({
      content: `❌ Erreur : ${error.message}`,
      flags: ["Ephemeral"],
    });
  }
}

export async function handleBlueprintCostQuantityModal(interaction: ModalSubmitInteraction): Promise<void> {
  try {
    const resourceTypeId = parseInt(interaction.customId.split(":")[1]);
    const quantity = parseInt(interaction.fields.getTextInputValue("quantity"));

    if (isNaN(quantity) || quantity <= 0) {
      await interaction.reply({
        content: "❌ La quantité doit être un nombre positif.",
        flags: ["Ephemeral"],
      });
      return;
    }

    const resources = (await apiService.getAllResourceTypes()) || [];
    const selectedResource = resources.find((r: any) => r.id === resourceTypeId);

    if (!selectedResource) {
      await interaction.reply({
        content: "❌ Ressource non trouvée.",
        flags: ["Ephemeral"],
      });
      return;
    }

    const draft = projectDrafts.get(interaction.user.id);
    if (!draft) {
      await interaction.reply({
        content: "❌ Session expirée.",
        flags: ["Ephemeral"],
      });
      return;
    }

    if (!draft.blueprintResourceCosts) {
      draft.blueprintResourceCosts = [];
    }

    draft.blueprintResourceCosts.push({
      resourceTypeId,
      resourceTypeName: selectedResource.name,
      quantityRequired: quantity,
    });

    projectDrafts.set(interaction.user.id, draft);

    await interaction.reply({
      content: `✅ Coût blueprint ajouté : ${quantity} ${selectedResource.name}`,
      flags: ["Ephemeral"],
    });

    // Update the main message with new draft
    const buttons = createProjectButtons(draft);
    await interaction.followUp({
      content: formatProjectDraft(draft),
      components: [buttons],
      flags: ["Ephemeral"],
    });
  } catch (error: any) {
    console.error("Error adding blueprint cost:", error);
    await interaction.reply({
      content: `❌ Erreur : ${error.message}`,
      flags: ["Ephemeral"],
    });
  }
}
