# CLAUDE - Essentials

**🤖 AUTO-CONTEXT SYSTEM - RUN THIS FIRST:**

```bash
node scripts/context-helper.js init
```

This analyzes your current task and suggests optimal files to load, minimizing tokens.
See `.claude/context-rules.md` for how the intelligent context system works.

---

**Read this first. Only read detailed docs when needed.**

---

## 🎯 Quick Context

**Project:** FateWeaverBot - Discord RPG bot (TypeScript) + REST API (Express/Prisma)
**Architecture:** Bot ↔ Backend API ↔ PostgreSQL
**Working Directory:** `/home/bouloc/Repo/FateWeaverBot/bot/` for npm commands

---

## ⚡ Critical Protocols (Read These)

1. **🚨 SUPERNOVA SYSTÉMATIQUE:** TOUJOURS proposer Supernova pour tâches >3 fichiers OU >100 lignes. Si validé → fournir prompt copier-coller + demander rapport final.
2. **Token Optimization:** `.claude/collaboration.md` - Protocole détaillé Supernova
3. **Meta-Protocol:** When you discover efficient workflows → document in `.claude/` or `docs/` → reference here

---

## 🔧 Essential Commands

```bash
# Bot (always run from /home/bouloc/Repo/FateWeaverBot/bot/)
npm run build              # Test compilation
npm run deploy             # Deploy changed commands to Discord

# Docker (from project root)
docker compose logs -f discord-botdev    # Bot logs
docker compose logs -f backenddev        # Backend logs
```

---

## 📚 Detailed Documentation (Read On-Demand)

- **Full Architecture & Workflows:** `.claude/reference.md` (214 lines - read when modifying structure/adding features)
- **Collaboration Protocol:** `.claude/collaboration.md` (273 lines - read at start of multi-step projects)
- **Context System Explained:** `.claude/context-optimization.md` (146 lines - how this system works)
- **Refactoring Progress:** `docs/refactoring-progress.md` (read when continuing refactoring work)
- **All .claude/ docs indexed:** `.claude/README.md`

---

## 🎯 Current Project Status

**Active Task:** Phase 5 refactoring (applying utils globally)
**Check:** `docs/refactoring-progress.md` for latest status

---

**This file: 52 lines | Old CLAUDE.md: 214 lines | Token savings: ~75% per session**
