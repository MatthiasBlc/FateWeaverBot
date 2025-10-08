-------------------------Todo-------------------------

## 🎯 Prochaines Étapes

### ✅ Étape 2 – Refactor du bot (COMPLÉTÉE)

- ✅ Composants modulaires et DRY
- ✅ Services, utils et constantes regroupés
- ✅ ARCHITECTURE.md créé

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

### ✅ Étape 6 – Isolation contexte (COMPLÉTÉ)

**Objectif** : Projet "Claude-friendly"

**Réalisé :**

- ✅ Système 3-tier créé (.claude/context-optimization.md)
- ✅ CLAUDE.md optimisé (214 → 52 lignes, -75%)
- ✅ Docs organisées (.claude/ + docs/archive/)
- ✅ Économie ~1,050 tokens par session

### 🧪 Étape 7 – Tests (EN COURS)

**Voir** : Ecrire des tests fonctionnels
Objectif : valider que le front/back refactorisés s’intègrent bien.
Prompts types :
Écris des tests d’intégration qui vérifient la communication entre front et back.
Donne-moi un plan de validation complet (unitaires + intégration + E2E).

💡 Claude peut générer des scripts jest, playwright, ou supertest pour ça.

### 📘 Étape 8 – Documentation (COMPLÉTÉ)

**Fichiers créés :**

- ✅ bot/ARCHITECTURE.md
- ✅ .claude/reference.md
- ✅ .claude/collaboration.md
- ✅ docs/refactoring-progress.md
- ✅ docs/archive/README.md

### 🧩 Étape 9 – Optimisation finale Claude

Objectif : t’assurer que les prochaines sessions soient économes.
Prompts types :

Aide-moi à créer un script d’initialisation pour tes futures sessions, afin de charger uniquement le contexte essentiel.
(Claude peut te générer un petit script CLI ou un load_context.sh.)

-------------------------Node Discord /update-------------------------

## fichier config emoji

Regrouper les emoji dans un fichier de "config" pour que l'on puisse les changer partout tous d'un coup plus facilement

## Update des commandes

### Commandes Utilisateurs

/help
-> actualiser et rendre plus lisible avec des catégories etc

