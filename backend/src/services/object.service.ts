import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const objectService = {
  /**
   * Récupère tous les types d'objets
   */
  async getAllObjectTypes() {
    return await prisma.objectType.findMany({
      include: {
        skillBonuses: {
          include: {
            skill: true
          }
        },
        capacityBonuses: {
          include: {
            capability: true
          }
        },
        resourceConversions: {
          include: {
            resourceType: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
  },

  /**
   * Récupère un type d'objet par ID
   */
  async getObjectTypeById(id: number) {
    return await prisma.objectType.findUnique({
      where: { id },
      include: {
        skillBonuses: {
          include: {
            skill: true
          }
        },
        capacityBonuses: {
          include: {
            capability: true
          }
        },
        resourceConversions: {
          include: {
            resourceType: true
          }
        }
      }
    });
  },

  /**
   * Crée un nouveau type d'objet (admin)
   */
  async createObjectType(data: { name: string; description?: string }) {
    return await prisma.objectType.create({
      data: {
        name: data.name,
        description: data.description
      }
    });
  },

  /**
   * Récupère l'inventaire d'un personnage
   */
  async getCharacterInventory(characterId: string) {
    const inventory = await prisma.characterInventory.findUnique({
      where: { characterId },
      include: {
        slots: {
          include: {
            objectType: {
              include: {
                skillBonuses: {
                  include: {
                    skill: true
                  }
                },
                capacityBonuses: {
                  include: {
                    capability: true
                  }
                }
              }
            }
          }
        }
      }
    });

    return inventory;
  },

  /**
   * Ajoute un objet à l'inventaire d'un personnage
   */
  async addObjectToCharacter(characterId: string, objectTypeId: number) {
    return await prisma.$transaction(async (tx) => {
      // 1. Récupérer l'objet avec ses conversions
      const objectType = await tx.objectType.findUnique({
        where: { id: objectTypeId },
        include: {
          resourceConversions: {
            include: { resourceType: true }
          }
        }
      });

      if (!objectType) {
        throw new Error(`ObjectType ${objectTypeId} not found`);
      }

      // 2. Si l'objet a des conversions de ressources (sac de ressources)
      if (objectType.resourceConversions.length > 0) {
        // Récupérer le personnage pour savoir où il est
        const character = await tx.character.findUnique({
          where: { id: characterId },
          include: {
            expeditionMembers: {
              include: { expedition: true },
              where: { expedition: { status: 'DEPARTED' } }
            }
          }
        });

        if (!character) {
          throw new Error(`Character ${characterId} not found`);
        }

        // Déterminer la destination des ressources
        const isDeparted = character.expeditionMembers.length > 0;
        const locationType = isDeparted ? 'EXPEDITION' : 'CITY';
        const locationId = isDeparted
          ? character.expeditionMembers[0].expedition.id
          : character.townId;

        // Pour chaque conversion, ajouter les ressources
        for (const conversion of objectType.resourceConversions) {
          await tx.resourceStock.upsert({
            where: {
              locationType_locationId_resourceTypeId: {
                locationType,
                locationId,
                resourceTypeId: conversion.resourceTypeId
              }
            },
            update: { quantity: { increment: conversion.quantity } },
            create: {
              locationType,
              locationId,
              resourceTypeId: conversion.resourceTypeId,
              quantity: conversion.quantity
            }
          });
        }

        // NE PAS ajouter l'objet à l'inventaire (auto-consommé)
        return {
          success: true,
          converted: true,
          resources: objectType.resourceConversions.map(c => ({
            name: c.resourceType.name,
            quantity: c.quantity
          }))
        };
      }

      // 3. Sinon, ajouter normalement à l'inventaire
      const inventory = await tx.characterInventory.upsert({
        where: { characterId },
        create: { characterId },
        update: {}
      });

      const slot = await tx.characterInventorySlot.create({
        data: {
          inventoryId: inventory.id,
          objectTypeId
        },
        include: {
          objectType: true
        }
      });

      return { success: true, converted: false, slot };
    });
  },

  /**
   * Retire un objet de l'inventaire
   */
  async removeObjectFromCharacter(slotId: string) {
    return await prisma.characterInventorySlot.delete({
      where: { id: slotId }
    });
  },

  /**
   * Récupère les types d'objets d'un personnage (pour l'admin)
   * Retourne une liste unique des types d'objets possédés
   */
  async getCharacterObjects(characterId: string) {
    const inventory = await prisma.characterInventory.findUnique({
      where: { characterId },
      include: {
        slots: {
          include: {
            objectType: {
              include: {
                skillBonuses: {
                  include: {
                    skill: true
                  }
                },
                capacityBonuses: {
                  include: {
                    capability: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!inventory) {
      return [];
    }

    // Dédupliquer les types d'objets
    const objectTypesMap = new Map();
    inventory.slots.forEach(slot => {
      if (!objectTypesMap.has(slot.objectType.id)) {
        objectTypesMap.set(slot.objectType.id, {
          id: slot.objectType.id,
          name: slot.objectType.name,
          description: slot.objectType.description,
          skillBonuses: slot.objectType.skillBonuses.map(sb => ({
            id: sb.id,
            skill: {
              id: sb.skill.id,
              name: sb.skill.name,
              description: sb.skill.description
            }
          })),
          capacityBonuses: slot.objectType.capacityBonuses.map(cb => ({
            id: cb.id,
            capability: {
              id: cb.capability.id,
              name: cb.capability.name,
              description: cb.capability.description,
              emojiTag: cb.capability.emojiTag
            },
            bonusType: cb.bonusType
          }))
        });
      }
    });

    return Array.from(objectTypesMap.values());
  },

  /**
   * Supprime un objet d'un personnage par objectTypeId
   * Supprime le premier slot trouvé avec ce type d'objet
   */
  async removeObjectFromCharacterByType(characterId: string, objectTypeId: number) {
    const inventory = await prisma.characterInventory.findUnique({
      where: { characterId },
      include: {
        slots: {
          include: {
            objectType: true
          }
        }
      }
    });

    if (!inventory) {
      throw new Error('Character has no inventory');
    }

    // Trouver le premier slot avec ce type d'objet
    const slot = inventory.slots.find(s => s.objectType.id === objectTypeId);

    if (!slot) {
      throw new Error('Object not found in character inventory');
    }

    return await prisma.characterInventorySlot.delete({
      where: { id: slot.id }
    });
  },

  /**
   * Transfère un objet entre personnages
   */
  async transferObject(slotId: string, targetCharacterId: string) {
    return await prisma.$transaction(async (tx) => {
      // 1. Récupérer le slot source
      const sourceSlot = await tx.characterInventorySlot.findUnique({
        where: { id: slotId },
        include: {
          inventory: {
            include: {
              character: {
                include: {
                  expeditionMembers: {
                    include: { expedition: true },
                    where: { expedition: { status: 'DEPARTED' } }
                  }
                }
              }
            }
          },
          objectType: true
        }
      });

      if (!sourceSlot) {
        throw new Error('Slot source not found');
      }

      // 2. Récupérer le personnage cible
      const targetCharacter = await tx.character.findUnique({
        where: { id: targetCharacterId },
        include: {
          expeditionMembers: {
            include: { expedition: true },
            where: { expedition: { status: 'DEPARTED' } }
          }
        }
      });

      if (!targetCharacter) {
        throw new Error('Target character not found');
      }

      const sourceChar = sourceSlot.inventory.character;

      // 3. Vérifier éligibilité (même ville OU même expédition DEPARTED)
      const sameCity = sourceChar.townId === targetCharacter.townId;
      const sourceExpedition = sourceChar.expeditionMembers[0]?.expedition;
      const targetExpedition = targetCharacter.expeditionMembers[0]?.expedition;
      const sameExpedition = sourceExpedition && targetExpedition &&
                              sourceExpedition.id === targetExpedition.id;

      if (!sameCity && !sameExpedition) {
        throw new Error('Characters must be in same city or same DEPARTED expedition');
      }

      // 4. Créer l'inventaire cible si nécessaire
      const targetInventory = await tx.characterInventory.upsert({
        where: { characterId: targetCharacterId },
        create: { characterId: targetCharacterId },
        update: {}
      });

      // 5. Créer nouveau slot pour la cible
      const newSlot = await tx.characterInventorySlot.create({
        data: {
          inventoryId: targetInventory.id,
          objectTypeId: sourceSlot.objectTypeId
        }
      });

      // 6. Supprimer le slot source
      await tx.characterInventorySlot.delete({
        where: { id: slotId }
      });

      return { success: true, newSlot };
    });
  }
};
