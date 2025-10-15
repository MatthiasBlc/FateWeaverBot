-------------------------Todo-------------------------




# Objets et inventaires.

intégration d'un système d'objets.
Un objet est défini par un nom, il peut avoir une une description.
Une liste d'objets exisants est disponible en base de données, avec un fonctionnement similaire aux ResourcesType.

Chaque personnage possède un inventaire.
Un inventaire appartient à un seul personnage.
Un inventaire peut contenir plusieurs objets.

Dans /profil, il faut afficher l'inventaire du personnage.
dans /profil, il faut ajouter un bouton permettant de donner un objet à un autre personnage.
Le bouton emmenère alors sur un message avec un liste déroulante pour choisir un personnage avec nous (dans la même ville, ou dans la même expédition DEPARTED). Il faut également une autre liste déroulante ou l'utilisateur peut choisir le ou les objets qu'il souhaite envoyer.
Une fois que l'utilisateur a fait ses choix, il faut afficher un message de confirmation.

Un projet d'artisanat (/bluerpint) peut fabriquer une resource (dans ce cas elle va en ville à la fin comme prévu à l'origine), ou un objet (dans ce cas il arrive directement dans l'inventaire de le la personne qui termine le chantier de création de l'objet).

Dans /character-admin, les admins doivent avoir un nouveau bouton permettant de donner ou de retirer un (ou plusieurs) objet à un personnage.
Un personnage peut tout à fait avoir plusieurs fois le même objet dans son inventaire.

# évolution pêche


Pour le pécheur dans le tableau de récompenses à 2PA, le dernier champ est "un grigri", le "grigri" est un objet.
Lorsque ce dernier est péché, par un des pécheur de la ville, il va dans son inventaire directement et est retiré du tableau de possibilité comme prévu. A la place, il doit être remplacé par "3 minerai, 3 de bois et 3 vivres".

# Compétences

Il faut ajouter un système de compétences.
Une compétence est définie par un nom, elle peut avoir une description.
Une liste de compétences exisants est disponible en base de données, avec un fonctionnement similaire aux ResourcesType.

Dans /profil, il faut afficher les compétences du personnage.

Dans /character-admin, les admins doivent avoir un nouveau bouton permettant de donner ou de retirer une (ou plusieurs) compétence à un personnage.

Un personnage ne peut pas avoir plusieurs fois la même compétence.

# métier (classe ?)

