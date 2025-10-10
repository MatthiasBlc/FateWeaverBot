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

### 🤝 collaboration.md (273 lines)
**Collaboration protocol between Claude Code and Code Supernova**
- When to use Supernova vs Claude
- 6-step protocol for delegation
- Token optimization strategies
- Prompt templates (short & detailed)
- Real examples with token savings

**When to read:** Starting multi-step projects, repetitive tasks, token optimization needed

---

### 📊 context-optimization.md (146 lines)
**Explanation of the 3-tier context system**
- Why CLAUDE.md is only 52 lines
- When to read detailed docs
- Token savings calculations
- Maintenance rules

**When to read:** Understanding how this system works, maintaining context files

---

### 📁 commands/ subdirectory
**Slash command definitions for Claude Code**
- `epct.md` - Explore-Plan-Code-Test workflow definition

**Note:** These are Claude Code slash commands, not Discord bot commands.

---

## 🔄 Relationship with Other Docs

**Claude-specific (this directory):**
- `.claude/reference.md` - Architecture & workflows
- `.claude/collaboration.md` - Supernova protocol
- `.claude/context-optimization.md` - Context system

**Project-specific (docs/):**
- `docs/refactoring-progress.md` - Refactoring status
- `docs/refactoring-roadmap.md` - Refactoring plan
- `docs/supernova-prompt-*.md` - Supernova instructions

**Entry point (root):**
- `CLAUDE.md` - Minimal context (auto-read every session)

---

## 🎯 Principle

**Keep root minimal, detailed docs on-demand**
- `CLAUDE.md` at root: ~52 lines, ~350 tokens
- This directory: Read only when task requires it
- Token savings: ~75% per session vs old monolithic CLAUDE.md

---

**Last updated:** 2025-10-08
