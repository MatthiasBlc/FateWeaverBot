export class ExpeditionQueries {
  static fullInclude() {
    return {
      include: {
        town: true,
        members: {
          include: {
            character: {
              include: { user: true }
            }
          }
        },
        emergencyVotes: true
      }
    };
  }

  static withMembers() {
    return {
      include: {
        members: {
          include: {
            character: {
              include: { user: true }
            }
          }
        }
      }
    };
  }

  static withTown() {
    return {
      include: {
        town: true
      }
    };
  }

  static withVotes() {
    return {
      include: {
        emergencyVotes: true
      }
    };
  }
}