Il faut ajouter un système de métier.
Un métier est défini par un nom, il peut avoir une une description, une capacité de départ, une capacité optionnelle (vide pour l'instant),blablaba(insérer ici les objets etc à choisir).

Une liste de métiers exisants est disponible en base de données, avec un fonctionnement similaire aux ResourcesType.

Voici la liste des couples métiers / capacités de départ:

-
-
-
-
-

Lorsqu'un métier est attribué à un character, il faut vérifier s'il a sa capacité de départ et, si ce n'est pas le cas la lui donner.

Dans /profil, il faut afficher le métier du personnage à la place de son rôle.

Dans /character-admin, dans le bouton adavanced, il faut ajouter un bouton permettant de changer le métier d'un character. Changer le métier d'un character lui retire également la/les capacité liée à son ancien métier et lui donne celles liée à son nouveau métier (capacité de départ et capacités optionnelles si ce n'est pas vide).

Un personnage ne peut avoir qu'un seul métier.

# Création de personnage.

Lors de la création d'un personnage (premier personnage ou reroll), Ce dernier doit choisir son nom. Dans le message en réponse, il doit choisir son métier dans une liste déroulante.

Une fois le métier choisi, il doit choisir parmi XXXXXX.
Si c'est le personnalisé qui est choisi alors .....

En réponse sa fiche profil s'affiche alors.


# création objet admin + compétence admin

# changer grigri en coquillage

























------------------------------TRUC------------------- -------------

## CapacitéV2

pécher grigri => mettre après 3/3/3

remplacer nourriture en repas ? 

Modifier projets pour que lorsqu'il est terminé, il puisse être recommencé et ce, à l'infini. (potentiellement moins cher à partir de la seconde fois ??)


capacité en "+"
cataplasme (utilisation) bug

Soin : Tu es en agonie (pv = 1) et ta faim = 0, on si l'on te soigne.....???'
Cataplasme : limite à 3 dans le monde (exped + ville)

Instinct ?

# Features, debug et tests

QUESTION :

# Automatiser conso de transformé puis normal ?

Bouton manger, gestion des erreurs (exemple manger alors que l'on a pas faim)

/expedition:
-> ⏸️ il faut faire le point sur la gestion de la faim et des PA spécifiques en expédition. - À TESTER
Expéd
2 PA/case/jour
-> ⏸️ Nombreux tests de fonctionnalité à faire et de CRON. - PHASE 7

Quand on crée une exped avec plus de ressources qu'il n'y en a en ville → message d'erreur
Comme dans les Chantiers, ce serait cool si le stock Vivres/Repas apparaissait quand on crée
Quand on transfère de la nourriture via les expeds, "Ville" apparaît au lieu de "Village (+ emote à changer 🏘️ ) (screen 2)
Idem après le transfert (screen 3)

donner une direction au formulaire ? voir règles

/profil:
-> Pour toutes les actions de manger : nouveaux logs utilisants les nouveaux emojis "thorynest a mangé X **resourceType** , il reste YY de \*\*ResourceType dans la ville"

/expedition-admin:
-> A tester en profondeur
On peut dire qu'on ajoute + de nourriture qu'existant dans le village MAIS cette nourriture n'apparaît ni dans l'exped, ni dans le village
Techniquement, c'est un bug mais je pense qu'on s'en fout, vu que ce n'est que pour nous et qu'on a pas trop de raison de faire ça (screen 1)
la modif du temps d'exped fonctionne bien, mais pas le stock Nourriture (et ce n'est pas très clair si on leur ajoute de la nourriture ? Des vivres ? Quid des cataplasmes ?)
On ne peut pas Gérer les membres s'il n'y en a qu'un (sûrement parce que retirer ce membre arrêterait l'exped)
Expédition avec un mort ?

##Tests urgents
Tester les interractions d'expéditions avec plusieurs personnages

Lister ce qui peut être fait en ville et en expédition, et ce qui ne peut pas être fait si l'on est pas dans l'une ou l'autre des situations

## Daily messages:

dayli message (weather)
Prévoir 7 messages types x2
== 2 array de 7, clone array, rm du clone quand utilisé, prendre random dans l'array

- message quotidien "belle journée" ou "journée pluvieuse" etc
- pouvoir lui donner un message différent la veille
  Message quotidien : ajouter stock vivres ?
  chantier terminés la veille
  récap des ressources vivres etc
  annonce du départ de l'expédition (préparée la veille)

SYSTEME
→ 8h : message du matin, récap de toutes les actions de la veille + Evelyne Déliat + stock (+ retour expéd)

## Erreur sur la gestion des saisons à vérifier :

gestion des saisons par VILLE et non pas globale !!!!!

##idées en vrac a réfléchir:

- système d'évènements

Gestion des pénuries ?? Alerte etc ?

Système de réapprovisionnement automatique des vivres via des chantiers ??

logs de la création de personnages

lors lors de l'ajout / retrait de ressources dans les stocks par les admins ?

# Contenu / texte

/help
Le terme "Survie" me gêne un peu, c'est plus large mais j'ai pas mieux pour l'instant (et 🍖 → 🍞)
"Aventure" → "Expéditions" non ? (plutôt 🏕️ )
"Communauté" → "Chantiers"
Après lecture de tout ça, je me demande si je ne ferais pas plutôt
👤 Perso
Profil
🏘️ Village
Stocks
Chantiers
🏕️ Expéditions
Texte guilde à remplacer par serveur

/profil
Ajout : classe métier, compétence, inventaire
Revoir bouton manger
bouton cataplasme ?

/chantier
mettre le nombre présent en ville (et le max)
synchro max et ce qui est cohérent (reste à mettre)
S'il n'y a pas assez de ressources, le message n'est pas clair (screen 2).
(note : les PA sont bien dépensées mais pas aucune ressource, même jusqu'au seuil)

/season-admin
changer l'emoji par saison

personaliser message de mort

# Optimisations

## 🎯 Prochaines Étapes

### 🧪 Étape 3 – Tests et validation (EN COURS)

**Objectif** : Garantir que le bot reste fonctionnel après refactoring

**Actions :**

- Tests utilisateur des fonctionnalités principales
- Vérification des interactions (boutons, modals, menus)
- Validation des commandes admin et user

**Voir** : Section "Tests Utilisateur" ci-dessous

### 📝 Étape 4 – Refactor du backend (À VENIR)

**Objectif** : Alléger la logique serveur, mutualiser les contrôleurs

**Actions prévues :**

- Réduire duplication middlewares
- Extraire constantes, helpers réutilisables
- Uniformiser les routes
- Séparer services des contrôleurs

### 🎨 Étape 5 – Normalisation conventions (À VENIR)

**Objectif** : Cohérence bot/backend, guide commun

**Fichier à créer** : CONVENTIONS.md

### 🧪 Étape 7 – Tests (EN COURS)

**Voir** : Ecrire des tests fonctionnels
Objectif : valider que le front/back refactorisés s’intègrent bien.
Prompts types :
Écris des tests d’intégration qui vérifient la communication entre front et back.
Donne-moi un plan de validation complet (unitaires + intégration + E2E).

💡 Claude peut générer des scripts jest, playwright, ou supertest pour ça.

### 🧩 Étape 9 – Optimisation finale Claude

Objectif : t’assurer que les prochaines sessions soient économes.
Prompts types :

Aide-moi à créer un script d’initialisation pour tes futures sessions, afin de charger uniquement le contexte essentiel.
(Claude peut te générer un petit script CLI ou un load_context.sh.)

-------------------------Idea To work about -------------------------------

Faire le point sur les CRON task

sélectionner fil ?

Développer les TESTS

#log update

lors de la mort d'un personnage écrire la raison

# Pouvoir faire manger les copains ? ou admin peuvent faire manger un joueur ?

Actions des charactes :

- ✅ manger
- ✅ système de faim

- que en ville ?
- faire manger
  - que en ville ?
    - ✅ faire avancer un chantier
    - ✅ voir commandes chantiers
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

- ✅ donner des PA
- ✅ retirer des PA
- ✅ donner des PFaim
- ✅ retirer des PFaim

- ✅ donner des PV
- ✅ retirer des PV
- ✅ donner des PM
- ✅ retirer des PM

- système d'évènements
  Action auto :
- message quotidien "belle journée" ou "journée pluvieuse" etc
- pouvoir lui donner un message différent la veille

#multi ville possible
Un character est lié à une ville et à un user.
Il est lié à la guilde par la ville.
S'il n'y a pas de ville, un ville est créer automatiquement.
une guilde peut avoir plusieurs villes. Une ville n'a qu'une seule guilde.

Les admins ont une commande pour choisir la ville actuelle. (liste déroulante)
Les admins ont une commande pour ajouter une ville à la guilde.
Les admins ont une commande pour suprimer une ville à la guilde (avec une modal de confirmation)
Toutes les commandes liées à la ville et les characters sont liés à la ville choisie.

Lors de l'interraction d'un User, on vérifie qu'il a bien un character sur la ville actuelle.
Si ce nest pas le cas, un nouveau character est créer (couple ville / user)
-------------------------Done-------------------------

-------------------------Notes-------------------------
