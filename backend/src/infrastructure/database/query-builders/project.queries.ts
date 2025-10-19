export class ProjectQueries {
  static fullInclude() {
    return {
      include: {
        craftTypes: true,
        resourceCosts: { include: { resourceType: true } },
        outputResourceType: true,
        outputObjectType: true,
        town: true
      }
    };
  }

  static withResourceCosts() {
    return {
      include: {
        resourceCosts: { include: { resourceType: true } }
      }
    };
  }

  static withCraftTypes() {
    return {
      include: {
        craftTypes: true
      }
    };
  }

  static withOutput() {
    return {
      include: {
        outputResourceType: true,
        outputObjectType: true
      }
    };
  }
}
