# 🧠 Règles de Contexte Intelligent - FateWeaverBot

**Version** : 1.0.0
**Mise à jour** : 2025-10-08

Ce document définit les règles de décision pour le chargement intelligent du contexte.

---

## 🎯 Philosophie

**Principe** : Charger le minimum nécessaire pour la tâche, mais suffisant pour être efficace.

**Priorités** :
1. ✅ **Pertinence** : Contexte directement lié à la tâche
2. ✅ **Fraîcheur** : Fichiers modifiés récemment
3. ✅ **Économie** : Minimiser les tokens
4. ✅ **Complétude** : Avoir assez d'info pour ne pas bloquer

---

## 📋 Règles par Type de Tâche

### 1. Corriger un Bug 🐛

**Contexte minimal :**
- `CLAUDE.md` (toujours)
- Feature concernée uniquement
- Utils utilisés par cette feature
- API service (si communication backend)

**Exemple :**
```
Bug dans expeditions → Charge :
- CLAUDE.md
- bot/src/features/expeditions/**
- bot/src/utils/embeds.ts (si embed bug)
- bot/src/services/api/index.ts (si API bug)
```

**Tokens estimés** : 3,000-5,000

**Commande** :
```bash
node scripts/context-helper.js suggest --task "fix expedition join bug"
```

---

### 2. Ajouter une Feature ✨

**Contexte recommandé :**
- `CLAUDE.md` (toujours)
- `.claude/reference.md` (architecture)
- `bot/ARCHITECTURE.md` (patterns)
- Utils partagés
- Handlers centralisés
- API service
- Feature similaire existante (exemple)

**Exemple :**
```
Ajouter trading system → Charge :
- CLAUDE.md
- .claude/reference.md
- bot/ARCHITECTURE.md
- bot/src/features/chantiers/ (exemple feature similaire)
- bot/src/utils/ (pour réutiliser)
- bot/src/services/api/
```

**Tokens estimés** : 8,000-15,000

**Commande** :
```bash
node scripts/context-helper.js suggest --task "add trading feature"
```

---

### 3. Refactoring 🔧

**Contexte recommandé :**
- `CLAUDE.md` (toujours)
- `.claude/collaboration.md` (protocole Supernova)
- `docs/refactoring-progress.md` (historique)
- Code cible du refactoring
- Utils existants (pour réutiliser)

**Exemple :**
```
Refactor hunger.handlers → Charge :
- CLAUDE.md
- .claude/collaboration.md
- docs/refactoring-progress.md
- bot/src/features/hunger/
- bot/src/utils/ (pour voir patterns DRY)
```

**Tokens estimés** : 5,000-10,000

**Commande** :
```bash
node scripts/context-helper.js suggest --task "refactor hunger handlers"
```

**💡 Conseil** : Utiliser Supernova pour tâches répétitives

---

### 4. Débugger un Problème 🔍

**Contexte minimal :**
- `CLAUDE.md` (toujours)
- Feature concernée
- Logs d'erreur (fournis par utilisateur)
- Utils si erreur dans utils

**Exemple :**
```
Erreur "Character not found" → Charge :
- CLAUDE.md
- Feature qui appelle getActiveCharacter()
- bot/src/utils/character-validation.ts
- bot/src/services/api/
```

**Tokens estimés** : 2,000-4,000

**Méthode** : Utilisateur fournit les logs, Claude charge seulement le code concerné

---

### 5. Continuer Travail Précédent ⏭️

**Contexte recommandé :**
- `CLAUDE.md` (toujours)
- `docs/TODO.md` (tâche en cours)
- Fichiers modifiés dans dernière session
- Contexte de la dernière session (`.claude/last-session.json`)

**Exemple :**
```
"Continue le travail" → Charge :
- CLAUDE.md
- docs/TODO.md
- Fichiers git diff HEAD~5 (5 derniers commits)
- Contexte sauvegardé last-session.json
```

**Tokens estimés** : Variable (3,000-10,000)

**Commande** :
```bash
node scripts/context-helper.js init  # Auto-détecte
```

---

## 🎨 Règles Intelligentes

### Règle 1 : Fichiers Récents
```
SI fichier modifié < 24h
ALORS suggérer chargement de cette feature
```

**Implémentation** : `context-helper.js` utilise `git log --since="1 day ago"`

### Règle 2 : TODO.md Priority
```
SI TODO.md contient "(EN COURS)"
ALORS charger contexte lié à cette tâche
```

**Implémentation** : Parse TODO.md et détecte sections "EN COURS"

### Règle 3 : Keywords Detection
```
SI tâche contient "supernova" OU "repetitive" OU "batch"
ALORS charger .claude/collaboration.md
```

**Keywords mappés** :
- `supernova`, `repetitive`, `batch` → collaboration.md
- `architecture`, `structure`, `organize` → reference.md + ARCHITECTURE.md
- `refactor`, `clean`, `dry` → refactoring-progress.md + collaboration.md
- Feature names (`expedition`, `chantier`, etc.) → code_contexts correspondant

### Règle 4 : Dépendances Transitives
```
SI charge feature X
ET feature X utilise utils Y
ALORS suggérer utils Y aussi
```

**Exemple** : expeditions → embeds.ts, character-validation.ts, api service

### Règle 5 : Budget Token
```
SI tokens_estimate > 30,000
ALORS afficher warning "Heavy context - vraiment nécessaire ?"
```

---

## 📊 Budgets Recommandés

