# 🎮 Commandes Rapides - Refactoring

Ce fichier contient des commandes prêtes à copier-coller pour demander à Claude de continuer le refactoring.

---

## 📋 Phase 1: UI Utils

### Batch 1: Character Admin (2h)
```
Continue le refactoring Phase 1 Batch 1.
Migre les 5 embeds restants dans character-admin.interactions.ts (tâches 1.1 à 1.6).
Utilise createSuccessEmbed() et createErrorEmbed() depuis utils/embeds.ts.
```

### Batch 2: Users Handlers (2h)
```
Continue le refactoring Phase 1 Batch 2.
Migre les embeds dans users.handlers.ts (tâches 2.1 à 2.4).
Utilise getHungerColor() et createCustomEmbed().
```

### Batch 3: Expedition Handlers (3h)
```
Continue le refactoring Phase 1 Batch 3.
Migre les 8 embeds dans expedition.handlers.ts (tâches 3.1 à 3.5).
Utilise createInfoEmbed() et createListEmbed().
```

### Batch 4: Stock Admin (2h)
```
Continue le refactoring Phase 1 Batch 4.
Migre les embeds dans stock-admin.handlers.ts (tâches 4.1 à 4.4).
Utilise getStockColor() depuis utils/embeds.ts.
```

### Batch 5: Autres Fichiers (3h)
```
Continue le refactoring Phase 1 Batch 5.
Migre les embeds dans chantiers, hunger, foodstock, expedition-admin et help (tâches 5.1 à 5.6).
```

### Batch 6: Boutons (2h)
```
Continue le refactoring Phase 1 Batch 6.
Migre les créations de boutons vers createActionButtons() et createSelectMenu() (tâches 6.1 à 6.4).
```

---

## 🚀 Phase 2: Expeditions

### Préparation
```
Continue le refactoring Phase 2.
Analyse les dépendances et crée expedition-shared.ts (tâches P2.3 à P2.4).
```

### Display
```
Continue le refactoring Phase 2 - Display.
Extrais expedition-display.ts avec handleExpeditionMainCommand et handleExpeditionInfoCommand (tâches D2.1 à D2.6).
```

### Create
```
Continue le refactoring Phase 2 - Create.
Extrais expedition-create.ts avec les 3 fonctions de création (tâches C2.1 à C2.6).
```

### Join
```
Continue le refactoring Phase 2 - Join.
Extrais expedition-join.ts avec les fonctions de rejoindre/quitter (tâches J2.1 à J2.7).
```

### Manage
```
Continue le refactoring Phase 2 - Manage.
Extrais expedition-manage.ts avec les fonctions de transfer (tâches M2.1 à M2.6).
```

### Entry Point
```
Continue le refactoring Phase 2 - Entry Point.
Crée expedition.command.ts et exports (tâches E2.1 à E2.4).
```

### Migration Imports
```
Continue le refactoring Phase 2 - Imports.
Mets à jour tous les imports dans index.ts, button-handler.ts, etc. (tâches I2.1 à I2.5).
```

### Nettoyage
```
Continue le refactoring Phase 2 - Nettoyage.
Supprime l'ancien expedition.handlers.ts et vérifie la compilation (tâches N2.1 à N2.4).
```

---

## 🔧 Phase 3: Logique Métier

### Utils Validation
```
Continue le refactoring Phase 3.
Crée utils/validation.ts avec toutes les fonctions de validation (tâches UV3.1 à UV3.6).
```

### Utils Formatting
```
Continue le refactoring Phase 3.
Crée utils/formatting.ts avec toutes les fonctions de formatage (tâches UF3.1 à UF3.6).
```

### Utils Interaction Helpers
```
Continue le refactoring Phase 3.
Crée utils/interaction-helpers.ts avec replyWithError, replyWithSuccess, etc. (tâches UI3.1 à UI3.5).
```

### Migration Validation
```
Continue le refactoring Phase 3.
Migre les validations dans character-admin, expedition, users, chantiers (tâches MV3.1 à MV3.5).
```

### Migration Formatting
```
Continue le refactoring Phase 3.
Migre les affichages vers les fonctions de formatage (tâches MF3.1 à MF3.4).
```

### Migration Interaction Helpers
```
Continue le refactoring Phase 3.
Migre les réponses d'erreur/succès vers les helpers (tâches MI3.1 à MI3.3).
```

---

## 📦 Phase 4: Admin Split (Optionnel)

