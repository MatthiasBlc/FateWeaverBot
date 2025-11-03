# Phase 4 - Consolidation Plan

**Date**: 2025-11-03
**Goal**: Split mega-files (6 files, 9,006 lines) into maintainable modules
**Estimated Time**: 16-24 hours
**Expected Token Savings**: ~400-500 tokens

---

## 🎯 Target Files

| File | Lines | Exports | Priority | Complexity |
|------|-------|---------|----------|------------|
| project-add.ts | 1,696 | 22 | HIGH | Multi-step workflow |
| new-element-admin.handlers.ts | 1,683 | 33 | HIGH | Multiple element types |
| element-object-admin.handlers.ts | 1,523 | 24 | MEDIUM | Object CRUD operations |
| projects.handlers.ts | 1,513 | 5 | MEDIUM | Large display functions |
| users.handlers.ts | 1,328 | 2 | LOW | 2 very large functions |
| chantiers.handlers.ts | 1,263 | 10 | MEDIUM | Command handlers |

**Total**: 9,006 lines across 96 exported functions

---

## 📋 Strategy by File

### 1. project-add.ts (1,696 lines) - **WORKFLOW SPLIT**

**Current Structure**: Monolithic workflow file with 22 step functions

**Analysis**:
- Clear linear workflow: Name → Craft Types → Output → Resources → Blueprint → Finalize
- Each function handles one step of project creation
- Heavy use of `projectCreationCache` for state management

**Proposed Split** (by workflow stage):

```
src/features/admin/projects-admin/
├── project-add/
│   ├── index.ts (re-exports for backward compatibility)
│   ├── step-1-init.ts (init + name handlers)
│   │   └── handleProjectAdminAddButton
│   │   └── handleProjectAdminAddStep1Modal
│   │   └── handleProjectAddOptionalName
│   │   └── handleProjectAddNameModal
│   ├── step-2-types.ts (craft types + output type)
│   │   └── handleProjectAddCraftTypesSelect
│   │   └── handleProjectAddOutputTypeSelect
│   │   └── handleProjectAddValidateSelection
│   ├── step-3-resources.ts (resource selection + costs)
│   │   └── handleProjectAddSelectResource
│   │   └── handleProjectAddObjectCategory
│   │   └── handleProjectAddSelectObject
│   │   └── handleProjectAddQuantityModal
│   │   └── handleProjectAddAddResource
│   │   └── handleProjectAddSelectCostResource
│   │   └── handleProjectAddResourceQuantityModal
│   │   └── handleProjectAddValidateCosts
│   ├── step-4-blueprint.ts (blueprint configuration)
│   │   └── handleProjectAddBlueprintNo
│   │   └── handleProjectAddBlueprintYes
│   │   └── handleProjectAddBlueprintPAModal
│   │   └── handleProjectAddAddBlueprintResource
│   │   └── handleProjectAddSelectBlueprintResource
│   │   └── handleProjectAddBlueprintResourceQuantityModal
│   └── step-5-finalize.ts (final creation)
│       └── handleProjectAddFinalize
```

**Benefits**:
- Each file represents one workflow stage (~250-400 lines each)
- Easy to understand flow
- Easier to test individual stages
- Shared utilities can be extracted to `utils.ts`

**Estimated Lines Per File**:
- step-1-init.ts: ~350 lines (4 functions)
- step-2-types.ts: ~400 lines (3 functions)
- step-3-resources.ts: ~550 lines (8 functions)
- step-4-blueprint.ts: ~350 lines (6 functions)
- step-5-finalize.ts: ~150 lines (1 function)
- index.ts: ~50 lines (re-exports)

**Token Savings**: ~150-200 tokens (selective loading of stages)

---

### 2. new-element-admin.handlers.ts (1,683 lines) - **ELEMENT TYPE SPLIT**

**Current Structure**: Single file handling 4 element types (Capabilities, Resources, Objects, Skills)

**Analysis**:
- 33 exported functions
- Functions grouped by element type
- Each element type has: modal submit, edit, delete handlers
- Plus emoji management functions

**Proposed Split** (by element type):

