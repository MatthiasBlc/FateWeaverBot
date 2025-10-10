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
5. **Supernova crée automatiquement un fichier de rapport** (pas de copier-coller)
6. L'utilisateur informe Claude : "Terminé" (Claude connaît l'emplacement du fichier)

### Étape 6 : Validation (User → Claude Code)
L'utilisateur dit simplement "Terminé". Claude :
1. Lit le fichier de rapport au chemin standardisé `docs/supernova-reports/supernova-report-[nom-tache]-[date].md`
2. Lit **UNIQUEMENT** la section **RÉSUMÉ EXÉCUTIF** (≤300 tokens)
3. Si le résumé indique tout OK → Valide et continue
4. Si problèmes détectés → Lit les sections pertinentes du rapport détaillé
5. Met à jour la documentation et prépare la suite

**Économie de contexte maximale** :
- Sans fichier : ~10k-50k tokens copiés-collés
- Avec fichier + résumé : ~300 tokens lus (95% des cas)
- **Économie : ~97% de tokens sur la validation**

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

**Avec Supernova + Fichiers de rapport** :
- Claude : ~85k tokens (analyse, planning, validation via résumés uniquement)
- Supernova : ~150k tokens (exécution)
- **Total : ~235k tokens**

**Avec Supernova + Rapports copiés-collés** (ancien système) :
- Claude : ~105k tokens (analyse, planning, validation en lisant rapports complets)
- Supernova : ~150k tokens (exécution)
- **Total : ~255k tokens**

**Sans Supernova** (estimation) :
- Claude seul : ~400k+ tokens
- **Économie : ~41% de tokens avec le nouveau système**

### Pourquoi ces économies ?
1. **Pas de lecture répétée** : Claude lit 1 fois, Supernova exécute N fois
2. **Pas de contexte dupliqué** : Un seul prompt détaillé vs multiples échanges
3. **Exécution parallèle** : Supernova ne compte pas dans le quota Claude
4. **Rapports en fichiers** : Pas de copier-coller massif de rapports
5. **Résumés courts** : Claude lit 300 tokens au lieu de 5k-10k par rapport (95% des cas)

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

## ⚠️ RÈGLES CRITIQUES - IMPÉRATIF

### 🚫 INTERDICTIONS ABSOLUES
1. **NE JAMAIS supprimer un fichier** sans avoir essayé au moins 3 corrections différentes
2. **NE JAMAIS considérer un fichier "corrompu"** - les fichiers ont juste des erreurs TypeScript à corriger
3. **NE JAMAIS tourner en boucle** - Si même erreur après 2 tentatives, STOP et documente le problème
4. **NE JAMAIS committer sans build** - Le build DOIT passer avant chaque commit

### ✅ PROCÉDURE OBLIGATOIRE

**Après CHAQUE modification de fichier :**
1. `cd /chemin/absolu && npm run build` (backend OU bot selon le fichier)
2. Si erreur TypeScript → **CORRIGER dans le même fichier** (pas de suppression)
3. Si même erreur 2 fois → **STOP, documenter, passer à la tâche suivante**
4. Si build OK → `git add . && git commit -m "message descriptif"`
5. Continuer avec la tâche suivante

**Gestion des erreurs TypeScript :**
- Erreur de syntaxe → Corriger la syntaxe (accolade, parenthèse, etc.)
- Import manquant → Ajouter l'import
- Type incorrect → Ajuster le type
- Variable non utilisée → Supprimer ou utiliser la variable
- **JAMAIS** → Supprimer le fichier et le recréer

### 📊 RAPPORT FINAL OBLIGATOIRE

Tu DOIS créer un fichier de rapport avec cette structure EXACTE :

**Emplacement** : `docs/supernova-reports/supernova-report-[nom-tache]-[YYYYMMDD].md`

**Structure du fichier** :

