# IDEE

Je développe un jeu de rôle sur serveur discord.
Mon architecture est un serveur NodeJS express avec une db PSQL prisma. Mon bot est développé en TS node.
Les joueurs ont tous un personnage et font partie d'une ville.
J'ai implémenté un système d'expédition et avoir des groupes de joueurs qui s'organisent pour partir en groupe.
J'aimerais augmenter immersion et voici mon idée.

Serait-il possible d'automatiquement créer un channel dédié à l'expédition quand elle passe en Created ?
Faire en sorte que seuls les membre de l'expédition puissent voir le channel.
lorque l'expédition passe en DEPARTED, les membres de l'expédition ne devrait plus avoir accés à certains autres channels du discord (que l'on va appeller les channels de la ville). Les personnes hors de l'expédition (hors admin) ne devrait plus pouvoir voir ce channel en question.
Le but est de simuler une isolation entre les channels roleplay de la ville et les channels roleplay des expéditions.
Lorsque l'expédition est RETURNED, les membres de l'expédition récupèrent à nouveau l'accès aux channels de la ville.

Est-ce possible ? ou pas exactement comme ça ?

# REPONSE THEORIQUE

Excellente idée 💡 — et oui, c’est tout à fait possible avec ton architecture actuelle (Node.js + bot Discord en TypeScript).
Discord permet de gérer dynamiquement la visibilité des channels par utilisateur ou par rôle via les permission overwrites de la Discord API.

👉 En résumé, ton idée est réalisable à 100 %, avec quelques nuances techniques à gérer.
Voici comment tu peux mettre ça en place proprement :

⚙️ Schéma général de fonctionnement

1. Quand une expédition passe en Created

Ton bot crée automatiquement un channel texte dédié à cette expédition :

const expeditionChannel = await guild.channels.create({
name: `expédition-${expedition.id}`,
type: ChannelType.GuildText,
parent: expeditionCategoryId, // optionnel
permissionOverwrites: [
{ id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] }, // tout le monde ne voit pas
...expedition.members.map(m => ({
id: m.discordId,
allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
})),
],
});

Seuls les membres de l’expédition (et éventuellement les admins) peuvent voir ce channel.

Tu stockes expeditionChannel.id dans ta DB (channelId sur la table Expedition via Prisma).

2. Quand l’expédition passe en DEPARTED

Tu veux simuler leur départ de la ville.
Tu peux donc :

Retirer les permissions "ville" des membres de l’expédition.

Empêcher les autres joueurs de voir le channel d’expédition (ils restent donc "en ville").

Deux stratégies possibles :

🧩 Option 1 : Par rôles

Tu attribues un rôle @EnExpédition aux joueurs qui partent.

Tu retires leur rôle @EnVille temporairement.

Les channels de la ville ont une permission :

{ id: roleExpeditionId, deny: [PermissionsBitField.Flags.ViewChannel] }

Le channel d’expédition autorise :

{ id: roleExpeditionId, allow: [PermissionsBitField.Flags.ViewChannel] }

✅ Avantage : beaucoup plus scalable, simple à gérer.
❌ Inconvénient : si plusieurs expéditions partent, elles partagent le même rôle — il faut donc gérer les cas où un joueur est dans une expédition mais revient plus tôt.

🧩 Option 2 : Par permissions individuelles

À chaque départ d’expédition :

Tu modifies les permissions des channels de la ville pour deny ViewChannel aux membres de l’expédition.

Et inversement pour les channels d’expédition.

✅ Avantage : isolation totale, chaque expédition a ses propres permissions.
❌ Inconvénient : plus de requêtes API Discord → à limiter ou à mettre en cache.

3. Quand l’expédition passe en RETURNED

Tu réattribues les permissions initiales :

Soit tu réappliques le rôle @EnVille.

Soit tu rétablis les overwrites pour chaque membre.

Tu peux aussi archiver ou supprimer le channel d’expédition :

await expeditionChannel.setParent(archiveCategoryId);
// ou
await expeditionChannel.delete("Expédition terminée");

🧱 Architecture recommandée
Élément Action principale
DB Prisma Table Expedition : status, channelId, members[]
Webhook / Listener Événement onExpeditionStatusChange()
Discord Bot Service Fonctions utilitaires : createExpeditionChannel(), updatePermissionsOnDeparture(), restoreCityAccess()
Permissions Utilise les permissionOverwrites ou un système de rôles dynamiques
🧩 Exemple de logique d’état
État Action Discord Accès membres expédition Accès autres joueurs
CREATED Créer channel expédition ✅ Visible ❌ Invisible
DEPARTED Masquer channels de la ville, garder channel expédition ✅ Seulement channel expédition ✅ Ville visible
RETURNED Restaurer accès ville, supprimer ou archiver expédition ✅ Ville visible ✅ Ville visible
🧠 Conseils pratiques

Crée une catégorie Discord par type de channel (Ville / Expéditions / Archives).

Limite les modifications d’overwrites (Discord rate-limit si trop de requêtes).

Implémente une file d’attente d’actions Discord (pour éviter les collisions API).

Sauvegarde les permissions initiales des channels (en JSON) si tu fais du overwrite dynamique.

Les rôles sont ta meilleure arme pour la scalabilité.

# AVIS

Plusieurs expéditions simultanées sont possible et je n'ai pas beaucoup de joueurs simultatnés (max 10 par là).
Je pense que l'option 2 est la meilleure pour moi.
