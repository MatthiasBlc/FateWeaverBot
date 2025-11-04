import {
  createInfoEmbed,
  createSuccessEmbed,
  createWarningEmbed,
} from "../../utils/embeds";
import {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  type CommandInteraction,
  type StringSelectMenuInteraction,
  type ButtonInteraction,
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
import { CONFIG } from "@shared/constants/emojis";
import { STATUS } from "../../constants/emojis.js";


interface GuildConfig {
  id: string;
  discordGuildId: string;
  name: string;
  logChannelId?: string | null;
  dailyMessageChannelId?: string | null;
  adminLogChannelId?: string | null;
  [key: string]: any;
}

type ChannelType = "logs" | "daily" | "admin";

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

  // S'assurer que la guilde existe
  try {
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

  // Récupérer la configuration actuelle
  let currentLogChannel = null;
  let currentLogChannelName = null;
  let currentDailyChannel = null;
  let currentDailyChannelName = null;
  let currentAdminLogChannel = null;
  let currentAdminLogChannelName = null;

  try {
    const guildConfig = (await apiService.guilds.getGuildByDiscordId(
      guild.id
    )) as GuildConfig;

    if (guildConfig?.logChannelId) {
      currentLogChannel = guild.channels.cache.get(guildConfig.logChannelId);
      currentLogChannelName = currentLogChannel?.name || "Salon supprimé";
    }

    if (guildConfig?.dailyMessageChannelId) {
      currentDailyChannel = guild.channels.cache.get(
        guildConfig.dailyMessageChannelId
      );
      currentDailyChannelName =
        currentDailyChannel?.name || "Salon supprimé";
    }

    if (guildConfig?.adminLogChannelId) {
      currentAdminLogChannel = guild.channels.cache.get(
        guildConfig.adminLogChannelId
      );
      currentAdminLogChannelName =
        currentAdminLogChannel?.name || "Salon supprimé";
    }
  } catch (error) {
    logger.warn("Could not fetch current guild configuration:", { error });
  }

  // Créer l'embed de présentation avec boutons
  let embedDescription =
    "Configurez les salons pour recevoir les notifications automatiques du bot.\n\n";
  embedDescription += "**📋 Salon des logs :**\n";
  embedDescription +=
    "• Investissements dans les chantiers\n• Actions des personnages\n• Événements en temps réel\n";
  if (currentLogChannel) {
    embedDescription += `**Actuel :** ${currentLogChannel}\n\n`;
  } else {
    embedDescription += "**Actuel :** _Non configuré_\n\n";
  }

  embedDescription += "**🌅 Salon des messages quotidiens :**\n";
  embedDescription +=
    "• Message météo quotidien (08:00)\n• Récapitulatif des activités\n• Changements de saison\n";
  if (currentDailyChannel) {
    embedDescription += `**Actuel :** ${currentDailyChannel}\n\n`;
  } else {
    embedDescription += "**Actuel :** _Non configuré_\n\n";
  }

  embedDescription += "**📊 Salon des logs admin :**\n";
  embedDescription +=
    "• Utilisation de capacités améliorées (bonus)\n• Capacités taggant les admins\n• Détails des tirages de dés\n";
  if (currentAdminLogChannel) {
    embedDescription += `**Actuel :** ${currentAdminLogChannel}\n\n`;
  } else {
    embedDescription += "**Actuel :** _Non configuré_\n\n";
  }

  embedDescription +=
    "💡 _Vous pouvez utiliser le même salon pour tous les types de notifications._";

  const embed = createInfoEmbed(
    "⚙️ Configuration des salons",
    embedDescription
  );

  // Créer les boutons de sélection
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("config_logs_channel")
      .setLabel("📋 Configurer les logs")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("config_daily_channel")
      .setLabel("🌅 Configurer les messages quotidiens")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("config_admin_channel")
      .setLabel("📊 Configurer les logs admin")
      .setStyle(ButtonStyle.Primary)
  );

  const response = await interaction.reply({
    embeds: [embed],
    components: [row],
    flags: ["Ephemeral"],
  });

  try {
    const buttonInteraction = (await response.awaitMessageComponent({
      componentType: ComponentType.Button,
      time: 60000,
    })) as ButtonInteraction;

    let channelType: ChannelType;
    if (buttonInteraction.customId === "config_logs_channel") {
      channelType = "logs";
    } else if (buttonInteraction.customId === "config_daily_channel") {
      channelType = "daily";
    } else {
      channelType = "admin";
    }

    await showChannelSelection(buttonInteraction, channelType, {
      currentLogChannel,
      currentDailyChannel,
      currentAdminLogChannel,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("time")) {
      const timeoutEmbed = createWarningEmbed(
        "⏰ Temps écoulé",
        "La configuration a été annulée car aucune sélection n'a été faite dans le délai imparti."
      );

      await interaction.editReply({
        embeds: [timeoutEmbed],
        components: [],
      });
    }
  }
}

async function showChannelSelection(
  interaction: ButtonInteraction,
  channelType: ChannelType,
  currentChannels: {
    currentLogChannel: any;
    currentDailyChannel: any;
    currentAdminLogChannel: any;
  }
) {
  const guild = interaction.guild!;
  let currentChannel;
  if (channelType === "logs") {
    currentChannel = currentChannels.currentLogChannel;
  } else if (channelType === "daily") {
    currentChannel = currentChannels.currentDailyChannel;
  } else {
    currentChannel = currentChannels.currentAdminLogChannel;
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

  // Limiter à 25 salons (limite Discord)
  const channelsToShow = textChannels.first(25);

  const menuOptions: Array<{label: string; description: string; value: string; emoji?: string}> = channelsToShow.map((channel) => ({
    label: channel.name,
    description:
      channel.id === currentChannel?.id
        ? `Salon actuel: #${channel.name}`
        : `Salon: #${channel.name}`,
    value: channel.id,
    emoji: channel.id === currentChannel?.id ? CONFIG.SUCCESS : undefined,
  }));

  // Option pour désactiver
  if (currentChannel) {
    let disableLabel = "Aucun salon (désactiver)";
    let disableDescription = "Désactiver les logs";
    if (channelType === "logs") {
      disableDescription = "Désactiver les logs";
    } else if (channelType === "daily") {
      disableDescription = "Désactiver les messages quotidiens";
    } else {
      disableDescription = "Désactiver les logs admin";
    }

    menuOptions.push({
      label: disableLabel,
      description: disableDescription,
      value: "none",
      emoji: CONFIG.DISABLED,
    });
  }

  let placeholderText = "Choisissez un salon";
  if (channelType === "logs") {
    placeholderText = "Choisissez un salon pour les logs";
  } else if (channelType === "daily") {
    placeholderText = "Choisissez un salon pour les messages quotidiens";
  } else {
    placeholderText = "Choisissez un salon pour les logs admin";
  }

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(`select_${channelType}_channel`)
    .setPlaceholder(placeholderText)
    .addOptions(menuOptions);

  let typeLabel = "logs automatiques";
  let typeEmoji = CONFIG.LIST;

  if (channelType === "logs") {
    typeLabel = "logs automatiques";
    typeEmoji = CONFIG.LIST;
  } else if (channelType === "daily") {
    typeLabel = "messages quotidiens";
    typeEmoji = CONFIG.SUNRISE;
  } else {
    typeLabel = "logs admin";
    typeEmoji = STATUS.STATS;
  }

  let embedDescription = `Choisissez le salon pour **${typeLabel}**.\n\n`;

  if (channelType === "logs") {
    embedDescription +=
      "Les logs incluent :\n• Investissements dans les chantiers\n• Actions des personnages\n• Événements en temps réel\n\n";
  } else if (channelType === "daily") {
    embedDescription +=
      "Les messages quotidiens incluent :\n• Message météo (08:00)\n• Récapitulatif des activités\n• Changements de saison\n\n";
  } else {
    embedDescription +=
      "Les logs admin incluent :\n• Utilisation de capacités améliorées (bonus)\n• Capacités taggant les admins\n• Détails des tirages de dés\n\n";
  }

  if (currentChannel) {
    embedDescription += `**Salon actuel :** ${currentChannel}\n`;
    embedDescription +=
      "💡 Sélectionnez un autre salon pour le changer, ou 'Aucun salon' pour désactiver.";
  } else {
    embedDescription += `${STATUS.INFO} Aucun salon n'est actuellement configuré.`;
  }

  let embedTitle = `${typeEmoji} Configuration `;
  if (channelType === "logs") {
    embedTitle += "des logs";
  } else if (channelType === "daily") {
    embedTitle += "des messages quotidiens";
  } else {
    embedTitle += "des logs admin";
  }

  const embed = createInfoEmbed(embedTitle, embedDescription);

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    selectMenu
  );

  await interaction.update({
    embeds: [embed],
    components: [row],
  });

  try {
    const selectInteraction = (await interaction.message.awaitMessageComponent({
      componentType: ComponentType.StringSelect,
      time: 60000,
    })) as StringSelectMenuInteraction;

    const selectedChannelId = selectInteraction.values[0];

    if (selectedChannelId === "none") {
      // Désactiver
      if (channelType === "logs") {
        await apiService.updateGuildLogChannel(guild.id, null);
      } else if (channelType === "daily") {
        await apiService.updateGuildDailyMessageChannel(guild.id, null);
      } else {
        await apiService.updateGuildAdminLogChannel(guild.id, null);
      }

      let logType = "Log";
      if (channelType === "daily") {
        logType = "Daily message";
      } else if (channelType === "admin") {
        logType = "Admin log";
      }

      logger.info(
        `${logType} channel disabled for guild ${guild.id}`
      );

      let disabledMessage = "L'envoi automatique des logs a été désactivé.";
      if (channelType === "daily") {
        disabledMessage = "L'envoi automatique des messages quotidiens a été désactivé.";
      } else if (channelType === "admin") {
        disabledMessage = "L'envoi automatique des logs admin a été désactivé.";
      }

      const successEmbed = createWarningEmbed(
        `🚫 ${typeLabel} désactivés`,
        disabledMessage
      );

      await selectInteraction.update({
        embeds: [successEmbed],
        components: [],
      });
      return;
    }

    const selectedChannel = guild.channels.cache.get(selectedChannelId);

    if (!selectedChannel) {
      return replyEphemeral(
        selectInteraction,
        "Le salon sélectionné n'existe plus."
      );
    }

    // Sauvegarder
    if (channelType === "logs") {
      await apiService.updateGuildLogChannel(guild.id, selectedChannelId);
    } else if (channelType === "daily") {
      await apiService.updateGuildDailyMessageChannel(guild.id, selectedChannelId);
    } else {
      await apiService.updateGuildAdminLogChannel(guild.id, selectedChannelId);
    }

    let logType = "Log";
    if (channelType === "daily") {
      logType = "Daily message";
    } else if (channelType === "admin") {
      logType = "Admin log";
    }

    logger.info(
      `${logType} channel configured for guild ${guild.id}: ${selectedChannelId}`
    );

    let typeDisplay = "📋 Logs automatiques";
    if (channelType === "daily") {
      typeDisplay = "🌅 Messages quotidiens";
    } else if (channelType === "admin") {
      typeDisplay = "📊 Logs admin";
    }

    const successEmbed = createSuccessEmbed(
      `${STATUS.SUCCESS} Salon configuré avec succès`,
      `Le salon ${selectedChannel} a été enregistré pour ${typeLabel}.`
    ).addFields([
      {
        name: "Salon",
        value: `${selectedChannel}`,
        inline: true,
      },
      {
        name: "Type",
        value: typeDisplay,
        inline: true,
      },
    ]);

    await selectInteraction.update({
      embeds: [successEmbed],
      components: [],
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("time")) {
      const timeoutEmbed = createWarningEmbed(
        "⏰ Temps écoulé",
        "La configuration a été annulée car aucune sélection n'a été faite."
      );

      await interaction.editReply({
        embeds: [timeoutEmbed],
        components: [],
      });
    } else {
      logger.error("Error in channel selection:", { error });
    }
  }
}
