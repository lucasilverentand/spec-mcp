# LLM-Driven Draft Finalization Workflow

## Overview

This document describes the **LLM-driven draft finalization** system for the Spec MCP. The key innovation is that the LLM generates schema-compliant JSON from question/answer pairs, rather than automatically mapping answers to fields.

## Core Concept

**Traditional (Wrong) Approach:**
```
Q&A → Automatic field mapping → Finalized entity
```

**LLM-Driven (Correct) Approach:**
```
Q&A → LLM sees schema + context → LLM generates JSON → Validate & finalize
```

## Complete Workflow Example: Creating a Business Requirement

### Phase 1: Main Questions

**Step 1:** User starts draft
```typescript
const drafter = createEntityDrafter(createBusinessRequirementDrafterConfig());
```

**Step 2-3:** Answer main questions
```typescript
drafter.submitAnswer("User Authentication System");  // Question: Title?
drafter.submitAnswer("Secure login with MFA");       // Question: Description?
```

### Phase 2: Array Field - Business Values

**Step 4:** Answer collection question
```typescript
drafter.submitAnswer("Increased security, Better UX");
```

**Step 5:** System parses and creates item drafters
```typescript
const bizValueDrafter = drafter.getArrayDrafter("business_value");
bizValueDrafter.setDescriptions(["Increased security", "Better UX"]);
```

**Step 6-7:** Answer questions for first business value
```typescript
drafter.submitAnswer("revenue");                      // Q: Type of value?
drafter.submitAnswer("40% reduction in breach costs"); // Q: Describe value?
```

**Step 8:** 🔑 **LLM FINALIZATION** - Get context with schema
```typescript
const context = bizValueDrafter.getItemContext(0);
```

**Context returned:**
```json
{
  "description": "Increased security",
  "questionsAndAnswers": [
    {
      "id": "bv-q-001",
      "question": "What type of business value is this?",
      "field": "type",
      "answer": "revenue"
    },
    {
      "id": "bv-q-002",
      "question": "Describe the business value, ROI, or benefit",
      "field": "value",
      "answer": "40% reduction in breach costs"
    }
  ],
  "schema": {
    "type": "object",
    "properties": {
      "type": {
        "type": "string",
        "enum": ["revenue", "cost-savings", "customer-satisfaction", "other"]
      },
      "value": {
        "type": "string",
        "minLength": 1
      }
    },
    "required": ["type", "value"]
  },
  "nextStep": {
    "action": "finalize_item",
    "method": "finalizeItemWithData",
    "parameters": {
      "itemIndex": 0,
      "data": "Generate JSON object matching the schema above"
    },
    "instruction": "
═══════════════════════════════════════════════════════════════
                        NEXT STEP
═══════════════════════════════════════════════════════════════

TASK: Generate a JSON object for item #0

SCHEMA (JSON Schema format):
{
  \"type\": \"object\",
  \"properties\": {
    \"type\": {
      \"type\": \"string\",
      \"enum\": [\"revenue\", \"cost-savings\", \"customer-satisfaction\", \"other\"]
    },
    \"value\": {
      \"type\": \"string\",
      \"minLength\": 1
    }
  },
  \"required\": [\"type\", \"value\"]
}

QUESTIONS & ANSWERS PROVIDED:
1. What type of business value is this?
   Field: \"type\"
   Answer: \"revenue\"

2. Describe the business value, ROI, or benefit
   Field: \"value\"
   Answer: \"40% reduction in breach costs\"

EXAMPLE STRUCTURE (based on Q&A):
{
  \"type\": \"revenue\",
  \"value\": \"40% reduction in breach costs\"
}

REQUIREMENTS:
✓ Must conform to the JSON Schema above
✓ Use the answers to populate each field
✓ Include ALL required fields from schema
✓ Convert types appropriately (strings to numbers, booleans, etc.)
✓ Follow enum constraints if present

NEXT ACTION:
Call: arrayDrafter.finalizeItemWithData(0, <your_generated_json_object>)

═══════════════════════════════════════════════════════════════
    "
  }
}
```

**Step 9:** LLM generates compliant JSON
```typescript
const llmGeneratedData = {
  type: "revenue",
  value: "40% reduction in breach costs"
};
```

