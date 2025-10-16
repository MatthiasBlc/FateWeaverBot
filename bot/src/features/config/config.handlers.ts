import {
  createInfoEmbed,
  createSuccessEmbed,
  createWarningEmbed,
} from "../../utils/embeds";
import {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ComponentType,
  type CommandInteraction,
  type StringSelectMenuInteraction,
  type ChatInputCommandInteraction,
  Client,
  PermissionFlagsBits,
} from "discord.js";
import { apiService } from "../../services/api";
import {
  replyEphemeral,
  replyError,
  replySuccess,
} from "../../utils/interaction-helpers.js";
import { logger } from "../../services/logger.js";

interface GuildConfig {
  id: string;
  discordGuildId: string;
  name: string;
  logChannelId?: string | null;
  [key: string]: any; // Pour les autres propriétés qui pourraient exister
}

export async function handleConfigChannelCommand(
  interaction: ChatInputCommandInteraction
) {
  if (!interaction.guild) {
    return replyEphemeral(
      interaction,
      "Cette commande ne peut être utilisée que dans un serveur."
    );
  }

  // Vérifier les permissions d'administrateur
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    return replyEphemeral(
      interaction,
      "Vous devez être administrateur pour utiliser cette commande."
    );
  }

  const guild = interaction.guild;

  // S'assurer que la guilde existe avant de continuer
  try {
    // Créer la guilde si elle n'existe pas
    await apiService.guilds.getOrCreateGuild(
      guild.id,
      guild.name,
      guild.memberCount
    );
  } catch (error) {
    logger.error("Failed to get or create guild:", { error });
    return replyEphemeral(
      interaction,
      "Une erreur est survenue lors de la configuration de la guilde."
    );
  }

  // Récupérer la configuration de la guilde
  let currentLogChannel = null;
  let currentLogChannelName = null;
  try {
    const guildConfig = (await apiService.guilds.getGuildByDiscordId(
      guild.id
    )) as GuildConfig;
    
    if (guildConfig?.logChannelId) {
      currentLogChannel = guild.channels.cache.get(guildConfig.logChannelId);
      currentLogChannelName = currentLogChannel
        ? currentLogChannel.name
        : "Salon supprimé";
    }
  } catch (error) {
    logger.warn("Could not fetch current guild configuration:", { error });
  }

  const textChannels = guild.channels.cache.filter(
    (channel) =>
      channel.type === 0 && // TextChannel
      channel
        .permissionsFor(interaction.user)
        ?.has(PermissionFlagsBits.SendMessages)
  );

  if (textChannels.size === 0) {
    return replyEphemeral(
      interaction,
      "Aucun salon textuel accessible n'a été trouvé."
    );
  }

  // Limiter à 25 salons maximum (limite Discord)
  const channelsToShow = textChannels.first(25);

  // Construire les options du menu déroulant
  const menuOptions = channelsToShow.map((channel) => ({
    label: channel.name,
    description:
      channel.id === currentLogChannel?.id
        ? `Salon actuel: #${channel.name}`
        : `Salon: #${channel.name}`,
    value: channel.id,
    emoji: channel.id === currentLogChannel?.id ? "✅" : undefined,
  }));

  // Ajouter une option pour désactiver les logs si un salon est configuré
  if (currentLogChannel) {
    menuOptions.push({
      label: "Aucun salon (désactiver les logs)",
      description: "Désactiver l'envoi automatique des logs",
      value: "none",
      emoji: "🚫",
    });
  }

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("config_channel_select")
    .setPlaceholder("Choisissez un salon pour les logs")
    .addOptions(menuOptions);

  // Construire la description de l'embed
  let embedDescription =
    "Choisissez le salon dans lequel les logs automatiques seront envoyés.\n\n";
  embedDescription += "Les logs incluent :\n";
  embedDescription += "• Les investissements dans les chantiers\n";
  embedDescription += "• Les actions des personnages\n";
  embedDescription += "• Autres événements automatiques\n\n";

  if (currentLogChannel) {
    embedDescription += `**Salon actuel :** ${currentLogChannel} (ID: ${currentLogChannel.id})\n`;
    embedDescription +=
      "💡 Sélectionnez un autre salon pour le changer, ou choisissez 'Aucun salon' pour désactiver les logs.";
  } else {
    embedDescription +=
      "ℹ️ Aucun salon n'est actuellement configuré pour les logs.";
  }

  const embed = createInfoEmbed(
    "⚙️ Configuration du salon de logs",
    embedDescription
  );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    selectMenu
  );

  const response = await interaction.reply({
    embeds: [embed],
    components: [row],
    flags: ["Ephemeral"],
  });

  try {
    const selectInteraction = (await response.awaitMessageComponent({
      componentType: ComponentType.StringSelect,
      time: 60000, // 1 minute
    })) as StringSelectMenuInteraction;

    const selectedChannelId = selectInteraction.values[0];

    if (selectedChannelId === "none") {
      // Désactiver les logs
      await apiService.updateGuildLogChannel(guild.id, null);

      logger.info(`Log channel disabled for guild ${guild.id}`);

      const successEmbed = createWarningEmbed(
        "🚫 Logs désactivés",
        "L'envoi automatique des logs a été désactivé."
      ).addFields([
        {
          name: "Guilde",
          value: guild.name,
          inline: true,
        },
      ]);

      await selectInteraction.update({
        embeds: [successEmbed],
        components: [],
      });
      return;
    }

    const selectedChannel = guild.channels.cache.get(selectedChannelId);

    if (!selectedChannel) {
      return replyEphemeral(selectInteraction, "Le salon sélectionné n'existe plus.");
    }

    // Sauvegarder dans la base de données
    await apiService.updateGuildLogChannel(guild.id, selectedChannelId);

    logger.info(
      `Log channel configured for guild ${guild.id}: ${selectedChannelId}`
    );

    const successEmbed = createSuccessEmbed(
      "✅ Salon configuré avec succès",
      `Le salon ${selectedChannel} a été enregistré pour les logs automatiques.`
    ).addFields([
      {
        name: "Salon",
        value: `${selectedChannel}`,
        inline: true,
      },
      {
        name: "Guilde",
        value: guild.name,
        inline: true,
      },
    ]);

    await selectInteraction.update({
      embeds: [successEmbed],
      components: [],
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("time")) {
      // Timeout
      const timeoutEmbed = createWarningEmbed(
        "⏰ Temps écoulé",
        "La configuration a été annulée car aucune sélection n'a été faite dans le délai imparti."
      );

      await interaction.editReply({
        embeds: [timeoutEmbed],
        components: [],
      });
    } else {
      logger.error("Error in channel selection:", { error });
      await interaction.editReply({
        content: "Une erreur est survenue lors de la sélection du salon.",
        embeds: [],
        components: [],
      });
    }
  }
}
