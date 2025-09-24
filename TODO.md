-------------------------Todo-------------------------

Server:
rôle est une suite de chiffres ?
si character name est null alors prendre nom du compte

@bot
lors d'une commande par un utilisateur, on regarde toujours si:
son discordId existe, si non on créer l'utilisateur.
son guildId existe, si non on créer le serveur.
son characterId existe, si non on créer le personnage.

lorsqu'un utilisateur fait une commande /profile dans le @bot
On regarde si so discordId et guildId existent dans la base de données
si non on les ajoute
si oui on les met à jour

Gestion des PA:
@backend
chaque utilisateurs a deux PA par jour .
chaque PA peut être individuellement conservé un maximum de 48h.
Nous avons donc un maximum de 4PA sur un utilisateur.
le total de PA >= 0 et toujours <= 4.
@bot
avec la commande /profil, on affiche le nombre de PA restant.

-------------------------Done-------------------------
@backend
Un utilisateur est défini par son discordId et son guildId

-------------------------Notes-------------------------
le backend est dans @backend

Il existe une liste de chantiers
chaque chantier est composé de :
un nom, une date de début, un nombre de PA requis pour le contruire (cout en PA), un nombre de PA investi dedans (débuteà 0), un statut (plan : 0PA dedans et n'a pas été encore sélectionné, en cours de construction : des PA ont été investis dedans mais il y en a moins que le nombre requis, Terminé si le nombre investit = au cout.)
Il ne peut pas y avoir plus de PA investit dans un chantier que le cout du chantier.

Les administrateurs peuvent créer un nouveau chantier à ajouter à la liste en reseignant :
nom et cost

Les utilisateurs peuvent investir leurs PA tant qu'ils en ont (nombre de PA >0) dans les chantiers pour les construire.

le bot est dans @bot

avec /profil un utilisateur peut voir son nombre de PA restant

une commande spéciale /addch disponible uniquement aux admins du serveur permet de créer un nouveau chantier à ajouter à la liste

avec /chantier, les utilisateurs peuvent voir une liste déroulante des chantiers, en choisir un (voir le nombre de PA investi/cout dans la liste) et indiquer le nombre de PA qu'ils veulent investir dedans.
valider la commande retire ce nombre de PA du user et les ajoute au total investi du chantier choisi

Les utilisateurs peuvent investir leurs PA tant qu'ils en ont (nombre de PA >0) dans les chantiers pour les construire.
