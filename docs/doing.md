Après lecture de ce document doing.md et une phase Exploration et plan, tu m'as proposé le document suivant : .supernova/prompt-job-system.md

Dans HistoriqueChat.md, tu as l'historique avant d'atteindre la Session limit.

Fais le point sur la situation et continue.

# métiers

Il faut ajouter un système de métier.
Un métier est défini par un nom, il peut avoir une une description, une capacité de départ, une capacité optionnelle (vide pour les premiers métiers).

Une liste de métiers exisants est disponible en base de données, avec un fonctionnement similaire aux ResourcesType.

Voici la liste des couples métiers / capacités de départ:

- Chasseuse -> Chasser
- Cueilleur -> Cueillir
- Pêcheur-> Pêcher
- Mineuse -> Miner
- Tisserand -> Tisser
- Forgeronne -> Forger
- Menuisier -> Menuiser
- Cuisinière-> Cuisiner
- Guérisseur -> Soigner
- Érudit-> Rechercher
- Cartographe -> Cartographier
- Météorologue -> Auspice
- L'Artiste -> Divertir

Lorsqu'un métier est attribué à un character, il faut vérifier s'il a sa capacité de départ et, si ce n'est pas le cas la lui donner.

Dans /profil, il faut afficher le métier du personnage à la place de son rôle.

Dans /character-admin, dans le bouton adavanced, il faut ajouter un bouton permettant de changer le métier d'un character. Changer le métier d'un character lui retire également la/les capacité liée à son ancien métier et lui donne celles liée à son nouveau métier (capacité de départ et capacités optionnelles si ce n'est pas vide).

Un personnage ne peut avoir qu'un seul métier.

Dans /new-element-admin, il faut ajouter un bouton permettant de créer un nouveau métier.

# Création de personnage.

Lors de la création d'un personnage (premier personnage ou reroll), Ce dernier doit choisir son nom et, il doit choisir son métier dans une liste déroulante.

En réponse sa fiche profil s'affiche alors.

logs de la création de personnages
