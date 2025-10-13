# Schema Package Refactoring Notes

## Issue: Logic Functions in Schema Package

The `@spec-mcp/schemas` package currently contains business logic functions alongside schema definitions. This violates the principle of separation of concerns - schema packages should only contain:

- Schema definitions (Zod schemas)
- Type definitions (TypeScript types inferred from schemas)
- Schema-level constants

## Current State

The following files contain logic functions that should be moved to `@spec-mcp/core`:

### `shared/task.ts`
- `isCompleted(status)` - Check if a task is completed
- `isVerified(status)` - Check if a task is verified
- `getUpdatedAt(status)` - Get latest timestamp
- `getTaskState(status)` - Calculate task state
- `canStartTask(task, allTasks)` - Validate task can start
- `canCompleteTask(task, allTasks)` - Validate task can complete
- `isTaskBlocked(task)` - Check if task is blocked
- `getActiveBlocks(task)` - Get unresolved blockers
- `getResolvedBlocks(task)` - Get resolved blockers
- `canStartTaskWithBlocking(task, allTasks)` - Start validation with blocking
- `isActiveTask(task)` - Check if task is not superseded
- `getActiveTasks(tasks)` - Filter active tasks
- `getTaskHistory(tasks, taskId)` - Get supersession history
- `getLatestTask(tasks, taskId)` - Get latest version

### `shared/supersession.ts`
- `createSupersessionSchema(idSchema)` - Schema factory (this is OK)
- `isActive(item)` - Check if item is active
- `getActiveItems(items)` - Filter active items
- `getItemHistory(items, itemId)` - Get supersession history
- `getLatestItem(items, itemId)` - Get latest version

### `shared/criteria.ts`
- `isActiveCriteria(criteria)` - Check if criteria is active
- `getActiveCriteria(criteriaList)` - Filter active criteria
- `getCriteriaHistory(criteriaList, criteriaId)` - Get history
- `getLatestCriteria(criteriaList, criteriaId)` - Get latest version

### `shared/requirement-status.ts`
- `getPlanState(plan)` - Calculate plan state
- `getCriterionState(criterion, allPlans)` - Calculate criterion state
- `getRequirementState(requirement, allPlans)` - Calculate requirement state
- `getRequirementCompletionStats(requirement, allPlans)` - Calculate stats

### `shared/query.ts`
- `isItemTypeQuery(query)` - Check query type
- `isSpecTypeQuery(query)` - Check query type
- `getSpecTypes(query)` - Extract spec types
- `getItemTypes(query)` - Extract item types

## Proposed Refactoring

### Phase 1: Move to Core Package
Create utility modules in `@spec-mcp/core/src/utils/`:

```
core/src/utils/
├── task-utils.ts        # Task-related logic
├── supersession-utils.ts # Supersession logic
├── criteria-utils.ts     # Criteria logic
├── requirement-utils.ts  # Requirement status logic
└── query-utils.ts        # Query logic
```

### Phase 2: Update Imports
Update all imports across:
- `@spec-mcp/core` package
- `@spec-mcp/mcp` package
- `@spec-mcp/cli` package
- `@spec-mcp/dashboard` package

Change from:
```typescript
import { isCompleted, getTaskState } from "@spec-mcp/schemas";
```

To:
```typescript
import { isCompleted, getTaskState } from "@spec-mcp/core/utils/task-utils";
```

### Phase 3: Update Exports
Update `@spec-mcp/core/src/index.ts` to re-export utilities:
```typescript
export * from "./utils/task-utils.js";
export * from "./utils/supersession-utils.js";
// ... etc
```

This allows imports like:
```typescript
import { isCompleted, getTaskState } from "@spec-mcp/core";
```

### Phase 4: Remove from Schemas
Remove all logic functions from schema files, keeping only:
- Schema definitions
- Type exports
- The `TaskState` type (it's a type, not logic)

## Benefits

1. **Separation of Concerns**: Schemas package is pure schema definitions
2. **Better Testing**: Logic can be tested independently
3. **Reduced Coupling**: Schema changes don't affect logic
4. **Clearer Dependencies**: Logic depends on schemas, not vice versa
5. **Type Safety**: Still maintains full TypeScript type safety

## Breaking Changes

This will be a breaking change for external consumers. Consider:

1. Major version bump
2. Provide migration guide
3. Deprecation warnings in current version
4. Codemod script to automate migration

## Current Blockers

- Large refactoring that touches many files
- Need to maintain backward compatibility during transition
- Should be done as part of a planned release cycle

## Recommendation

Schedule this refactoring for the next major version (2.0.0) to minimize disruption.
