/**
 * Entry point pour toutes les fonctions d'admin projets
 * Re-exporte les handlers depuis les modules spécialisés
 */

// Display
export { handleProjectsAdminCommand } from "./projects-admin/project-display";

// Add - Flux multi-étapes
export {
  handleProjectAdminAddButton,
  handleProjectAdminAddStep1Modal,
  handleProjectAddSelectResource,
  handleProjectAddObjectCategory,
  handleProjectAddSelectObject,
  handleProjectAddQuantityModal,
  handleProjectAddAddResource,
  handleProjectAddSelectCostResource,
  handleProjectAddResourceQuantityModal,
  handleProjectAddValidateCosts,
  handleProjectAddBlueprintNo,
  handleProjectAddBlueprintYes,
  handleProjectAddBlueprintPAModal,
  handleProjectAddAddBlueprintResource,
  handleProjectAddSelectBlueprintResource,
  handleProjectAddBlueprintResourceQuantityModal,
  handleProjectAddFinalize,
} from "./projects-admin/project-add";

// Edit
export {
  handleProjectAdminEditButton,
  handleProjectAdminEditSelect,
  handleProjectAdminEditModal
} from "./projects-admin/project-edit";

// Delete
export {
  handleProjectAdminDeleteButton,
  handleProjectAdminDeleteSelect,
  handleProjectAdminDeleteConfirm
} from "./projects-admin/project-delete";
