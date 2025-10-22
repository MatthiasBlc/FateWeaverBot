# 📁 .claude/ - Claude Code Context Directory

This directory contains all context files and documentation specifically for Claude Code AI sessions.

---

## 📋 Files in this Directory

### 🎯 reference.md (214 lines)
**Full project architecture and detailed workflows**
- Complete directory structure
- Database schema details
- Discord bot architecture
- Development workflows (commands, features, endpoints)
- Testing & deployment procedures

**When to read:** Adding features, modifying architecture, understanding data models

---

### 🤝 collaboration.md (416 lines)
**Collaboration protocol between Claude Code and Code Supernova**
- When to use Supernova vs Claude
- 6-step protocol for delegation (AUTOMATIQUE)
- Token optimization strategies
- Prompt templates (mini-prompt ≤50 tokens & detailed)
- Checklist automatique pour Claude
- Real examples with token savings

**When to read:** Starting multi-step projects, repetitive tasks, token optimization needed

---

### 🚀 supernova-quick-ref.md (59 lines)
**Quick reference for Supernova protocol**
- Checklist pour savoir quand proposer Supernova
- Protocole en 3 phases automatiques
- Liste des JAMAIS / TOUJOURS
- Format exact du mini-prompt

**When to read:** EVERY TIME before delegating to Supernova

---

### 📊 context-optimization.md (146 lines)
**Explanation of the 3-tier context system**
- Why CLAUDE.md is only 52 lines
- When to read detailed docs
- Token savings calculations
- Maintenance rules

**When to read:** Understanding how this system works, maintaining context files

---

### 🏗️ production-build.md
**Production build configuration and troubleshooting**
- TypeScript path mappings resolution with `tsconfig-paths`
- Shared directory handling (symlink local, copied in Docker)
- Docker build verification steps
- Common issues and solutions

**When to read:** Fixing compilation errors, setting up new dev environment, production deployment issues

---

### 📁 commands/ subdirectory
**Slash command definitions for Claude Code**
- `epct.md` - Explore-Plan-Code-Test workflow definition

**Note:** These are Claude Code slash commands, not Discord bot commands.

---

## 🔄 Relationship with Other Docs

**Claude-specific (this directory):**
- `.claude/reference.md` - Architecture & workflows
- `.claude/collaboration.md` - Supernova protocol complet
- `.claude/supernova-quick-ref.md` - Référence rapide Supernova (⚡ À lire AVANT chaque délégation)
- `.claude/context-optimization.md` - Context system

**Project-specific (docs/):**
- `docs/refactoring-progress.md` - Refactoring status
- `docs/refactoring-roadmap.md` - Refactoring plan

**Supernova workspace (.supernova/):**
- `.supernova/prompt-*.md` - Instructions détaillées pour Supernova
- `.supernova/report-*.md` - Rapports d'exécution de Supernova

**Entry point (root):**
- `CLAUDE.md` - Minimal context (auto-read every session)

---

## 🎯 Principle

**Keep root minimal, detailed docs on-demand**
- `CLAUDE.md` at root: ~52 lines, ~350 tokens
- This directory: Read only when task requires it
- Token savings: ~75% per session vs old monolithic CLAUDE.md

---

## 🎯 Pour Claude : Protocole Supernova Automatique

**RAPPEL CRITIQUE** : Quand une tâche nécessite >3 fichiers OU >100 lignes :

1. ⚡ Consulter `.claude/supernova-quick-ref.md`
2. ✅ Créer AUTOMATIQUEMENT `.supernova/prompt-[nom].md`
3. ✅ Fournir mini-prompt ≤50 tokens
4. ✅ Attendre "Terminé" → Lire résumé uniquement

**Ne jamais oublier** : Le but est d'économiser les crédits en déléguant à Supernova toutes les tâches répétitives/volumineuses.

---

**Last updated:** 2025-10-16
