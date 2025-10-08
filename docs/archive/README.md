# 📦 Archive - Documentation Historique

Ce répertoire contient la documentation archivée du projet FateWeaverBot.

**Date d'archivage** : 2025-10-08

---

## 📂 Structure de l'Archive

### specifications/
Documentation des spécifications et cahiers des charges (historique)

- **1-cdc/** - Cahier des charges complet original
- **2-Doc/** - Documentation technique initiale (CHANGELOG, MIGRATION-GUIDE, etc.)
- **3-expeditions/** - TODOs et specs expéditions (multiples versions)
- **4-capacite/** - Specs système de capacités
- **5-resourcesV2/** - Specs ressources V2

**Status** : Référence historique, peut contenir des informations obsolètes

---

### refactoring/
Documentation du grand refactoring (Phases 1-5, Oct 2025)

#### Fichiers principaux :
- **refactoring-roadmap.md** - Plan détaillé des 4 phases de refactoring
- **refactoring-commands.md** - Commandes à copier-coller pour avancer

#### supernova-prompts/
Prompts détaillés donnés à Code Supernova pour exécution :
- **supernova-prompt-phase1.md** - Migration embeds/components
- **supernova-prompt-phase1-finalisation.md** - Finalisation Phase 1
- **supernova-prompt-phase2.md** - Décomposition expeditions
- **supernova-prompt-phase3.md** - Extraction logique métier
- **supernova-prompt-phase4.md** - Split admin modules
- **supernova-prompt-phase5.md** - Application globale utils

**Status** : Complété et archivé pour référence future

---

## 📚 Documentation Active (Hors Archive)

### Racine Projet
- **CLAUDE.md** - Point d'entrée pour Claude Code (52 lignes, optimisé)
- **README.md** - Guide utilisateur principal
- **README-local.md** - Setup développement local

### .claude/
Documentation spécifique à Claude Code (optimisée tokens) :
- **reference.md** - Architecture complète et workflows
- **collaboration.md** - Protocole Supernova
- **context-optimization.md** - Système 3-tier contexte
- **README.md** - Index docs Claude

### bot/
- **ARCHITECTURE.md** - Architecture post-refactoring (détaillée)
- **README.md** - Guide bot Discord
- **DEPLOY-COMMANDS.md** - Système déploiement commandes

### docs/
- **refactoring-progress.md** - Journal des sessions et métriques
- **TODO.md** - Liste des tâches et améliorations futures

### backend/
- **README.md** - Guide API backend

---

## 🔍 Quand Consulter l'Archive ?

### specifications/
- Comprendre les décisions de conception initiales
- Retrouver des specs fonctionnelles anciennes
- Contexte historique du projet

**⚠️ Attention** : Peut contenir des informations obsolètes par rapport à l'implémentation actuelle

### refactoring/
- Comprendre le processus de refactoring
- Apprendre les patterns utilisés
- Reproduire un refactoring similaire
- Voir l'évolution du code (avant/après)

**✅ Référence** : Documentation fiable du refactoring Oct 2025

---

## 📊 Résumé du Refactoring Archivé

**Phases complétées** : 1-5 (100%)
**Durée totale** : ~10 sessions
**Lignes refactorisées** : 25+ fichiers
**Utils créés** : ~1,000 lignes réutilisables
**Duplication éliminée** : ~500-700 lignes
**Économie tokens** : ~70-80% vs approche naïve

**Voir** : `refactoring/refactoring-roadmap.md` pour détails complets

---

## 🗂️ Arborescence Complète

```
docs/archive/
├── README.md (ce fichier)
├── specifications/
│   ├── 1-cdc/
│   │   └── CAHIER_DES_CHARGES_COMPLET.md
│   ├── 2-Doc/
│   │   ├── CHANGELOG-DEPLOY.md
│   │   ├── CHARACTER-SYSTEM.md
│   │   ├── MIGRATION-GUIDE.md
│   │   ├── QUICK-REFERENCE.md
│   │   ├── SCHEMA-CONSTRAINTS.md
│   │   └── SYSTEM-OVERVIEW.md
│   ├── 3-expeditions/
│   │   ├── expeditionrework-todo.md
│   │   ├── expeditions.md
│   │   ├── expedition-TODO.md
│   │   ├── EXPEDITION-TODO-V1.md
│   │   └── multi-resource-expeditions-todo.md
│   ├── 4-capacite/
│   │   ├── capacite-todo.md
│   │   └── capaciteV1.md
│   └── 5-resourcesV2/
│       └── resources-todo.md
└── refactoring/
    ├── refactoring-roadmap.md
    ├── refactoring-commands.md
    └── supernova-prompts/
        ├── supernova-prompt-phase1.md
        ├── supernova-prompt-phase1-finalisation.md
        ├── supernova-prompt-phase2.md
        ├── supernova-prompt-phase3.md
        ├── supernova-prompt-phase4.md
        └── supernova-prompt-phase5.md
```

---

**Créé le** : 2025-10-08
**Par** : Audit et réorganisation documentation projet