/profil
->un bouton "manger" et un "manger +". si faim <=0 ou >=4 alors on affiche ces boutons.

    -> En Ville (pas dans une expédition avec status : DEPARTED)
      -> le bouton "manger" fait manger 1 de nourriture venant de la ville, s'il n'y en a pas, il fait manger 1 vivre venant de la ville, s'il n'y en a pas erreur (plus rien à manger en ville).
      -> le bouton "manger +" ouvre un message éphémère avec : état de la faim, état des stocks de vivres dans la ville et nourriture dans la ville avec une alerte de pénurie. La nourriture n'apparait que si la ressource nourriture existe dans le ResourceStock de la ville du character. Ce message propose 4 boutons:
        ->manger 1 vivre (venant du stock de la ville)
        -> manger 1 nourriture (venant du stock de la ville). Le bouton nourriture n'apparait que si le stock de nourriture >0 dans le ResourceStock de la ville du character
        -> manger à sa faim des vivres (mange des vivres jusqu'a être a 4/4 en faim), entre parenthèse il doit y avoir le nombre de vivre consommé. S'il faut consommer 3 vivres mais qu'il en reste 2, alors mettre 2 entre parenthèse et ne consommer que deux vivres. Le bouton ne s'affiche que s'il faut consommer plus d'un seul vivre pour être à 4/4.
        -> manger à sa faim de la nourriture (mange des nourritures jusqu'a être a 4/4 en faim), entre parenthèse il doit y avoir le nombre de nourriture consommé. S'il faut consommer 3 nourritures mais qu'il en reste 2, alors mettre 2 entre parenthèse et ne consommer que deux nourritures. Le bouton ne s'affiche que s'il faut consommer plus d'une seule nourriture pour être à 4/4. le bouton ne s'affiche que s'il y a au minimum 2 nourriture en stock de la ville.
    -> En Expédition avec status : DEPARTED
      -> le bouton "manger" fait manger 1 de nourriture venant de l'Expédition, s'il n'y en a pas, il fait manger 1 vivre venant de l'Expédition, s'il n'y en a pas erreur (plus rien à manger dans l'Expédition).
      -> le bouton "manger +" ouvre un message éphémère avec : état de la faim, état des stocks de vivres dans l'Expédition et nourriture dans l'Expédition avec une alerte de pénurie. La nourriture n'apparait que si la ressource nourriture existe dans le ResourceStock de l'Expédition du character. Ce message propose 4 boutons:
        ->manger 1 vivre (venant du stock de l'Expédition)
        -> manger 1 nourriture (venant du stock de l'Expédition). Le bouton nourriture n'apparait que si le stock de nourriture >0 dans le ResourceStock de l'Expédition du character
        -> manger à sa faim des vivres (mange des vivres jusqu'a être a 4/4 en faim), entre parenthèse il doit y avoir le nombre de vivre consommé. S'il faut consommer 3 vivres mais qu'il en reste 2, alors mettre 2 entre parenthèse et ne consommer que deux vivres. Le bouton ne s'affiche que s'il faut consommer plus d'un seul vivre pour être à 4/4.
        -> manger à sa faim de la nourriture (mange des nourritures jusqu'a être a 4/4 en faim), entre parenthèse il doit y avoir le nombre de nourriture consommé. S'il faut consommer 3 nourritures mais qu'il en reste 2, alors mettre 2 entre parenthèse et ne consommer que deux nourritures. Le bouton ne s'affiche que s'il faut consommer plus d'une seule nourriture pour être à 4/4. le bouton ne s'affiche que s'il y a au minimum 2 nourriture en stock de l'Expédition.

/stock
->ok comme ça pour l'instant, semble fonctionner correctement

/foodstock
-> Commande plus utilisée

/manger
-> Commande plus utilisée

/ping
-> Commande plus utilisée

/expedition
-> Ne devrait plus avoir de sous commandes (tout est géré par la commande /expedition directement avec des boutons)
-> Nombreux tests de fonctionnalité à faire et de CRON.
-> le bouton pour créer une expédition a disparu. (voir les docs ce que l'on peut en tirer)
-> lorsque l'on est dans une expédition qui n'est pas encore en status DEPARTED, un bouton "transferer la nourriture" doit ouvrir une modale avec deux champs danset gérer les deux ressources en transfert. il doit aussi gére de manière ergonomique le transfert de vivres et / ou nourriture vers la ville et inversement. Un scond bouton quitter l'expédition doit être présent.
-> lorsque l'on est dans une expédition en status DEPARTED, il devrait y avoir un bouton "retour de l'expédition en urgence".
Ce bouton agit comme un toggelable, si au moins la moitié des membres d'une expédition (hors isdead true ou agonie) appuie sur le bouton, alors l'expédition est retournée en urgence. Rappuyer sur le bouton doit annuler l'opt-in pour le retour en urgence. Un retour en urgence validé fait rentrer l'expédition lors du prochain cron avec le status RETURNED, a condition que tous les membres ne soient pas en isdead = true à ce moment là.
-> il faut faire le point sur la gestion de la faim et des PA spécifiques en expédition.

/chantiers
-> actuellement la commande a deux sous commandes : liste et build.
-> Remplacer par une commande sans sous commande : /chantier donne la liste des chantiers, un bouton "participer" renvoie sur l'ancien message de build : liste déroulante des chantiers, choix de celui pour lequel l'on veut participer, modale demandant le nombre de PA et gérant toutes les erreurs, investissement des PA dans le chantier.
->-> Actuellement, un chantier a un nom et ne coute que des PA. Il faudrait qu'un chantier puisse avoir un cout supllémentaire dans nimporte quelle ressource. (une ou plusieurs ressources) (voir commande chantier-admin)

### Commandes Administrateur

/admin-help
-> actualiser et rendre plus lisible avec des catégories etc
->rename en help-admin

/config-channel
->rename en config-channel-admin
-> fonctionne bien

/season-admin
-> fonctionne bien

/character-admin
-> fonctionne bien

/stock-admin
-> fonctionne bien

/expedition-admin
-> A tester en profondeur

/chantiers-admin
-> Actuellement, un chantier a un nom et ne coute que des PA. Il faudrait qu'un chantier puisse avoir un cout supllémentaire dans nimporte quelle ressource. (une ou plusieurs ressources)

# Lister ce qui peut être fait en ville et en expédition, et ce qui ne peut pas être fait si l'on est pas dans l'une ou l'autre des situations

##Tests urgents

Tester les interractions d'expéditions avec plusieurs personnages
Commandes users non visibles par les users sur le server A Tale of a Star

## CapacitéV2

beaucoup de trucs
Capacité
capacité hiver
capacité en "+"

Artisanat
Pour l’artisanat, tu veux probablement des stocks distincts dans la ville (minerai, tissu, métal, planches, etc.).
→ Il faudra élargir le modèle Foodstock ou créer un ResourceStock multi-type.

Instinct ?

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

## Erreur sur la gestion des saisons à vérifier :

gestion des saisons par VILLE et non pas globale !!!!!

##idées en vrac a réfléchir:

- système d'évènements

Gestion des pénuries ?? Alerte etc ?

Système de réapprovisionnement automatique des vivres via des chantiers ??

logs de la création de personnages

-------------------------Idea To work about -------------------------

sélectionner fil ?

Développer les TESTS

#log update
"🍽️ thorynest a pris un repas, il reste 60 de vivres dans la ville"
-> indiquer le nombre de vivres mangés ?

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
