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
import { apiService } from "../../services/api.js";
import { logger } from "../../services/logger.js";

export async function handleConfigChannelCommand(interaction: CommandInteraction) {
  if (!interaction.guild) {
    return interaction.reply({
      content: "Cette commande ne peut être utilisée que dans un serveur.",
      flags: ["Ephemeral"],
    });
  }

  // Vérifier les permissions d'administrateur
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({
      content: "Vous devez être administrateur pour utiliser cette commande.",
      flags: ["Ephemeral"],
    });
  }

  const guild = interaction.guild;

  // Récupérer le serveur actuel pour voir s'il y a déjà un salon configuré
  let currentLogChannel = null;
  let currentLogChannelName = null;
  try {
    const server = await apiService.getServerByDiscordId(guild.id);
    if (server && server.logChannelId) {
      currentLogChannel = guild.channels.cache.get(server.logChannelId);
      currentLogChannelName = currentLogChannel ? currentLogChannel.name : "Salon supprimé";
    }
  } catch (error) {
    logger.warn("Could not fetch current server configuration:", { error });
  }

  const textChannels = guild.channels.cache.filter(
    (channel) =>
      channel.type === 0 && // TextChannel
      channel.permissionsFor(interaction.user)?.has(PermissionFlagsBits.SendMessages)
  );

  if (textChannels.size === 0) {
    return interaction.reply({
      content: "Aucun salon textuel accessible n'a été trouvé.",
      flags: ["Ephemeral"],
    });
  }

  // Limiter à 25 salons maximum (limite Discord)
  const channelsToShow = textChannels.first(25);

  // Construire les options du menu déroulant
  const menuOptions = channelsToShow.map((channel) => ({
    label: channel.name,
    description: channel.id === currentLogChannel?.id ? `Salon actuel: #${channel.name}` : `Salon: #${channel.name}`,
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
  let embedDescription = "Choisissez le salon dans lequel les logs automatiques seront envoyés.\n\n";
  embedDescription += "Les logs incluent :\n";
  embedDescription += "• Les investissements dans les chantiers\n";
  embedDescription += "• Les actions des personnages\n";
  embedDescription += "• Autres événements automatiques\n\n";

  if (currentLogChannel) {
    embedDescription += `**Salon actuel :** ${currentLogChannel} (ID: ${currentLogChannel.id})\n`;
    embedDescription += "💡 Sélectionnez un autre salon pour le changer, ou choisissez 'Aucun salon' pour désactiver les logs.";
  } else {
    embedDescription += "ℹ️ Aucun salon n'est actuellement configuré pour les logs.";
  }

  const embed = new EmbedBuilder()
    .setColor("#0099ff")
    .setTitle("⚙️ Configuration du salon de logs")
    .setDescription(embedDescription);

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

  const response = await interaction.reply({
    embeds: [embed],
    components: [row],
    flags: ["Ephemeral"],
  });

  try {
    const selectInteraction = await response.awaitMessageComponent({
      componentType: ComponentType.StringSelect,
      time: 60000, // 1 minute
    }) as StringSelectMenuInteraction;

    const selectedChannelId = selectInteraction.values[0];

    if (selectedChannelId === "none") {
      // Désactiver les logs
      await apiService.updateServerLogChannel(guild.id, null);

      logger.info(`Log channel disabled for guild ${guild.id}`);

      const successEmbed = new EmbedBuilder()
        .setColor("#ff9900")
        .setTitle("🚫 Logs désactivés")
        .setDescription("L'envoi automatique des logs a été désactivé.")
        .addFields([
          {
            name: "Serveur",
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
      return selectInteraction.reply({
        content: "Le salon sélectionné n'existe plus.",
        flags: ["Ephemeral"],
      });
    }

    // Sauvegarder dans la base de données
    await apiService.updateServerLogChannel(guild.id, selectedChannelId);

    logger.info(`Log channel configured for guild ${guild.id}: ${selectedChannelId}`);

    const successEmbed = new EmbedBuilder()
      .setColor("#00ff00")
      .setTitle("✅ Salon configuré avec succès")
      .setDescription(`Le salon ${selectedChannel} a été enregistré pour les logs automatiques.`)
      .addFields([
        {
          name: "Salon",
          value: `${selectedChannel}`,
          inline: true,
        },
        {
          name: "Serveur",
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
      const timeoutEmbed = new EmbedBuilder()
        .setColor("#ff9900")
        .setTitle("⏰ Temps écoulé")
        .setDescription("La configuration a été annulée car aucune sélection n'a été faite dans le délai imparti.");

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
