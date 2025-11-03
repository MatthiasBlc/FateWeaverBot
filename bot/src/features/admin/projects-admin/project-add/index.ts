/**
 * Project Add - Main Index
 *
 * Re-exports all project creation handlers for backward compatibility.
 * This file maintains the same public API as the original project-add.ts.
 */

// Step 1: Initialization and name handlers
export {
  handleProjectAdminAddButton,
  handleProjectAdminAddStep1Modal,
  handleProjectAddOptionalName,
  handleProjectAddNameModal,
} from "./step-1-init.js";

// Step 2: Craft types and output type selection
export {
  handleProjectAddCraftTypesSelect,
  handleProjectAddOutputTypeSelect,
  handleProjectAddValidateSelection,
} from "./step-2-types.js";

// Step 3: Resource management
export {
  handleProjectAddSelectResource,
  handleProjectAddObjectCategory,
  handleProjectAddSelectObject,
  handleProjectAddQuantityModal,
  handleProjectAddAddResource,
  handleProjectAddSelectCostResource,
  handleProjectAddResourceQuantityModal,
  handleProjectAddValidateCosts,
} from "./step-3-resources.js";

// Step 4: Blueprint configuration
export {
  handleProjectAddBlueprintNo,
  handleProjectAddBlueprintYes,
  handleProjectAddBlueprintPAModal,
  handleProjectAddAddBlueprintResource,
  handleProjectAddSelectBlueprintResource,
  handleProjectAddBlueprintResourceQuantityModal,
} from "./step-4-blueprint.js";

// Step 5: Finalization
export {
  handleProjectAddFinalize,
} from "./step-5-finalize.js";
