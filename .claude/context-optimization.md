# 📊 Système de Contexte Optimisé pour Claude Code

## 🎯 Objectif

Minimiser les tokens consommés à chaque session tout en conservant l'information nécessaire accessible à la demande.

---

## 🏗️ Architecture en 3 Niveaux

### Niveau 1 : CLAUDE.md (30 lignes) - LU AUTOMATIQUEMENT
**Contenu :**
- Contexte minimal du projet (3 lignes)
- Pointeurs vers protocoles critiques
- Commandes essentielles seulement
- Références vers docs détaillées

**Tokens :** ~200 tokens par session
**Lecture :** Automatique à chaque session

### Niveau 2 : Documents de Référence - LUS À LA DEMANDE
**Fichiers :**
- `.claude/reference.md` (214 lignes) - Architecture complète, workflows détaillés
- `.claude/collaboration.md` (273 lignes) - Protocole Supernova détaillé
- `docs/refactoring-progress.md` (300+ lignes) - Historique refactoring

**Tokens :** ~1,500 tokens par lecture (seulement si nécessaire)
**Lecture :** Claude lit seulement quand pertinent pour la tâche

### Niveau 3 : Code Source - LU AU BESOIN
**Lecture :** Uniquement les fichiers spécifiques nécessaires pour la tâche en cours

---

## 📊 Comparaison Avant/Après

### ❌ Avant Optimisation
```
Session start:
- CLAUDE.md (214 lignes) → ~1,400 tokens
- Lu à CHAQUE session
- 80% non pertinent pour la plupart des tâches

Session typique:
- Contexte initial: ~1,400 tokens
- Total session: 10,000-20,000 tokens
- % contexte inutile: ~10-14%
```

### ✅ Après Optimisation
```
Session start:
- CLAUDE.md (30 lignes) → ~200 tokens
- Lu à CHAQUE session
- 100% pertinent

Session typique:
- Contexte initial: ~200 tokens
- Lecture à la demande: +0 à +1,500 tokens (si besoin)
- Total session: 8,000-18,000 tokens
- Économie: ~1,200 tokens par session (12%)
- Économie sur 10 sessions: ~12,000 tokens
```

---

## 🎯 Règles pour Claude

### Quand lire .claude/reference.md (214 lignes)
- Ajouter une nouvelle feature/commande Discord
- Modifier l'architecture (nouveau module, réorganisation)
- Questions sur les modèles de données Prisma
- Comprendre le système de deployment
- Ajouter un endpoint backend

### Quand lire .claude/collaboration.md (273 lignes)
- Début d'un projet multi-étapes (refactoring, migration)
- Tâche répétitive sur plusieurs fichiers
- Hésitation : "Est-ce que Supernova pourrait faire ça ?"

### Quand lire refactoring-progress.md (300+ lignes)
- Continuer le refactoring en cours
- Vérifier l'état d'avancement
- Préparer la prochaine phase

### Ne JAMAIS lire
- Fichiers non pertinents pour la tâche actuelle
- Documentation "au cas où"

---

## 📝 Maintenance du Système

### Ajouter un nouveau protocole/workflow
1. Créer `.claude/nouveau-protocole.md` (si spécifique Claude) ou `docs/NOUVEAU.md` (si doc projet)
2. Ajouter référence dans `CLAUDE.md` section "Detailed Documentation"
3. Mettre à jour `.claude/README.md` si fichier Claude
4. Garder CLAUDE.md minimal (max 60 lignes)

### Mettre à jour l'état du projet
Modifier `CLAUDE.md` section "Current Project Status" :
```markdown
## 🎯 Current Project Status

**Active Task:** [Description courte]
**Check:** [Fichier à lire pour détails]
```

---

## 🚀 Bénéfices

1. **Économie tokens** : ~1,200 tokens par session (~12%)
2. **Démarrage rapide** : Claude comprend l'essentiel en ~200 tokens
3. **Lecture ciblée** : Documentation détaillée lue seulement si pertinente
4. **Scalabilité** : Projet peut grandir sans augmenter le contexte initial
5. **Maintenance** : Un seul fichier léger à maintenir (CLAUDE.md)

---

## 📈 Métriques

**Économie estimée sur le refactoring complet (10 sessions) :**
- Avant : 214 lignes × 10 sessions = 2,140 lignes lues
- Après : 30 lignes × 10 sessions = 300 lignes lues
- **Économie : 1,840 lignes = ~12,000 tokens**

**Avec collaboration Supernova :**
- Économie refactoring Phases 1-5 : ~60% tokens
- Économie système contexte : ~12% tokens additionels
- **Total : ~72% économie vs approche naïve**

---

## 🔄 Évolution Future

Si CLAUDE.md dépasse 40 lignes :
1. Identifier sections détaillées
2. Extraire dans nouveau fichier `docs/`
3. Garder seulement référence dans CLAUDE.md

**Principe :** CLAUDE.md doit tenir sur un seul écran terminal (< 50 lignes)

---

**Date de création :** 2025-10-08
**Créé par :** Système de meta-protocole (utilisateur + Claude)
