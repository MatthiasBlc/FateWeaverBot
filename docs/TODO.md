-------------------------Todo-------------------------
Messages type dans daily messages

#Objets /compétence métiers :

Chaque métier peut avoir une liste d'objets de départs possibles.
Cette table propose de lier N objets à 1 Métier.
un character qui a le métier en question n'a pas par défaut les objets en question, c'est une table d'objets recommandés.
Voici ce qu'il faut seed pour chaque métiers: (vérifier que les objets en question sont déjà seed avant)

- Chasseuse -> Arc / Couteau de chasse / Appeau
- Cueilleur -> Serpe / Herbier / Graines
- Pêcheur-> Matériel de plongée / Filet / Nasse
- Mineuse -> Pioche / Lanterne / Canari
- Tisserand -> Corde / Tissu / Quenouille
- Forgeronne -> Marteau / Enclume / ferraille
- Menuisier -> Harnais / Mètre / Planches
- Cuisinière-> Marmite / Jambon / Sel
- Guérisseur -> Fioles / Bandages / Somnifère
- Érudit-> Grimoire vierge / Loupe / Bougie
- Cartographe -> Boussole / Bottes / Compas
- Météorologue -> Grenouille / Anémomètre / Longue-vue
- L'Artiste -> Maquillage / Couronne de fleurs / Instrument

# Création de personnage Update.

Une fois le métier choisi, il doit choisir parmi XXXXXX.
Si c'est le personnalisé qui est choisi alors .....

# création objet admin + compétence admin

Implémenter les mssages météo

Commandes add objet et add compétences

Update Docs, Update Backend

------------------------------TRUC------------------- -------------

------------------------------TRUC------------------- -------------

## CapacitéV2

remplacer nourriture en repas ?

capacité en "+"
cataplasme (utilisation) bug

Cataplasme : limite à 3 dans le monde (exped + ville)

Instinct ?

# Features, debug et tests

QUESTION :

# Automatiser conso de transformé puis normal ?

Bouton manger, gestion des erreurs (exemple manger alors que l'on a pas faim)

/expedition:
-> ⏸️ Nombreux tests de fonctionnalité à faire et de CRON. - PHASE 7

Quand on crée une exped avec plus de ressources qu'il n'y en a en ville → message d'erreur
Comme dans les Chantiers, ce serait cool si le stock Vivres/Repas apparaissait quand on crée
Quand on transfère de la nourriture via les expeds, "Ville" apparaît au lieu de "Village (+ emote à changer 🏘️ ) (screen 2)
Idem après le transfert (screen 3)

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

## Erreur sur la gestion des saisons à vérifier :

gestion des saisons par VILLE et non pas globale !!!!!

##idées en vrac a réfléchir:

- système d'évènements

Gestion des pénuries ?? Alerte etc ?

Système de réapprovisionnement automatique des vivres via des chantiers ??

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
