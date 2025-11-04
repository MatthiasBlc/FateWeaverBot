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
  [key: string]: any;
}

type ChannelType = "logs" | "daily";

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

  embedDescription +=
    "💡 _Vous pouvez utiliser le même salon pour les deux types de notifications._";

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

    const channelType: ChannelType =
      buttonInteraction.customId === "config_logs_channel" ? "logs" : "daily";

    await showChannelSelection(buttonInteraction, channelType, {
      currentLogChannel,
      currentDailyChannel,
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
  }
) {
  const guild = interaction.guild!;
  const currentChannel =
    channelType === "logs"
      ? currentChannels.currentLogChannel
      : currentChannels.currentDailyChannel;

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
    menuOptions.push({
      label: "Aucun salon (désactiver)",
      description: `Désactiver ${channelType === "logs" ? "les logs" : "les messages quotidiens"}`,
      value: "none",
      emoji: CONFIG.DISABLED,
    });
  }

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(`select_${channelType}_channel`)
    .setPlaceholder(
      `Choisissez un salon pour ${channelType === "logs" ? "les logs" : "les messages quotidiens"}`
    )
    .addOptions(menuOptions);

  const typeLabel =
    channelType === "logs" ? "logs automatiques" : "messages quotidiens";
  const typeEmoji = channelType === "logs" ? CONFIG.LIST : CONFIG.SUNRISE;

  let embedDescription = `Choisissez le salon pour **${typeLabel}**.\n\n`;

  if (channelType === "logs") {
    embedDescription +=
      "Les logs incluent :\n• Investissements dans les chantiers\n• Actions des personnages\n• Événements en temps réel\n\n";
  } else {
    embedDescription +=
      "Les messages quotidiens incluent :\n• Message météo (08:00)\n• Récapitulatif des activités\n• Changements de saison\n\n";
  }

  if (currentChannel) {
    embedDescription += `**Salon actuel :** ${currentChannel}\n`;
    embedDescription +=
      "💡 Sélectionnez un autre salon pour le changer, ou 'Aucun salon' pour désactiver.";
  } else {
    embedDescription += `${STATUS.INFO} Aucun salon n'est actuellement configuré.`;
  }

  const embed = createInfoEmbed(
    `${typeEmoji} Configuration ${channelType === "logs" ? "des logs" : "des messages quotidiens"}`,
    embedDescription
  );

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
      } else {
        await apiService.updateGuildDailyMessageChannel(guild.id, null);
      }

      logger.info(
        `${channelType === "logs" ? "Log" : "Daily message"} channel disabled for guild ${guild.id}`
      );

      const successEmbed = createWarningEmbed(
        `🚫 ${typeLabel} désactivés`,
        `L'envoi automatique ${channelType === "logs" ? "des logs" : "des messages quotidiens"} a été désactivé.`
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
    } else {
      await apiService.updateGuildDailyMessageChannel(guild.id, selectedChannelId);
    }

    logger.info(
      `${channelType === "logs" ? "Log" : "Daily message"} channel configured for guild ${guild.id}: ${selectedChannelId}`
    );

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
        value:
          channelType === "logs" ? "📋 Logs automatiques" : "🌅 Messages quotidiens",
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
