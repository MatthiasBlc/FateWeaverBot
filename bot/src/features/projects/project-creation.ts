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
  outputQuantity: number;
  resourceCosts: { resourceTypeId: number; quantity: number; name: string; emoji: string }[];
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

    modal.addComponents(
      new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(nameInput),
      new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(paInput),
      new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(outputQtyInput)
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

    const draft: ProjectDraft = {
      name,
      paRequired,
      guildId: interaction.guildId!,
      userId: interaction.user.id,
      craftTypes: [],
      outputResourceTypeId: null,
      outputQuantity,
      resourceCosts: [],
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
        { label: "Travailler le bois", value: "TRAVAILLER_LE_BOIS", emoji: "🪚" },
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

    const allResources = (await apiService.getAllResourceTypes()) || [];
    if (allResources.length === 0) return;

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("project_output_select")
      .setPlaceholder("Ressource de sortie")
      .addOptions(
        allResources.slice(0, 25).map((resource: any) => ({
          label: resource.name,
          value: resource.id.toString(),
          emoji: resource.emoji || undefined,
        }))
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    await interaction.reply({
      content: "Sélectionnez la ressource produite :",
      components: [row],
      flags: ["Ephemeral"],
    });
  } catch (error) {
    logger.error("Erreur output:", { error });
  }
}

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

    if (draft.craftTypes.length === 0 || !draft.outputResourceTypeId) {
      await interaction.reply({
        content: `${STATUS.ERROR} Sélectionnez craft types ET ressource de sortie.`,
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

    const result = await apiService.projects.createProject(
      {
        name: draft.name,
        paRequired: draft.paRequired,
        townId: town.id,
        craftTypes: draft.craftTypes,
        outputResourceTypeId: draft.outputResourceTypeId,
        outputQuantity: draft.outputQuantity,
        resourceCosts: resourceCosts.length > 0 ? resourceCosts : undefined,
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
  const canCreate = draft.craftTypes.length > 0 && draft.outputResourceTypeId !== null;

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

  if (draft.craftTypes.length > 0) {
    message += `\n🛠️ **Types:** ${draft.craftTypes.map(getCraftTypeEmoji).join(" ")}\n`;
  } else {
    message += `\n⚠️ *Aucun type sélectionné*\n`;
  }

  if (draft.outputResourceTypeId) {
    message += `✅ *Ressource sortie OK*\n`;
  } else {
    message += `⚠️ *Ressource sortie manquante*\n`;
  }

  if (draft.resourceCosts.length > 0) {
    message += `\n📦 **Ressources requises:**\n`;
    message += draft.resourceCosts.map((rc) => `  • ${rc.emoji} ${rc.quantity} ${rc.name}`).join("\n");
  }

  return message;
}
