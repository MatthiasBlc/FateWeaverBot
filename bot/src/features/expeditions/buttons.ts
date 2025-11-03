/**
 * Button handlers for Expeditions
 * Extracted from utils/button-handler.ts for better organization
 */

import type { ButtonInteraction } from "discord.js";
import type { ButtonHandler } from "../../utils/button-handler";
import { logger } from "../../services/logger";

/**
 * Register all Expedition button handlers
 */
export function registerExpeditionButtons(handler: ButtonHandler): void {
  handler.registerHandlerByPrefix("expedition_", async (interaction: ButtonInteraction) => {
    const customId = interaction.customId;

    if (customId === "expedition_leave") {
      const { handleExpeditionLeaveButton } = await import(
        "./handlers/expedition-leave.js"
      );
      await handleExpeditionLeaveButton(interaction);
    } else if (customId === "expedition_transfer") {
      const { handleExpeditionTransferButton } = await import(
        "./handlers/expedition-transfer.js"
      );
      await handleExpeditionTransferButton(interaction);
    } else if (customId === "expedition_create_new") {
      const { handleExpeditionCreateNewButton } = await import(
        "./handlers/expedition-create.js"
      );
      await handleExpeditionCreateNewButton(interaction);
    } else if (customId === "expedition_join_existing") {
      const { handleExpeditionJoinExistingButton } = await import(
        "./handlers/expedition-join.js"
      );
      await handleExpeditionJoinExistingButton(interaction);
    } else if (customId.startsWith("expedition_admin_")) {
      const { handleExpeditionAdminButton } = await import(
        "../admin/expedition-admin.handlers.js"
      );
      await handleExpeditionAdminButton(interaction);
    } else if (customId.startsWith("expedition_emergency_return:")) {
      const { handleEmergencyReturnButton } = await import(
        "./handlers/expedition-emergency.js"
      );
      await handleEmergencyReturnButton(interaction);
    } else if (customId.startsWith("expedition_choose_direction:")) {
      const { handleExpeditionChooseDirection } = await import(
        "./handlers/expedition-display.js"
      );
      await handleExpeditionChooseDirection(interaction);
    } else if (customId.startsWith("expedition_create_add_resources:")) {
      const { handleExpeditionAddResources } = await import(
        "./handlers/expedition-create-resources.js"
      );
      await handleExpeditionAddResources(interaction);
    } else if (customId.startsWith("expedition_create_validate:")) {
      const { handleExpeditionValidateResources } = await import(
        "./handlers/expedition-create-resources.js"
      );
      await handleExpeditionValidateResources(interaction);
    } else if (customId.startsWith("expedition_resource_add:")) {
      const { handleExpeditionResourceAdd } = await import(
        "./handlers/expedition-resource-management.js"
      );
      await handleExpeditionResourceAdd(interaction);
    } else if (customId.startsWith("expedition_resource_remove:")) {
      const { handleExpeditionResourceRemove } = await import(
        "./handlers/expedition-resource-management.js"
      );
      await handleExpeditionResourceRemove(interaction);
    }
  });
}
