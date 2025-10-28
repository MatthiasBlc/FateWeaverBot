# 🧠 Guide de Contexte Intelligent - FateWeaverBot

**Version:** 2.0
**Dernière mise à jour:** 2025-10-27

---

## 🎯 Principe

**Charger le minimum nécessaire, suffisant pour être efficace.**

**Architecture 3 Niveaux:**
1. **CLAUDE.md** (~50 lignes) - Lu automatiquement chaque session
2. **Docs de référence** (.claude/*.md) - Lus à la demande seulement
3. **Code source** - Lu uniquement pour la tâche en cours

**Économie:** ~1,200 tokens par session (75% vs ancien système monolithique)

---

## 📋 Quand lire chaque fichier

### `.claude/reference.md` (214 lignes)
**Lire quand:**
- Ajouter une feature/commande Discord
- Modifier l'architecture (nouveau module, réorganisation)
- Questions sur les modèles Prisma
- Comprendre le système de deployment
- Ajouter un endpoint backend

**Ne PAS lire pour:** Corrections de bugs simples, modifications isolées

---

### `.claude/supernova-quick-ref.md` (68 lignes)
**Lire quand:**
- Tâche répétitive sur >3 fichiers
- Code à écrire >100 lignes
- Avant CHAQUE délégation à Supernova

**Ne PAS lire pour:** Tâches simples faisables directement par Claude

---

### `.claude/collaboration.md` (416 lignes)
**Lire quand:**
- Début d'un projet multi-étapes (refactoring, migration)
- Besoin de détails sur le protocole Supernova
- Bloqué avec supernova-quick-ref.md

**Note:** Dans 90% des cas, supernova-quick-ref.md suffit

---

### `.claude/lessons-learned.md` (210 lignes)
**Lire quand:**
- Hésitation sur utilisation de Supernova
- Échec précédent avec Supernova
- Tâche complexe nécessitant décision protocole

**Ne PAS lire pour:** Utilisation standard de Supernova

---

## 🎯 Règles par Type de Tâche

### 1. Corriger un Bug 🐛
**Contexte minimal:**
- CLAUDE.md (automatique)
- Feature concernée uniquement
- Utils utilisés par cette feature
- API service (si backend impliqué)

**Tokens estimés:** 3,000-5,000

**Exemple:**
```
Bug expedition join → Charger:
- CLAUDE.md
- bot/src/features/expeditions/**
- bot/src/utils/embeds.ts (si embed bug)
- bot/src/services/api/index.ts (si API bug)
```

---

### 2. Ajouter une Feature ✨
**Contexte recommandé:**
- CLAUDE.md (automatique)
- .claude/reference.md (architecture complète)
- bot/ARCHITECTURE.md (patterns)
- Utils partagés + Handlers centralisés
- Feature similaire existante (exemple)

**Tokens estimés:** 8,000-15,000

**Exemple:**
```
Ajouter trading system → Charger:
- CLAUDE.md
- .claude/reference.md
- bot/ARCHITECTURE.md
- bot/src/features/chantiers/ (exemple similaire)
- bot/src/utils/ (réutiliser patterns)
- bot/src/services/api/
```

---

### 3. Refactoring 🔧
**Contexte recommandé:**
- CLAUDE.md (automatique)
- .claude/supernova-quick-ref.md (protocole)
- Code cible du refactoring
- Utils existants (patterns DRY)

**Tokens estimés:** 5,000-10,000

**Note:** Utiliser Supernova pour refactoring >3 fichiers

---

### 4. Modification Schema Prisma 🗄️
**Contexte recommandé:**
- CLAUDE.md (automatique)
- .claude/reference.md (modèles existants)
- backend/prisma/schema.prisma
- Services/Controllers affectés

**Tokens estimés:** 6,000-12,000

**Attention:** Éviter Supernova pour modifications schema critiques

---

## 📊 Économies de Tokens

### Avant Optimisation
```
Session start: CLAUDE.md (214 lignes) → ~1,400 tokens
Session typique: 10,000-20,000 tokens
% contexte inutile: ~10-14%
```

### Après Optimisation
```
Session start: CLAUDE.md (50 lignes) → ~200 tokens
Lecture à la demande: +0 à +1,500 tokens (si besoin)
Session typique: 8,000-18,000 tokens
Économie: ~1,200 tokens/session (12%)
Sur 10 sessions: ~12,000 tokens économisés
```

---

## 🛠️ Maintenance du Système

### Ajouter un nouveau protocole
1. Créer `.claude/nouveau-protocole.md` (si Claude-specific)
2. Ajouter référence dans `CLAUDE.md` section "Detailed Documentation"
3. Mettre à jour `.claude/README.md`
4. Garder CLAUDE.md minimal (max 60 lignes)

### Mettre à jour l'état du projet
1. Modifier section "Current Project Status" dans `CLAUDE.md`
2. Ne PAS détailler dans CLAUDE.md (juste pointer vers doc)
3. Créer doc détaillée dans `docs/` si nécessaire

---

## ⚠️ Anti-Patterns à Éviter

### ❌ Lecture préventive
Ne pas lire "au cas où" - Charger uniquement si tâche le nécessite

### ❌ Contexte exhaustif
Ne pas tout charger pour être "sûr" - Précision > Exhaustivité

### ❌ Oublier la hiérarchie
Toujours lire quick-ref AVANT collaboration.md pour Supernova

### ❌ Duplication d'info
Si info existe ailleurs, pointer vers elle, ne pas répéter

---

## ✅ Best Practices

### ✅ Lecture sélective
Utiliser TOC et sauter aux sections pertinentes (reference.md)

### ✅ Parallélisation
Charger plusieurs fichiers en parallèle quand possible

### ✅ Validation progressive
Commencer minimal, ajouter contexte si bloqué

### ✅ Documentation précise
"Quand lire ce fichier" doit être cristal clair

---

**Règle d'or:** Si tu hésites sur quel fichier lire, commence par le plus petit et remonte si besoin.