| Type Session | Tokens | Contexte | Usage |
|--------------|--------|----------|-------|
| **Light** | 5,000 | Minimal + 1 feature | Bug fix, petit ajout |
| **Medium** | 15,000 | Minimal + architecture + 2-3 features | Nouvelle feature, refactor moyen |
| **Heavy** | 30,000 | Tout le contexte pertinent | Grande feature, refactor majeur |
| **Full** | 50,000+ | Tout | ⚠️ Rare, seulement si absolument nécessaire |

**Recommandation** : Viser Light/Medium quand possible, Heavy seulement si nécessaire.

---

## 🤖 Utilisation avec context-helper.js

### Mode Automatique (Recommandé)
```bash
# Au démarrage de chaque session Claude
node scripts/context-helper.js init
```

**Ce que ça fait :**
1. ✅ Analyse TODO.md pour tâche en cours
2. ✅ Regarde fichiers modifiés récemment (git)
3. ✅ Suggère contexte optimal
4. ✅ Affiche estimation tokens
5. ✅ Sauvegarde session dans `.claude/last-session.json`

### Mode Manuel
```bash
# Spécifier une tâche manuellement
node scripts/context-helper.js suggest --task "fix expedition bug"
```

### Lister Contextes
```bash
# Voir tous les contextes disponibles
node scripts/context-helper.js list
```

---

## 🔄 Workflow Recommandé

### Début de Session (Automatique ⭐)
1. **Hook auto-exécute** : `context-helper.js auto-suggest` (configuré dans `.claude/settings.local.json`)
2. **Lire** les suggestions affichées automatiquement
3. **Charger** les fichiers suggérés dans Claude
4. **Commencer** à travailler

> 💡 **Alternative manuelle** : Si besoin de plus de détails, exécuter `node scripts/context-helper.js init`

### Changement de Tâche
1. **Exécuter** : `node scripts/context-helper.js suggest --task "nouvelle tâche"`
2. **Ajuster** le contexte si nécessaire
3. **Continuer** avec nouveau contexte

### Fin de Session
Le script sauvegarde automatiquement dans `.claude/last-session.json`
→ Prochaine session pourra reprendre où tu en étais

---

## 📝 Exemples Concrets

### Exemple 1 : Bug Report Utilisateur
**Situation** : "Le bouton transfert expedition ne marche pas"

**Commande** :
```bash
node scripts/context-helper.js suggest --task "fix expedition transfer button"
```

**Contexte suggéré** :
- CLAUDE.md
- bot/src/features/expeditions/handlers/expedition-transfer.ts
- bot/src/utils/button-handler.ts
- bot/src/utils/modal-handler.ts

**Tokens** : ~3,500

---

### Exemple 2 : Nouvelle Feature
**Situation** : "Je veux ajouter un système de commerce entre joueurs"

**Commande** :
```bash
node scripts/context-helper.js suggest --task "add trading system between players"
```

**Contexte suggéré** :
- CLAUDE.md
- .claude/reference.md (architecture)
- bot/ARCHITECTURE.md (patterns)
- bot/src/features/chantiers/ (exemple feature)
- bot/src/utils/ (tous les utils)
- bot/src/services/api/

**Tokens** : ~12,000

---

### Exemple 3 : Continue Refactoring
**Situation** : "Continue le refactoring Phase 6"

**Commande** :
```bash
node scripts/context-helper.js init  # Auto-détecte
```

**Contexte suggéré** (si TODO.md dit "Phase 6 EN COURS") :
- CLAUDE.md
- .claude/collaboration.md
- docs/refactoring-progress.md
- Fichiers modifiés récemment

**Tokens** : ~8,000

---

## 🎯 Optimisations Avancées

### 1. Lazy Loading
Charge d'abord minimal, puis demande plus si nécessaire :
```
Claude: "J'ai besoin de voir comment les embeds sont créés"
User: Charge bot/src/utils/embeds.ts
```

### 2. Contexte Incrémental
Au lieu de tout charger d'un coup, charge par vagues :
```
Vague 1: CLAUDE.md + feature principale
Vague 2: Utils utilisés
Vague 3: API service si nécessaire
```

### 3. Cache Mental
Claude "se souvient" dans la conversation :
```
"Comme on l'a vu dans embeds.ts plus tôt..."
→ Pas besoin de recharger si déjà dans la conversation
```

### 4. Hook Automatique (Recommandé ⭐)
Le système est configuré pour **s'exécuter automatiquement** à chaque démarrage de Claude :

**Configuration** : `.claude/settings.local.json`
```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup",
        "hooks": [{
          "type": "command",
          "command": "node scripts/context-helper.js auto-suggest"
        }]
      },
      {
        "matcher": "resume",
        "hooks": [{
          "type": "command",
          "command": "node scripts/context-helper.js auto-suggest"
        }]
      }
    ]
  }
}
```

**Ce qui se passe automatiquement** :
1. ✅ Claude démarre une session (nouvelle ou reprise)
2. ✅ Hook déclenche `context-helper.js auto-suggest`
3. ✅ Analyse TODO.md + fichiers récents (git)
4. ✅ Affiche suggestions de contexte minimal
5. ✅ Sauvegarde session dans `.claude/last-session.json`

**Avantage** : Plus besoin de penser à exécuter la commande, c'est **100% automatique** !

---

## 📚 Maintenance des Règles

**Quand mettre à jour ce fichier :**
- Nouveau pattern de travail découvert
- Nouvelle règle d'optimisation identifiée
- Feedback après plusieurs sessions

**Qui maintient :**
- Claude peut suggérer améliorations
- Utilisateur valide et applique

---

**Créé le** : 2025-10-08
**Système** : Context Helper v1.0.0
**Objectif** : Économiser 70-80% tokens vs chargement naïf
