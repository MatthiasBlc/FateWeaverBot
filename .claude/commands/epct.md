---
description: Execute Explore-Plan-Code-Test workflow for structured development
argument-hint: [task description (optional)]
allowed-tools: Read, Glob, Grep, WebFetch, Edit, Write, Bash, TodoWrite, Task, mcp__ide__getDiagnostics, mcp__ide__executeCode
safety: confirm-before-write
---

# 🚀 EPCT Workflow: Explore → Plan → Code → Test

You are executing a structured development workflow for the following task:

**Task:** $ARGUMENTS

If no task was provided, apply this workflow to the **current conversation context** or active code.

---

## 📋 Workflow Overview

Follow these **4 mandatory phases** in strict order.  
Use `TodoWrite` to create and track your progress through each phase.

**IMPORTANT:** Create a todo list with these 4 main items at the start:
1. ✅ Explore - Gather context and understand the problem  
2. ⏳ Plan - Design the solution and get validation  
3. ⏳ Code - Implement the approved plan  
4. ⏳ Test - Verify quality and functionality  

You may add sub-tasks within each phase, but always maintain this structure.

---

## 🔍 Phase 1: EXPLORE

**Goal:** Gather all necessary context before making any decisions.

### Actions:
1. **Read existing code** related to the task  
   - Use `Read`, `Glob`, `Grep` to locate relevant files  
   - Understand current implementation, patterns, and conventions  
   - Check project documentation (`CLAUDE.md`, `README`, `docs/`)  

2. **Research external knowledge** if needed  
   - Use `WebFetch` for official documentation  
   - Search for best practices, standards, or examples  
   - Understand the technology stack requirements  

3. **Analyze dependencies and impacts**  
   - Identify affected files, modules, or systems  
   - Check for related features or tests  
   - Review database schemas (Prisma) if applicable  

4. **Document findings**  
   - Summarize what you learned  
   - Identify gaps in understanding  
   - List assumptions that need validation  

5. **Timebox exploration**  
   - Limit exploration to what’s directly relevant to the task  
   - Avoid unnecessary file scanning or deep unrelated research  

### Success Criteria:
- ✅ You have a complete understanding of the current state  
- ✅ You know what needs to change and why  
- ✅ You've identified all relevant files and dependencies  
- ✅ No more exploration is needed to create a plan  

> After completing this phase, summarize findings and update the TodoWrite list before moving on.

**DO NOT proceed to Plan phase until exploration is complete.**

---

## 📐 Phase 2: PLAN

**Goal:** Design a clear, validated solution before writing code.

### Actions:
1. **Create a structured plan** with:  
   - Clear objectives and success criteria  
   - Step-by-step implementation approach  
   - List of files to create/modify/delete  
   - Potential risks or edge cases  
   - Testing strategy  

2. **Present the plan** to the user with:  
   - Concise summary (not overly verbose)  
   - Rationale for major decisions  
   - Alternative approaches considered (if relevant)  
   - Questions about unclear requirements  

3. **Wait for validation**  
   - Ask explicit questions if anything is ambiguous  
   - Propose solutions for identified risks  
   - Request approval before proceeding  

### Success Criteria:
- ✅ Plan is clear, complete, and actionable  
- ✅ User has reviewed and approved the plan  
- ✅ All questions have been answered  
- ✅ You're confident you can implement it  

> After completing this phase, summarize findings and update the TodoWrite list before moving on.

**⚠️ MANDATORY CHECKPOINT: Get user approval before proceeding to Code phase.**

---

## 💻 Phase 3: CODE

**Goal:** Implement the approved plan efficiently and correctly.

### Actions:
1. **Follow the approved plan** strictly  
   - Implement changes step by step  
   - Use `Edit` for modifications, `Write` for new files  
   - Maintain existing code style and conventions  
   - Add meaningful comments where complexity exists  