```markdown
# 📊 RÉSUMÉ EXÉCUTIF (≤300 tokens)

**Statut** : ✅ Succès complet | ⚠️ Succès partiel | ❌ Échec
**Tâches complétées** : X/Y
**Builds** : ✅ Backend OK | ✅ Bot OK (ou ❌ si erreurs)
**Commits** : X commits créés
**Problèmes bloquants** : Aucun | [Liste courte]

**Résumé** : [2-3 phrases décrivant ce qui a été fait et résultat global]

---

# 📋 RAPPORT DÉTAILLÉ

## 📁 Fichiers Modifiés
[Liste complète avec lignes ajoutées/supprimées]

## 💾 Commits Créés
[Liste avec hashes et messages]

## ✅ Builds Réussis
[Détails des builds]

## 🔧 Erreurs Résolues
[Liste détaillée]

## ⚠️ Problèmes Non Résolus
[Si applicable]

## 📈 Métriques
[Temps, lignes, taux de succès]
```

**RÈGLE CRITIQUE** : Le RÉSUMÉ EXÉCUTIF doit tenir en 300 tokens MAX (Claude le lira toujours, le reste seulement si nécessaire)

## 🎯 TÂCHES
[Liste courte des tâches principales]

## 🚀 COMMENCE
Lis le prompt détaillé et commence !
\`\`\`

---

**Action pour toi :** Copie ce prompt et donne-le à Supernova dans Windsurf. Dis-moi juste "Terminé" quand il aura fini (il créera un fichier de rapport que je lirai) ! 🎯
```

### Template Prompt Détaillé (docs/supernova-prompt-X.md)
```markdown
# 🚀 [NOM DE LA TÂCHE]

## 📋 Mission Supernova

**Objectif** : [Description claire]
**Fichiers cibles** : [Nombre] fichiers ([Nombre] lignes)
**Résultat attendu** : [Métriques de succès]

## ⚠️ RÈGLES CRITIQUES - IMPÉRATIF

### 🚫 INTERDICTIONS ABSOLUES
1. **NE JAMAIS supprimer un fichier** sans avoir essayé au moins 3 corrections différentes
2. **NE JAMAIS considérer un fichier "corrompu"** - Corriger les erreurs TypeScript, pas supprimer
3. **NE JAMAIS tourner en boucle** - Si même erreur après 2 tentatives :
   - STOP immédiatement
   - Documente l'erreur dans le rapport
   - Passe à la tâche suivante
4. **NE JAMAIS committer sans build** - Build DOIT passer avant commit

### ✅ WORKFLOW STRICT PAR FICHIER

```
Pour CHAQUE fichier modifié :
1. Modifier le fichier
2. cd /chemin/absolu && npm run build
3. Si erreur :
   a. Lire l'erreur TypeScript complète
   b. Corriger DANS LE MÊME FICHIER (pas de suppression)
   c. Re-build
   d. Si même erreur → Tenter correction différente (max 2 fois)
   e. Si toujours erreur → STOP, documenter, passer au suivant
4. Si build OK :
   a. git add .
   b. git commit -m "feat: description précise"
   c. Passer au fichier suivant
```

### 🔍 GESTION ERREURS TYPESCRIPT

**Types d'erreurs et corrections :**
- `Unexpected token` → Vérifier accolades/parenthèses/virgules
- `Cannot find name` → Ajouter import ou déclarer la variable
- `Type X is not assignable to Y` → Ajuster le type ou le cast
- `X is declared but never used` → Utiliser la variable ou supprimer la déclaration
- `Missing closing brace` → Compter les accolades, ajouter la manquante

**SI BLOQUÉ après 2 tentatives :**
1. Laisser le fichier dans son état actuel
2. Documenter : "❌ Fichier X : Erreur Y non résolue après 2 tentatives"
3. Passer à la tâche suivante
4. **NE PAS** supprimer le fichier

### 📊 RAPPORT FINAL OBLIGATOIRE

Structure EXACTE du rapport à fournir :

```markdown
# ✅ RAPPORT FINAL - [NOM TÂCHE]

## 📁 Fichiers Modifiés
- `/chemin/fichier1.ts` (+X lignes, -Y lignes)
- `/chemin/fichier2.ts` (+X lignes, -Y lignes)
Total : X fichiers

## 💾 Commits Créés
1. `abc1234` - feat: description commit 1
2. `def5678` - feat: description commit 2
Total : X commits

## ✅ Builds Réussis
- ✅ Backend : `npm run build` (0 errors)
- ✅ Bot : `npm run build` (0 errors)