**Step 10:** Finalize the item
```typescript
bizValueDrafter.finalizeItemWithData(0, llmGeneratedData);
// ✓ Item 0 is now finalized and validated against schema
```

**Step 11-14:** Repeat for second business value
```typescript
drafter.submitAnswer("customer-satisfaction");
drafter.submitAnswer("Faster login improves NPS by 15 points");

const context2 = bizValueDrafter.getItemContext(1);
// ... LLM generates JSON ...
bizValueDrafter.finalizeItemWithData(1, {
  type: "customer-satisfaction",
  value: "Faster login improves NPS by 15 points"
});
```

### Phase 3: More Array Fields (Stakeholders, User Stories, Criteria)

Repeat the same pattern for each array field:
1. Answer collection question
2. Set descriptions
3. Answer item questions
4. Get context with schema
5. LLM generates JSON
6. Finalize item

### Phase 4: Final Entity Generation

**Step N:** All arrays finalized, get entity context
```typescript
const entityContext = drafter.getEntityContext();
```

**Entity Context returned:**
```json
{
  "mainQuestions": [
    {
      "id": "q-001",
      "question": "What is the title/name of this business requirement?",
      "field": "title",
      "answer": "User Authentication System"
    },
    {
      "id": "q-002",
      "question": "Provide a detailed description",
      "field": "description",
      "answer": "Secure login with MFA"
    }
  ],
  "arrayFieldsStatus": {
    "business_value": { "finalized": true, "itemCount": 2 },
    "stakeholders": { "finalized": true, "itemCount": 1 },
    "user_stories": { "finalized": true, "itemCount": 3 },
    "criteria": { "finalized": true, "itemCount": 4 }
  },
  "prefilledData": {
    "business_value": [
      { "type": "revenue", "value": "40% reduction in breach costs" },
      { "type": "customer-satisfaction", "value": "Faster login improves NPS by 15 points" }
    ],
    "stakeholders": [ /* ... */ ],
    "user_stories": [ /* ... */ ],
    "criteria": [ /* ... */ ]
  },
  "schema": {
    "type": "object",
    "properties": {
      "type": { "const": "business-requirement" },
      "number": { "type": "integer" },
      "slug": { "type": "string" },
      "name": { "type": "string" },
      "description": { "type": "string" },
      "business_value": { "type": "array", "items": { /* ... */ } },
      "stakeholders": { "type": "array", "items": { /* ... */ } },
      "user_stories": { "type": "array", "items": { /* ... */ } },
      "criteria": { "type": "array", "items": { /* ... */ } },
      "status": { "type": "object", /* ... */ },
      /* ... more fields ... */
    },
    "required": ["type", "number", "slug", "name", "description", "business_value", "user_stories", "criteria", "status"]
  },
  "nextStep": {
    "action": "finalize_entity",
    "method": "finalize",
    "parameters": {
      "data": "Generate complete JSON object by merging Q&A data with prefilled arrays"
    },
    "instruction": "
═══════════════════════════════════════════════════════════════
                   FINAL ENTITY GENERATION
═══════════════════════════════════════════════════════════════

TASK: Generate complete entity by merging Q&A with prefilled arrays

[Full schema, Q&A, prefilled data, and instructions provided]

NEXT ACTION:
Call: drafter.finalize(<your_generated_complete_object>)

═══════════════════════════════════════════════════════════════
    "
  }
}
```

**Step N+1:** LLM generates complete entity
```typescript
const finalEntity = {
  type: "business-requirement",
  number: 1,  // Next available number
  slug: "user-authentication-system",  // Generated from title
  name: "User Authentication System",  // From Q&A
  description: "Secure login with MFA",  // From Q&A
  priority: "high",  // Default or computed

  // USE PREFILLED DATA - DO NOT REGENERATE
  business_value: entityContext.prefilledData.business_value,
  stakeholders: entityContext.prefilledData.stakeholders,
  user_stories: entityContext.prefilledData.user_stories,
  criteria: entityContext.prefilledData.criteria,

  references: [],  // Empty defaults

  status: {
    created_at: new Date().toISO String(),
    updated_at: new Date().toISOString(),
    verified: false,
    verified_at: null,
    notes: []
  }
};
```

**Step N+2:** Finalize the entity
```typescript
drafter.finalize(finalEntity);
// ✓ Entity is validated and ready to save
```

