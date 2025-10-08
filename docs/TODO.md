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

Tester les interractions d'expéditions avec plusieurs personnages

Expédition bouton transferer la nourriture non fonctionnel , doit avoir deux champs dans la modale et gérer les deux ressources en transfert

QUESTIONS:
foodstock on conserve ? si oui on conserve les boutons manger ? si non on les delete ?
/manger on conserve ? ou est-ce que /profil garde tout ?

ExpéditionV2: Gestion de faim et PA spécifiques en expédition.

CapacitéV2: beaucoup de trucs

dayli message (weather)
Prévoir 7 messages types x2
== 2 array de 7, clone array, rm du clone quand utilisé, prendre random dans l'array

Commandes users non visibles par les users...

Capacité
capacité hiver
capacité en "+"

Artisanat
Pour l’artisanat, tu veux probablement des stocks distincts dans la ville (minerai, tissu, métal, planches, etc.).
→ Il faudra élargir le modèle Foodstock ou créer un ResourceStock multi-type.

Instinct ?

Effets saisonniers :
Le principe “une semaine IRL sur deux” → top pour la cadence.
Il faudra une table ou un paramètre global Season (enum : SUMMER | WINTER).
Cron hebdomadaire à prévoir pour basculer la saison.

gestion des saisons par VILLE et non pas globale !!!!!
-------------------------Idea To work about -------------------------

Gestion des pénuries ?? Alerte etc ?

Action auto :

- message quotidien "belle journée" ou "journée pluvieuse" etc
- pouvoir lui donner un message différent la veille
  Message quotidien : ajouter stock vivres ?
  chantier terminés la veille
  récap des ressources vivres etc
  annonce du départ de l'expédition (préparée la veille)

sélectionner fil ?

Créer Nourriture ?

/manger plusieurs boutons suivant la situation (jusquà full ? une seule ration?)

Développer les TESTS

#log update
"🍽️ thorynest a pris un repas, il reste 60 de vivres dans la ville"
-> indiquer le nombre de vivres mangés ?

lors de la mort d'un personnage écrire la raison

# Pouvoir faire manger les copains ? ou admin peuvent faire manger un joueur ?

Refacto les add + remove commands in one and only

Refacto le backend

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

#info
Système de réapprovisionnement automatique des vivres via des chantiers ??

#logs génériques à ajouter
logs des morts
logs de la création de personnages

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

admin-help │
ping │
help
chantiers-admin│ 'add, delete' │
character-admin
foodstock-admin│ 'add, remove' │
foodstock │
manger │
chantiers │'liste, build' │
config-channel
profil'

-------------------------Done-------------------------

-------------------------Notes-------------------------
