-------------------------Todo-------------------------

@part0

Ajouter une commande pour setup la variable d'ADMIN_ROLE


@part1

Ajouter un log global des actions?



Utiliser une commande admin avec des sous commandes si besoin ?

@part2

@par3
Manger
1 unité de nourriture / pers / 2 jours

Prévoir un channel avec un bot 
Nous ajoutons les unités selon les évènements
Les joueurs mangent en mettant un message


1 jour raté = 1/2 PA
2 jours ratés = hospit (besoin double dose)
3 jours ratés = morts

Pouvoir faire manger les copains ? 


+log ? ok dans un channel groupé 


Actions des charactes : 
- manger
  - systèmede faim
  - que en ville ? 
- faire manger
  - que en ville ?
- faire avancer un chantier 
  - voir commandes chantiers
- lancer un chantier / demander sa création
  - asynchrone ? 
- partir en expédition
 - règle des expéditions
 - nombre de characters
 - nombre d'évent etc
 - que rapporte des expeds ? 
- Il peut utiliser une compétence activable
  - Soigner: il peut soigner quelqu'un (ou lui même)
  - Réconforter: il peut soigner la santé mentale de quelqu'un (ou lui même)



Action des Admins:
- donner des PA 
- retirer des PA
- donner des PV 
- retirer des PV
- donner des PM 
- retirer des PM

- système d'évènements


Action auto :
- message quotidien "belle journée" ou "journée pluvieuse" etc 
- pouvoir lui donner un message différent la veille 



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


-------------------------Notes-------------------------