```
src/features/admin/elements/
├── index.ts (command handler + category selection)
├── capability-handlers.ts
│   └── handleCapabilityModalSubmit
│   └── handleNewCapabilityModal (if exists)
│   └── ... (capability-specific functions)
├── resource-handlers.ts
│   └── handleResourceModalSubmit
│   └── ... (resource-specific functions)
├── object-handlers.ts
│   └── handleObjectModalSubmit
│   └── handleObjectSkillBonusModalSubmit
│   └── handleObjectResourceConversionModalSubmit
│   └── ... (object-specific functions)
├── skill-handlers.ts
│   └── handleSkillModalSubmit
│   └── ... (skill-specific functions)
└── emoji-handlers.ts
    └── handleEmojiAddModal
    └── ... (emoji management)
```

**Estimated Lines Per File**:
- index.ts: ~150 lines (main command + routing)
- capability-handlers.ts: ~300 lines
- resource-handlers.ts: ~300 lines
- object-handlers.ts: ~500 lines
- skill-handlers.ts: ~300 lines
- emoji-handlers.ts: ~150 lines

**Token Savings**: ~120-150 tokens

---

### 3. element-object-admin.handlers.ts (1,523 lines) - **OPERATION SPLIT**

**Current Structure**: Object administration with edit/delete/bonus operations

**Analysis**:
- 24 exported functions
- Operations: Display, Edit, Delete, Skill Bonus, Resource Conversion, Category Management

**Proposed Split** (by operation type):

```
src/features/admin/elements/objects/
├── index.ts (main handlers + routing)
├── object-display.ts
│   └── Display and list functions
│   └── Category management
├── object-edit.ts
│   └── handleEditObjectButton
│   └── handleEditObjectModal
│   └── handleEditObjectNameModalSubmit
│   └── handleEditObjectDescriptionModalSubmit
├── object-bonus.ts
│   └── handleObjectSkillBonusButton
│   └── handleObjectSkillBonusModalSubmit
├── object-conversion.ts
│   └── handleObjectResourceConversionButton
│   └── handleObjectResourceConversionModalSubmit
└── object-delete.ts
    └── handleDeleteObjectButton
    └── handleDeleteObjectConfirm
```

**Estimated Lines Per File**:
- index.ts: ~200 lines
- object-display.ts: ~400 lines
- object-edit.ts: ~350 lines
- object-bonus.ts: ~250 lines
- object-conversion.ts: ~200 lines
- object-delete.ts: ~150 lines

**Token Savings**: ~100-120 tokens

---

### 4. projects.handlers.ts (1,513 lines) - **FEATURE SPLIT**

**Current Structure**: 5 large functions (average 300 lines each!)

**Analysis**:
- `/projets` command handler
- Participate button handler
- Blueprint participate handler
- Invest modal handler
- Various select handlers

**Functions**:
```
handleProjectsCommand - 400+ lines (display with filtering)
handleParticipateButton - 350+ lines (project selection)
handleBlueprintParticipateButton - 300+ lines (blueprint selection)
handleInvestModalSubmit - 250+ lines (investment logic)
+ select handlers
```

**Proposed Split** (by feature):

```
src/features/projects/
├── projects-display.ts
│   └── handleProjectsCommand
│   └── Display utilities
├── projects-participate.ts
│   └── handleParticipateButton
│   └── Selection logic
├── projects-blueprint.ts
│   └── handleBlueprintParticipateButton
│   └── Blueprint logic
├── projects-invest.ts
│   └── handleInvestModalSubmit
│   └── Investment calculations
└── projects-selects.ts
    └── All select menu handlers
```

**Estimated Lines Per File**:
- projects-display.ts: ~450 lines
- projects-participate.ts: ~400 lines
- projects-blueprint.ts: ~350 lines
- projects-invest.ts: ~300 lines
- projects-selects.ts: ~150 lines

**Token Savings**: ~80-100 tokens

---

### 5. users.handlers.ts (1,328 lines) - **DEFER**

**Analysis**:
- Only 2 exported functions but each is 600+ lines
- `handleProfileButtonInteraction`: massive switch statement
- `handleProfileCommand`: large display function

**Recommendation**: **DEFER** - Requires refactoring logic, not just file splitting

