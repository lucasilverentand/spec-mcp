# LLM Flow Testing Guide

## Overview

This guide explains how to fully test the LLM-driven creation flow for spec-mcp. The creation flow uses a guided Q&A approach where LLMs interact with the system through MCP tools to create specifications.

## Current Test Coverage

### 1. Unit Tests (`packages/core/tests/`)

**Location:** `packages/core/tests/creation-flow/`

**What they test:**
- `draft-manager.test.ts` - Draft CRUD operations, persistence, expiration
- `schema-finalizer.test.ts` - Q&A metadata cleanup, schema validation
- `step-validator.test.ts` - Individual step validation logic

**Coverage:** ✅ Core functionality, validation rules, data transformations

### 2. Integration Tests (`packages/server/tests/integration/`)

**Location:** `packages/server/tests/integration/creation-flow.test.ts`

**What they test:**
- Complete flow for all 5 entity types (Requirement, Component, Plan, Constitution, Decision)
- Step-by-step progression through Q&A workflow
- Data accumulation across steps
- Error handling and validation feedback
- Draft persistence

**Coverage:** ✅ Full programmatic flow simulation

### 3. E2E Tests (`packages/server/tests/e2e/`)

**Location:** `packages/server/tests/e2e/mcp-client.test.ts`

**What they test:**
- Real MCP client communication
- Tool discovery
- Complete requirement creation via MCP protocol
- Query, validate, update, delete operations
- Security and error handling

**Coverage:** ✅ MCP protocol compliance, client-server communication

## What's Missing: LLM Behavior Testing

The current tests verify the **system** works correctly but don't verify that **LLMs can successfully use it**. Key gaps:

### 1. LLM Response Parsing
- Can LLMs correctly interpret step questions?
- Do they provide data in the expected format?
- Do they handle validation errors appropriately?

### 2. Multi-Step Reasoning
- Can LLMs maintain context across 8-16 steps?
- Do they use research tools (query, context7) when instructed?
- Do they synthesize information from multiple sources?

### 3. Error Recovery
- When validation fails, do LLMs understand the errors?
- Can they correct their inputs based on suggestions?
- Do they retry with improved data?

### 4. Schema Mapping
- In the final step, can LLMs correctly map Q&A data to the schema?
- Do they handle nested objects (articles, tasks, consequences)?
- Do they properly structure arrays with IDs?

## Recommended LLM Testing Strategy

### Level 1: Prompt Testing (Quick, Manual)

**Goal:** Verify prompts are clear and actionable

**Method:**
1. Copy a step's question + guidance into Claude/ChatGPT
2. Provide example context
3. Ask LLM to generate a response
4. Verify response format matches expected data structure

**Example Test:**
```
Question: "What acceptance criteria does this requirement need?"
Guidance: "List 2-4 specific, testable criteria. Each should be concrete..."

LLM Response Should Be:
{
  "criteria": [
    "User can log in within 3 seconds",
    "Error messages display within 1 second"
  ]
}
```

**When to use:** During prompt development, after changing step definitions

### Level 2: Simulated LLM Tests (Automated)

**Goal:** Verify LLM-like behavior patterns work end-to-end

**Method:**
1. Create test fixtures that mimic LLM responses (varied formats, edge cases)
2. Feed them through the flow programmatically
3. Assert successful completion

**Implementation:**
```typescript
// packages/server/tests/integration/llm-simulation.test.ts

describe("LLM-like Response Patterns", () => {
  it("should handle varied criteria formats", async () => {
    // Simulate LLM providing criteria as array
    await step(draft_id, { criteria: ["criterion 1", "criterion 2"] });

    // Simulate LLM providing criteria as newline-separated
    await step(draft_id, { criteria: "criterion 1\ncriterion 2" });

    // Both should work
  });

  it("should handle LLM elaborating beyond requested data", async () => {
    // LLMs often provide extra context
    await step(draft_id, {
      description: "This requirement is needed because...",
      rationale: "Additional explanation that wasn't requested",
      notes: "Some extra thoughts"
    });

    // Should extract description, ignore extra fields
  });
});
```

**When to use:** CI/CD pipeline, regression testing

### Level 3: Real LLM Integration Tests (Semi-Automated)

**Goal:** Verify actual LLM agents can complete flows

**Method:**
1. Use Claude Code Agent or similar to interact with MCP server
2. Provide minimal instructions: "Create a requirement for user authentication"
3. Let agent navigate the flow autonomously
4. Verify successful spec creation

**Implementation:**
```typescript
// packages/server/tests/e2e/live-llm.test.ts

describe("Live LLM Agent Tests", () => {
  it("should create requirement with Claude agent", async () => {
    // This requires actual LLM API access
    const agent = new ClaudeAgent({
      mcpServerUrl: "stdio://./dist/index.js",
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const result = await agent.execute(
      "Create a requirement for user authentication with email/password"
    );

    expect(result.spec_id).toMatch(/^req-\d{3}-/);
    expect(result.success).toBe(true);
  });
});
```

**When to use:** Pre-release validation, major version updates

### Level 4: Human-in-the-Loop Testing (Manual)

**Goal:** Validate real-world UX and edge cases

**Method:**
1. Use Claude Code CLI directly with MCP server
2. Create specs for various scenarios (simple, complex, edge cases)
3. Document friction points, confusing prompts, unexpected errors