2. **Track progress** transparently  
   - Update TodoWrite with sub-tasks if needed  
   - Mark items as completed as you go  
   - Report blockers or unexpected issues immediately  

3. **Preserve functionality**  
   - Don't break existing features  
   - Maintain backward compatibility unless explicitly discussed  
   - Follow project patterns (see CLAUDE.md for FateWeaver conventions)  

4. **Handle errors gracefully**  
   - If you encounter blockers, stop and report  
   - Don't make assumptions or workarounds without approval  
   - Update the plan if significant changes are needed  

### Success Criteria:
- ✅ All planned changes are implemented  
- ✅ Code follows project conventions and standards  
- ✅ No syntax errors or obvious bugs  
- ✅ Implementation matches the approved plan  

> After completing this phase, summarize findings and update the TodoWrite list before moving on.

**Once coding is complete, automatically proceed to Test phase.**

---

## ✅ Phase 4: TEST

**Goal:** Verify the implementation is correct, stable, and meets quality standards.

### Actions:
1. **Run existing tests**  
   - Execute test suites: `npm test`, `npm run test:unit`, etc.  
   - Check for test failures or regressions  
   - Report any broken tests immediately  

2. **Verify code quality**  
   - Run linting: `npm run lint` or equivalent  
   - Check type safety: `npm run build` or `tsc --noEmit`  
   - Use `mcp__ide__getDiagnostics` to check for IDE warnings  

3. **Validate functionality**  
   - Verify the changes work as intended  
   - Check edge cases mentioned in the plan  
   - Test integration with related features  

4. **Check configuration**  
   - Review `.eslintrc`, `tsconfig.json`, etc.  
   - Ensure all tools are properly configured  
   - Verify no unintended configuration changes  

5. **Document missing tests**  
   - **DO NOT create new tests** unless explicitly requested  
   - Report which tests are missing or should be added  
   - Flag areas that lack test coverage  

### Success Criteria:
- ✅ All existing tests pass  
- ✅ No linting or type errors  
- ✅ Functionality verified and working  
- ✅ No regressions introduced  

> After completing this phase, summarize findings and update the TodoWrite list before moving on.

---

## 📊 Final Deliverable

After completing all 4 phases, provide a **concise summary** with:

### 🎯 Changes Made  
- List of files created/modified/deleted  
- Brief description of each change  
- Any important technical decisions  

### 🔍 Improvements Identified  
- Code smells or technical debt noticed  
- Missing tests or documentation  
- Potential optimizations or refactoring opportunities  

### ⏭️ Next Steps (if any)  
- Follow-up tasks or improvements  
- Known limitations or TODOs  
- Recommendations for future work  

---

## 🛠️ FateWeaver Project Context

This workflow is optimized for the **FateWeaver Discord RPG Bot** project:

- **Architecture:** Discord Bot (TypeScript) ↔ Backend API (Express) ↔ PostgreSQL (Prisma)  
- **Key directories:** `bot/`, `backend/`, `.claude/commands/`  
- **Common commands:** See `CLAUDE.md` for Docker, npm, Prisma workflows  
- **Conventions:** Feature-based organization, auto-loaded commands, service layer pattern  

**Always check `CLAUDE.md` during exploration for project-specific patterns and workflows.**

---

## ⚙️ Execution Rules

1. **Always create TodoWrite list** at the start with 4 EPCT phases  
2. **Mark tasks completed** immediately after finishing each one  
3. **Validation checkpoint** required between Plan → Code  
4. **Auto-proceed** from Code → Test (no validation needed)  
5. **Use tools proactively** — parallel calls when possible  
6. **Be concise** — avoid unnecessary explanations unless asked  
7. **Report blockers immediately** — don't make assumptions  
8. **Follow project conventions** — consistency is critical  
9. **Timebox exploration** — avoid over-analysis of unrelated code  

---

**🚀 Ready to execute EPCT workflow. Starting Phase 1: EXPLORE...**
