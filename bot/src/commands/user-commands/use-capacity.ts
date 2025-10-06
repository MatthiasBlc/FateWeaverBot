import {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} from "discord.js";
import type { Command } from "../../types/command";
import { withUser } from "../../core/middleware/ensureUserClean";
import { CharacterAPIService } from "../../services/api/character-api.service";
import { httpClient } from "../../services/httpClient";
import {
  getCharacterCapabilities,
  Capability,
} from "../../services/capability.service";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("use-capacity")
    .setDescription("Utiliser une capacité spéciale de votre personnage")
    .addStringOption((option) =>
      option
        .setName("capacity")
        .setDescription("Nom de la capacité à utiliser")
        .setAutocomplete(true)
    ),
  async autocomplete(interaction) {
    try {
      const focusedValue = interaction.options.getFocused();
      const characterService = new CharacterAPIService(httpClient);
      const character = await characterService.getActiveCharacter(
        interaction.user.id,
        interaction.guildId!
      );

      if (!character) {
        await interaction.respond([
          { name: "Aucun personnage actif trouvé", value: "" },
        ]);
        return;
      }

      const capabilities = await getCharacterCapabilities(character.id);
      const filtered = capabilities
        .filter(
          (cap) =>
            cap.name.toLowerCase().includes(focusedValue.toLowerCase()) ||
            cap.description?.toLowerCase().includes(focusedValue.toLowerCase())
        )
        .slice(0, 25);

      await interaction.respond(
        filtered.map((cap) => ({
          name: `${cap.name} (${cap.costPA} PA) - ${
            cap.description || "Aucune description"
          }`,
          value: cap.name,
        }))
      );
    } catch (error) {
      console.error("Erreur dans l'autocomplétion de use-capacity:", error);
      await interaction.respond([
        { name: "Erreur lors du chargement des capacités", value: "" },
      ]);
    }
  },

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const characterService = new CharacterAPIService(httpClient);
      const character = await characterService.getActiveCharacter(
        interaction.user.id,
        interaction.guildId!
      );

      if (!character) {
        await interaction.editReply(
          "❌ Vous n'avez pas de personnage actif dans cette ville."
        );
        return;
      }

      // Vérifier si le personnage est en ville
      // Note: La propriété isOnExpedition n'est pas disponible dans le type Character
      // Vous devrez peut-être l'ajouter à l'interface Character si nécessaire
      // Pour l'instant, cette vérification est commentée
      // if (character.isOnExpedition) {
      //   await interaction.editReply("❌ Vous ne pouvez pas utiliser de capacités en expédition.");
      //   return;
      // }

      const capacityName = interaction.options.getString("capacity");

      if (!capacityName) {
        // Afficher le menu de sélection des capacités
        if (this.showCapacityMenu) {
          await this.showCapacityMenu(interaction, character.id);
        }
        return;
      }

      // Utiliser la capacité spécifiée
      if (this.useCapacity) {
        await this.useCapacity(interaction, character, capacityName);
      }
    } catch (error) {
      console.error("Erreur lors de l'exécution de use-capacity:", error);
      await interaction.editReply(
        "❌ Une erreur est survenue lors de l'exécution de la commande."
      );
    }
  },

  async showCapacityMenu(interaction: any, characterId: string) {
    try {
      const capabilities = await getCharacterCapabilities(characterId);

      if (capabilities.length === 0) {
        await interaction.editReply(
          "❌ Vous ne connaissez aucune capacité pour l'instant."
        );
        return;
      }

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("select_capacity")
        .setPlaceholder("Sélectionnez une capacité à utiliser")
        .addOptions(
          capabilities.map((cap) => ({
            label: `${cap.name} (${cap.costPA} PA)`,
            description:
              cap.description?.substring(0, 100) || "Aucune description",
            value: cap.name,
          }))
        );

      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        selectMenu
      );

      await interaction.editReply({
        content: "Choisissez une capacité à utiliser :",
        components: [row.toJSON()],
      });
    } catch (error) {
      console.error("Erreur lors de l'affichage du menu des capacités:", error);
      await interaction.editReply(
        "❌ Une erreur est survenue lors de l'affichage du menu."
      );
    }
  },

  async useCapacity(interaction, character, capacityName: string) {
    try {
      // Get the current season from the API
      const seasonResponse = await httpClient.get("/seasons/current");
      const currentSeason = seasonResponse.data;
      const isSummer = currentSeason?.name?.toLowerCase() === "summer";

      // Get the capability details
      const capabilities = await getCharacterCapabilities(character.id);
      const selectedCapability = capabilities.find(
        (cap) => cap.name.toLowerCase() === capacityName.toLowerCase()
      );

      if (!selectedCapability) {
        await interaction.editReply("Capacité non trouvée.");
        return;
      }

      // Gestion spéciale pour la pêche avec option de lucky roll
      if (capacityName.toLowerCase() === "pêcher" && character.paTotal >= 2) {
        const row = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId("fishing_choice")
            .setPlaceholder("Choisissez votre type de pêche")
            .addOptions([
              {
                label: "Pêche normale (1 PA)",
                description: "Un seul lancer de dé",
                value: "normal",
              },
              {
                label: "Pêche chanceuse (2 PA)",
                description: "Deux lancers, garde le meilleur",
                value: "lucky",
              },
            ])
        );

        await interaction.editReply({
          content: "Choisissez votre type de pêche :",
          components: [row.toJSON()],
        });
        return;
      }

      // Vérifier si la capacité est disponible
      if (!selectedCapability) {
        await interaction.editReply(
          "Cette capacité n'est pas disponible pour votre personnage."
        );
        return;
      }

      // Vérifier les PA nécessaires
      if (character.paTotal < selectedCapability.costPA) {
        await interaction.editReply(
          `Vous n'avez pas assez de points d'action (nécessite ${selectedCapability.costPA} PA).`
        );
        return;
      }

      // Exécuter la capacité via l'API
      try {
        const response = await httpClient.post(
          `/characters/${character.id}/capabilities/use`,
          {
            capabilityName: capacityName,
            isSummer,
          }
        );

        const result = response.data;

        // Gérer les messages de retour
        if (
          result.publicMessage &&
          interaction.channel &&
          "send" in interaction.channel
        ) {
          await interaction.channel.send(result.publicMessage);
        }

        await interaction.editReply({
          content:
            result.message || `Capacité ${capacityName} utilisée avec succès.`,
        });

        // Mise à jour des points d'action du personnage
        if (result.updatedCharacter) {
          // Mettre à jour le personnage localement si nécessaire
          character.paTotal = result.updatedCharacter.paTotal;
        }
      } catch (error: any) {
        console.error("Erreur lors de l'utilisation de la capacité:", error);
        await interaction.editReply({
          content: `❌ Erreur : ${error.message || "Une erreur est survenue"}`,
        });
      }
    } catch (error: any) {
      console.error("Erreur lors de l'utilisation de la capacité:", error);
      await interaction.editReply({
        content: `❌ Erreur : ${error.message || "Une erreur est survenue"}`,
      });
    }
  },
};

export default command;
