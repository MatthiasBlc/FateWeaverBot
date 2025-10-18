# 🎯 Mission – Capacités V1 pour FateWeaver Bot

## 🧠 CONTEXTE

FateWeaver Bot est un bot Discord connecté à une base Prisma (PostgreSQL) gérant des villes, des personnages et des ressources (vivres, bois, minerai, etc.).  
Les personnages réalisent des actions (chantier, récolte, etc.) en dépensant des Points d’Action (PA).

Tu vas développer le **système des capacités (V1)** :

- ajout des modèles Prisma,
- intégration backend,
- commandes Discord `/use-capacity`, `/character-admin`, `/profil`, `/season-admin`,
- gestion automatique et manuelle des saisons,
- logs publics,
- cohérence PA / foodstock / conditions de lieu (ville seulement).

---

## 🗂️ TODO INITIAL

Commence par **créer un fichier `docs/capacite-todo.md`** contenant ta todo list technique structurée par étape :

```md
# Capacités V1 – ToDo

## Étape 1 : Base de données

[ ] Ajouter modèles Capability et CharacterCapability
[ ] Ajouter champ divertCounter dans Character
[ ] Ajouter table Season

## Étape 2 : Backend

[ ] Créer services de gestion des capacités (ajout, suppression, exécution)
[ ] Gérer random range et lucky roll pour la pêche
[ ] Implémenter cron hebdomadaire saison
[ ] Créer commande admin pour changer la saison manuellement

## Étape 3 : Commandes Discord

[ ] Ajouter section Capacités dans /profil (avec boutons)
[ ] Créer /use-capacity (sélection, validation, effets, logs)
[ ] Étendre /character-admin pour gestion des capacités
[ ] Créer /season-admin pour changement manuel de saison

## Étape 4 : Tests & Validation

[ ] Vérifier PA, stocks, logs publics
[ ] Vérifier saison automatique et manuelle
[ ] Vérifier Divertir et soin PM
🧱 SCHÉMA PRISMA
prisma
Copy code
model Capability {
id String @id @default(cuid())
name String @unique
category CapabilityCategory
costPA Int
description String?
characters CharacterCapability[]
}

model CharacterCapability {
characterId String
capabilityId String
character Character @relation(fields: [characterId], references: [id])
capability Capability @relation(fields: [capabilityId], references: [id])
@@id([characterId, capabilityId])
}

enum CapabilityCategory {
HARVEST
SPECIAL
}

model Character {
id String @id @default(cuid())
name String
...
divertCounter Int @default(0) // compteur individuel de divertissement
}

model Season {
id Int @id @default(1)
name String // "SUMMER" | "WINTER"
updatedAt DateTime @updatedAt
}
⚙️ RÈGLES DE GAMEPLAY
🔸 Conditions générales
Utilisable uniquement en ville (pas en expédition).

Coûtent des PA depuis le pool quotidien.

Les ressources générées vont dans le foodstock de la ville.

Un log public est envoyé dans le canal configuré via /channel-config.

/use-capacity permet d’utiliser une capacité.

/character-admin permet d’ajouter/retirer des capacités.

/profil affiche les capacités connues avec boutons d’action.

🧭 CAPACITÉS V1
Nom Catégorie Coût PA Été Hiver Résultat Log public
Chasser HARVEST 2 +2 à +8 vivres +1 à +4 vivres vivres → ville 🏹 ChaMot est revenu de la chasse avec 4 vivres.
Cueillir HARVEST 1 +1 à +3 vivres +0 à +2 vivres vivres → ville 🌿 ChaMot a cueilli 2 vivres.
Pêcher HARVEST 1 ou 2 0–4 vivres (si 2 PA → lucky roll) 0–2 vivres (si 2 PA → lucky roll) vivres → ville 🎣 ChaMot a pêché 3 vivres.
Divertir SPECIAL 1 cumul 5 → spectacle idem +1 PM (max 5) à tous persos vivants et actifs en ville 🎭 ChaMot a donné un spectacle ! Tout le monde regagne 1 PM.

🐟 Lucky roll (Pêcher)
Si le joueur dépense 2 PA, effectue deux tirages et conserve le meilleur.

🎭 Divertir
Chaque utilisation consomme 1 PA et +1 divertCounter.

Quand divertCounter = 5 :

reset à 0 ;

tous les personnages vivants dans la même ville gagnent +1 PM (max 5) ;

log public du spectacle.

🕰️ GESTION DES SAISONS
Un cron automatique s’exécute chaque lundi, alternant la saison :

Été → Hiver → Été → etc.

Une commande admin /season-admin permet de changer manuellement la saison.

Le cron tient compte des changements :

Si un admin change jeudi, lundi suivant le cron repassera à la saison opposée.

🧑‍💻 COMMANDES DISCORD À AJOUTER / MODIFIER
/use-capacity
Menu déroulant listant les capacités connues du personnage.

Validation :

doit être en ville

doit avoir assez de PA

doit posséder la capacité

Application des effets (random, PA, vivres, PM).

Log public clair et immersif.

/profil
Ajouter une section 🧠 Capacités connues.

Chaque capacité affichée avec un bouton → exécute /use-capacity.

/character-admin
Nouvelle action : 🧠 Gérer les capacités.

multi-sélection de capacités à attribuer/retirer.

sauvegarde en base via CharacterCapability.

/season-admin
Permet de :

voir la saison actuelle

forcer une saison (“Été” ou “Hiver”)

afficher la prochaine rotation prévue (lundi suivant)

🔧 TECHNIQUE
Random via Math.random() (secure, simple).

Respect du flow transactionnel :

Vérif du contexte (ville, PA, capacité).

Déduction PA.

Application effets.

Log public.

Rollback si erreur.

Logs publics : inclure emoji et texte clair.

✅ LIVRABLES ATTENDUS
✅ Prisma schema mis à jour

✅ Services backend CRUD (capability, season, use)

✅ Commandes Discord /use-capacity, /character-admin, /profil, /season-admin

✅ Cron hebdomadaire saison

✅ Logs publics cohérents et clairs

✅ Fichier docs/capacite-todo.md

yaml
Copy code

---

💡 **Astuce Windsurf / Supernova**
Quand tu colles ce prompt dans Windsurf :

1. Mets-le dans une seule instruction à Supernova.
2. Laisse-lui gérer la création du `docs/capacite-todo.md` avant toute implémentation.
3. Tu pourras ensuite suivre son avancement directement depuis ce fichier.

---

Souhaites-tu que je te prépare aussi un **prompt court de suivi** (que tu pourras coller plus tard à Supernova pour qu’il reprenne la V2 avec artisanat et analyse) ?  
Cela te permettrait de planifier la suite proprement.
```
