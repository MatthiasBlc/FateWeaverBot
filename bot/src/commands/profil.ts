import {
  SlashCommandBuilder,
  EmbedBuilder,
  type GuildMember,
} from "discord.js";
import type { Command } from "../types/command";
import { withUser } from "../middleware/ensureUser";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("profil")
    .setDescription("Affiche votre profil et vos informations"),

  execute: withUser(async (interaction) => {
    // Le middleware withUser s'occupe déjà de vérifier/créer l'utilisateur, le serveur et le personnage
    const member = interaction.member as GuildMember;
    const user = interaction.user;
    const guild = interaction.guild!;

    // Vérifier si on peut accéder aux propriétés du membre
    if (!("joinedTimestamp" in member) || !member.joinedTimestamp) {
      await interaction.reply({
        content: "Je n'ai pas pu récupérer la date d'arrivée sur ce serveur.",
        ephemeral: true,
      });
      return;
    }

    // Créer un embed pour afficher les informations du profil
    const embed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle(`Profil de ${member.user.username}`)
      .setThumbnail(user.displayAvatarURL())
      .addFields(
        { name: "👤 Pseudo", value: user.username, inline: true },
        { name: "🆔 ID", value: user.id, inline: true },
        {
          name: "📅 Membre depuis",
          value: new Date(member.joinedTimestamp).toLocaleDateString(),
          inline: true,
        },
        { name: "🏠 Serveur", value: guild.name, inline: true },
        {
          name: "👑 Rôle",
          value: member.roles.highest?.toString() || "Aucun rôle",
          inline: true,
        }
      )
      .setFooter({
        text: `Profil de ${user.tag}`,
        iconURL: user.displayAvatarURL(),
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }),
};

export default command;
