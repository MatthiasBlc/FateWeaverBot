# CLAUDE - Essentials

**Read this first. Only read detailed docs when needed.**

---

## 🎯 Quick Context

**Project:** FateWeaverBot - Discord RPG bot (TypeScript) + REST API (Express/Prisma)
**Architecture:** Bot ↔ Backend API ↔ PostgreSQL
**Working Directory:** `/home/bouloc/Repo/FateWeaverBot/bot/` for npm commands

---

## ⚡ Critical Protocols (Read These)

1. **Token Optimization:** `docs/COLLABORATION-PROTOCOL.md` - When to use Supernova vs Claude
2. **Meta-Protocol:** When you discover efficient workflows → document in `docs/` → reference here

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

- **Full Architecture & Workflows:** `CLAUDE-REFERENCE.md` (214 lines - read when modifying structure/adding features)
- **Refactoring Progress:** `docs/refactoring-progress.md` (read when continuing refactoring work)
- **Collaboration Protocol:** `docs/COLLABORATION-PROTOCOL.md` (read at start of multi-step projects)
- **Context Optimization System:** `docs/CONTEXT-OPTIMIZATION.md` (explains this 3-tier system)

---

## 🎯 Current Project Status

**Active Task:** Phase 5 refactoring (applying utils globally)
**Check:** `docs/refactoring-progress.md` for latest status

---

**This file: 52 lines | Old CLAUDE.md: 214 lines | Token savings: ~75% per session**
