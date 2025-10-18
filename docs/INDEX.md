# 📚 Index de la Documentation - FateWeaverBot

**Dernière mise à jour** : 2025-10-08

Ce fichier sert d'index central pour toute la documentation du projet.

---

## 🎯 Documentation par Usage

### Pour Commencer
- **Setup projet** : [README.md](../README.md) (racine)
- **Setup local** : [README-local.md](../README-local.md)
- **Setup bot** : [bot/README.md](../bot/README.md)
- **Setup backend** : [backend/README.md](../backend/README.md)

### Pour Développer
- **Architecture bot** : [bot/ARCHITECTURE.md](../bot/ARCHITECTURE.md) ⭐ **NOUVEAU**
- **Déploiement commandes** : [bot/DEPLOY-COMMANDS.md](../bot/DEPLOY-COMMANDS.md)
- **Liste des tâches** : [TODO.md](TODO.md)
- **Référence technique** : [.claude/reference.md](../.claude/reference.md)

### Pour Claude Code
- **Point d'entrée** : [CLAUDE.md](../CLAUDE.md) (52 lignes, optimisé)
- **Architecture complète** : [.claude/reference.md](../.claude/reference.md)
- **Protocole Supernova** : [.claude/collaboration.md](../.claude/collaboration.md)
- **Système contexte** : [.claude/context-optimization.md](../.claude/context-optimization.md)
- **Index .claude/** : [.claude/README.md](../.claude/README.md)

### Refactoring (Oct 2025)
- **Progression** : [refactoring-progress.md](refactoring-progress.md) ⭐ **Actif**
- **Archive** : [archive/refactoring/](archive/refactoring/) (roadmap, prompts Supernova)

---

## 📂 Structure des Fichiers Markdown

### Racine Projet (/)
| Fichier | Description | Status |
|---------|-------------|--------|
| [README.md](../README.md) | Guide utilisateur principal | ✅ Actif |
| [README-local.md](../README-local.md) | Setup développement local | ✅ Actif |
| [CLAUDE.md](../CLAUDE.md) | Point d'entrée Claude (52 lignes) | ✅ Actif |

### Bot (bot/)
| Fichier | Description | Status |
|---------|-------------|--------|
| [ARCHITECTURE.md](../bot/ARCHITECTURE.md) | Architecture post-refactoring | ✅ NOUVEAU |
| [README.md](../bot/README.md) | Guide bot Discord | ✅ Actif |
| [DEPLOY-COMMANDS.md](../bot/DEPLOY-COMMANDS.md) | Système déploiement commandes | ✅ Actif |

### Backend (backend/)
| Fichier | Description | Status |
|---------|-------------|--------|
| [README.md](../backend/README.md) | Guide API backend | ✅ Actif |

### Claude (.claude/)
| Fichier | Description | Lignes | Status |
|---------|-------------|--------|--------|
| [README.md](../.claude/README.md) | Index docs Claude | 76 | ✅ Actif |
| [reference.md](../.claude/reference.md) | Architecture complète | 214 | ✅ Actif |
| [collaboration.md](../.claude/collaboration.md) | Protocole Supernova | 273 | ✅ Actif |
| [context-optimization.md](../.claude/context-optimization.md) | Système 3-tier | 147 | ✅ Actif |
| [commands/epct.md](../.claude/commands/epct.md) | Slash command workflow | 235 | ✅ Actif |

### Documentation Active (docs/)
| Fichier | Description | Status |
|---------|-------------|--------|
| [INDEX.md](INDEX.md) | Index central (ce fichier) | ✅ NOUVEAU |
| [TODO.md](TODO.md) | Liste tâches et améliorations | ✅ Actif |
| [refactoring-progress.md](refactoring-progress.md) | Journal refactoring | ✅ Actif |

### Archive (docs/archive/)
| Dossier | Description | Status |
|---------|-------------|--------|
| [README.md](archive/README.md) | Guide de l'archive | ✅ NOUVEAU |
| [specifications/](archive/specifications/) | Specs historiques (5 dossiers) | 📦 Archivé |
| [refactoring/](archive/refactoring/) | Refactoring docs | 📦 Archivé |
| [refactoring/supernova-prompts/](archive/refactoring/supernova-prompts/) | Prompts Phases 1-5 | 📦 Archivé |

---

## 🔍 Trouver une Information

### "Je veux comprendre l'architecture du bot"
→ [bot/ARCHITECTURE.md](../bot/ARCHITECTURE.md)

### "Je veux ajouter une nouvelle feature"
→ [bot/ARCHITECTURE.md](../bot/ARCHITECTURE.md) section "Workflow de Développement"

### "Je veux travailler avec Claude Code"
→ [CLAUDE.md](../CLAUDE.md) puis [.claude/reference.md](../.claude/reference.md)

### "Je veux utiliser Supernova"
→ [.claude/collaboration.md](../.claude/collaboration.md)

### "Je veux comprendre le refactoring"
→ [refactoring-progress.md](refactoring-progress.md) ou [archive/refactoring/](archive/refactoring/)

### "Je veux voir les specs historiques"
→ [archive/specifications/](archive/specifications/)

### "Qu'est-ce qui reste à faire ?"
→ [TODO.md](TODO.md)

---

## 📊 Statistiques Documentation

**Total fichiers markdown** : 37

**Par catégorie :**
- Racine : 3
- Bot : 3
- Backend : 1
- .claude/ : 5
- docs/ actifs : 3
- docs/archive/ : 22

**Lignes totales (docs actives)** : ~1,500 lignes
**Lignes archivées** : ~3,000+ lignes

---

## 🎯 Règles de Maintenance

### Ajouter un Nouveau Document

**Si c'est pour Claude Code :**
1. Créer dans `.claude/`
2. Mettre à jour `.claude/README.md`
3. Référencer dans `CLAUDE.md` si essentiel

**Si c'est une doc projet :**
1. Créer dans `docs/`
2. Mettre à jour ce fichier (INDEX.md)
3. Catégoriser correctement

**Si c'est une spec/RFC :**
1. Créer dans `docs/archive/specifications/`
2. Ajouter référence dans `archive/README.md`

### Archiver un Document

1. Déplacer vers `docs/archive/[catégorie]/`
2. Mettre à jour `archive/README.md`
3. Mettre à jour ce fichier (INDEX.md)
4. **Ne jamais supprimer** (seulement archiver)

### Mettre à Jour

Ce fichier doit être mis à jour quand :
- Nouveau fichier markdown ajouté
- Fichier archivé ou déplacé
- Nouvelle catégorie de docs créée

---

## 🔗 Liens Externes Utiles

- **Discord.js Docs** : https://discord.js.org/
- **Prisma Docs** : https://www.prisma.io/docs
- **Claude Code** : https://claude.com/claude-code
- **GitHub Repo Issues** : https://github.com/anthropics/claude-code/issues

---

**Créé le** : 2025-10-08
**Par** : Audit et réorganisation documentation
**Maintenu par** : Équipe de développement
