-------------------------Done-------------------------

@backend
Un utilisateur est défini par son discordId et son guildId

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

Pour chaque serveur, il existe une liste de chantiers
chaque chantier est composé de :
un nom,
une date de début (date à laquelle le premier PA a été investi, nul de base),
un cout en PA (un nombre de PA requis pour le contruire),
un nombre de PA investi dedans (débute à 0),
un statut

- plan : 0PA dedans et n'a pas été encore sélectionné (date de début à nul),
- en cours de construction : des PA ont été investis dedans mais il y en a moins que le nombre total requis,
- Terminé : si le nombre investit == au cout.

Les characters ayants le rôle admin, ADMIN_ROLE dans le .env, et seulement eux peuvent créer un nouveau chantier à ajouter à la liste en utilisant la commande /addch et en reseignant :
nom et cost

Les utilisateurs peuvent investir leurs PA tant qu'ils en ont (nombre de PA >0) dans les chantiers pour les construire.
Exemple Si un utilisateur a 1PA en stock et qu'il veut en utiliser 2, son PA est retiré et seulement 1 PA est investi dans le chantier.

avec /chantier, les utilisateurs peuvent voir une liste déroulante des chantiers, en choisir un (voir le nombre de PA investi/cout dans la liste) et indiquer le nombre de PA qu'ils veulent investir dedans.
valider la commande retire ce nombre de PA du user et les ajoute au total investi du chantier choisi

Il ne peut pas y avoir plus de PA investit dans un chantier que le cout du chantier.
Exemple un character a 3PA, un chantier est à 8/10, même si le character veut investir 3 PA seulement 2 seront retirés de sa réserve et 2 investis dans le chantier. Son dernier PA reste en réserve.

ajouter delete et add chantier en sous commandes

PA est strictement positif et <=4

Ajouter un log global des actions?

Utiliser une commande admin avec des sous commandes si besoin ?

#guild
Rename server -> guil pour plus de cohérence discord.
Rename serveur en guild là ou il faut ✅

# ville

🏙️ Ville : nouvelle entité
Ajout d’un modèle Ville
Champs :
id
name
foodStock (int) : stock de vivres disponibles.
serverId : FK vers le serveur.
Chaque serveur a une ville (relation 1:1).
Les personnages sont liés à leur ville via leur serveur.
Les chantiers sont désormais liés à une ville
Ajout d’une FK villeId dans les chantiers.
À adapter dans les endpoints de création et de lecture.
les chantiers ne doivent plus être reliés aux serveurs directement mais aux villes.
Les villes sont la passerelle entre chantier et serveurs
Création automatique de ville : Quand un serveur est créé via
upsertServer
, une ville par défaut est automatiquement créée

Implémenter une nouvelle mécanique de faim dans le jeu Discord basé sur les personnages (characters), en ajoutant :
un suivi de la faim des personnages,
une commande utilisateur pour faire manger leur personnage,
un système de vivres rattaché à une ville,
des conséquences en cas de repas manqués,
et une intégration avec le canal de log pour afficher les événements.

📌 Faim : règles et stockage
Ajout d’un champ hungerLevel dans le modèle Character
Type : enum numérique avec les états suivants :
0 - En bonne santé
1 - Faim
2 - Affamé (1 repas raté)
3 - Faim prolongée (2 repas ratés)
4 - Mort (3 repas ratés)

Ce champ représente l’état actuel de la faim d’un personnage.
Par défaut : 0.
Conséquences de la faim (à intégrer dans le système de régénération de PA) :
Affamé (niveau 2) : ne récupère que 1 PA au lieu de 2.
Faim prolongée (niveau 3) : nécessite 2 repas pour revenir au niveau 2.
Mort (niveau 4) : le personnage est considéré comme inactif. Il ne peut plus agir.
Ajout d’un CRON (ou traitement périodique déclenché par le bot) qui :
Tous les 2 jours (ou 1 fois par jour si la logique est intégrée au CRON existant),
Vérifie si un personnage n’a pas mangé (à définir via une date lastMealAt ou autre méthode),
Incrémente hungerLevel d’un cran,
Applique les conséquences correspondantes.

#eat
Manger
1 unité de nourriture / pers / 2 jours

Prévoir un channel avec un bot
Nous ajoutons les unités selon les évènements
Les joueurs mangent en mettant un message

1 jour raté = 1/2 PA
2 jours ratés = hospit (besoin double dose)
3 jours ratés = morts

