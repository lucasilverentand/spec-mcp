# Biome Linting Refactoring Plan

## Current State
- **Total Errors**: 7
- **Total Warnings**: 166
- **TypeScript Compilation**: ✅ 0 errors

## Breakdown by Issue Type

### Static-Only Classes (2 errors)
1. `packages/core/src/generators/plan-generator.ts` - PlanGenerator class
2. `packages/core/src/validation/validators/schema-validator.ts` - SchemaValidator class

### noExplicitAny in Source Files (41 warnings)
1. `packages/core/src/validation/validators/reference-validator.ts` - 23 instances
2. `packages/core/src/validation/validators/schema-validator.ts` - 13 instances
3. `packages/data/src/managers/validation-manager.ts` - 3 instances
4. `packages/data/src/managers/entity-manager.ts` - 2 instances

### noExplicitAny in Test Files (109 warnings)
- `packages/data/tests/managers/validation-manager.test.ts` - 28 instances
- `packages/core/tests/services/spec-operations.test.ts` - 21 instances
- `packages/data/tests/managers/entity-manager.test.ts` - 13 instances
- `packages/core/tests/validation/schema-validator.test.ts` - 11 instances
- `packages/data/tests/managers/file-manager.test.ts` - 9 instances
- `packages/core/tests/services/spec-service.test.ts` - 7 instances
- `packages/data/tests/manager.test.ts` - 6 instances
- `packages/core/tests/transformation/yaml-transformer.test.ts` - 5 instances
- Others (14 instances across 5+ files)

## Parallel Agent Strategy

### Agent 1: Static Class Refactoring
**Files**: 2 files
- `packages/core/src/generators/plan-generator.ts`
- `packages/core/src/validation/validators/schema-validator.ts`

**Task**: Convert static-only classes to const objects with exported functions

**Complexity**: Medium-High
- PlanGenerator has 25 static methods (large refactor)
- SchemaValidator is already partially refactored
- Need to maintain backward compatibility via exports

**Estimated Impact**: Fix 2 errors

---

### Agent 2: Reference Validator Type Safety
**Files**: 1 file
- `packages/core/src/validation/validators/reference-validator.ts`

**Task**: Replace all `any` types with proper types
- Fix validateRequirementReferences signature (line 325-326)
- Fix validatePlanReferences signature (line 346-348)
- Remove remaining `as any` casts (lines 262, 275, 404, 418)
- Add proper type definitions for plan/component validation

**Complexity**: High
- 23 instances of `any` usage
- Complex validation logic with multiple entity types
- Requires understanding of Plan, Requirement, Component schemas

**Estimated Impact**: Fix 5 errors, ~23 warnings

---

### Agent 3: Schema Validator Type Safety
**Files**: 1 file
- `packages/core/src/validation/validators/schema-validator.ts`

**Task**: Replace remaining `any` types with proper types
- Fix extractFieldSchema method
- Fix extractSchemaRules method
- Improve Zod schema type handling

**Complexity**: Medium
- 13 instances of `any` usage
- Already has some type improvements
- Needs better Zod type definitions

**Estimated Impact**: ~13 warnings

---

### Agent 4: Data Layer Type Safety
**Files**: 2 files
- `packages/data/src/managers/validation-manager.ts` (3 instances)
- `packages/data/src/managers/entity-manager.ts` (2 instances)

**Task**: Replace `any` types with proper types
- Add type definitions for validation results
- Improve entity manager type signatures

**Complexity**: Low-Medium
- Only 5 instances total
- Smaller, focused changes

**Estimated Impact**: ~5 warnings

---

### Agent 5: Test File Type Safety (Core Package)
**Files**: 6+ files in `packages/core/tests/`
- `spec-operations.test.ts` (21 instances)
- `schema-validator.test.ts` (11 instances)
- `spec-service.test.ts` (7 instances)
- `yaml-transformer.test.ts` (5 instances)
- `id-generator.test.ts` (3 instances)
- Others (~10 instances)

**Task**: Replace `any` types in test mocks and assertions
- Add proper type definitions for test data
- Use typed mocks instead of `any`

**Complexity**: Low
- Test files are lower priority
- Can use more permissive types if needed

**Estimated Impact**: ~57 warnings

---

### Agent 6: Test File Type Safety (Data Package)
**Files**: 3+ files in `packages/data/tests/`
- `validation-manager.test.ts` (28 instances)
- `entity-manager.test.ts` (13 instances)
- `file-manager.test.ts` (9 instances)
- `manager.test.ts` (6 instances)

**Task**: Replace `any` types in test mocks and assertions
- Add proper type definitions for test data
- Use typed mocks instead of `any`

**Complexity**: Low
- Test files are lower priority
- Can use more permissive types if needed

**Estimated Impact**: ~56 warnings

---

## Recommended Execution Order

### Phase 1: Critical Source Files (Agents 1-4 in parallel)
These fix the actual errors and most important warnings in source code:
- Agent 1: Static Class Refactoring
- Agent 2: Reference Validator Type Safety
- Agent 3: Schema Validator Type Safety
- Agent 4: Data Layer Type Safety

**Expected Result After Phase 1**: 0 errors, ~60-70 warnings remaining (all in tests)

### Phase 2: Test Files (Agents 5-6 in parallel)
Lower priority cleanup:
- Agent 5: Core Package Test Files
- Agent 6: Data Package Test Files

**Expected Result After Phase 2**: 0 errors, 0 warnings

---

## Key Considerations

### For All Agents:
1. **Maintain Backward Compatibility**: Exported APIs must remain unchanged
2. **Run Tests**: Execute `npm test` after changes to ensure nothing breaks
3. **Run Build**: Execute `npm run build` to verify TypeScript compilation
4. **Incremental Commits**: Commit after each file or logical group of changes

### Type Strategy:
- Prefer `unknown` over `any` for truly unknown types
- Use discriminated unions for entity types (Plan | Requirement | Component)
- Extract common interfaces for validation options
- Use Zod schema inference types where possible (`z.infer<typeof Schema>`)

### Static Class Strategy:
- Convert class to exported functions
- Export const object with same name for backward compatibility
- Update internal references to use function names directly

---

## Success Criteria
- ✅ 0 TypeScript compilation errors
- ✅ 0 Biome lint errors
- ✅ 0 Biome lint warnings
- ✅ All tests passing
- ✅ Build succeeds