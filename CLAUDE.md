# CLAUDE - Essentials

**🤖 AUTO-CONTEXT SYSTEM - RUN THIS FIRST:**

```bash
node scripts/context-helper.js init
```

This analyzes your current task and suggests optimal files to load, minimizing tokens.
See `.claude/context-guide.md` for how the intelligent context system works.

---

**Read this first. Only read detailed docs when needed.**

---

## 🎯 Quick Context

**Project:** FateWeaverBot - Discord RPG bot (TypeScript) + REST API (Express/Prisma)
**Architecture:** Bot ↔ Backend API ↔ PostgreSQL
**Working Directory:** `/home/bouloc/Repo/FateWeaverBot/bot/` for npm commands

---

## ⚡ Critical Protocols (Read These)

1. **🚨 SUPERNOVA AUTOMATIQUE:** Pour tâches >3 fichiers OU >100 lignes :
   - Créer AUTOMATIQUEMENT `.supernova/prompt-[nom].md` avec détails
   - Fournir mini-prompt ≤50 tokens : `Lis .supernova/prompt-[nom].md et exécute. Crée rapport : .supernova/report-[nom].md avec résumé ≤300 tokens en première section.`
   - Attendre "Terminé" → Lire résumé du rapport uniquement
2. **Token Optimization:** `.claude/collaboration.md` - Protocole complet avec checklist
3. **Meta-Protocol:** When you discover efficient workflows → document in `.claude/` or `docs/` → reference here

---

## 📐 Code Conventions

1. **Emoji Centralization (STRICT):**
   - ❌ NEVER hardcode emojis in code (`"🎉"`, `"✅"`)
   - ✅ ALWAYS import from `@shared/constants/emojis`
   - All emojis MUST be documented with usage location
   - File: `shared/constants/emojis.ts`

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

- **Full Architecture & Workflows:** `.claude/reference.md` - read when modifying structure/adding features
- **Supernova Quick Ref:** `.claude/supernova-quick-ref.md` - read before EACH Supernova delegation
- **Collaboration Protocol:** `.claude/collaboration.md` - read at start of multi-step projects
- **Context Guide:** `.claude/context-guide.md` - how this system works, when to read what
- **All .claude/ docs indexed:** `.claude/README.md`

---

**This file: 52 lines | Old CLAUDE.md: 214 lines | Token savings: ~75% per session**
- Je ne veux pas de dotenv ni dans le back ni dans le front, les variables env sont envoyées via le build du docker compose