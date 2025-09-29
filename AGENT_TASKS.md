# Agent Task Assignments for Biome Refactoring

## How to Execute

Run these agents in parallel for maximum efficiency:

```bash
# Phase 1: Run agents 1-4 simultaneously
# Each agent works on independent files with no conflicts
```

---

## Agent 1: Static Class Refactoring

**Priority**: HIGH (fixes 2 errors)
**Estimated Time**: 30-45 minutes
**Dependencies**: None

### Task
Convert static-only classes to const objects with exported functions to fix `lint/complexity/noStaticOnlyClass` errors.

### Files to Modify
1. `packages/core/src/generators/plan-generator.ts` (25 static methods)
2. `packages/core/src/validation/validators/schema-validator.ts` (partially done)

### Specific Instructions

#### For plan-generator.ts:
```typescript
// BEFORE (current):
export class PlanGenerator {
  static generateFromRequirement(...) { }
  static generateFromPlan(...) { }
  // ... 25 methods total
}

// AFTER (target):
function generateFromRequirement(...) { }
function generateFromPlan(...) { }
// ... 25 functions total

// Export for backward compatibility
export const PlanGenerator = {
  generateFromRequirement,
  generateFromPlan,
  // ... all methods
};
```

#### For schema-validator.ts:
- Already partially refactored
- Convert remaining static methods to functions
- Export const object for backward compatibility
- Update all internal `SchemaValidator.method()` calls to `method()` calls

### Verification
```bash
npx biome check packages/core/src/generators/plan-generator.ts
npx biome check packages/core/src/validation/validators/schema-validator.ts
npm run build
npm test -- plan-generator
npm test -- schema-validator
```

---

## Agent 2: Reference Validator Type Safety

**Priority**: HIGH (fixes 5 errors, ~23 warnings)
**Estimated Time**: 45-60 minutes
**Dependencies**: None

### Task
Replace all `any` types in reference-validator.ts with proper types.

### File to Modify
`packages/core/src/validation/validators/reference-validator.ts`

### Specific Issues to Fix

1. **Line 325-326**: `validateRequirementReferences` signature
```typescript
// BEFORE:
private async validateRequirementReferences(
  requirement: any,
  plans: any[],
  ...
)

// AFTER:
private async validateRequirementReferences(
  requirement: { criteria: Array<{ plan_id: string }> },
  plans: Array<{ number: number; slug: string; id: string }>,
  ...
)
```

2. **Line 346-348**: `validatePlanReferences` signature
```typescript
// BEFORE:
private async validatePlanReferences(
  plan: any,
  plans: any[],
  components: any[],
  ...
)

// AFTER:
import type { Plan, AnyComponent } from "@spec-mcp/data";

private async validatePlanReferences(
  plan: Plan,
  plans: Plan[],
  components: AnyComponent[],
  ...
)
```

3. **Lines 262, 275**: Remove `as any` casts
```typescript
// Use proper type narrowing instead
if (entity.type === "plan" && "depends_on" in entity) {
  for (const depId of entity.depends_on) {
    // ...
  }
}
```

4. **Lines 404, 418**: Type flow.steps and plan.tasks
```typescript
// Use proper types from schemas
const stepIds = flow.steps.map((s) => s.id);
const taskIds = plan.tasks.map((t) => t.id);
```

### Verification
```bash
npx biome check packages/core/src/validation/validators/reference-validator.ts
npm run build
npm test -- reference-validator
```

---

## Agent 3: Schema Validator Type Safety

**Priority**: HIGH (~13 warnings)
**Estimated Time**: 30-40 minutes
**Dependencies**: None

### Task
Replace remaining `any` types in schema-validator.ts with proper types.

### File to Modify
`packages/core/src/validation/validators/schema-validator.ts`

### Specific Issues to Fix

1. **extractFieldSchema method**: Add proper types
```typescript
private static extractFieldSchema(
  schema: z.Schema,
  fieldPath: string
): z.Schema {
  // Implement with proper type handling
}
```

2. **extractSchemaRules method**: Improve return type
```typescript
private static extractSchemaRules(
  schema: z.Schema
): Record<string, unknown> {
  // Already done, verify no `any` usage
}
```

3. **Check all helper methods**: Ensure no `any` types remain

### Verification
```bash
npx biome check packages/core/src/validation/validators/schema-validator.ts
npm run build
npm test -- schema-validator
```

---

## Agent 4: Data Layer Type Safety

**Priority**: MEDIUM (~5 warnings)
**Estimated Time**: 20-30 minutes
**Dependencies**: None

### Task
Replace `any` types in data layer managers.

### Files to Modify
1. `packages/data/src/managers/validation-manager.ts` (3 instances)
2. `packages/data/src/managers/entity-manager.ts` (2 instances)

### Specific Instructions

For validation-manager.ts:
- Check validation result types
- Use proper ValidationResult interface
- Avoid `any` in error handling

For entity-manager.ts:
- Use proper entity types (AnyEntity, Plan, Requirement, etc.)
- Type entity CRUD operations properly

### Verification
```bash
npx biome check packages/data/src/managers/
npm run build
npm test -- packages/data
```

---

## Agent 5: Core Package Test Type Safety

**Priority**: LOW (~57 warnings)
**Estimated Time**: 40-50 minutes
**Dependencies**: Agents 1-4 should complete first

### Task
Replace `any` types in core package test files.

### Files to Modify
- `packages/core/tests/services/spec-operations.test.ts` (21 instances)
- `packages/core/tests/validation/schema-validator.test.ts` (11 instances)
- `packages/core/tests/services/spec-service.test.ts` (7 instances)
- `packages/core/tests/transformation/yaml-transformer.test.ts` (5 instances)
- `packages/core/tests/transformation/id-generator.test.ts` (3 instances)
- Others

### Strategy
1. Create typed test fixtures
2. Use `Partial<Type>` for incomplete test data
3. Use `unknown` for truly dynamic test data
4. Type mock return values properly

### Verification
```bash
npx biome check packages/core/tests/
npm test -- packages/core
```

---

## Agent 6: Data Package Test Type Safety

**Priority**: LOW (~56 warnings)
**Estimated Time**: 40-50 minutes
**Dependencies**: Agents 1-4 should complete first

### Task
Replace `any` types in data package test files.

### Files to Modify
- `packages/data/tests/managers/validation-manager.test.ts` (28 instances)
- `packages/data/tests/managers/entity-manager.test.ts` (13 instances)
- `packages/data/tests/managers/file-manager.test.ts` (9 instances)
- `packages/data/tests/manager.test.ts` (6 instances)

### Strategy
1. Create typed test fixtures
2. Use `Partial<Type>` for incomplete test data
3. Use `unknown` for truly dynamic test data
4. Type mock return values properly

### Verification
```bash
npx biome check packages/data/tests/
npm test -- packages/data
```

---

## Coordination Notes

### Avoid Conflicts
- Each agent works on different files
- No shared files between Phase 1 agents (1-4)
- Phase 2 agents (5-6) work on separate packages

### Communication
After each agent completes:
1. Run verification commands
2. Report results (errors/warnings remaining)
3. Commit changes with descriptive message
4. Share any common patterns or issues discovered

### Final Verification (After All Agents Complete)
```bash
npx biome check
npm run build
npm test
```

Expected result: 0 errors, 0 warnings, all tests passing