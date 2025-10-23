import { PrismaClient } from "@prisma/client";
import { CapabilityRepository } from "../domain/repositories/capability.repository";
import { CapabilityExecutionResult } from "./types/capability-result.types";
import {
  ChasserCapability,
  CueillirCapability,
  CouperDuBoisCapability,
  MinerCapability,
  PecherCapability,
  DivertirCapability,
  CuisinerCapability,
  SoignerCapability,
  CartographierCapability,
  RechercherCapability,
  AuspiceCapability,
} from "./capability/capabilities";
import { BaseCapability } from "./capability/base-capability.service";

/**
 * Service orchestrateur pour les capacités
 * Délègue l'exécution aux classes de capacités spécialisées
 *
 * Architecture refactorée :
 * - Chaque capacité est une classe séparée dans /capability/capabilities/
 * - Ce service instancie et coordonne les capacités
 * - Maintient la compatibilité avec l'API existante
 */
export class CapabilityService {
  private readonly capabilities: Map<string, BaseCapability>;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly capabilityRepo: CapabilityRepository
  ) {
    // Initialiser toutes les capacités
    this.capabilities = new Map<string, BaseCapability>();
    this.capabilities.set("chasser", new ChasserCapability(prisma, capabilityRepo));
    this.capabilities.set("cueillir", new CueillirCapability(prisma, capabilityRepo));
    this.capabilities.set("couper du bois", new CouperDuBoisCapability(prisma, capabilityRepo));
    this.capabilities.set("miner", new MinerCapability(prisma, capabilityRepo));
    this.capabilities.set("pêcher", new PecherCapability(prisma, capabilityRepo));
    this.capabilities.set("divertir", new DivertirCapability(prisma, capabilityRepo));
    this.capabilities.set("cuisiner", new CuisinerCapability(prisma, capabilityRepo));
    this.capabilities.set("soigner", new SoignerCapability(prisma, capabilityRepo));
    this.capabilities.set("cartographier", new CartographierCapability(prisma, capabilityRepo));
    this.capabilities.set("rechercher", new RechercherCapability(prisma, capabilityRepo));
    this.capabilities.set("auspice", new AuspiceCapability(prisma, capabilityRepo));
  }

  /**
   * Récupère une capacité par son nom
   */
  private getCapability(name: string): BaseCapability | undefined {
    return this.capabilities.get(name.toLowerCase());
  }

  // ==========================================
  // API publique - Méthodes V2 (nouvelles)
  // ==========================================

  /**
   * Exécute Chasser
   */
  async executeChasser(
    characterId: string,
    capabilityId: string,
    isSummer: boolean = true
  ): Promise<CapabilityExecutionResult> {
    const capability = this.getCapability("chasser");
    if (!capability) throw new Error("Capability Chasser not found");
    return capability.execute(characterId, capabilityId, { isSummer });
  }

  /**
   * Exécute Cueillir
   */
  async executeCueillir(
    characterId: string,
    capabilityId: string,
    isSummer: boolean = true
  ): Promise<CapabilityExecutionResult> {
    const capability = this.getCapability("cueillir");
    if (!capability) throw new Error("Capability Cueillir not found");
    return capability.execute(characterId, capabilityId, { isSummer });
  }

  /**
   * Exécute Couper du bois (V2)
   */
  async executeCouperDuBoisV2(
    characterId: string,
    capabilityId: string
  ): Promise<CapabilityExecutionResult> {
    const capability = this.getCapability("couper du bois");
    if (!capability) throw new Error("Capability Couper du bois not found");
    return capability.execute(characterId, capabilityId);
  }

  /**
   * Exécute Miner (V2)
   */
  async executeMinerV2(
    characterId: string,
    capabilityId: string
  ): Promise<CapabilityExecutionResult> {
    const capability = this.getCapability("miner");
    if (!capability) throw new Error("Capability Miner not found");
    return capability.execute(characterId, capabilityId);
  }

  /**
   * Exécute Pêcher (V2)
   */
  async executePecherV2(
    characterId: string,
    capabilityId: string,
    paToUse: 1 | 2
  ): Promise<CapabilityExecutionResult> {
    const capability = this.getCapability("pêcher");
    if (!capability) throw new Error("Capability Pêcher not found");
    return capability.execute(characterId, capabilityId, { paToUse });
  }

  /**
   * Exécute Divertir
   */
  async executeDivertir(
    characterId: string,
    capabilityId: string
  ): Promise<CapabilityExecutionResult> {
    const capability = this.getCapability("divertir");
    if (!capability) throw new Error("Capability Divertir not found");
    return capability.execute(characterId, capabilityId);
  }

  /**
   * Exécute Cuisiner (V2)
   */
  async executeCuisinerV2(
    characterId: string,
    capabilityId: string,
    paToUse: number,
    vivresToConsume: number
  ): Promise<CapabilityExecutionResult> {
    const capability = this.getCapability("cuisiner");
    if (!capability) throw new Error("Capability Cuisiner not found");
    return capability.execute(characterId, capabilityId, { paToUse, vivresToConsume });
  }

  /**
   * Exécute Soigner (V2)
   */
  async executeSoignerV2(
    characterId: string,
    capabilityId: string,
    mode: "heal" | "craft",
    targetCharacterId?: string
  ): Promise<CapabilityExecutionResult> {
    const capability = this.getCapability("soigner");
    if (!capability) throw new Error("Capability Soigner not found");
    return capability.execute(characterId, capabilityId, { mode, targetCharacterId });
  }

  /**
   * Exécute Cartographier (V2)
   */
  async executeCartographierV2(
    characterId: string,
    capabilityId: string,
    paToUse: number
  ): Promise<CapabilityExecutionResult> {
    const capability = this.getCapability("cartographier");
    if (!capability) throw new Error("Capability Cartographier not found");
    return capability.execute(characterId, capabilityId, { paToUse });
  }

  /**
   * Exécute Rechercher (V2)
   */
  async executeRechercherV2(
    characterId: string,
    capabilityId: string,
    paToUse: number
  ): Promise<CapabilityExecutionResult> {
    const capability = this.getCapability("rechercher");
    if (!capability) throw new Error("Capability Rechercher not found");
    return capability.execute(characterId, capabilityId, { paToUse });
  }

  /**
   * Exécute Auspice (V2)
   */
  async executeAuspiceV2(
    characterId: string,
    capabilityId: string,
    paToUse: number
  ): Promise<CapabilityExecutionResult> {
    const capability = this.getCapability("auspice");
    if (!capability) throw new Error("Capability Auspice not found");
    return capability.execute(characterId, capabilityId, { paToUse });
  }

  // ==========================================
  // Méthodes héritées du legacy (pour compatibilité)
  // TODO: À migrer ou supprimer progressivement
  // ==========================================

  /**
   * Récupère toutes les capacités
   */
  async getAllCapabilities() {
    return await this.prisma.capability.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
  }

  /**
   * Récupère une capacité par son nom
   */
  async getCapabilityByName(name: string) {
    return await this.prisma.capability.findFirst({
      where: { name },
    });
  }

  /**
   * Vérifie si un personnage a une capacité
   */
  async hasCapability(characterId: string, capabilityId: string): Promise<boolean> {
    const characterCapability = await this.prisma.characterCapability.findUnique({
      where: {
        characterId_capabilityId: {
          characterId,
          capabilityId,
        },
      },
    });
    return characterCapability !== null;
  }

  /**
   * Récupère le nombre de cataplasmes
   */
  async getCataplasmeCount(townId: string): Promise<number> {
    const soignerCapability = this.getCapability("soigner") as SoignerCapability;
    if (!soignerCapability) {
      throw new Error("Soigner capability not found");
    }
    // Accès à la méthode privée via any (temporaire)
    return (soignerCapability as any).getCataplasmeCount(townId);
  }

  /**
   * Exécute la capacité Harvest (utilisée par le controller)
   */
  async executeHarvestCapacity(
    characterId: string,
    capabilityName: string,
    isSummer: boolean
  ): Promise<CapabilityExecutionResult> {
    // Récupérer l'ID de la capacité
    const capability = await this.getCapabilityByName(capabilityName);
    if (!capability) {
      throw new Error(`Capability ${capabilityName} not found`);
    }

    if (capabilityName === "Chasser") {
      return this.executeChasser(characterId, capability.id, isSummer);
    } else if (capabilityName === "Cueillir") {
      return this.executeCueillir(characterId, capability.id, isSummer);
    } else {
      throw new Error(`Unknown harvest capability: ${capabilityName}`);
    }
  }

  // ==========================================
  // Méthodes de compatibilité (wrappers vers V2)
  // Ces méthodes maintiennent l'API des controllers existants
  // ==========================================

  /**
   * @deprecated Use executeCouperDuBoisV2 instead
   */
  async executeCouperDuBois(characterId: string) {
    const capability = await this.getCapabilityByName("Couper du bois");
    if (!capability) throw new Error("Capability not found");

    const result = await this.executeCouperDuBoisV2(characterId, capability.id);
    return {
      success: result.success,
      woodGained: result.loot?.["Bois"] || 0,
      message: result.message,
      luckyRollUsed: result.metadata?.bonusApplied?.includes('LUCKY_ROLL'),
    };
  }

  /**
   * @deprecated Use executeMinerV2 instead
   */
  async executeMiner(characterId: string) {
    const capability = await this.getCapabilityByName("Miner");
    if (!capability) throw new Error("Capability not found");

    const result = await this.executeMinerV2(characterId, capability.id);
    return {
      success: result.success,
      oreGained: result.loot?.["Minerai"] || 0,
      message: result.message,
      publicMessage: result.publicMessage || "",
      loot: result.loot,
    };
  }

  /**
   * @deprecated Use executePecherV2 instead
   */
  async executeFish(characterId: string, paSpent: 1 | 2) {
    const capability = await this.getCapabilityByName("Pêcher");
    if (!capability) throw new Error("Capability not found");

    const result = await this.executePecherV2(characterId, capability.id, paSpent);
    return {
      success: result.success,
      loot: result.loot,
      message: result.message,
      objectFound: result.metadata?.objectFound,
      luckyRollUsed: result.metadata?.bonusApplied?.includes('LUCKY_ROLL'),
    };
  }

  /**
   * @deprecated Use executeSoignerV2 instead
   */
  async executeSoigner(
    characterId: string,
    mode: "heal" | "craft",
    targetCharacterId?: string
  ) {
    const capability = await this.getCapabilityByName("Soigner");
    if (!capability) throw new Error("Capability not found");

    const result = await this.executeSoignerV2(characterId, capability.id, mode, targetCharacterId);
    return {
      success: result.success,
      message: result.message,
      publicMessage: result.publicMessage,
    };
  }

  /**
   * @deprecated Use executeCartographierV2, executeRechercherV2, or executeAuspiceV2 instead
   */
  async executeResearch(
    characterId: string,
    researchType: "rechercher" | "cartographier" | "auspice",
    paSpent: 1 | 2
  ) {
    const capability = await this.getCapabilityByName(
      researchType === "rechercher" ? "Rechercher" :
      researchType === "cartographier" ? "Cartographier" : "Auspice"
    );
    if (!capability) throw new Error("Capability not found");

    let result: CapabilityExecutionResult;
    if (researchType === "rechercher") {
      result = await this.executeRechercherV2(characterId, capability.id, paSpent);
    } else if (researchType === "cartographier") {
      result = await this.executeCartographierV2(characterId, capability.id, paSpent);
    } else {
      result = await this.executeAuspiceV2(characterId, capability.id, paSpent);
    }

    return {
      success: result.success,
      message: result.message,
    };
  }

  /**
   * @deprecated Craft functionality needs to be refactored
   * Placeholder for now - will be implemented when craft system is redesigned
   */
  async executeCraft(
    characterId: string,
    craftType: string,
    inputAmount: number,
    paSpent: 1 | 2
  ) {
    throw new Error("executeCraft is deprecated and needs to be refactored with the new project system");
  }
}
