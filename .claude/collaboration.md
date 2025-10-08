# 🤝 Protocole de Collaboration - Claude Code & Supernova

## 📋 Vue d'ensemble

Ce document définit le protocole de collaboration entre **Claude Code** et **Code Supernova** pour optimiser l'utilisation des crédits et maximiser l'efficacité du développement.

---

## 🎯 Quand utiliser Supernova

Supernova doit être utilisé pour **toutes les tâches couteuses en tokens** :

### ✅ Tâches pour Supernova
- **Migrations répétitives** : Appliquer le même pattern sur plusieurs fichiers
- **Refactoring mécanique** : Renommer, déplacer, restructurer selon un plan défini
- **Modifications en masse** : Changer des imports, remplacer du code dupliqué
- **Tests systématiques** : Tester après chaque modification, créer commits
- **Documentation répétitive** : Générer des docs basées sur des templates

### ❌ Tâches pour Claude Code
- **Analyse et planification** : Comprendre la structure, identifier les problèmes
- **Décisions d'architecture** : Choisir les patterns, définir la stratégie
- **Création de prompts** : Rédiger les instructions détaillées pour Supernova
- **Validation** : Vérifier le travail de Supernova, valider la qualité
- **Résolution de problèmes complexes** : Debugger, comprendre des erreurs non-standard

---

## 🔄 Protocole Standard (6 étapes)

### Étape 1 : Analyse (Claude Code)
Claude analyse le problème, le contexte, et détermine si Supernova peut aider.

**Claude pense** : "Cette tâche est-elle répétitive/mécanique/volumineuse ?"
- **Oui** → Protocole Supernova
- **Non** → Claude fait le travail directement

### Étape 2 : Planification (Claude Code)
Claude crée un plan détaillé avec :
- Liste des fichiers/tâches
- Ordre d'exécution
- Patterns de transformation (avant/après)
- Critères de succès
- Procédure de test

### Étape 3 : Création du Prompt (Claude Code)
Claude crée un fichier détaillé :
- **Emplacement** : `docs/supernova-prompt-[nom-tache].md`
- **Contenu** : Instructions complètes, exemples, règles critiques
- **Format** : Markdown structuré avec sections claires

### Étape 4 : Transmission (Claude Code → User)
Claude fournit un **prompt court** à copier-coller pour Supernova :

```markdown
## 🚀 PROMPT POUR SUPERNOVA

Copie le texte ci-dessous et donne-le à Code Supernova dans Windsurf :

[Prompt court avec référence au fichier docs/supernova-prompt-*.md]
```

### Étape 5 : Exécution (User → Supernova)
L'utilisateur :
1. Copie le prompt fourni par Claude
2. Lance Supernova dans Windsurf
3. Colle le prompt
4. Laisse Supernova travailler
5. Récupère le rapport final de Supernova

### Étape 6 : Validation (User → Claude Code)
L'utilisateur colle le rapport de Supernova à Claude qui :
1. Valide le travail (build, structure, métriques)
2. Met à jour la documentation
3. Prépare la suite ou termine

---

## ⚠️ Règles Critiques

### 🚫 Ce que Claude NE DOIT JAMAIS faire
- **Lancer Supernova via Task tool** : Toujours passer par l'utilisateur
- **Faire le travail de Supernova** : Si c'est répétitif, déléguer
- **Oublier de proposer Supernova** : Penser systématiquement aux tokens

### ✅ Ce que Claude DOIT faire
- **Proposer Supernova proactivement** : "Je vais créer un prompt pour Supernova"
- **Créer des prompts détaillés** : Supernova doit avoir toutes les infos
- **Inclure les commandes exactes** : Chemins absolus, commandes complètes
- **Définir le format du rapport** : Supernova doit savoir quoi rapporter

---

## 📊 Économies de Tokens

### Exemple : Refactoring FateWeaverBot (Phases 1-5)

**Avec Supernova** :
- Claude : ~105k tokens (analyse, planning, validation)
- Supernova : ~150k tokens (exécution)
- **Total : ~255k tokens**

**Sans Supernova** (estimation) :
- Claude seul : ~400k+ tokens
- **Économie : ~36% de tokens**

### Pourquoi ces économies ?
1. **Pas de lecture répétée** : Claude lit 1 fois, Supernova exécute N fois
2. **Pas de contexte dupliqué** : Un seul prompt détaillé vs multiples échanges
3. **Exécution parallèle** : Supernova ne compte pas dans le quota Claude

---

## 📝 Templates de Prompts

