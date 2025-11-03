# Modal Import Fixes

## Issues Found
Based on audit-modal-exports.py, we have 9 missing imports.

## Verified Correct Imports

### ✅ Working (33 functions)
All these are correctly exported and can be used as-is in modal feature modules.

### ❌ Need Fixing (9 functions)

#### 1. handleExpeditionTransferModal
**Current Path**: `../features/expeditions/expedition.command.ts`
**Correct Path**: `./handlers/expedition-transfer.js`
**Status**: Function EXISTS in expedition-transfer.ts:221

#### 2-9. Project Admin Modal Handlers
**Current Path**: `../features/admin/projects-admin.command.ts`
**Issue**: All 8 project modal handlers reference non-existent file

Functions needed:
- handleProjectAdminAddStep1Modal
- handleProjectAdminEditModal
- handleProjectAddQuantityModal
- handleProjectAddResourceQuantityModal
- handleProjectAddBlueprintPAModal
- handleProjectAddBlueprintResourceQuantityModal
- handleProjectAddNameModal

**Solution Options**:
1. These functions might be inline in modal-handler.ts (not extracted yet)
2. They might be in a different file like project-creation.ts
3. We need to keep them inline in the modal feature module

**Decision**: Since these are NOT exported anywhere, we'll keep them as inline handlers in the modal feature modules (similar to button-handler pattern).

## Implementation Strategy

For modals refactoring:
1. Fix the 1 expedition import path
2. For project admin modals that don't exist as exports, keep handlers inline in feature/projects/modals.ts
3. All other 33 functions can be imported normally
