                                                                                       │
│   ## Deprecated Methods in capability.service.ts                                       │
│                                                                                        │
│   ### 1. executeCouperDuBois() - Lines 282-295                                         │
│   ```typescript                                                                        │
│   /**                                                                                  │
│    * @deprecated Use executeCouperDuBoisV2 instead                                     │
│    */                                                                                  │
│   async executeCouperDuBois(characterId: string) {                                     │
│     const capability = await this.getCapabilityByName("Couper du bois");               │
│     if (!capability) throw new Error("Capability not found");                          │
│                                                                                        │
│     const result = await this.executeCouperDuBoisV2(characterId, capability.id);       │
│     return {                                                                           │
│       success: result.success,                                                         │
│       woodGained: result.loot?.["Bois"] || 0,                                          │
│       message: result.message,                                                         │
│       luckyRollUsed: result.metadata?.bonusApplied?.includes('LUCKY_ROLL'),            │
│     };                                                                                 │
│   }                                                                                    │
│   ```                                                                                  │
│                                                                                        │
│   ### 2. executeMiner() - Lines 298-312                                                │
│   ```typescript                                                                        │
│   /**                                                                                  │
│    * @deprecated Use executeMinerV2 instead                                            │
│    */                                                                                  │
│   async executeMiner(characterId: string) {                                            │
│     const capability = await this.getCapabilityByName("Miner");                        │
│     if (!capability) throw new Error("Capability not found");                          │
│                                                                                        │
│     const result = await this.executeMinerV2(characterId, capability.id);              │
│     return {                                                                           │
│       success: result.success,                                                         │
│       oreGained: result.loot?.["Minerai"] || 0,                                        │
│       message: result.message,                                                         │
│       publicMessage: result.publicMessage || "",                                       │
│       loot: result.loot,                                                               │
│     };                                                                                 │
│   }                                                                                    │
│   ```                                                                                  │
│                                                                                        │
│   ### 3. executeFish() - Lines 315-329                                                 │
│   ```typescript                                                                        │
│   /**                                                                                  │
│    * @deprecated Use executePecherV2 instead                                           │
│    */                                                                                  │
│   async executeFish(characterId: string, paSpent: 1 | 2) {                             │
│     const capability = await this.getCapabilityByName("Pêcher");                       │
│     if (!capability) throw new Error("Capability not found");                          │
│                                                                                        │
│     const result = await this.executePecherV2(characterId, capability.id, paSpent);    │
│     return {                                                                           │
│       success: result.success,                                                         │
│       loot: result.loot,                                                               │
│       message: result.message,                                                         │
│       objectFound: result.metadata?.objectFound,                                       │
│       luckyRollUsed: result.metadata?.bonusApplied?.includes('LUCKY_ROLL'),            │
│     };                                                                                 │
│   }                                                                                    │
│   ```                                                                                  │
│                                                                                        │
│   ### 4. executeSoigner() - Lines 332-348 (DEAD CODE - NOT CALLED)                     │
│   ```typescript                                                                        │
│   /**                                                                                  │
│    * @deprecated Use executeSoignerV2 instead                                          │
│    */                                                                                  │
│   async executeSoigner(                                                                │
│     characterId: string,                                                               │
│     mode: "heal" | "craft",                                                            │
│     targetCharacterId?: string                                                         │
│   ) {                                                                                  │
│     const capability = await this.getCapabilityByName("Soigner");                      │
│     if (!capability) throw new Error("Capability not found");                          │
│                                                                                        │
│     const result = await this.executeSoignerV2(characterId, capability.id, mode,       │
│   targetCharacterId);                                                                  │
│     return {                                                                           │
│       success: result.success,                                                         │
│       message: result.message,                                                         │
│       publicMessage: result.publicMessage,                                             │
│     };                                                                                 │
│   }                                                                                    │
│   ```                                                                                  │
│   **STATUS**: Not called anywhere - the controller at line 217 uses                    │
│   `characterCapabilityService` instead                                                 │
│                                                                                        │
│   ### 5. executeResearch() - Lines 351-377                                             │
│   ```typescript                                                                        │
│   /**                                                                                  │
│    * @deprecated Use executeCartographierV2, executeRechercherV2, or                   │
│   executeAuspiceV2 instead                                                             │
│    */                                                                                  │
│   async executeResearch(                                                               │
│     characterId: string,                                                               │
│     researchType: "rechercher" | "cartographier" | "auspice",                          │
│     paSpent: 1 | 2                                                                     │
│   ) {                                                                                  │
│     const capability = await this.getCapabilityByName(                                 │
│       researchType === "rechercher" ? "Rechercher" :                                   │
│       researchType === "cartographier" ? "Cartographier" : "Auspice"                   │
│     );                                                                                 │
│     if (!capability) throw new Error("Capability not found");                          │
│                                                                                        │
│     let result: CapabilityExecutionResult;                                             │
│     if (researchType === "rechercher") {                                               │
│       result = await this.executeRechercherV2(characterId, capability.id, paSpent);    │
│     } else if (researchType === "cartographier") {                                     │
│       result = await this.executeCartographierV2(characterId, capability.id,           │
│   paSpent);                                                                            │
│     } else {                                                                           │
│       result = await this.executeAuspiceV2(characterId, capability.id, paSpent);       │
│     }                                                                                  │
│                                                                                        │
│     return {                                                                           │
│       success: result.success,                                                         │
│       message: result.message,                                                         │
│     };                                                                                 │
│   }                                                                                    │
│   ```                                                                                  │
│                                                                                        │
│   ### 6. executeCraft() - Lines 380-390 (CRITICAL - BROKEN)                            │
│   ```typescript                                                                        │
│   /**                                                                                  │
│    * @deprecated Craft functionality needs to be refactored                            │
│    * Placeholder for now - will be implemented when craft system is redesigned         │
│    */                                                                                  │
│   async executeCraft(                                                                  │
│     characterId: string,                                                               │
│     craftType: string,                                                                 │
│     inputAmount: number,                                                               │
│     paSpent: 1 | 2                                                                     │
│   ) {                                                                                  │
│     throw new Error("executeCraft is deprecated and needs to be refactored with the    │
│   new project system");                                                                │
│   }                                                                                    │
│   ```                                                                                  │
│   **STATUS**: ENDPOINT WILL FAIL - only throws error                                   │
│                                                                                        │
│   ### 7. executeHarvestCapacity() - Lines 256-274 (LEGACY)                             │
│   ```typescript                                                                        │
│   /**                                                                                  │
│    * Exécute la capacité Harvest (utilisée par le controller)                          │
│    */                                                                                  │
│   async executeHarvestCapacity(                                                        │
│     characterId: string,                                                               │
│     capabilityName: string,                                                            │
│     isSummer: boolean                                                                  │
│   ): Promise<CapabilityExecutionResult> {                                              │
│     // Récupérer l'ID de la capacité                                                   │
│     const capability = await this.getCapabilityByName(capabilityName);                 │
│     if (!capability) {                                                                 │
│       throw new Error(`Capability ${capabilityName} not found`);                       │
│     }                                                                                  │
│                                                                                        │
│     if (capabilityName === "Chasser") {                                                │
│       return this.executeChasser(characterId, capability.id, isSummer);                │
│     } else if (capabilityName === "Cueillir") {                                        │
│       return this.executeCueillir(characterId, capability.id, isSummer);               │
│     } else {                                                                           │
│       throw new Error(`Unknown harvest capability: ${capabilityName}`);                │
│     }                                                                                  │
│   }                                                                                    │
│   ```                                                                                  │
│   **STATUS**: Not marked deprecated but is legacy - bypasses                           │
│   CharacterCapabilityService PA handling                                               │
│                                                                                        │
│   ---                                                                                  │
│                                                                                        │
│   ## Deprecated Controllers Using Old System                                           │
│                                                                                        │
│   ### executeCouperDuBois Controller - Lines 67-91                                     │
│   ```typescript                                                                        │
│   export const executeCouperDuBois: RequestHandler = async (req, res, next) => {       │
│     try {                                                                              │
│       const { characterId } = req.params;                                              │
│       if (!characterId) {                                                              │
│         throw new BadRequestError("characterId requis");                               │
│       }                                                                                │
│                                                                                        │
│       const result = await                                                             │
│   container.capabilityService.executeCouperDuBois(characterId);                        │
│       res.status(200).json(result);                                                    │
│     } catch (error) {                                                                  │
│       // error handling...                                                             │
│     }                                                                                  │
│   };                                                                                   │
│   ```                                                                                  │
│   **ISSUE**: Calls deprecated `executeCouperDuBois()` instead of using                 │
│   CharacterCapabilityService                                                           │
│                                                                                        │
│   ### executeSoigner Controller - Lines 199-251 (CORRECT)                              │
│   ```typescript                                                                        │
│   export const executeSoigner: RequestHandler = async (req, res, next) => {            │
│     try {                                                                              │
│       const { characterId } = req.params;                                              │
│       const { mode, targetCharacterId } = req.body;                                    │
│                                                                                        │
│       // ... validation ...                                                            │
│                                                                                        │
│       // Utiliser le nouveau système avec gestion des PA et effects                    │
│       const characterCapabilityService = container.characterCapabilityService;         │
│       const paToUse = mode === "craft" ? 2 : 1;                                        │
│       const result = await characterCapabilityService.useCharacterCapability(          │
│         characterId,                                                                   │
│         "Soigner",                                                                     │
│         false, // isSummer                                                             │
│         paToUse,                                                                       │
│         targetCharacterId as any // Pass target ID as inputQuantity for now (for       │
│   heal mode)                                                                           │
│       );                                                                               │
│                                                                                        │
│       res.status(200).json({                                                           │
│         success: result.success,                                                       │
│         message: result.message,                                                       │
│         publicMessage: result.publicMessage,                                           │
│         updatedCharacter: result.updatedCharacter,                                     │
│       });                                                                              │
│     } catch (error) {                                                                  │
│       // error handling...                                                             │
│     }                                                                                  │
│   };                                                                                   │
│   ```                                                                                  │
│   **STATUS**: This is the CORRECT pattern - uses CharacterCapabilityService            │
│                                                                                        │
│   ### executeCraft Controller - Lines 150-197 (BROKEN)                                 │
│   ```typescript                                                                        │
│   export const executeCraft: RequestHandler = async (req, res, next) => {              │
│     try {                                                                              │
│       const { characterId } = req.params;                                              │
│       const { craftType, inputAmount, paSpent } = req.body;                            │
│                                                                                        │
│       // ... validation ...                                                            │
│                                                                                        │
│       const result = await container.capabilityService.executeCraft(                   │
│         characterId,                                                                   │
│         craftType,                                                                     │
│         inputAmount,                                                                   │
│         paSpent                                                                        │
│       );                                                                               │
│                                                                                        │
│       res.status(200).json(result);                                                    │
│     } catch (error) {                                                                  │
│       // error handling...                                                             │
│     }                                                                                  │
│   };                                                                                   │
│   ```                                                                                  │
│   **ISSUE**: Calls `executeCraft()` which throws an error - endpoint is broken         │
│                                                                                        │
│   ---                                                                                  │
│                                                                                        │
│   ## Correct vs Incorrect Patterns                                                     │
│                                                                                        │
│   ### INCORRECT PATTERN (Bypasses PA handling)                                         │
│   ```typescript                                                                        │
│   // What current code does:                                                           │
│   const result = await container.capabilityService.executeCouperDuBois(characterId);   │
│   // Returns: { success, woodGained, message, luckyRollUsed }                          │
│   // Problem: No PA deduction, no effects, custom format                               │
│                                                                                        │
│   // Problems:                                                                         │
│   // 1. No PA deduction from character                                                 │
│   // 2. No effects processing                                                          │
│   // 3. Inconsistent response format                                                   │
│   // 4. Calls deprecated method                                                        │
│   ```                                                                                  │
│                                                                                        │
│   ### CORRECT PATTERN (Uses CharacterCapabilityService)                                │
│   ```typescript                                                                        │
│   // What new code should do:                                                          │
│   const result = await characterCapabilityService.useCharacterCapability(              │
│     characterId,                                                                       │
│     "Couper du bois",                                                                  │
│     false, // isSummer                                                                 │
│     1,     // paToUse (optional)                                                       │
│     0      // inputQuantity (optional)                                                 │
│   );                                                                                   │
│   // Returns: { success, message, publicMessage, loot, effects, updatedCharacter,      │
│   paUsed }                                                                             │
│   // Benefits:                                                                         │
│   // 1. Automatic PA deduction (line 255 in service)                                   │
│   // 2. Effects processing (lines 380-400)                                             │
│   // 3. Resource stock updates (lines 279-325)                                         │
│   // 4. Consistent response format                                                     │
│   ```                                                                                  │
│                                                                                        │
│   ---                                                                                  │
│                                                                                        │
│   ## Summary Table                                                                     │
│                                                                                        │
│   | Method | Location | Status | Called By | Should Do |                               │
│   |--------|----------|--------|-----------|-----------|                               │
│   | executeCouperDuBois() | 282-295 | Deprecated | capabilities.ts:75 | Remove |       │
│   | executeMiner() | 298-312 | Deprecated | capabilities.ts:101 | Remove |             │
│   | executeFish() | 315-329 | Deprecated | capabilities.ts:132 | Remove |              │
│   | executeSoigner() | 332-348 | Deprecated | NONE | Remove (dead code) |              │
│   | executeResearch() | 351-377 | Deprecated | capabilities.ts:279 | Remove |          │
│   | executeCraft() | 380-390 | Deprecated | capabilities.ts:171 | Implement or         │
│   remove |                                                                             │
│   | executeHarvestCapacity() | 256-274 | Legacy | capabilities.ts:348 | Refactor or    │
│   remove |                                                                             │
│   | executeCouperDuBois handler | 67-91 | Wrong | routes.ts:42 | Migrate to            │
│   CharacterCapabilityService |                                                         │
│   | executeMiner handler | 93-117 | Wrong | routes.ts:43 | Migrate to                  │
│   CharacterCapabilityService |                                                         │
│   | executeFish handler | 119-148 | Wrong | routes.ts:44 | Migrate to                  │
│   CharacterCapabilityService |                                                         │
│   | executeCraft handler | 150-197 | Broken | routes.ts:46 | Fix or remove |           │
│   | executeSoigner handler | 199-251 | Correct | routes.ts:47 | Keep as example |      │
│   | executeResearch handler | 253-299 | Wrong | routes.ts:48 | Migrate to              │
│   CharacterCapabilityService |                                                         │
│   | executeDivertir handler | 301-331 | Wrong | routes.ts:49 | Migrate to              │
│   CharacterCapabilityService |                                                         │
│   | executeHarvest handler | 333-368 | Wrong | routes.ts:45 | Migrate to               │
│   CharacterCapabilityService |                                                         │
│                                                                                        │
│   EOF                                                                                  │
│   cat /tmp/code_snippets.md                                                            │
│                                                                                        │
│   Run shell command                                                                    │
│                                                                                        │
│ Hook PreToolUse:Bash requires confirmation for this command:                           │
│ ⚠️  Potentially dangerous command detected!                                            │
│                                                                                        │
│ Command: cat > /tmp/code_snippets.md << 'EOF'                                          │
│ # Deprecated Code - Code Snippets Reference                                            │
│                                                                                        │
│ ## Deprecated Methods in capability.service.ts                                         │
│                                                                                        │
│ ### 1. executeCouperDuBois() - Lines 282-295                                           │
│ ```typescript                                                                          │
│ /**                                                                                    │
│  * @deprecated Use executeCouperDuBoisV2 instead                                       │
│  */                                                                                    │
│ async executeCouperDuBois(characterId: string) {                                       │
│   const capability = await this.getCapabilityByName("Couper du bois");                 │
│   if (!capability) throw new Error("Capability not found");                            │
│                                                                                        │
│   const result = await this.executeCouperDuBoisV2(characterId, capability.id);         │
│   return {                                                                             │
│     success: result.success,                                                           │
│     woodGained: result.loot?.["Bois"] || 0,                                            │
│     message: result.message,                                                           │
│     luckyRollUsed: result.metadata?.bonusApplied?.includes('LUCKY_ROLL'),              │
│   };                                                                                   │
│ }                                                                                      │
│ ```                                                                                    │
│                                                                                        │
│ ### 2. executeMiner() - Lines 298-312                                                  │
│ ```typescript                                                                          │
│ /**                                                                                    │
│  * @deprecated Use executeMinerV2 instead                                              │
│  */                                                                                    │
│ async executeMiner(characterId: string) {                                              │
│   const capability = await this.getCapabilityByName("Miner");                          │
│   if (!capability) throw new Error("Capability not found");                            │
│                                                                                        │
│   const result = await this.executeMinerV2(characterId, capability.id);                │
│   return {                                                                             │
│     success: result.success,                                                           │
│     oreGained: result.loot?.["Minerai"] || 0,                                          │
│     message: result.message,                                                           │
│     publicMessage: result.publicMessage || "",                                         │
│     loot: result.loot,                                                                 │
│   };                                                                                   │
│ }                                                                                      │
│ ```                                                                                    │
│                                                                                        │
│ ### 3. executeFish() - Lines 315-329                                                   │
│ ```typescript                                                                          │
│ /**                                                                                    │
│  * @deprecated Use executePecherV2 instead                                             │
│  */                                                                                    │
│ async executeFish(characterId: string, paSpent: 1 | 2) {                               │
│   const capability = await this.getCapabilityByName("Pêcher");                         │
│   if (!capability) throw new Error("Capability not found");                            │
│                                                                                        │
│   const result = await this.executePecherV2(characterId, capability.id, paSpent);      │
│   return {                                                                             │
│     success: result.success,                                                           │
│     loot: result.loot,                                                                 │
│     message: result.message,                                                           │
│     objectFound: result.metadata?.objectFound,                                         │
│     luckyRollUsed: result.metadata?.bonusApplied?.includes('LUCKY_ROLL'),              │
│   };                                                                                   │
│ }                                                                                      │
│ ```                                                                                    │
│                                                                                        │
│ ### 4. executeSoigner() - Lines 332-348 (DEAD CODE - NOT CALLED)                       │
│ ```typescript                                                                          │
│ /**                                                                                    │
│  * @deprecated Use executeSoignerV2 instead                                            │
│  */                                                                                    │
│ async executeSoigner(                                                                  │
│   characterId: string,                                                                 │
│   mode: "heal" | "craft",                                                              │
│   targetCharacterId?: string                                                           │
│ ) {                                                                                    │
│   const capability = await this.getCapabilityByName("Soigner");                        │
│   if (!capability) throw new Error("Capability not found");                            │
│                                                                                        │
│   const result = await this.executeSoignerV2(characterId, capability.id, mode,         │
│ targetCharacterId);                                                                    │
│   return {                                                                             │
│     success: result.success,                                                           │
│     message: result.message,                                                           │
│     publicMessage: result.publicMessage,                                               │
│   };                                                                                   │
│ }                                                                                      │
│ ```                                                                                    │
│ **STATUS**: Not called anywhere - the controller at line 217 uses                      │
│ `characterCapabilityService` instead                                                   │
│                                                                                        │
│ ### 5. executeResearch() - Lines 351-377                                               │
│ ```typescript                                                                          │
│ /**                                                                                    │
│  * @deprecated Use executeCartographierV2, executeRechercherV2, or executeAuspiceV2    │
│ instead                                                                                │
│  */                                                                                    │
│ async executeResearch(                                                                 │
│   characterId: string,                                                                 │
│   researchType: "rechercher" | "cartographier" | "auspice",                            │
│   paSpent: 1 | 2                                                                       │
│ ) {                                                                                    │
│   const capability = await this.getCapabilityByName(                                   │
│     researchType === "rechercher" ? "Rechercher" :                                     │
│     researchType === "cartographier" ? "Cartographier" : "Auspice"                     │
│   );                                                                                   │
│   if (!capability) throw new Error("Capability not found");                            │
│                                                                                        │
│   let result: CapabilityExecutionResult;                                               │
│   if (researchType === "rechercher") {                                                 │
│     result = await this.executeRechercherV2(characterId, capability.id, paSpent);      │
│   } else if (researchType === "cartographier") {                                       │
│     result = await this.executeCartographierV2(characterId, capability.id, paSpent);   │
│   } else {                                                                             │
│     result = await this.executeAuspiceV2(characterId, capability.id, paSpent);         │
│   }                                                                                    │
│                                                                                        │
│   return {                                                                             │
│     success: result.success,                                                           │
│     message: result.message,                                                           │
│   };                                                                                   │
│ }                                                                                      │
│ ```                                                                                    │
│                                                                                        │
│ ### 6. executeCraft() - Lines 380-390 (CRITICAL - BROKEN)                              │
│ ```typescript                                                                          │
│ /**                                                                                    │
│  * @deprecated Craft functionality needs to be refactored                              │
│  * Placeholder for now - will be implemented when craft system is redesigned           │
│  */                                                                                    │
│ async executeCraft(                                                                    │
│   characterId: string,                                                                 │
│   craftType: string,                                                                   │
│   inputAmount: number,                                                                 │
│   paSpent: 1 | 2                                                                       │
│ ) {                                                                                    │
│   throw new Error("executeCraft is deprecated and needs to be refactored with the new  │
│ project system");                                                                      │
│ }                                                                                      │
│ ```                                                                                    │
│ **STATUS**: ENDPOINT WILL FAIL - only throws error                                     │
│                                                                                        │
│ ### 7. executeHarvestCapacity() - Lines 256-274 (LEGACY)                               │
│ ```typescript                                                                          │
│ /**                                                                                    │
│  * Exécute la capacité Harvest (utilisée par le controller)                            │
│  */                                                                                    │
│ async executeHarvestCapacity(                                                          │
│   characterId: string,                                                                 │
│   capabilityName: string,                                                              │
│   isSummer: boolean                                                                    │
│ ): Promise<CapabilityExecutionResult> {                                                │
│   // Récupérer l'ID de la capacité                                                     │
│   const capability = await this.getCapabilityByName(capabilityName);                   │
│   if (!capability) {                                                                   │
│     throw new Error(`Capability ${capabilityName} not found`);                         │
│   }                                                                                    │
│                                                                                        │
│   if (capabilityName === "Chasser") {                                                  │
│     return this.executeChasser(characterId, capability.id, isSummer);                  │
│   } else if (capabilityName === "Cueillir") {                                          │
│     return this.executeCueillir(characterId, capability.id, isSummer);                 │
│   } else {                                                                             │
│     throw new Error(`Unknown harvest capability: ${capabilityName}`);                  │
│   }                                                                                    │
│ }                                                                                      │
│ ```                                                                                    │
│ **STATUS**: Not marked deprecated but is legacy - bypasses CharacterCapabilityService  │
│ PA handling                                                                            │
│                                                                                        │
│ ---                                                                                    │
│                                                                                        │
│ ## Deprecated Controllers Using Old System                                             │
│                                                                                        │
│ ### executeCouperDuBois Controller - Lines 67-91                                       │
│ ```typescript                                                                          │
│ export const executeCouperDuBois: RequestHandler = async (req, res, next) => {         │
│   try {                                                                                │
│     const { characterId } = req.params;                                                │
│     if (!characterId) {                                                                │
│       throw new BadRequestError("characterId requis");                                 │
│     }                                                                                  │
│                                                                                        │
│     const result = await container.capabilityService.executeCouperDuBois(characterId); │
│     res.status(200).json(result);                                                      │
│   } catch (error) {                                                                    │
│     // error handling...                                                               │
│   }                                                                                    │
│ };                                                                                     │
│ ```                                                                                    │
│ **ISSUE**: Calls deprecated `executeCouperDuBois()` instead of using                   │
│ CharacterCapabilityService                                                             │
│                                                                                        │
│ ### executeSoigner Controller - Lines 199-251 (CORRECT)                                │
│ ```typescript                                                                          │
│ export const executeSoigner: RequestHandler = async (req, res, next) => {              │
│   try {                                                                                │
│     const { characterId } = req.params;                                                │
│     const { mode, targetCharacterId } = req.body;                                      │
│                                                                                        │
│     // ... validation ...                                                              │
│                                                                                        │
│     // Utiliser le nouveau système avec gestion des PA et effects                      │
│     const characterCapabilityService = container.characterCapabilityService;           │
│     const paToUse = mode === "craft" ? 2 : 1;                                          │
│     const result = await characterCapabilityService.useCharacterCapability(            │
│       characterId,                                                                     │
│       "Soigner",                                                                       │
│       false, // isSummer                                                               │
│       paToUse,                                                                         │
│       targetCharacterId as any // Pass target ID as inputQuantity for now (for heal    │
│ mode)                                                                                  │
│     );                                                                                 │
│                                                                                        │
│     res.status(200).json({                                                             │
│       success: result.success,                                                         │
│       message: result.message,                                                         │
│       publicMessage: result.publicMessage,                                             │
│       updatedCharacter: result.updatedCharacter,                                       │
│     });                                                                                │
│   } catch (error) {                                                                    │
│     // error handling...                                                               │
│   }                                                                                    │
│ };                                                                                     │
│ ```                                                                                    │
│ **STATUS**: This is the CORRECT pattern - uses CharacterCapabilityService              │
│                                                                                        │
│ ### executeCraft Controller - Lines 150-197 (BROKEN)                                   │
│ ```typescript                                                                          │
│ export const executeCraft: RequestHandler = async (req, res, next) => {                │
│   try {                                                                                │
│     const { characterId } = req.params;                                                │
│     const { craftType, inputAmount, paSpent } = req.body;                              │
│                                                                                        │
│     // ... validation ...                                                              │
│                                                                                        │
│     const result = await container.capabilityService.executeCraft(                     │
│       characterId,                                                                     │
│       craftType,                                                                       │
│       inputAmount,                                                                     │
│       paSpent                                                                          │
│     );                                                                                 │
│                                                                                        │
│     res.status(200).json(result);                                                      │
│   } catch (error) {                                                                    │
│     // error handling...                                                               │
│   }                                                                                    │
│ };                                                                                     │
│ ```                                                                                    │
│ **ISSUE**: Calls `executeCraft()` which throws an error - endpoint is broken           │
│                                                                                        │
│ ---                                                                                    │
│                                                                                        │
│ ## Correct vs Incorrect Patterns                                                       │
│                                                                                        │
│ ### INCORRECT PATTERN (Bypasses PA handling)                                           │
│ ```typescript                                                                          │
│ // What current code does:                                                             │
│ const result = await container.capabilityService.executeCouperDuBois(characterId);     │
│ // Returns: { success, woodGained, message, luckyRollUsed }                            │
│ // Problem: No PA deduction, no effects, custom format                                 │
│                                                                                        │
│ // Problems:                                                                           │
│ // 1. No PA deduction from character                                                   │
│ // 2. No effects processing                                                            │
│ // 3. Inconsistent response format                                                     │
│ // 4. Calls deprecated method                                                          │
│ ```                                                                                    │
│                                                                                        │
│ ### CORRECT PATTERN (Uses CharacterCapabilityService)                                  │
│ ```typescript                                                                          │
│ // What new code should do:                                                            │
│ const result = await characterCapabilityService.useCharacterCapability(                │
│   characterId,                                                                         │
│   "Couper du bois",                                                                    │
│   false, // isSummer                                                                   │
│   1,     // paToUse (optional)                                                         │
│   0      // inputQuantity (optional)                                                   │
│ );                                                                                     │
│ // Returns: { success, message, publicMessage, loot, effects, updatedCharacter, paUsed │
│  }                                                                                     │
│ // Benefits:                                                                           │
│ // 1. Automatic PA deduction (line 255 in service)                                     │
│ // 2. Effects processing (lines 380-400)                                               │
│ // 3. Resource stock updates (lines 279-325)                                           │
│ // 4. Consistent response format                                                       │
│ ```                                                                                    │
│                                                                                        │
│ ---                                                                                    │
│                                                                                        │
│ ## Summary Table                                                                       │
│                                                                                        │
│ | Method | Location | Status | Called By | Should Do |                                 │
│ |--------|----------|--------|-----------|-----------|                                 │
│ | executeCouperDuBois() | 282-295 | Deprecated | capabilities.ts:75 | Remove |         │
│ | executeMiner() | 298-312 | Deprecated | capabilities.ts:101 | Remove |               │
│ | executeFish() | 315-329 | Deprecated | capabilities.ts:132 | Remove |                │
│ | executeSoigner() | 332-348 | Deprecated | NONE | Remove (dead code) |                │
│ | executeResearch() | 351-377 | Deprecated | capabilities.ts:279 | Remove |            │
│ | executeCraft() | 380-390 | Deprecated | capabilities.ts:171 | Implement or remove |  │
│ | executeHarvestCapacity() | 256-274 | Legacy | capabilities.ts:348 | Refactor or      │
│ remove |                                                                               │
│ | executeCouperDuBois handler | 67-91 | Wrong | routes.ts:42 | Migrate to              │
│ CharacterCapabilityService |                                                           │
│ | executeMiner handler | 93-117 | Wrong | routes.ts:43 | Migrate to                    │
│ CharacterCapabilityService |                                                           │
│ | executeFish handler | 119-148 | Wrong | routes.ts:44 | Migrate to                    │
│ CharacterCapabilityService |                                                           │
│ | executeCraft handler | 150-197 | Broken | routes.ts:46 | Fix or remove |             │
│ | executeSoigner handler | 199-251 | Correct | routes.ts:47 | Keep as example |        │
│ | executeResearch handler | 253-299 | Wrong | routes.ts:48 | Migrate to                │
│ CharacterCapabilityService |                                                           │
│ | executeDivertir handler | 301-331 | Wrong | routes.ts:49 | Migrate to                │
│ CharacterCapabilityService |                                                           │
│ | executeHarvest handler | 333-368 | Wrong | routes.ts:45 | Migrate to                 │
│ CharacterCapabilityService |                                                           │
│                                                                                        │
│ EOF                                                                                    │
│ cat /tmp/code_snippets.md                                                              │
│                                                                                        │
│ Violations: Chained command violation: }                                               │
│ ```                                                                                    │
│                                                                                        │
│ ### 3. executeFish() - Lines 315-329                                                   │
│ ```typescript                                                                          │
│ /**                                                                                    │
│  * @deprecated Use executePecherV2 instead                                             │
│  */                                                                                    │
│ async executeFish(characterId: string, paSpent: 1 | 2) {                               │
│   const capability = await this.getCapabilityByName("Pêcher") - Binary or encoded      │
│ content detected, Chained command violation: }                                         │
│ ```                                                                                    │
│ **STATUS**: ENDPOINT WILL FAIL - only throws error                                     │
│                                                                                        │
│ ### 7. executeHarvestCapacity() - Lines 256-274 (LEGACY)                               │
│ ```typescript                                                                          │
│ /**                                                                                    │
│  * Exécute la capacité Harvest (utilisée par le controller)                            │
│  */                                                                                    │
│ async executeHarvestCapacity(                                                          │
│   characterId: string,                                                                 │
│   capabilityName: string,                                                              │
│   isSummer: boolean                                                                    │
│ ): Promise<CapabilityExecutionResult> {                                                │
│   // Récupérer l'ID de la capacité                                                     │
│   const capability = await this.getCapabilityByName(capabilityName);                   │
│   if (!capability) {                                                                   │
│     throw new Error(`Capability ${capabilityName} not found`);                         │
│   }                                                                                    │
│                                                                                        │
│   if (capabilityName === "Chasser") {                                                  │
│     return this.executeChasser(characterId, capability.id, isSummer);                  │
│   } else if (capabilityName === "Cueillir") {                                          │
│     return this.executeCueillir(characterId, capability.id, isSummer);                 │
│   } else {                                                                             │
│     throw new Error(`Unknown harvest capability: ${capabilityName}`);                  │
│   }                                                                                    │
│ }                                                                                      │
│ ```                                                                                    │
│ **STATUS**: Not marked deprecated but is legacy - bypasses CharacterCapabilityService  │
│ PA handling                                                                            │
│                                                                                        │
│ ---                                                                                    │
│                                                                                        │
│ ## Deprecated Controllers Using Old System                                             │
│                                                                                        │
│ ### executeCouperDuBois Controller - Lines 67-91                                       │
│ ```typescript                                                                          │
│ export const executeCouperDuBois: RequestHandler = async (req, res, next) => {         │
│   try {                                                                                │
│     const { characterId } = req.params;                                                │
│     if (!characterId) {                                                                │
│       throw new BadRequestError("characterId requis");                                 │
│     }                                                                                  │
│                                                                                        │
│     const result = await container.capabilityService.executeCouperDuBois(characterId); │
│     res.status(200).json(result);                                                      │
│   } catch (error) {                                                                    │
│     // error handling...                                                               │
│   }                                                                                    │
│ };                                                                                     │
│ ```                                                                                    │
│ **ISSUE**: Calls deprecated `executeCouperDuBois()` instead of using                   │
│ CharacterCapabilityService                                                             │
│                                                                                        │
│ ### executeSoigner Controller - Lines 199-251 (CORRECT)                                │
│ ```typescript                                                                          │
│ export const executeSoigner: RequestHandler = async (req, res, next) => {              │
│   try {                                                                                │
│     const { characterId } = req.params;                                                │
│     const { mode, targetCharacterId } = req.body;                                      │
│                                                                                        │
│     // ... validation ...                                                              │
│                                                                                        │
│     // Utiliser le nouveau système avec gestion des PA et effects                      │
│     const characterCapabilityService = container.characterCapabilityService;           │
│     const paToUse = mode === "craft" ? 2 : 1;                                          │
│     const result = await characterCapabilityService.useCharacterCapability(            │
│       characterId,                                                                     │
│       "Soigner",                                                                       │
│       false, // isSummer                                                               │
│       paToUse,                                                                         │
│       targetCharacterId as any // Pass target ID as inputQuantity for now (for heal    │
│ mode)                                                                                  │
│     );                                                                                 │
│                                                                                        │
│     res.status(200).json({                                                             │
│       success: result.success,                                                         │
│       message: result.message,                                                         │
│       publicMessage: result.publicMessage,                                             │
│       updatedCharacter: result.updatedCharacter,                                       │
│     });                                                                                │
│   } catch (error) {                                                                    │
│     // error handling...                                                               │
│   }                                                                                    │
│ };                                                                                     │
│ ```                                                                                    │
│ **STATUS**: This is the CORRECT pattern - uses CharacterCapabilityService              │
│                                                                                        │
│ ### executeCraft Controller - Lines 150-197 (BROKEN)                                   │
│ ```typescript                                                                          │
│ export const executeCraft: RequestHandler = async (req, res, next) => {                │
│   try {                                                                                │
│     const { characterId } = req.params;                                                │
│     const { craftType, inputAmount, paSpent } = req.body;                              │
│                                                                                        │
│     // ... validation ...                                                              │
│                                                                                        │
│     const result = await container.capabilityService.executeCraft(                     │
│       characterId,                                                                     │
│       craftType,                                                                       │
│       inputAmount,                                                                     │
│       paSpent                                                                          │
│     );                                                                                 │
│                                                                                        │
│     res.status(200).json(result);                                                      │
│   } catch (error) {                                                                    │
│     // error handling...                                                               │
│   }                                                                                    │
│ };                                                                                     │
│ ```                                                                                    │
│ **ISSUE**: Calls `executeCraft()` which throws an error - endpoint is broken           │
│                                                                                        │
│ ---                                                                                    │
│                                                                                        │
│ ## Correct vs Incorrect Patterns                                                       │
│                                                                                        │
│ ### INCORRECT PATTERN (Bypasses PA handling)                                           │
│ ```typescript                                                                          │
│ // What current code does:                                                             │
│ const result = await container.capabilityService.executeCouperDuBois(characterId);     │
│ // Returns: { success, woodGained, message, luckyRollUsed }                            │
│ // Problem: No PA deduction, no effects, custom format                                 │
│                                                                                        │
│ // Problems:                                                                           │
│ // 1. No PA deduction from character                                                   │
│ // 2. No effects processing                                                            │
│ // 3. Inconsistent response format                                                     │
│ // 4. Calls deprecated method                                                          │
│ ```                                                                                    │
│                                                                                        │
│ ### CORRECT PATTERN (Uses CharacterCapabilityService)                                  │
│ ```typescript                                                                          │
│ // What new code should do:                                                            │
│ const result = await characterCapabilityService.useCharacterCapability(                │
│   characterId,                                                                         │
│   "Couper du bois",                                                                    │
│   false, // isSummer                                                                   │
│   1,     // paToUse (optional)                                                         │
│   0      // inputQuantity (optional)                                                   │
│ );                                                                                     │
│ // Returns: { success, message, publicMessage, loot, effects, updatedCharacter, paUsed │
│  }                                                                                     │
│ // Benefits:                                                                           │
│ // 1. Automatic PA deduction (line 255 in service)                                     │
│ // 2. Effects processing (lines 380-400)                                               │
│ // 3. Resource stock updates (lines 279-325)                                           │
│ // 4. Consistent response format                                                       │
│ ```                                                                                    │
│                                                                                        │
│ ---                                                                                    │
│                                                                                        │
│ ## Summary Table                                                                       │
│                                                                                        │
│ | Method | Location | Status | Called By | Should Do |                                 │
│ |--------|----------|--------|-----------|-----------|                                 │
│ | executeCouperDuBois() | 282-295 | Deprecated | capabilities.ts:75 | Remove |         │
│ | executeMiner() | 298-312 | Deprecated | capabilities.ts:101 | Remove |               │
│ | executeFish() | 315-329 | Deprecated | capabilities.ts:132 | Remove |                │
│ | executeSoigner() | 332-348 | Deprecated | NONE | Remove (dead code) |                │
│ | executeResearch() | 351-377 | Deprecated | capabilities.ts:279 | Remove |            │
│ | executeCraft() | 380-390 | Deprecated | capabilities.ts:171 | Implement or remove |  │
│ | executeHarvestCapacity() | 256-274 | Legacy | capabilities.ts:348 | Refactor or      │
│ remove |                                                                               │
│ | executeCouperDuBois handler | 67-91 | Wrong | routes.ts:42 | Migrate to              │
│ CharacterCapabilityService |                                                           │
│ | executeMiner handler | 93-117 | Wrong | routes.ts:43 | Migrate to                    │
│ CharacterCapabilityService |                                                           │
│ | executeFish handler | 119-148 | Wrong | routes.ts:44 | Migrate to                    │
│ CharacterCapabilityService |                                                           │
│ | executeCraft handler | 150-197 | Broken | routes.ts:46 | Fix or remove |             │
│ | executeSoigner handler | 199-251 | Correct | routes.ts:47 | Keep as example |        │
│ | executeResearch handler | 253-299 | Wrong | routes.ts:48 | Migrate to                │
│ CharacterCapabilityService |                                                           │
│ | executeDivertir handler | 301-331 | Wrong | routes.ts:49 | Migrate to                │
│ CharacterCapabilityService |                                                           │
│ | executeHarvest handler | 333-368 | Wrong | routes.ts:45 | Migrate to                 │
│ CharacterCapabilityService |                                             