### Template Prompt Court (pour l'utilisateur)
```markdown
## 🚀 PROMPT POUR SUPERNOVA - [Nom Tâche]

Copie le contenu ci-dessous et donne-le à **Code Supernova** dans Windsurf :

\`\`\`markdown
# MISSION : [Nom de la tâche]

Tu es **Code Supernova**, agent d'exécution pour [projet].

## 📄 INSTRUCTIONS COMPLÈTES
Lis et exécute : `/chemin/absolu/vers/docs/supernova-prompt-X.md`

## ⚠️ RÈGLES CRITIQUES
1. Commandes npm : `cd /chemin/absolu && npm run build`
2. Tester APRÈS CHAQUE modification
3. Committer APRÈS CHAQUE succès

## 🎯 TÂCHES
[Liste courte des tâches principales]

## 📊 RAPPORT FINAL
À la fin, fournis un rapport avec [liste des métriques attendues]

## 🚀 COMMENCE
Lis le prompt détaillé et commence !
\`\`\`

---

**Action pour toi :** Copie ce prompt et donne-le à Supernova dans Windsurf. Tu me colleras son rapport quand il aura terminé ! 🎯
```

### Template Prompt Détaillé (docs/supernova-prompt-X.md)
```markdown
# 🚀 [NOM DE LA TÂCHE]

## 📋 Mission Supernova

**Objectif** : [Description claire]
**Fichiers cibles** : [Nombre] fichiers ([Nombre] lignes)
**Résultat attendu** : [Métriques de succès]

## ⚠️ RÈGLES CRITIQUES

1. **Commandes** : [Commandes exactes avec chemins absolus]
2. **Ordre** : [Ordre d'exécution strict]
3. **Tests** : [Quand et comment tester]
4. **Commits** : [Format et fréquence]

## 📦 TÂCHES (dans l'ordre)

### Tâche 1 : [Nom]
**Fichier** : `chemin/absolu/fichier.ts`
**Modifications** :
- [Liste précise]

**Tester** : [Commande]
**Commit** : [Message exact]

[Répéter pour chaque tâche]

## 📝 PATTERNS DE TRANSFORMATION

### Pattern 1 : [Nom]
**AVANT** :
\`\`\`typescript
[Code avant]
\`\`\`

**APRÈS** :
\`\`\`typescript
[Code après]
\`\`\`

[Répéter pour chaque pattern]

## ✅ PROCÉDURE

1. [Étape 1]
2. [Étape 2]
[...]

## 🎯 OBJECTIFS DE RÉUSSITE

- ✅ [Critère 1]
- ✅ [Critère 2]
[...]

## 📊 RAPPORT FINAL ATTENDU

\`\`\`
✅ [NOM TÂCHE] COMPLÉTÉE

**Fichiers traités** : X/Y
[Liste avec détails]

**Métriques** :
- [Métrique 1] : [Valeur]
- [Métrique 2] : [Valeur]

**Avant** : [État initial]
**Après** : [État final]

**Problèmes** : [Liste ou "Aucun"]
\`\`\`

## 🚨 SI PROBLÈME

[Instructions de dépannage]

## 🚀 COMMENCE

[Instruction de démarrage précise]
```

---

## 🔍 Exemples Concrets

### Exemple 1 : Migration répétitive (Phase 5 FateWeaverBot)
- **Tâche** : Migrer 8 fichiers pour utiliser les utils créés
- **Tokens Claude** : ~15k (analyse + prompt + validation)
- **Tokens Supernova** : ~35k (exécution sur 8 fichiers)
- **Économie** : ~70% vs si Claude faisait tout

### Exemple 2 : Décomposition fichier monolithique (Phase 2)
- **Tâche** : Découper expedition.handlers.ts (1,725 lignes) en 5 modules
- **Tokens Claude** : ~20k (analyse + planning + prompt + validation)
- **Tokens Supernova** : ~40k (extraction + tests + commits)
- **Économie** : ~60% vs si Claude faisait tout

---

## 💡 Rappels pour Claude

Quand tu (Claude Code) vois une tâche volumineuse/répétitive :

1. **Pense Supernova** : "Est-ce que Supernova peut faire ça ?"
2. **Propose proactivement** : "Je vais créer un prompt pour Supernova"
3. **Crée le prompt détaillé** : Ne pas lésiner sur les détails
4. **Fournis le prompt court** : Facilite la vie de l'utilisateur
5. **Attends le rapport** : Ne pas lancer Supernova toi-même

**Phrase clé à retenir** : "Tu dois économiser tes crédits coute que coute"

---

## 📚 Références

- **Documentation Claude Code** : `/home/bouloc/Repo/FateWeaverBot/CLAUDE.md`
- **Progression Refactoring** : `/home/bouloc/Repo/FateWeaverBot/docs/refactoring-progress.md`
- **Prompts Supernova** : `/home/bouloc/Repo/FateWeaverBot/docs/supernova-prompt-*.md`

---

**Dernière mise à jour** : 2025-10-08
