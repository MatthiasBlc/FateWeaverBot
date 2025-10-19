export class CharacterQueries {
  static baseInclude() {
    return {
      include: {
        user: true,
        town: { include: { guild: true } },
        job: true
      }
    };
  }

  static fullInclude() {
    return {
      include: {
        user: true,
        town: { include: { guild: true } },
        characterRoles: { include: { role: true } },
        job: {
          include: {
            startingAbility: true,
            optionalAbility: true
          }
        },
        characterCapabilities: {
          include: { capability: true },
          orderBy: { capability: { name: "asc" as const } }
        },
        characterSkills: { include: { skill: true } },
        expeditionMembers: { include: { expedition: true } },
        inventory: {
          include: {
            slots: { include: { objectType: true } }
          }
        }
      }
    };
  }

  static withCapabilities() {
    return {
      include: {
        user: true,
        town: { include: { guild: true } },
        characterRoles: { include: { role: true } },
        job: true,
        characterCapabilities: {
          include: { capability: true },
          orderBy: { capability: { name: "asc" as const } }
        }
      }
    };
  }

  static withInventory() {
    return {
      include: {
        user: true,
        town: { include: { guild: true } },
        job: true,
        inventory: {
          include: {
            slots: { include: { objectType: true } }
          }
        }
      }
    };
  }

  static withExpeditions() {
    return {
      include: {
        user: true,
        town: { include: { guild: true } },
        job: true,
        expeditionMembers: {
          include: {
            expedition: true
          }
        }
      }
    };
  }
}
