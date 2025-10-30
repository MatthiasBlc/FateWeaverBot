# Codebase Optimization Audit - Supernova Task

## Objective
Perform a comprehensive analysis of `/home/bouloc/Repo/FateWeaverBot/bot/src/` (158 TypeScript files) to identify optimization opportunities across 5 dimensions.

## Instructions

### 1. Duplication Analysis
- Scan for API call patterns using `apiService` (search: `apiService\.(get|post|put|delete)`)
- Identify error handling blocks (try-catch patterns, error response formats)
- Find response formatting patterns (Discord embeds, API responses)
- Search for similar function structures (especially handlers, utils)
- Report patterns appearing 3+ times with exact file locations and line numbers

### 2. Import Analysis
- Check for circular dependencies: Run `npm run build` and capture any warnings
- Identify unused imports in files (grep for imported names vs usage)
- Find missing barrel exports (directories with multiple .ts files but no index.ts)
- List heavy imports that could be lazy-loaded

### 3. Code Smells
- Functions >100 lines: Find and list with file paths
- Deep nesting (>4 levels): Check switch/if statements
- Complex conditionals: Look for 3+ conditions in single statements
- Magic numbers/strings: Find hardcoded values not in constants
- **CRITICAL**: Find hardcoded emojis (grep for emoji patterns like `"🎉"`, `"✅"`, `"❌"`) - must use `@shared/constants/emojis`

### 4. Type Safety
- Search for `any` type usage
- Find functions missing return type annotations
- Check for `| null | undefined` that could use strict null checks

### 5. File Organization
- Files >300 lines that could be split
- Handler files with multiple unrelated functions
- Missing index.ts in directories with 3+ modules

## Search Commands Reference
```bash
# Run from /home/bouloc/Repo/FateWeaverBot/bot/

# Find hardcoded emojis
rg '"[😀-🙏🌀-🗿]|✅|❌|🎉|⚠️|🔥|💫' src/ --type ts -n

# Find 'any' types
rg ': any[,;)]' src/ --type ts -n

# Find long functions (basic)
grep -r "^async function\|^function\|^const.*=.*=>" src/ --include="*.ts" | head -50

# Check for try-catch blocks
rg 'try \{' src/ --type ts -c

# List files by line count
find src -name "*.ts" -exec wc -l {} \; | sort -rn | head -30
```

## Output Format
Return as `.supernova/report-audit.md` with:
1. Summary section (≤300 tokens): Key findings, impact, priority
2. Detailed sections with:
   - Category name
   - Count of issues found
   - Specific examples with absolute file paths and line numbers
   - Recommended actions
3. Priority matrix (High/Medium/Low impact)

## Scope Notes
- Focus on HIGH-IMPACT items only (those affecting >5 files or affecting core patterns)
- Include file paths as absolute paths starting with `/home/bouloc/Repo/FateWeaverBot/bot/src/`
- Line numbers must be exact (use -n flag with grep/rg)
- Estimate token savings potential for each category