**Checklist:**
- [ ] Create simple requirement (happy path)
- [ ] Create requirement with validation errors (error recovery)
- [ ] Create component with many dependencies (complex data)
- [ ] Create constitution with 5+ articles (array loops)
- [ ] Create decision with full consequences object (nested structures)
- [ ] Create plan with 10+ tasks (large arrays)
- [ ] Intentionally provide wrong data types (robustness)
- [ ] Skip optional fields (defaults handling)

**When to use:** Before major releases, after UX changes

## Specific Test Scenarios to Cover

### Scenario 1: Array Loop Handling

**Entity:** Constitution (articles), Plan (tasks), Requirement (criteria)

**Test:**
1. Provide array of descriptions in step N
2. System creates loop for step N+1
3. LLM expands each item with additional details
4. Verify all items processed correctly

**Edge cases:**
- Empty array (skip loop)
- Single item (loop once)
- Many items (10+ iterations)

### Scenario 2: Schema Finalization

**All entities, final step**

**Test:**
1. Complete all Q&A steps
2. Receive finalization instructions with schema
3. LLM maps Q&A data to schema
4. Call `finalize_draft`
5. Verify validation passes and spec created

**Edge cases:**
- Missing required fields (should fail with helpful error)
- Extra fields from Q&A (should be stripped)
- Wrong data types (should be coerced or fail clearly)

### Scenario 3: Research Tool Usage

**Steps with tool_hints**

**Test:**
1. Step instructs LLM to use query/context7
2. Verify LLM makes appropriate tool calls
3. LLM incorporates research into response
4. Response passes validation

**Example:**
```
Step 1: Research Similar Requirements
Guidance: "Use query tool to search for existing requirements"

Expected LLM behavior:
1. Call query({ search_terms: "authentication", types: ["requirement"] })
2. Review results
3. Provide research_findings: "Found req-002-oauth, which differs because..."
```

### Scenario 4: Validation Error Recovery

**Any step with validation**

**Test:**
1. LLM provides invalid data
2. System returns validation errors + suggestions
3. LLM corrects data based on feedback
4. Retry succeeds

**Example:**
```
LLM: { description: "Short" }
System: {
  validation: {
    passed: false,
    issues: ["Description must be at least 50 characters"],
    suggestions: ["Add rationale using 'because', 'needed', 'so that'"]
  }
}
LLM: { description: "Users need authentication because we handle sensitive data" }
System: { validation: { passed: true }, step: 2 }
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
# Unit tests
npm -w @spec-mcp/core test

# Integration tests
npm -w @spec-mcp/server test -- creation-flow.test.ts

# E2E tests
npm -w @spec-mcp/server test -- mcp-client.test.ts
```

### Run with Coverage
```bash
npm test -- --coverage
```

### Run Specific Test Pattern
```bash
npm test -- -t "Constitution Creation Flow"
```

## Creating New Tests

### Template: Integration Test
```typescript
describe("New Entity Creation Flow", () => {
  it("should create entity through complete flow", async () => {
    const startResponse = await creationFlowHelper.start("entity-type");
    const draft_id = startResponse.draft_id;

    // Step 1: First step
    await creationFlowHelper.step(draft_id, {
      field_name: "field value"
    });

    // Step N: Final step
    const finalStep = await creationFlowHelper.step(draft_id, {
      // Complete schema
    });

    expect(finalStep.completed).toBe(true);
  });
});
```

### Template: E2E Test
```typescript
describe("MCP Tool Tests", () => {
  it("should perform operation via MCP client", async () => {
    const result = await client.callTool({
      name: "tool_name",
      arguments: {
        param: "value"
      }
    });

    const response = JSON.parse(result.content[0].text);
    expect(response.success).toBe(true);
  });
});
```

## Debugging Failed Tests

### View Test Output
```bash
npm test -- --reporter=verbose
```

### Inspect Draft Files
```bash
# Drafts are persisted to .specs/.drafts/
ls -la .specs/.drafts/
cat .specs/.drafts/req-*.draft.json
```

### Check Validation Details
```typescript
const draft = creationFlowHelper.getDraft(draft_id);
console.log("Validation history:", draft.validation_results);
console.log("Current data:", draft.data);
```

### Enable Debug Logging
```bash
LOG_LEVEL=debug npm test
```

## Best Practices

1. **Test all entity types** - Requirements, Components, Plans, Constitutions, Decisions have different flows
2. **Test error paths** - Not just happy paths, but validation failures and recovery
3. **Test edge cases** - Empty arrays, missing optional fields, maximum lengths
4. **Test data persistence** - Verify drafts survive server restarts
5. **Test schema validation** - Ensure finalize_draft catches invalid data
6. **Use realistic data** - Test data should resemble actual usage patterns
7. **Clean up test data** - Delete drafts/specs after tests to avoid pollution

## Continuous Improvement

After each release:
1. Review support tickets for flow-related issues
2. Add regression tests for any bugs found
3. Update prompts/guidance based on LLM confusion
4. Expand test coverage for new entity types or fields
5. Benchmark LLM completion rates (what % of flows succeed?)

## Related Documentation

- [Step Definitions](../packages/core/src/creation-flow/step-definitions.ts) - All Q&A steps
- [Schema Finalizer](../packages/core/src/creation-flow/schema-finalizer.ts) - Validation logic
- [MCP Tools](../packages/server/src/tools/) - Tool implementations
- [Test Report](../packages/server/MCP_SERVER_TEST_REPORT.md) - Latest test results
