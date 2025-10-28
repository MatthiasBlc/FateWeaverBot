# 📁 .claude/ - Claude Code Context Directory

Fichiers de contexte et protocoles pour sessions Claude Code.

---

## 📋 Index des Fichiers

### 🎯 **reference.md** (214 lignes)
Architecture complète du projet, modèles DB, workflows.
**Lire quand:** Ajouter features, modifier architecture, comprendre data models.

### 🤝 **collaboration.md** (416 lignes)
Protocole détaillé Claude ↔ Supernova (cas complexes).
**Lire quand:** Projet multi-étapes, besoin détails protocole.

### ⚡ **supernova-quick-ref.md** (68 lignes)
**Référence rapide Supernova** - Checklist, mini-prompt format.
**Lire quand:** Avant CHAQUE délégation à Supernova (>3 fichiers ou >100 lignes).

### 🧠 **context-guide.md** (120 lignes)
Guide "quand lire quel fichier" + règles par type de tâche.
**Lire quand:** Doute sur contexte nécessaire, optimiser tokens.

### 📚 **lessons-learned.md** (210 lignes)
Quand NE PAS utiliser Supernova, erreurs passées.
**Lire quand:** Hésitation sur délégation, échec précédent.

### 🚀 **commands/epct.md** (236 lignes)
Workflow Explore-Plan-Code-Test structuré.
**Lire quand:** Slash command `/epct` utilisée.

---

## 🎯 Hiérarchie Supernova

```
⚡ supernova-quick-ref.md → LIRE EN PREMIER (90% des cas)
          ↓ (si bloqué)
📚 collaboration.md → DÉTAILS COMPLETS
```

---

**Principe:** Keep root minimal (CLAUDE.md), detailed docs on-demand (.claude/)
