export class ChantierQueries {
  static fullInclude() {
    return {
      include: {
        town: true,
        resourceCosts: {
          include: { resourceType: true }
        }
      }
    };
  }

  static withResourceCosts() {
    return {
      include: {
        resourceCosts: {
          include: { resourceType: true }
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
}
