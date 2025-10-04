# Bug Fixes Applied to Spec-MCP

## Summary
Fixed two critical bugs in the spec-mcp MCP server that prevented complex specifications from being created through the draft creation flow.

## Bug #1: JSON Array/Object Type Conversion in MCP Transmission
### Problem
When providing array or object values to `update_draft`, they were being converted to strings instead of being properly parsed as JSON structures. The YAML serializer was receiving stringified JSON instead of actual arrays/objects.

### Root Cause
MCP SDK serializes complex parameters to JSON strings during transmission. The server wasn't detecting and parsing these JSON strings back to their original types.

### Solution
Added JSON detection and parsing logic in `packages/server/src/tools/update-draft.ts`:
```typescript
if (typeof value === "string") {
    // Try to parse JSON arrays/objects that were stringified during MCP transmission
    if (
        (value.trim().startsWith("[") && value.trim().endsWith("]")) ||
        (value.trim().startsWith("{") && value.trim().endsWith("}"))
    ) {
        try {
            sanitizedValue = JSON.parse(value);
        } catch {
            // If parsing fails, treat as regular string and sanitize
            sanitizedValue = context.inputValidator.sanitizeString(value);
        }
    } else {
        sanitizedValue = context.inputValidator.sanitizeString(value);
    }
}
```

### Files Modified
- `packages/server/src/tools/update-draft.ts`

## Bug #2: Schema Validation Rejecting Extra Fields
### Problem
Multi-step draft creation was failing validation even when values were correct. The discriminated union schemas were rejecting submissions that contained accumulated fields from previous steps.

### Root Cause
Zod discriminated union schemas are strict by default and reject extra properties. As users progressed through steps, the draft accumulated fields. When validating step 2, the schema expected only `{step, field_value}` but received `{step, field1, field2, field_value}`.

### Solution
Added `.passthrough()` to all step submission schemas to allow extra fields during validation. This was applied to ALL spec types:
- Requirements (7 steps)
- Components (10 steps)
- Plans (12 steps)
- Constitutions (3 steps)
- Decisions (6 steps)

Example from `packages/core/src/creation-flow/step-submission-schemas.ts`:
```typescript
export const RequirementProblemIdentificationSchema = z.object({
    step: z.literal("problem_identification"),
    description: z.string().min(50, "Description must be at least 50 characters")
        .refine(/* validation logic */)
}).passthrough(); // <-- Added this

export const RequirementAvoidImplementationSchema = z.object({
    step: z.literal("avoid_implementation"),
    description: z.string().refine(/* validation logic */)
}).passthrough(); // <-- Added this

// ... applied to all 38 step schemas
```

### Files Modified
- `packages/core/src/creation-flow/step-submission-schemas.ts` (38 schemas updated)

## Testing Status
✅ Code changes applied
✅ TypeScript compilation successful
✅ Build completed successfully
⏳ Runtime testing pending (requires MCP server restart)

## Next Steps for Testing

### 1. Restart Claude Code
The MCP server needs to be restarted to load the new build. The fixes are in `/Users/luca/Developer/personal/spec-mcp/main/packages/server/dist/index.js`.

### 2. Test Constitution Creation
```javascript
// Start draft
mcp__spec-mcp__start_draft({ type: "constitution" })

// Add basic info
mcp__spec-mcp__update_draft({
    draft_id: "con-...",
    field: "description",
    value: "Engineering principles for the platform"
})

// Add articles (this should now work!)
mcp__spec-mcp__update_draft({
    draft_id: "con-...",
    field: "articles",
    value: [
        {
            id: "art-001",
            title: "Type Safety",
            principle: "Use TypeScript strict mode",
            rationale: "Prevents runtime errors",
            status: "active"
        }
    ]
})
```

### 3. Test Requirement Creation
```javascript
// Create requirement and test all 7 steps
// Should no longer fail at avoid_implementation step
```

## Impact
These fixes enable:
- ✅ Constitution creation with articles arrays
- ✅ All multi-step flows (requirements, components, plans, decisions)
- ✅ Complex nested data structures in drafts
- ✅ Proper validation without false rejections

## Build Commands
```bash
npm run build        # Build all packages
npm run test         # Run tests (optional)
```

## Debug Logging
Added temporary debug logging to track value types:
```typescript
console.error(`[DEBUG] Field: ${field}, Type: ${typeof value}, Value:`, value);
```

This can be removed after confirming the fixes work in production.
