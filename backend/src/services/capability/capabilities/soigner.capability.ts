import { BaseCapability } from "../base-capability.service";
import { CapabilityExecutionResult } from "../../types/capability-result.types";
import { NotFoundError, BadRequestError, ValidationError } from "../../../shared/errors";
import { hasHealExtraBonus } from "../../../util/character-validators";
import { ResourceUtils } from "../../../shared/utils";

/**
 * Capacité Soigner
 * Permet de soigner une cible (+1 HP, +2 avec bonus) ou de crafter un cataplasme
 * Bonus: HEAL_EXTRA (20% de chance pour +1 HP supplémentaire)
 */
export class SoignerCapability extends BaseCapability {
  readonly name = "Soigner";
  readonly category = "SPECIAL" as const;

  async execute(
    characterId: string,
    capabilityId: string,
    params?: { mode?: "heal" | "craft"; targetCharacterId?: string }
  ): Promise<CapabilityExecutionResult> {
    const mode = params?.mode ?? "heal";
    const targetCharacterId = params?.targetCharacterId;

    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
      include: { town: true },
    });

    if (!character) {
      throw new NotFoundError("Character", characterId);
    }

    if (mode === "heal") {
      // Mode 1: Heal target
      if (!targetCharacterId) {
        throw new ValidationError("Cible requise pour soigner");
      }

      const target = await this.prisma.character.findUnique({
        where: { id: targetCharacterId },
      });

      if (!target) {
        throw new NotFoundError("Target character", targetCharacterId);
      }

      if (target.hp >= 5) {
        throw new BadRequestError("La cible a déjà tous ses PV");
      }

      // Vérifier si la cible est en agonie affamé (hungerLevel=0 ET hp=1)
      if (target.hungerLevel === 0 && target.hp === 1) {
        throw new BadRequestError(
          "Impossible de soigner un personnage en agonie affamé. Il doit d'abord manger."
        );
      }

      // Vérifier si le soigneur a le bonus HEAL_EXTRA
      const hasHealBonus = await hasHealExtraBonus(
        characterId,
        capabilityId,
        this.prisma
      );

      // Calculer les PV à ajouter (base = 1)
      let hpToAdd = 1;
      let bonusApplied = false;

      if (hasHealBonus) {
        // HEAL_EXTRA : 20% de chance d'avoir +1 PV supplémentaire
        const roll = Math.floor(Math.random() * 100) + 1; // 1-100
        bonusApplied = roll <= 20; // 20% de chance

        if (bonusApplied) {
          hpToAdd = 2; // +1 PV bonus
        }

        console.log(
          `[HEAL_EXTRA] Soigneur: ${character.name} | Cible: ${target.name} | Roll: ${roll}/100 (seuil: 20) | Bonus appliqué: ${bonusApplied} | PV ajoutés: ${hpToAdd}`
        );
      }

      // Appliquer les soins (sans dépasser 5 PV)
      const newHp = Math.min(5, target.hp + hpToAdd);
      const actualHpAdded = newHp - target.hp;

      const message = bonusApplied
        ? `Vous avez soigné ${target.name} (+${actualHpAdded} PV) ⭐ (Heal Extra)`
        : `Vous avez soigné ${target.name} (+${actualHpAdded} PV)`;

      return {
        success: true,
        message,
        publicMessage: `💚 ${character.name} a soigné ${target.name} (+${actualHpAdded} PV)${bonusApplied ? ' ⭐' : ''}`,
        paConsumed: 1,
        effects: [
          {
            targetCharacterId: targetCharacterId,
            hpChange: actualHpAdded,
          },
        ],
        metadata: {
          bonusApplied: bonusApplied ? ['HEAL_EXTRA'] : [],
        },
      };
    } else {
      // Mode 2: Craft cataplasme

      // Check cataplasme limit (max 3 per town including expeditions)
      const cataplasmeCount = await this.getCataplasmeCount(character.townId);

      if (cataplasmeCount >= 3) {
        throw new BadRequestError(
          "Limite de cataplasmes atteinte (max 3 par ville)"
        );
      }

      return {
        success: true,
        message: "Vous avez préparé un cataplasme",
        publicMessage: `${character.name} a préparé un cataplasme.`,
        paConsumed: 2,
        loot: { Cataplasme: 1 },
        metadata: {
          bonusApplied: [],
        },
      };
    }
  }

  /**
   * Récupère le nombre total de cataplasmes dans une ville (city + expeditions)
   */
  private async getCataplasmeCount(townId: string): Promise<number> {
    const cataplasmeType = await ResourceUtils.getResourceTypeByName("Cataplasme");

    const cityStock = await ResourceUtils.getStock(
      "CITY",
      townId,
      cataplasmeType.id
    );

    // Count cataplasmes in all town expeditions
    const townExpeditions = await this.prisma.expedition.findMany({
      where: { townId: townId },
      select: { id: true },
    });

    const expeditionStocks = await this.prisma.resourceStock.findMany({
      where: {
        locationType: "EXPEDITION",
        locationId: {
          in: townExpeditions.map((exp) => exp.id),
        },
        resourceTypeId: cataplasmeType.id,
      },
    });

    const cityCount = cityStock?.quantity || 0;
    const expeditionCount = expeditionStocks.reduce(
      (sum, stock) => sum + stock.quantity,
      0
    );

    return cityCount + expeditionCount;
  }
}
