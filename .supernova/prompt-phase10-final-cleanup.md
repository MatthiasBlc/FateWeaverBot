# Phase 10: Final Cleanup

**Context**: Backend refactoring Phase 10 - Polish and finalize refactoring
**Documentation**: `docs/backend-refactoring/04-IMPLEMENTATION-PLAN.md` (lines 1061-1085)

---

## Objective

Perform final cleanup and polish:
1. Remove unused imports and dead code
2. Verify naming conventions
3. Check for N+1 queries
4. Review database indexes
5. Security audit (basic)
6. Final verification

---

## Task 1: Remove Unused Imports

### Strategy

Use TypeScript compiler to find unused imports:

```bash
cd backend
npm run typecheck 2>&1 | grep "is declared but"
```

### Manual Check

For each file with warnings:
1. Read the file
2. Identify unused imports
3. Remove them
4. Verify still compiles

### Files to Check

Focus on recently modified files:
- All controllers
- All services
- All repositories
- Infrastructure files

---

## Task 2: Remove Dead Code

### Search Patterns

Look for:
1. **Commented code**:
   ```bash
   grep -rn "^[[:space:]]*//.*" src/ --include="*.ts" | wc -l
   ```

2. **Unused functions**:
   - Functions not referenced anywhere
   - Export statements never imported

3. **Console.log statements**:
   ```bash
   grep -rn "console\.log" src/ --include="*.ts"
   ```
   - Remove debug logs
   - Keep intentional logging

4. **TODO comments**:
   ```bash
   grep -rn "TODO\|FIXME\|HACK" src/ --include="*.ts"
   ```
   - Review and address or document

### Cleanup Actions

- Remove commented code (unless it's documentation)
- Remove unused helper functions
- Remove debug console.log
- Document or fix TODOs

---

## Task 3: Verify Naming Conventions

### Conventions to Check

1. **Files**: kebab-case (e.g., `character-service.ts`)
2. **Classes**: PascalCase (e.g., `CharacterService`)
3. **Functions**: camelCase (e.g., `getActiveCharacter`)
4. **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_PA_PER_DAY`)
5. **Interfaces**: PascalCase with 'I' prefix optional (e.g., `Character` or `ICharacter`)

### Check Commands

```bash
# Find files not following kebab-case
ls src/**/*.ts | grep -v "^[a-z-]*\.ts$"

# Find classes not following PascalCase
grep -rn "^export class [a-z]" src/ --include="*.ts"

# Find constants not following UPPER_SNAKE_CASE
grep -rn "^export const [A-Z][a-z]" src/ --include="*.ts" | grep -v "Service\|Repository\|Controller"
```

### Corrections

- Rename files/classes/functions as needed
- Update all references
- Verify compilation after renames

---

## Task 4: Review for N+1 Queries

### What to Look For

N+1 query pattern:
```typescript
// BAD - N+1 query
const characters = await prisma.character.findMany();
for (const character of characters) {
  const capabilities = await prisma.characterCapability.findMany({
    where: { characterId: character.id }
  });
}

// GOOD - Single query
const characters = await prisma.character.findMany({
  include: { capabilities: true }
});
```

### Files to Review

Check these service methods:
- Any loops with await inside
- Multiple sequential Prisma queries
- List endpoints in controllers

### Search Command

```bash
grep -rn "for.*await\|forEach.*await" src/services/ --include="*.ts"
```

### Fixes

- Use Prisma `include` instead of separate queries
- Use `Promise.all()` for parallel queries
- Batch operations where possible

---

## Task 5: Review Database Indexes

### Check Prisma Schema

**File**: `backend/prisma/schema.prisma`

Look for:
1. **Foreign keys without indexes**
2. **Commonly queried fields without indexes**
3. **Composite indexes for multi-field queries**

### Common Patterns Needing Indexes

```prisma
model Character {
  // Should have index on userId + townId for findActiveCharacter
  @@index([userId, townId, isActive])

  // Should have index on expeditionId for expedition queries
  @@index([expeditionId])
}
```

### Review Queries

For each repository, check what fields are used in `where` clauses:
- If a field is frequently queried, ensure it has an index
- Composite indexes for multi-field queries

---

## Task 6: Security Audit (Basic)

### Authentication Check

1. **Controller endpoints**:
   - Do they check authentication?
   - Do they validate user ownership?

2. **Search for direct user input**:
   ```bash
   grep -rn "req\.body\|req\.params\|req\.query" src/controllers/ --include="*.ts"
   ```
   - Ensure validation middleware is used
   - Check for SQL injection risks

### Validation Check

1. **Zod schemas**: Verify all endpoints have validation
2. **Type coercion**: Check for unsafe type casting
3. **Authorization**: Verify user can only access their own data

### Common Vulnerabilities

- [ ] SQL injection (via Prisma - generally safe)
- [ ] XSS (in returned data)
- [ ] Mass assignment (updating fields user shouldn't change)
- [ ] Missing authentication checks
- [ ] Insufficient authorization checks

---

## Task 7: Final Verification

### 1. TypeScript Compilation

```bash
npm run typecheck
```

**Expected**: Only 2 pre-existing errors (emojis constants)

### 2. Build

```bash
npm run build
```

**Expected**: Build succeeds

### 3. Lint (if available)

```bash
npm run lint
```

Fix any linting errors.

### 4. Count Improvements

Track improvements:
- Unused imports removed: X
- Dead code lines removed: X
- Console.log removed: X
- TODOs addressed: X
- N+1 queries fixed: X
- Indexes added: X
- Security issues fixed: X

---

## Success Criteria

- ✅ No unused imports (except intentional)
- ✅ No commented dead code
- ✅ No debug console.log statements
- ✅ Naming conventions consistent
- ✅ No obvious N+1 queries
- ✅ Database indexes reviewed
- ✅ Basic security checks passed
- ✅ TypeScript compilation passes
- ✅ Build succeeds
- ✅ Lint passes (if enabled)

---

## Output Requirements

Create a comprehensive report: `.supernova/report-phase10-final-cleanup.md`

**Report structure** (first section ≤300 tokens):

1. **Executive Summary** (≤300 tokens)
   - Unused imports removed: X
   - Dead code lines removed: X
   - Console.log removed: X
   - TODOs addressed: X
   - N+1 queries fixed: X
   - Indexes added: X
   - Security issues fixed: X
   - Naming violations fixed: X
   - Compilation status
   - Time spent

2. **Detailed Cleanup**
   - Files cleaned (list with line count changes)
   - Naming convention fixes
   - Performance improvements
   - Security improvements

3. **Verification Results**
   - TypeScript: pass/fail
   - Build: pass/fail
   - Lint: pass/fail
   - Remaining issues (if any)

4. **Recommendations**
   - Future improvements
   - Technical debt identified
   - Next steps

---

**Execute this plan autonomously. Be thorough but pragmatic. Report back when complete.**