🍽️ Commande /manger
Description :
Commande utilisateur permettant de nourrir son personnage.
Quand le personnage mange :
1 vivre est consommé dans la ville.
Son niveau de faim diminue de 1 (sauf cas particulier).
Un message est envoyé dans le channel de log configuré :
🍽️ Le personnage X a mangé.
Conditions :
Le personnage ne doit pas être mort (hungerLevel < 4).
La ville doit avoir au moins 1 unité de vivre.
Ne consomme pas de PA.
Cas particuliers :
Si le personnage est au niveau 3 (faim prolongée), il doit manger 2 fois (donc 2 unités de vivre) pour passer au niveau 2.
Si le personnage est au niveau 4 (mort), la commande est bloquée (option : prévoir une future mécanique de résurrection).

🔁 Backend à mettre à jour
Modifications :
characters :
Champ hungerLevel (enum int, default 0).
Optionnel : champ lastMealAt pour tracer le dernier repas (si besoin de logique temporelle fine).
villes (nouvelle table) :
Champs : id, name, foodStock, guildId.
chantiers :
Ajouter FK villeId.
Nouveaux endpoints (proposition) :
POST /api/characters/:characterId/eat
Vérifie la faim, la ville, le stock.
Diminue foodStock de la ville.
Met à jour hungerLevel.
Retourne l’état du personnage.
POST /api/villes/:villeId/add-food (facultatif)
Pour réapprovisionner en vivres (admin ? futur chantier ?).

🧠 Logique à intégrer dans le bot
Commande utilisateur /manger
Récupère le personnage et sa ville.
Appelle l’endpoint /characters/:id/eat.
Affiche le résultat au joueur.
Envoie un message dans le channel de log (déjà stocké via logChannelId du Guild).
Mise à jour du service de régénération de PA :
Intégrer la logique de faim :
Si hungerLevel == 2, ne régénère que 1 PA.
Si hungerLevel >= 3, ne régénère pas du tout.
(Déjà possible via daily-pa.cron.ts ou à adapter)
Facultatif : commande admin /ville vivres pour afficher ou modifier le stock de vivres.

✅ Résultat attendu
Le joueur peut nourrir son personnage (si encore en vie) via /manger.
Le stock de vivres est décrémenté automatiquement.
La faim affecte la régénération de PA.
Si un personnage meurt de faim, il ne peut plus agir (investir, se déplacer, etc.).
Les actions sont loguées dans le salon configuré pour le serveur.

🧪 Bonus :
Intégrer la faim dans les messages d’investissement (X a investi Y PA → X (Affamé) a investi Y PA).

# eat Ajouts

Système de CRON pour l'augmentation automatique de la faim (tous les 2 jours)
On va ajouter des Commandes admin pour gérer le stock de vivres. Pour la commande Add, faire un promt avec un int demandé

Effets visuels avancés dans les embeds
Ajouter un effet visuel ou embed spécial dans /profil pour refléter l’état de faim du personnage.

empécher de manger si faim ==0

retrait de /foodstock-admin, /foodstock-view est suffisant

Mettre à jour l'affichage du profil pour montrer l'état de faim
Créer une commande admin pour gérer les stocks de vivres des villes

Créer une commande admin pour gérer les stocks de vivres des villes

Créer une commande admin pour gérer un character : ses PA (ajout ou retrait), sa faim (changement de statut)

Ajouter un bouton manger à la commande foodstock
Il faut que le bouton ne soit visible que si le character n'a pas "faim ==0 ou qu'il est mort"
Il faut que le user voit son status à côté du bouton

est-ce que foodstock-admin est ephemeral ?

Inverser échelle hunger (0->4)

Update deploy script

Multi character / villes

Update du système de boutons

character admin, bouton tuer uniquement si personnage en vie.

Refacto character-admin.handler

Ville has 1 foodstock
Foodstock is foodstock
Foodstock has many Ville
Exped is Ville

À création Foodstock exped < Foodstock Ville
Après création FE > FV

Fin d'exped : FE → FV

PV

✅ ❤️ ❤️ ❤️ 🖤 🖤
✅ ❤️‍🩹 🖤 🖤 🖤 🖤
✅ 💜 💜 💜 🖤 🖤
✅ Profil : rôle bug

✅ Passer expéditions en jours et non pas en heure.

✅Expedition create message invisible mais log

Expedition info
✅->membres 0 ?
✅-> ajouter liste des membres
✅->bouton quitter non fonctionnel
✅-> bouton Transférer nourriture non fonctionnel
✅-> ajouter égalemetn un log au transfert

