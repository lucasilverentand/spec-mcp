# Biome Linting Refactoring Summary

## Overview
This document provides a quick reference for the parallel agent strategy to eliminate all Biome linting errors and warnings in the spec-mcp repository.

## Current Status (Starting Point)
- ✅ TypeScript Compilation: 0 errors
- ❌ Biome Errors: 7
- ⚠️ Biome Warnings: 166
- 📊 Total Issues: 173

## Agent Distribution

### Phase 1: Critical Source Files (Parallel Execution)
Execute these 4 agents simultaneously - they work on independent files:

| Agent | Files | Issues | Priority | Est. Time |
|-------|-------|--------|----------|-----------|
| **Agent 1** | plan-generator.ts<br>schema-validator.ts | 2 errors | HIGH | 30-45 min |
| **Agent 2** | reference-validator.ts | 5 errors<br>23 warnings | HIGH | 45-60 min |
| **Agent 3** | schema-validator.ts | 13 warnings | HIGH | 30-40 min |
| **Agent 4** | validation-manager.ts<br>entity-manager.ts | 5 warnings | MEDIUM | 20-30 min |

**Phase 1 Target**: 0 errors, ~60-70 warnings remaining

### Phase 2: Test Files (Parallel Execution)
Execute after Phase 1 completes:

| Agent | Package | Issues | Priority | Est. Time |
|-------|---------|--------|----------|-----------|
| **Agent 5** | core/tests/* | 57 warnings | LOW | 40-50 min |
| **Agent 6** | data/tests/* | 56 warnings | LOW | 40-50 min |

**Phase 2 Target**: 0 errors, 0 warnings

## Quick Start Commands

### Running Agents in Parallel (Phase 1)

```bash
# Terminal 1: Agent 1
# See AGENT_TASKS.md - Agent 1 section

# Terminal 2: Agent 2
# See AGENT_TASKS.md - Agent 2 section

# Terminal 3: Agent 3
# See AGENT_TASKS.md - Agent 3 section

# Terminal 4: Agent 4
# See AGENT_TASKS.md - Agent 4 section
```

### Running Agents in Parallel (Phase 2)

```bash
# Terminal 1: Agent 5
# See AGENT_TASKS.md - Agent 5 section

# Terminal 2: Agent 6
# See AGENT_TASKS.md - Agent 6 section
```

## Key Refactoring Patterns

### Static Class → Const Object
```typescript
// BEFORE
export class MyClass {
  static method1() {}
  static method2() {}
}

// AFTER
function method1() {}
function method2() {}

export const MyClass = {
  method1,
  method2,
};
```

### any → Proper Types
```typescript
// BEFORE
function validate(entity: any, plans: any[]) {}

// AFTER
import type { Plan, AnyEntity } from "@spec-mcp/data";
function validate(entity: AnyEntity, plans: Plan[]) {}
```

### Type Narrowing
```typescript
// BEFORE
if (entity.type === "plan") {
  doSomething(entity as any);
}

// AFTER
if (entity.type === "plan") {
  // TypeScript automatically narrows entity to Plan type
  doSomething(entity);
}
```

## Files Affected

### Source Files (Priority 1)
```
packages/core/src/
├── generators/
│   └── plan-generator.ts              [Agent 1]
└── validation/validators/
    ├── reference-validator.ts          [Agent 2]
    └── schema-validator.ts             [Agent 1 & 3]

packages/data/src/managers/
├── validation-manager.ts               [Agent 4]
└── entity-manager.ts                   [Agent 4]
```

### Test Files (Priority 2)
```
packages/core/tests/                    [Agent 5]
packages/data/tests/                    [Agent 6]
```

## Success Metrics

### After Phase 1 (Source Files)
- ✅ 0 Biome errors
- ✅ ~60-70 warnings (only in test files)
- ✅ All source code properly typed
- ✅ Build succeeds
- ✅ Tests pass

### After Phase 2 (Test Files)
- ✅ 0 Biome errors
- ✅ 0 Biome warnings
- ✅ 100% type safety
- ✅ Build succeeds
- ✅ Tests pass

## Verification Commands

```bash
# Check specific file
npx biome check <file-path>

# Check all files
npx biome check

# Build
npm run build

# Run tests
npm test

# Run specific test
npm test -- <test-name>
```

## Rollback Strategy

Each agent should commit after completing their work:

```bash
# If something breaks, rollback specific agent's changes
git log --oneline -10
git revert <commit-hash>

# Or reset to before agents started
git reset --hard <starting-commit>
```

## Common Issues & Solutions

### Issue: Type doesn't exist
**Solution**: Import from `@spec-mcp/data` package

### Issue: Complex Zod types
**Solution**: Use `as unknown as z.Schema` pattern

### Issue: Discriminated union not narrowing
**Solution**: Add explicit type check: `if (entity.type === "plan")`

### Issue: Test mock types
**Solution**: Use `Partial<Type>` or `unknown` for flexibility

## Timeline Estimate

- **Phase 1** (parallel): ~60 minutes total
- **Phase 2** (parallel): ~50 minutes total
- **Verification & Fixes**: ~30 minutes
- **Total**: ~2.5 hours with parallelization

Without parallelization: ~4-5 hours

## Next Steps

1. Review AGENT_TASKS.md for detailed instructions
2. Assign agents (or run sequentially if needed)
3. Execute Phase 1 agents in parallel
4. Verify Phase 1 results
5. Execute Phase 2 agents in parallel
6. Final verification
7. Celebrate 🎉 0 errors, 0 warnings!

## Documentation Files

- `BIOME_REFACTOR_PLAN.md` - Detailed analysis and strategy
- `AGENT_TASKS.md` - Specific instructions for each agent
- `REFACTOR_SUMMARY.md` - This file, quick reference