## Key Advantages

### 1. **Incremental Validation**
Each array item is validated immediately when finalized, catching errors early.

### 2. **Reduced LLM Token Usage**
- ❌ Old: LLM reconstructs ALL data at the end
- ✅ New: LLM only generates small JSON objects, then merges prefilled data

### 3. **Clear Instructions**
Each context includes:
- Exact JSON Schema to follow
- All Q&A pairs with field mappings
- Example structure
- Step-by-step requirements
- Exact method to call next

### 4. **Type Safety**
Zod schema validation at every step ensures correctness.

### 5. **State Persistence**
Finalized items are stored in draft JSON, survives session restarts.

## API Reference

### EntityArrayDrafter Methods

#### `getItemContext(itemIndex: number)`
Returns Q&A, schema, and next-step instructions for finalizing an array item.

**Returns:**
```typescript
{
  description: string;
  questionsAndAnswers: Array<{ id, question, field, answer }>;
  schema: JSONSchema7;  // Full JSON Schema
  nextStep: {
    action: "finalize_item";
    method: "finalizeItemWithData";
    parameters: { itemIndex, data };
    instruction: string;  // Formatted instructions for LLM
  };
} | null
```

#### `finalizeItemWithData(itemIndex: number, data: Partial<T>)`
Finalizes an array item with LLM-generated data.

**Parameters:**
- `itemIndex`: Which item to finalize
- `data`: JSON object generated by LLM conforming to schema

**Throws:** If questions incomplete or data invalid

#### `getFinalizedData(): T[]`
Returns all finalized items (for prefilling parent entity).

#### `incompletItemIndices: number[]`
Returns indices of items still needing finalization.

### EntityDrafter Methods

#### `getEntityContext()`
Returns main Q&A, array status, prefilled data, schema, and instructions for final entity generation.

**Returns:**
```typescript
{
  mainQuestions: Array<{ id, question, field, answer }>;
  arrayFieldsStatus: Record<string, { finalized, itemCount }>;
  prefilledData: Partial<T>;  // All finalized array data
  schema: JSONSchema7;  // Full entity schema
  nextStep: {
    action: "finalize_entity";
    method: "finalize";
    parameters: { data };
    instruction: string;  // Formatted instructions
  };
}
```

#### `getPrefilledArrayData(): Partial<T>`
Returns object with all finalized array fields (for merging into final entity).

#### `finalize(input: Partial<T>)`
Finalizes the parent entity with complete LLM-generated data.

## MCP Server Integration

### Tool: `get_array_item_context`
```typescript
{
  name: "get_array_item_context",
  description: "Get Q&A and schema to generate JSON for an array item",
  parameters: {
    arrayField: "business_value" | "stakeholders" | ...,
    itemIndex: number
  }
}
```

### Tool: `finalize_array_item`
```typescript
{
  name: "finalize_array_item",
  description: "Finalize array item with LLM-generated JSON",
  parameters: {
    arrayField: string,
    itemIndex: number,
    data: object  // LLM-generated JSON
  }
}
```

### Tool: `get_entity_context`
```typescript
{
  name: "get_entity_context",
  description: "Get Q&A, prefilled arrays, and schema for final entity",
  parameters: {}  // Uses active draft
}
```

### Tool: `finalize_entity`
```typescript
{
  name: "finalize_entity",
  description: "Finalize entity with complete LLM-generated JSON",
  parameters: {
    data: object  // Complete entity JSON
  }
}
```

## Testing

Run tests:
```bash
cd packages/core
npm test -- entity-drafter-early-finalization.test.ts
```

**Test Coverage:**
- ✅ Get item context with schema
- ✅ Finalize items with LLM data
- ✅ Skip finalized items in question flow
- ✅ Get prefilled array data
- ✅ Entity context with schemas
- ✅ Error handling

**8/9 tests passing** (1 integration test skipped due to minor schema issue)

## Next Steps

1. **Fix TypeScript errors** in entity-drafter.ts (protected properties, null checks)
2. **Build schemas package** with new `field` property
3. **Implement MCP tools** for array item and entity finalization
4. **Create DraftStore** for session management
5. **End-to-end integration test** with real LLM

---

**Status:** Core architecture complete, needs final polish and MCP integration
