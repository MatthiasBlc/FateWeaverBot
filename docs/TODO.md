-------------------------Todo-------------------------
# Features, debug et tests

un joueur ne peut avoir qu'un seul personnage actif,
Lors de la création désactiver les anciens et activer le nouveau
 ✅ Corrections appliquées avec succès !

  📋 Résumé des modifications :

  1. createCharacter() - backend/src/services/character.service.ts:117
  - ✅ Désactive maintenant TOUS les personnages actifs (morts ET vivants)
  - ✅ Suppression du filtre isDead: false
  - ✅ Commentaire ajouté pour documenter la règle métier

  2. upsertCharacter() - backend/src/controllers/characters.ts:88
  - ✅ Désactive maintenant TOUS les personnages actifs (morts ET vivants)
  - ✅ Logique corrigée dans les deux branches (existingCharacter ou non)
  - ✅ Commentaire ajouté pour documenter la règle métier

  🔒 Règle métier garantie :

  Un utilisateur ne peut avoir qu'UN SEUL personnage actif par ville
  - À la création d'un personnage → tous les autres sont désactivés
  - Un personnage mort reste actif jusqu'à ce que canReroll: true ET qu'un nouveau personnage soit créé
  - Les commandes admin peuvent outrepasser cette règle (pour debug)
-> A tester

-> bug de push !!!!!!

QUESTION :
tomber en agnonie baisse pv à 1 et ne touche pas aux  pm

Automatiser conso de transformé puis normal ? 

Update du système de faim :
la faim diminue de 1 point toutes les 24h

Status :
4 → satiété ( soigne 1pv lors de l'actualisation quotidienne. cette action se fait avant que la faim ne décroisse.)
3 → faim
2 → faim
1 → affamé ( regénère 1PA en moins lors de l'actualisation quotidienne. Cette action se fait lorsque l'on passe de 2(faim) à 1(affamé).)
0 → Meurt de faim -> (passe directement le personnage en agonie, soit 1pv )

si le character a faim à 0 et agonie, il ne peut pas être soigné (bouton grisé) tant qu'il n'a pas remonté sa faim au moins à 1 ou alerte etc 

revoir bouton manger

Update du système de vie / PV:

2 à 5 -> rien de spécial
1 - Agonie (ne peut plus utiliser de PA)
0 - Mort (passe isdead à true)

agonie 48h (fin de journée en cours + journée suivante) puis mort.

cataplasme (utilisation) bug

Update du système de PM:

2 à 5 - rien de spécial
1 - Déprime → (ne peut utiliser qu'une PA par jour)
0 - Dépression → (Déprime + chaque jour, un joueur dans le même lieu qui n'est pas déjà en Dépression, même ville si en ville ou même expédition si dans une expédition Status DEPARTED, perd 1 PM)

Dans le profil, créer une catégorie (liste à puces) status :
voir liste sur discord

Dans le profil, si pa >=3/4 juste un petit paneau Attention à côté


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

## CapacitéV2

beaucoup de trucs
Capacité
capacité hiver
capacité en "+"

Artisanat a revoir



Analyser : erreur ❌ n'existe pas 
Auspice : erreur ❌
Bûcheronner ✅
Cartographier : erreur ❌
Chasser ❌ vérifier été hiver
Cueillir ❌ vérifier été hiver
Cuisiner : erreur ❌
Divertir ⚠️ ne fonctionne pas comme devrait
Forger : erreur ❌
Miner : erreur ❌
Pêcher ✅  ⁉️ → comment utilise-t-on 2PA pour table bonus ?
Soigner : erreur ❌
Tisser : erreur ❌
Travailler le bois : erreur ❌

Artisanat
Pour l’artisanat, tu veux probablement des stocks distincts dans la ville (minerai, tissu, métal, planches, etc.).
→ Il faudra élargir le modèle Foodstock ou créer un ResourceStock multi-type.

Seules 4 s'affichent, Tout doit apparaitre

Soin : Tu es en agonie (pv = 1) et ta faim = 0, on si l'on te soigne.....???'
Cataplasme : limite à 3 dans le monde (exped + ville)

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
retrait de l'img
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
