# Draft System Implementation - Type-Specific Workflows

## Overview

Successfully refactored the drafting system to support **type-specific workflows** where each entity type can define its own custom draft flow. This enables complex multi-phase workflows like the Plan entity's task-by-task creation process.

## Architecture Changes

### 1. Updated Draft Schema (`packages/schemas/src/shared/draft.ts`)

**Before:** Single flat schema for all drafts
```typescript
export const DraftSchema = z.object({
  id: z.string(),
  type: EntityTypeSchema,
  questions: z.array(DraftQuestionSchema),
  // ...
});
```

**After:** Discriminated union with type-specific extensions
```typescript
// Base schema shared by all
export const BaseDraftSchema = z.object({
  id: z.string(),
  type: EntityTypeSchema,
  questions: z.array(DraftQuestionSchema),
  currentQuestionIndex: z.number(),
  // ...
});

// Plan-specific extension with task collections
export const PlanDraftSchema = BaseDraftSchema.extend({
  type: z.literal("plan"),
  tasks: z.array(DraftTaskSchema).default([]),
  taskTitles: z.array(z.string()).default([]),
  currentTaskIndex: z.number().default(0),
});

// Union type for all drafts
export const DraftSchema = z.discriminatedUnion("type", [
  PlanDraftSchema,
  BaseDraftSchema.extend({ type: z.literal("requirement") }),
  // ... other types
]);
```

**New Schemas:**
- `DraftTaskSchema`: Represents a task during draft phase (temp IDs, nullable fields)
- Type-safe task structure with title, description, acceptance_criteria

### 2. Refactored BaseDraftManager (`packages/core/src/drafts/base-draft-manager.ts`)

**Before:** Concrete implementation with fixed Q&A workflow
- Implemented `createDraft()`, `submitAnswer()`, `isComplete()`
- All entity types forced into same linear Q&A pattern

**After:** Abstract base class with utility methods
```typescript
export abstract class BaseDraftManager<T> {
  // Shared utilities
  protected getDraftFilePath(draftId: string): string
  protected getNextDraftId(): Promise<string>
  protected saveDraft(draft: Draft): Promise<void>
  async getDraft(draftId: string): Promise<Draft | null>
  async deleteDraft(draftId: string): Promise<void>
  async listDrafts(): Promise<string[]>

  // Abstract methods - each type implements
  abstract createDraft(name: string, description?: string): Promise<CreateDraftResult>
  abstract submitAnswer(draftId: string, answer: string): Promise<SubmitAnswerResult>
  abstract isComplete(draftId: string): Promise<boolean>
  abstract createFromDraft(draftId: string): Promise<T>
}
```

**Benefits:**
- Each entity type controls its own workflow
- Shared file operations and ID generation
- Type-safe draft operations

### 3. Plan Two-Phase Workflow (`packages/core/src/managers/plan-manager.ts`)

Implemented a sophisticated **two-phase workflow** for plan creation:

#### Phase 1: Main Q&A (5 questions)
1. What is the main goal? (auto-filled if description provided)
2. Which requirement/criteria does this fulfill?
3. What is in scope?
4. What is out of scope?
5. **List tasks** (one per line, short descriptions)

#### Phase 2: Task-by-Task Q&A (2 questions per task)
After task list is provided, iterates through each task:
- Task N/M: "Title" - Provide detailed description
- Task N/M: "Title" - What are acceptance criteria?

**Key Features:**
- Parses task list from multiline answer
- Stores tasks with temporary IDs (`temp-task-001`, `temp-task-002`)
- Tracks progress with `currentTaskIndex`
- Converts to real task IDs on finalization (`task-001`, `task-002`)

**Example Flow:**
```typescript
// Phase 1
createDraft("Sprint 1 Auth") // → Q: main goal?
submitAnswer("draft-001", "Auth") // → Q: requirement?
submitAnswer("draft-001", "req-001/crit-001") // → Q: in scope?
submitAnswer("draft-001", "Login, registration") // → Q: out scope?
submitAnswer("draft-001", "OAuth") // → Q: list tasks?
submitAnswer("draft-001", "Login form\nPassword hash\nSessions")
  // → Transitions to Phase 2: "Task 1/3: Login form - description?"

// Phase 2
submitAnswer("draft-001", "Build React login form")
  // → "Task 1/3: Login form - acceptance criteria?"
submitAnswer("draft-001", "Validates email format")
  // → "Task 2/3: Password hash - description?"
submitAnswer("draft-001", "Use bcrypt for hashing")
  // → "Task 2/3: Password hash - acceptance criteria?"
// ... continues for all tasks

// Finalization
createPlan("draft-001") // → Creates plan with tasks
```

### 4. Updated Simple Draft Managers