**Alternative**: Extract sub-functions first, then split
- Would need to refactor switch statement into strategy pattern
- Estimated 8-12 hours of work (out of scope for Phase 4)

---

### 6. chantiers.handlers.ts (1,263 lines) - **FEATURE SPLIT**

**Current Structure**: 10 functions for chantier operations

**Analysis**:
- Command handlers: `/chantiers`, `/chantiers-admin`
- Participate handlers
- Invest handlers
- Admin operations (add, delete)

**Proposed Split**:

```
src/features/chantiers/
├── chantiers-display.ts
│   └── handleChantiersCommand
├── chantiers-participate.ts
│   └── handleParticipateButton
│   └── handleChantierSelectResource
├── chantiers-invest.ts
│   └── handleInvestModalSubmit
└── chantiers-admin.ts
    └── handleChantiersAdminCommand
    └── handleAdminAddButton
    └── handleAdminDeleteButton
```

**Estimated Lines Per File**:
- chantiers-display.ts: ~350 lines
- chantiers-participate.ts: ~350 lines
- chantiers-invest.ts: ~250 lines
- chantiers-admin.ts: ~350 lines

**Token Savings**: ~60-80 tokens

---

## 📊 Summary

### Files to Split (Priority Order)

1. ✅ **project-add.ts** (1,696 lines → 5 files)
   - Clear workflow stages
   - High token savings
   - Moderate complexity

2. ✅ **new-element-admin.handlers.ts** (1,683 lines → 5 files)
   - Clear element type boundaries
   - Good token savings
   - Straightforward split

3. ✅ **element-object-admin.handlers.ts** (1,523 lines → 5 files)
   - Operation-based split
   - Medium token savings
   - Moderate complexity

4. ✅ **projects.handlers.ts** (1,513 lines → 5 files)
   - Feature-based split
   - Medium token savings
   - Large functions need careful handling

5. ⏸️ **users.handlers.ts** (1,328 lines) - **DEFER**
   - Needs logic refactoring first
   - Low priority (only 2 functions)

6. ✅ **chantiers.handlers.ts** (1,263 lines → 4 files)
   - Feature-based split
   - Medium token savings
   - Straightforward

### Expected Results

**Lines Impact**:
- Before: 9,006 lines in 6 files
- After: ~9,500 lines in ~30 files (includes index files and utilities)
- Net: +500 lines BUT much better organized

**Token Savings**:
- project-add: ~180 tokens
- new-element-admin: ~135 tokens
- element-object-admin: ~110 tokens
- projects.handlers: ~90 tokens
- chantiers.handlers: ~70 tokens
- **Total**: ~585 tokens (12-15% additional reduction)

**Maintainability**:
- Files reduced from 1,200-1,700 lines to 150-450 lines
- Average file size: ~300 lines (vs 1,500 currently)
- Clear separation of concerns
- Easier to navigate and understand

---

## 🚀 Implementation Order

### Week 1 (Priority files)

**Day 1-2**: project-add.ts
- Create directory structure
- Split into 5 workflow files
- Update imports/exports
- Test build

**Day 3**: new-element-admin.handlers.ts
- Split by element type
- Create 5 handler files
- Test build

### Week 2 (Medium priority)

**Day 4**: element-object-admin.handlers.ts
- Split by operation type
- Create 5 operation files
- Test build

**Day 5**: projects.handlers.ts
- Extract large functions
- Split by feature
- Test build

**Day 6**: chantiers.handlers.ts
- Split by feature
- Create 4 files
- Test build

### Week 3 (Polish)

**Day 7**: Testing & Documentation
- Integration testing
- Update documentation
- Final commit

---

## ✅ Success Criteria

- [ ] All builds passing
- [ ] No functionality regression
- [ ] Average file size < 500 lines
- [ ] Token savings > 500 tokens
- [ ] Clear file organization
- [ ] Documentation updated

---

## 📚 References

- Button handler refactoring (Phase 3.1) - Pattern to follow
- PHASE_3_RESULTS.md - Lessons learned
- Current codebase organization

---

**Next Step**: Start with project-add.ts (highest priority, clearest structure)