✅Expedition join log
✅expedition leave log

✅Ajouter la liste des membres dans expédition-admin
✅Bouton gérer les membres expédition-admin

## ✅ fichier config emoji (COMPLÉTÉ)

✅ Regrouper les emoji dans un fichier de "config" pour que l'on puisse les changer partout tous d'un coup plus facilement
-> Fichier créé : `bot/src/constants/emojis.ts`

## Update des commandes

### Commandes Utilisateurs

✅ /help
-> ✅ actualiser et rendre plus lisible avec des catégories etc (COMPLÉTÉ - Phase 3.2)

✅ /profil (COMPLÉTÉ - Phase 4)
-> ✅ un bouton "manger" et un "manger +". si faim <=0 ou >=4 alors on affiche ces boutons.

    -> ✅ En Ville (pas dans une expédition avec status : DEPARTED)
      -> ✅ le bouton "manger" fait manger 1 de nourriture venant de la ville, s'il n'y en a pas, il fait manger 1 vivre venant de la ville, s'il n'y en a pas erreur (plus rien à manger en ville).
      -> ✅ le bouton "manger +" ouvre un message éphémère avec : état de la faim, état des stocks de vivres dans la ville et nourriture dans la ville avec une alerte de pénurie. La nourriture n'apparait que si la ressource nourriture existe dans le ResourceStock de la ville du character. Ce message propose 4 boutons:
        -> ✅ manger 1 vivre (venant du stock de la ville)
        -> ✅ manger 1 nourriture (venant du stock de la ville). Le bouton nourriture n'apparait que si le stock de nourriture >0 dans le ResourceStock de la ville du character
        -> ✅ manger à sa faim des vivres (mange des vivres jusqu'a être a 4/4 en faim), entre parenthèse il doit y avoir le nombre de vivre consommé. S'il faut consommer 3 vivres mais qu'il en reste 2, alors mettre 2 entre parenthèse et ne consommer que deux vivres. Le bouton ne s'affiche que s'il faut consommer plus d'un seul vivre pour être à 4/4.
        -> ✅ manger à sa faim de la nourriture (mange des nourritures jusqu'a être a 4/4 en faim), entre parenthèse il doit y avoir le nombre de nourriture consommé. S'il faut consommer 3 nourritures mais qu'il en reste 2, alors mettre 2 entre parenthèse et ne consommer que deux nourritures. Le bouton ne s'affiche que s'il faut consommer plus d'une seule nourriture pour être à 4/4. le bouton ne s'affiche que s'il y a au minimum 2 nourriture en stock de la ville.
    -> ✅ En Expédition avec status : DEPARTED
      -> ✅ le bouton "manger" fait manger 1 de nourriture venant de l'Expédition, s'il n'y en a pas, il fait manger 1 vivre venant de l'Expédition, s'il n'y en a pas erreur (plus rien à manger dans l'Expédition).
      -> ✅ le bouton "manger +" ouvre un message éphémère avec : état de la faim, état des stocks de vivres dans l'Expédition et nourriture dans l'Expédition avec une alerte de pénurie. La nourriture n'apparait que si la ressource nourriture existe dans le ResourceStock de l'Expédition du character. Ce message propose 4 boutons:
        -> ✅ manger 1 vivre (venant du stock de l'Expédition)
        -> ✅ manger 1 nourriture (venant du stock de l'Expédition). Le bouton nourriture n'apparait que si le stock de nourriture >0 dans le ResourceStock de l'Expédition du character
        -> ✅ manger à sa faim des vivres (mange des vivres jusqu'a être a 4/4 en faim), entre parenthèse il doit y avoir le nombre de vivre consommé. S'il faut consommer 3 vivres mais qu'il en reste 2, alors mettre 2 entre parenthèse et ne consommer que deux vivres. Le bouton ne s'affiche que s'il faut consommer plus d'un seul vivre pour être à 4/4.
        -> ✅ manger à sa faim de la nourriture (mange des nourritures jusqu'a être a 4/4 en faim), entre parenthèse il doit y avoir le nombre de nourriture consommé. S'il faut consommer 3 nourritures mais qu'il en reste 2, alors mettre 2 entre parenthèse et ne consommer que deux nourritures. Le bouton ne s'affiche que s'il faut consommer plus d'une seule nourriture pour être à 4/4. le bouton ne s'affiche que s'il y a au minimum 2 nourriture en stock de l'Expédition.

✅ /stock (COMPLÉTÉ - Phase 3.1)
-> ✅ retirer 👤 Votre Personnage **character name** (**faim**)
-> ✅ retirer le total de ressources
-> ✅ retirer cette phrase : Stock actuel de toutes les ressources de la ville Owl's Lab City (ville de votre personnage ChatMot).
-> ✅ trier les ressources par types : nourriture + vivres et le reste (tout de même groupé deux par deux, produit brut puis sa transformation)
-> ✅ ok comme ça pour l'instant, semble fonctionner correctement

✅ /foodstock (COMPLÉTÉ - Phase 1)
-> ✅ Commande supprimée (plus utilisée)

✅ /manger (COMPLÉTÉ - Phase 1)
-> ✅ Commande supprimée (plus utilisée)

✅ /ping (COMPLÉTÉ - Phase 1)
-> ✅ Commande supprimée (plus utilisée)

✅ /expedition (COMPLÉTÉ - Phases 5.1 + 5.2)
-> ✅ Ne devrait plus avoir de sous commandes (tout est géré par la commande /expedition directement avec des boutons)

-> ✅ lorsque l'on est dans une expédition qui n'est pas encore en status DEPARTED, un bouton "transferer la nourriture" doit ouvrir une modale avec deux champs et gérer les deux ressources en transfert. il doit aussi gérer de manière ergonomique le transfert de vivres et / ou nourriture vers la ville et inversement. Un second bouton quitter l'expédition doit être présent. (COMPLÉTÉ - Phase 5.1)
-> ✅ lorsque l'on est dans une expédition en status DEPARTED, il devrait y avoir un bouton "retour de l'expédition en urgence".
Ce bouton agit comme un togglable, si au moins la moitié des membres d'une expédition (hors isdead true ou agonie) appuie sur le bouton, alors l'expédition est retournée en urgence. Rappuyer sur le bouton doit annuler l'opt-in pour le retour en urgence. Un retour en urgence validé fait rentrer l'expédition lors du prochain cron avec le status RETURNED, a condition que tous les membres ne soient pas en isdead = true à ce moment là. (COMPLÉTÉ - Phase 5.2)

✅ /chantiers (COMPLÉTÉ - Phases 6.1 + 6.2)
-> ✅ actuellement la commande a deux sous commandes : liste et build.
-> ✅ Remplacer par une commande sans sous commande : /chantier donne la liste des chantiers, un bouton "participer" renvoie sur l'ancien message de build : liste déroulante des chantiers, choix de celui pour lequel l'on veut participer, modale demandant le nombre de PA et gérant toutes les erreurs, investissement des PA dans le chantier.
->-> ✅ Actuellement, un chantier a un nom et ne coute que des PA. Il faudrait qu'un chantier puisse avoir un cout supllémentaire dans nimporte quelle ressource. (une ou plusieurs ressources) (voir commande chantier-admin)

✅ /chantiers-admin (COMPLÉTÉ - Phase 6.2)
-> ✅ Actuellement, un chantier a un nom et ne coute que des PA. Il faudrait qu'un chantier puisse avoir un cout supllémentaire dans nimporte quelle ressource. (une ou plusieurs ressources)

### ✅ Étape 2 – Refactor du bot (COMPLÉTÉE)

- ✅ Composants modulaires et DRY
- ✅ Services, utils et constantes regroupés
- ✅ ARCHITECTURE.md créé

### ✅ Étape 6 – Isolation contexte (COMPLÉTÉ)

**Objectif** : Projet "Claude-friendly"

**Réalisé :**

- ✅ Système 3-tier créé (.claude/context-optimization.md)
- ✅ CLAUDE.md optimisé (214 → 52 lignes, -75%)
- ✅ Docs organisées (.claude/ + docs/archive/)
- ✅ Économie ~1,050 tokens par session

### 📘 Étape 8 – Documentation (COMPLÉTÉ)

**Fichiers créés :**

- ✅ bot/ARCHITECTURE.md
- ✅ .claude/reference.md
- ✅ .claude/collaboration.md
- ✅ docs/refactoring-progress.md
- ✅ docs/archive/README.md

/chantiers EN COURS
-> il faut un message log indiquant quel character a mis combienbien de pa et/ ou de ressources dans les chantiers.
-> il faut un message log indiquant qu'un chantier est terminé.
-> le cas ou un character termine une chantier, il faut les deux messages l'un après l'autre. Peut être que dans le message indiquant qu'un chantier est terminé il ne faut pas indiquer à nouveau par qui pour ne pas saturer l'information.