Updated all simple managers to implement the new abstract methods:
- **RequirementDraftManager**: 3 questions (purpose, criteria, priority)
- **ComponentDraftManager**: 4 questions (purpose, type, folder, tech stack)
- **ConstitutionDraftManager**: 2 questions (purpose, articles)
- **DecisionDraftManager**: 4 questions (decision, context, alternatives, status)

All follow the same pattern:
```typescript
async createDraft(name: string, description?: string): Promise<CreateDraftResult> {
  // Build questions array
  // Create draft object
  // Save and return first question
}

async submitAnswer(draftId: string, answer: string): Promise<SubmitAnswerResult> {
  // Load draft
  // Update current question
  // Increment index
  // Return next question or completion
}

async isComplete(draftId: string): Promise<boolean> {
  // Check if currentQuestionIndex >= questions.length
}

async createFromDraft(draftId: string): Promise<Entity> {
  // Parse answers into entity structure
  // Transform data as needed
  // Return entity
}
```

## Testing

Created comprehensive test suite for PlanDraftManager (`packages/core/tests/plan-draft-manager.test.ts`):

### Test Coverage (14 tests, all passing ✅)

**Phase 1: Main Q&A**
- ✅ Creates draft with main questions
- ✅ Pre-fills first question if description provided
- ✅ Progresses through main questions
- ✅ Transitions to Phase 2 after task list provided
- ✅ Requires at least one task

**Phase 2: Task Q&A**
- ✅ Asks for description and acceptance criteria per task
- ✅ Stores tasks with temp IDs during draft phase

**Completion & Entity Creation**
- ✅ Marks draft incomplete until all tasks answered
- ✅ Creates plan entity from completed draft
- ✅ Throws if trying to create from incomplete draft

**Error Handling**
- ✅ Throws if draft not found
- ✅ Throws if trying to answer past last task

**Multiple Drafts**
- ✅ Generates sequential draft IDs
- ✅ Lists all plan drafts

## File Changes

### Modified Files
1. `packages/schemas/src/shared/draft.ts` - Added typed draft schemas
2. `packages/core/src/drafts/base-draft-manager.ts` - Refactored to abstract base
3. `packages/core/src/managers/plan-manager.ts` - Implemented two-phase workflow
4. `packages/core/src/managers/requirement-manager.ts` - Updated to new pattern
5. `packages/core/src/managers/component-manager.ts` - Updated to new pattern
6. `packages/core/src/managers/constitution-manager.ts` - Updated to new pattern
7. `packages/core/src/managers/decision-manager.ts` - Updated to new pattern

### New Files
1. `packages/core/tests/plan-draft-manager.test.ts` - Comprehensive test suite

## Benefits

### 1. **Flexibility**
Each entity type can define its own workflow:
- Simple types: Basic Q&A
- Complex types: Multi-phase workflows with collections
- Future: Could add entity-specific tools (add/edit/remove items)

### 2. **Type Safety**
- Discriminated unions ensure type-safe draft operations
- TypeScript narrows types based on draft.type
- Prevents mixing incompatible operations

### 3. **Maintainability**
- Clear separation of concerns
- Shared utilities in base class
- Type-specific logic in subclasses

### 4. **Extensibility**
Easy to add new entity types with custom workflows:
```typescript
export const CustomDraftSchema = BaseDraftSchema.extend({
  type: z.literal("custom"),
  customField: z.array(z.string()),
});

// Add to union
export const DraftSchema = z.discriminatedUnion("type", [
  PlanDraftSchema,
  CustomDraftSchema,
  // ...
]);
```

## Next Steps

### Potential Enhancements
1. **Additional MCP Tools** (optional):
   - `list_plan_tasks(draft_id)` - View tasks added so far
   - `edit_plan_task(draft_id, task_id, updates)` - Modify a task
   - `remove_plan_task(draft_id, task_id)` - Remove a task

2. **Other Entity Types with Collections**:
   - Requirements → Multiple criteria with detailed Q&A
   - Components → Properties/methods with descriptions
   - Constitutions → Articles with examples/exceptions

3. **Validation Enhancements**:
   - Real-time validation during task Q&A
   - Preview entity before finalization
   - Edit answers before committing

## Migration Notes

**No migration needed** - This is a clean replacement:
- All existing functionality preserved
- Same external API for simple entities
- New workflow only affects plan creation
- All tests pass ✅
- Build succeeds ✅

## Summary

Successfully implemented a **flexible, type-safe drafting system** that supports:
- ✅ Type-specific workflows per entity
- ✅ Complex multi-phase flows (Plan with task collections)
- ✅ Simple linear Q&A (Requirements, Components, etc.)
- ✅ Full type safety with discriminated unions
- ✅ Comprehensive test coverage
- ✅ Clean architecture with shared utilities

The system is now ready to support any future entity types with custom creation workflows!