## 🔧 Erreurs Résolues
1. **Fichier X, ligne Y** : Erreur Z → Corrigé en [explication]
2. **Fichier A, ligne B** : Erreur C → Corrigé en [explication]

## ⚠️ Problèmes Non Résolus (SI APPLICABLE)
- ❌ Fichier `/path/file.ts` : Erreur "message" après 2 tentatives
- Raison : [Explication de pourquoi bloqué]

## 📈 Métriques
- Durée estimée : X heures
- Lignes ajoutées : +XXX
- Lignes supprimées : -XXX
- Taux de succès : X/Y tâches complétées
```

### 🎯 COMMANDES EXACTES
- **Build backend** : `cd /home/bouloc/Repo/FateWeaverBot/backend && npm run build`
- **Build bot** : `cd /home/bouloc/Repo/FateWeaverBot/bot && npm run build`
- **Commit** : `git add . && git commit -m "message"`
- **Prisma** : `cd /home/bouloc/Repo/FateWeaverBot/backend && npx prisma migrate dev --name nom_migration`

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

### ⚠️ RÈGLE ABSOLUE : PROPOSITION SYSTÉMATIQUE SUPERNOVA

**Claude Code DOIT TOUJOURS proposer Supernova pour les tâches volumineuses/répétitives.**

Quand tu (Claude Code) vois une tâche volumineuse/répétitive :

1. **Pense Supernova IMMÉDIATEMENT** : "Est-ce que Supernova peut faire ça ?"
2. **Propose SYSTÉMATIQUEMENT** : Si >3 fichiers OU >100 lignes OU répétitif → Proposer Supernova
3. **Laisse le choix** : "Je te propose de déléguer à Supernova pour économiser des crédits. Veux-tu que je le fasse, ou préfères-tu que je m'en charge ?"
4. **Si validation → Crée le prompt IMMÉDIATEMENT** : Prompt copier-coller ready avec instruction de créer un fichier de rapport
5. **ATTENDS "Terminé"** : Puis lis le fichier de rapport (résumé d'abord, détails si nécessaire)

### 🎯 Réflexes Automatiques

**TOUJOURS** quand tu délègues à Supernova :
1. ✅ Créer un prompt copier-coller ready
2. ✅ Inclure : "Crée un fichier de rapport à `docs/supernova-reports/supernova-report-[nom]-[date].md`"
3. ✅ Spécifier que le rapport doit avoir un **RÉSUMÉ EXÉCUTIF ≤300 tokens** en première section
4. ✅ Dire à l'utilisateur : "Dis-moi juste 'Terminé' quand c'est fait"
5. ✅ Quand terminé : Lire le fichier de rapport (résumé d'abord, détails si nécessaire)

**JAMAIS** :
- ❌ Oublier de proposer Supernova pour une tâche volumineuse/répétitive
- ❌ Valider l'utilisation de Supernova sans fournir un prompt copier-coller
- ❌ Demander à l'utilisateur de copier-coller le rapport (c'est un fichier maintenant !)
- ❌ Lire le rapport détaillé complet si le résumé indique que tout est OK

### 📏 Seuils de Décision

**Utilise Supernova SI** :
- Modifier >3 fichiers avec même pattern
- Écrire >100 lignes de code répétitif
- Appliquer des migrations mécaniques
- Tester systématiquement après chaque change
- Créer de la documentation structurée

**Fais-le toi-même SI** :
- Analyse/compréhension de code
- Décision d'architecture
- Debugging complexe
- Modification <50 lignes sur 1-2 fichiers

**Phrase clé à retenir** : "Tu dois économiser tes crédits coute que coute - propose Supernova SYSTÉMATIQUEMENT pour toute tâche volumineuse, et fournis TOUJOURS un prompt copier-coller si validé"

---

## 📚 Références

- **Documentation Claude Code** : `/home/bouloc/Repo/FateWeaverBot/CLAUDE.md`
- **Progression Refactoring** : `/home/bouloc/Repo/FateWeaverBot/docs/refactoring-progress.md`
- **Prompts Supernova** : `/home/bouloc/Repo/FateWeaverBot/docs/supernova-prompt-*.md`

---

**Dernière mise à jour** : 2025-10-10