### Stock Admin
```
Continue le refactoring Phase 4.
Découpe stock-admin.handlers.ts en modules (tâches SA4.1 à SA4.6).
```

### Character Admin
```
Continue le refactoring Phase 4.
Découpe character-admin.interactions.ts en modules (tâches CA4.1 à CA4.5).
```

---

## 🔍 Commandes de Diagnostic

### Vérifier État Actuel
```
Affiche-moi l'état actuel du refactoring :
- Nombre total de lignes dans bot/src
- Nombre d'embeds restants à migrer (grep "new EmbedBuilder")
- Top 5 des plus gros fichiers
```

### Tester Compilation
```
Vérifie que le code compile :
- npm run build
- npm run lint
Affiche-moi seulement les erreurs s'il y en a.
```

### Compter Lignes Gagnées
```
Compare le nombre de lignes actuel vs le début du refactoring.
Calcule le pourcentage de progression vers l'objectif de -1,270 lignes.
```

---

## ⚡ Commandes Mini-Sessions (15-30min)

### Mini-Session 1: Migrer 1-2 Embeds
```
Choisis 1-2 embeds dans character-admin.interactions.ts et migre-les vers les utils.
```

### Mini-Session 2: Créer 1 Utils
```
Crée une seule fonction utilitaire dans utils/validation.ts :
validateCharacterActive(character)
```

### Mini-Session 3: Extraire 1 Fonction
```
Extrais handleExpeditionMainCommand depuis expedition.handlers.ts vers handlers/expedition-display.ts.
```

---

## 📊 Commandes de Suivi

### Mettre à Jour Progress
```
Mets à jour docs/refactoring-progress.md avec :
- Les tâches que tu viens de terminer
- Les métriques actuelles (lignes, embeds, fichiers)
- Ajoute une entrée dans le journal des sessions
```

### Commit Session
```
Crée un commit avec :
git add .
git commit -m "refactor(phase-X): description de ce qui a été fait"

Génère le message de commit approprié basé sur les changements.
```

---

## 🎯 Commandes par Contexte

### Je veux avancer vite (1-2h disponible)
```
Fais un batch complet de Phase 1 (choisis celui qui n'est pas fait).
Exemple: Batch 1, 2, 3, 4, 5 ou 6.
```

### Je veux être prudent (30min-1h disponible)
```
Fais 2-3 tâches d'un batch (par exemple tâches 1.1 et 1.2 du Batch 1).
Test après chaque tâche.
```

### Je veux finir une Phase
```
Liste-moi ce qu'il reste à faire pour finir Phase X.
Estime le temps nécessaire.
Puis fais tout d'un coup si j'ai le temps, sinon découpe en sessions.
```

### Je suis bloqué / j'ai un bug
```
Regarde le dernier commit qui fonctionnait.
Explique-moi ce qui a changé et pourquoi ça casse.
Propose une solution.
```

---

## 💾 Template de Commande Générique

```
Continue le refactoring {Phase} {Batch/Section}.
Fais les tâches {X.Y} à {X.Z}.
{Instructions spécifiques optionnelles}.
{Rappels/contraintes optionnels}.
```

**Exemples** :
```
Continue le refactoring Phase 1 Batch 1.
Fais les tâches 1.1 à 1.3.
N'oublie pas d'utiliser createSuccessEmbed() depuis utils/embeds.ts.
```

```
Continue le refactoring Phase 2 Display.
Fais les tâches D2.1 à D2.2.
Assure-toi que les imports sont corrects.
Teste la compilation après.
```

---

## 🚨 Commandes d'Urgence

### Revenir en Arrière
```
Il y a un problème avec les derniers changements.
Reviens au dernier commit qui fonctionnait.
Explique ce qui a cassé.
```

### Fix Rapide
```
Le build est cassé à cause de {erreur}.
Fixe uniquement cette erreur sans faire d'autres changements.
```

### Vérification Complète
```
Fais un audit complet :
1. Vérifie la compilation
2. Vérifie ESLint
3. Vérifie qu'aucun import n'est cassé
4. Liste les warnings s'il y en a
```

---

**Dernière mise à jour** : ${new Date().toISOString().split('T')[0]}

## 📝 Notes d'Utilisation

1. **Copie-colle** directement la commande qui correspond à ce que tu veux faire
2. **Adapte** si nécessaire (change les numéros de tâches, ajoute des contraintes)
3. **Lance** la commande
4. **Vérifie** le résultat avec `npm run build`
5. **Commit** si tout est OK
6. **Répète** pour la prochaine session

Bon refactoring ! 🚀
