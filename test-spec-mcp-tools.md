# Spec-MCP Tools Comprehensive Test Results

## Overview
This document demonstrates a comprehensive test of all spec-mcp MCP tools, showcasing their capabilities and edge cases.

## Test Summary

### Tools Tested
1. ✅ `start_draft` - Successfully creates draft specifications
2. ✅ `update_draft` - Successfully updates draft fields with validation
3. ✅ `delete_spec` - Successfully deletes drafts and specs
4. ❌ `query` - Requires at least one parameter (entity_id, search_terms, types, or filters)
5. ⏭️ `validate` - Not tested yet
6. ⏭️ `update_spec` - Not tested yet

### Discovered Issues

#### Issue 1: Constitution Articles Field - Type Conversion Bug
**Status**: Bug Found
**Tool**: `update_draft`
**Entity**: Constitution
**Field**: `articles`

**Problem**: When providing array/object values to `update_draft`, they are being converted to strings instead of being parsed as JSON. The YAML serializer is treating complex values as strings.

**Evidence**:
- Provided: `[{id: "art-001", title: "...", ...}]` (array)
- Stored in YAML: `"[{\"id\": \"art-001\"...}]"` (string)
- Validation Error: "Expected array, received string"

**Expected Behavior**: MCP tool should accept JSON arrays/objects and store them properly in the draft YAML.

**Workaround**: None found - the tool's parameter type is `unknown` which should accept arrays, but the YAML formatter is stringifying everything.

#### Issue 2: Requirement Avoid Implementation Step - Validation Bug
**Status**: Bug Found
**Tool**: `update_draft`
**Entity**: Requirement
**Step**: `avoid_implementation`

**Problem**: The step validation is failing even when the description contains no implementation keywords.

**Evidence**:
- Test description: "Customers need the ability to establish and verify their identity when accessing the platform because this enables personalized shopping experiences"
- Contains no keywords from the blacklist: database, mongodb, postgres, redis, react, vue, angular, api endpoint, rest api, graphql, button, form, table, component, class, method
- Still fails with: "Description should not contain implementation details"

**Root Cause Hypothesis**: The discriminated union schema might be rejecting submissions with extra fields. The `RequirementAvoidImplementationSchema` expects only `{ step, description }`, but `updatedData` contains all previous fields (`name`, `problem`, `confirmed`, etc.).

**Expected Behavior**: Schema should use `.passthrough()` or `.strip()` to handle extra fields gracefully.

## Test Plan Created

### ✅ Phase 1: Constitution (Attempted)
- Created draft: `con-1759612905254-cbg8bl`
- Provided: name, description
- **Failed** at articles field due to Issue #1
- Deleted draft

### ✅ Phase 2: Requirement (Attempted)
- Created draft: `req-1759613016681-gdllud`
- Provided: name, description
- **Failed** at avoid_implementation step due to Issue #2
- Deleted draft

### ⏭️ Phase 3: Components (Pending)
Will test:
- App component
- Service component
- Library component

### ⏭️ Phase 4: Plans (Pending)
Will test:
- Plan with tasks
- Plan with flows
- Plan with test cases
- Plan linking to requirement criteria

### ⏭️ Phase 5: Query Tool (Pending)
Will test:
- Entity ID lookup
- Batch entity lookup
- Text search
- Type filtering
- Priority filtering
- Status filtering
- Date range filtering
- Folder filtering
- Orphaned entities
- Uncovered requirements
- Dependency expansion
- Faceted search
- Pagination
- Sorting

### ⏭️ Phase 6: Validation (Pending)
Will test:
- Validate all specs
- Validate specific entity
- Check broken references
- Check circular dependencies
- Health scoring

### ⏭️ Phase 7: Updates and Locking (Pending)
Will test:
- Update spec fields
- Lock specs
- Attempt updates on locked specs (should only allow progress fields)

## Recommendations

### For Tool Developers
1. **Fix YAML Serialization**: Update the draft manager to properly handle complex types (arrays, objects) instead of stringifying them
2. **Fix Schema Validation**: Update step submission schemas to use `.passthrough()` to ignore extra fields during validation
3. **Add Better Error Messages**: Include the actual value received in validation errors for debugging
4. **Add Field Type Hints**: Document which fields expect arrays vs strings vs objects in the tool descriptions

### For Tool Users
1. Wait for bug fixes before using constitution creation flow
2. Be cautious with multi-step flows that accumulate fields
3. Use direct spec creation (if available) instead of draft flow as a workaround
4. Test with simple cases first before complex nested structures

## Next Steps
1. Report Issues #1 and #2 to the development team
2. Continue testing with simpler spec types once bugs are fixed
3. Complete comprehensive query tool testing
4. Validate full workflow: create → query → update → validate → delete
