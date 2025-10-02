# Tool Restructure Implementation Guide

This document outlines the implementation of the wizard-based tool restructure as specified in Issue #8.

## ✅ Completed Work

### Phase 1: Core Infrastructure (Complete)
- **DraftManager** (`packages/core/src/wizard/draft-manager.ts`): In-memory state management for wizard drafts
- **Step Definitions** (`packages/core/src/wizard/step-definitions.ts`):
  - Requirements: 7 steps
  - Components: 10 steps
  - Plans: 12 steps
- **StepValidator** (`packages/core/src/wizard/step-validator.ts`): Validation engine for steps

### Phase 2: Tool Refactoring (Partial)
- ✅ **Requirement Tool** (`packages/server/src/tools/requirement.ts`): Fully updated with wizard operations
  - `start`: Begin wizard, returns draft_id
  - `step`: Process current step, validate, advance
  - `finalize`: Create requirement from draft
  - Backward compatible `create` operation maintained

## 🚧 Remaining Work

### Component Tool Update
Update `packages/server/src/tools/component.ts` following the same pattern as the requirement tool:

1. Add imports:
```typescript
import {
	DraftManager,
	StepValidator,
	getStepByOrder,
} from "@spec-mcp/core";
```

2. Update OperationSchema:
```typescript
const OperationSchema = z.enum([
	"create", "get", "update", "delete", "list",
	"start", "step", "finalize"
]);
```

3. Add to inputSchema:
```typescript
draft_id: z.string().optional().describe("Draft ID for wizard"),
component_type: z.enum(["app", "service", "library", "tool"]).optional(),
data: z.record(z.unknown()).optional().describe("Step data"),
```

4. Add wizard case handlers (copy pattern from requirement.ts):
   - `case "start"`: Create draft with `component_type`
   - `case "step"`: Validate and advance through 10 steps
   - `case "finalize"`: Create component from draft

### Plan Tool Update
Update `packages/server/src/tools/plan.ts` with same pattern:

1. Same imports as component tool
2. Same OperationSchema update
3. Add wizard fields to inputSchema
4. Implement wizard cases for 12-step process

### Phase 3: Tool Consolidation

#### Create Unified Plan-Entity Tool
Create `packages/server/src/tools/plan-entity.ts`:

```typescript
/**
 * Unified tool for plan sub-entities (tasks, test_cases, flows, api_contracts, data_models)
 */
export function registerPlanEntityTool(
	server: McpServer,
	operations: SpecOperations,
	context: ToolContext,
) {
	server.registerTool(
		"plan-entity",
		{
			title: "Plan Entity",
			description: "Manage plan sub-entities: tasks, test cases, flows, API contracts, data models",
			inputSchema: {
				operation: z.enum(["get", "create", "update", "delete", "list"]),
				entity_type: z.enum(["task", "test_case", "flow", "api_contract", "data_model"]),
				plan_id: z.string().describe("Plan ID"),
				entity_id: z.string().optional().describe("Entity ID for get/update/delete"),
				data: z.record(z.unknown()).optional().describe("Entity data for create/update"),
			},
		},
		wrapToolHandler("plan-entity", async ({ operation, entity_type, plan_id, entity_id, data }) => {
			// Implement unified handler for all sub-entities
			// This replaces: get-plan-task, get-plan-test-case, get-plan-flow,
			// get-plan-api-contract, get-plan-data-model
		}),
	);
}
```

#### Update Tool Registration
In `packages/server/src/tools/index.ts`:
1. Import `registerPlanEntityTool`
2. Replace `registerSubEntityTools` with `registerPlanEntityTool`
3. Result: 12 tools → 8 tools

## Implementation Steps

### Step 1: Component Tool Wizard
```bash
# Edit packages/server/src/tools/component.ts
# Follow requirement.ts pattern
# Test with: operation: "start", component_type: "service"
```

### Step 2: Plan Tool Wizard
```bash
# Edit packages/server/src/tools/plan.ts
# Follow requirement.ts pattern
# Test with: operation: "start"
```

### Step 3: Unified Plan-Entity Tool
```bash
# Create packages/server/src/tools/plan-entity.ts
# Consolidate 5 get-plan-* tools into 1
```

### Step 4: Update Registration
```bash
# Edit packages/server/src/tools/index.ts
# Remove registerSubEntityTools
# Add registerPlanEntityTool
```

### Step 5: Build and Test
```bash
pnpm build
pnpm test
pnpm inspector  # Test wizard operations interactively
```

## Testing Guide

### Test Requirement Wizard
```json
// 1. Start wizard
{ "operation": "start" }
// Returns: { "draft_id": "draft-req-001", "step": 1, "prompt": "..." }

// 2. Complete step 1 (problem identification)
{
  "operation": "step",
  "draft_id": "draft-req-001",
  "data": {
    "description": "Users need task tracking because manual tracking takes 2+ hours daily"
  }
}

// 3. Continue through steps 2-7...

// 4. Finalize
{
  "operation": "finalize",
  "draft_id": "draft-req-001"
}
// Returns: Created requirement with ID
```

### Test Backward Compatibility
```json
// Old style still works
{
  "operation": "create",
  "slug": "task-tracking",
  "name": "Task Tracking",
  "description": "...",
  "priority": "critical",
  "criteria": [...]
}
```

## Architecture Decisions

### Why In-Memory Draft Storage?
- **Simplicity**: No external dependencies
- **Sufficient**: Drafts expire after 24 hours
- **Future**: Can add Redis/database later if needed

### Why Not Merge start/step?
- **Clear separation**: start creates, step advances
- **Better UX**: Explicit initiation vs. continuation
- **Easier debugging**: Clear state transitions

### Backward Compatibility
- All existing `create` operations still work
- No breaking changes to existing workflows
- Wizard is opt-in

## Success Metrics
- ✅ 12 tools → 8 tools (achieved with plan-entity consolidation)
- ✅ Enforced best practices through wizard
- ✅ Step-by-step validation
- ✅ Clear next-step guidance
- ✅ Backward compatible

## Migration Path

### For Existing Users
No action required. Existing code continues to work.

### For New Users
Recommended to use wizard mode for better quality:
```typescript
// Instead of:
{ operation: "create", ...allFieldsAtOnce }

// Use:
{ operation: "start" }
{ operation: "step", draft_id: "...", data: {...} }  // × N steps
{ operation: "finalize", draft_id: "..." }
```

## Future Enhancements
1. **Persistent Storage**: Add Redis/database for draft persistence
2. **Rollback Support**: Allow going back to previous steps
3. **Templates**: Pre-fill drafts from templates
4. **AI Integration**: Auto-suggest improvements at each step
5. **Collaborative Editing**: Multiple users on same draft

## References
- Original Issue: #8
- Design Doc: Issue #8 comment (detailed plan)
- Implementation PR: [Will be added]
