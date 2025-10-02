# Wizard Module

Step-by-step guided spec creation following best practices.

## Overview

The wizard module provides a structured, multi-step approach to creating specifications (requirements, components, plans). It enforces best practices by guiding users through a logical sequence of steps with validation at each stage.

## Components

### DraftManager
Manages in-memory state for wizard sessions.

```typescript
const draftManager = new DraftManager();

// Create a new draft
const draft = draftManager.createDraft("requirement");

// Update draft data
draftManager.updateDraft(draft.id, { description: "..." });

// Advance to next step
draftManager.advanceStep(draft.id);

// Finalize and clean up
draftManager.deleteDraft(draft.id);
```

### StepDefinitions
Defines the structured steps for each spec type:
- **Requirements**: 7 steps (problem identification → review)
- **Components**: 10 steps (analyze requirements → validate)
- **Plans**: 12 steps (review context → validate)

```typescript
import { getStepsForType, getStepByOrder } from "./step-definitions";

// Get all steps for requirements
const reqSteps = getStepsForType("requirement");

// Get specific step
const step1 = getStepByOrder("requirement", 1);
console.log(step1.prompt); // "What problem are we solving?..."
```

### StepValidator
Validates draft data against step requirements.

```typescript
const validator = new StepValidator();

// Validate current step
const result = validator.validateStep(step, draftData);
if (!result.passed) {
  console.log(result.issues);    // ["Description should be at least 50 characters"]
  console.log(result.suggestions); // ["Consider adding words like: because, needed"]
}

// Validate for finalization
const finalCheck = validator.validateForFinalization("requirement", draftData);
```

## Usage Example

```typescript
import { DraftManager, StepValidator, getStepByOrder } from "@spec-mcp/core";

const draftManager = new DraftManager();
const validator = new StepValidator();

// Step 1: Start wizard
const draft = draftManager.createDraft("requirement");
const step1 = getStepByOrder("requirement", 1);

console.log(step1.prompt);
// "What problem are we solving? What's the business value?..."

// Step 2: User provides data
draft Manager.updateDraft(draft.id, {
  description: "Users need automated task tracking because manual tracking takes 2+ hours daily"
});

// Step 3: Validate
const validation = validator.validateStep(step1, draft.data);

if (validation.passed) {
  // Advance to next step
  draftManager.advanceStep(draft.id);
  const step2 = getStepByOrder("requirement", draft.current_step);
  console.log(step2.prompt);
  // "Review the description to ensure it focuses on WHAT..."
}

// ... continue through all 7 steps ...

// Final step: Validate and create
const finalValidation = validator.validateForFinalization("requirement", draft.data);
if (finalValidation.passed) {
  // Create the requirement from draft data
  const requirement = createRequirementFromDraft(draft.data);
  draftManager.deleteDraft(draft.id);
}
```

## Step Sequences

### Requirement (7 steps)
1. **Problem Identification**: Define the problem and rationale
2. **Avoid Implementation**: Remove implementation details
3. **Measurability**: Add measurable criteria
4. **Specific Language**: Replace vague terms
5. **Acceptance Criteria**: Finalize 2-4 criteria
6. **Priority Assignment**: Set appropriate priority
7. **Review and Refine**: Final validation

### Component (10 steps)
1. **Analyze Requirements**: Link to requirements
2. **Define Boundaries**: Single responsibility
3. **Define Responsibilities**: List capabilities
4. **Define Interfaces**: Inputs, outputs, contracts
5. **Map Dependencies**: Internal and external
6. **Define Ownership**: State management
7. **Identify Patterns**: Architectural patterns
8. **Quality Attributes**: Constraints
9. **Trace Requirements**: Traceability matrix
10. **Validate and Refine**: Final review

### Plan (12 steps)
1. **Review Context**: Requirements and components
2. **Identify Phases**: Major phases
3. **Analyze Dependencies**: Dependency graph
4. **Break Down Tasks**: 0.5-3 day tasks
5. **Estimate Effort**: With 20% buffer
6. **Define Acceptance**: Plan criteria
7. **Identify Milestones**: Key checkpoints
8. **Plan Testing**: Testing strategy
9. **Plan Risks**: Risk mitigation
10. **Create Timeline**: Schedule and critical path
11. **Trace Specifications**: Link to requirements
12. **Validate and Refine**: Final validation

## Validation Rules

The validator supports several rule types:
- `min_length`: Minimum character count
- `max_length`: Maximum character count
- `contains_rationale`: Must include rationale keywords
- `no_implementation`: Block implementation details
- `required`: Field must be present
- `pattern`: Regex pattern matching

## Draft Lifecycle

```
┌─────────┐
│ CREATE  │ ← operation: "start"
└────┬────┘
     │
     ▼
┌─────────────┐
│   STEP 1    │ ← operation: "step", data: {...}
│  (validate) │
└────┬────────┘
     │ (if passed)
     ▼
┌─────────────┐
│   STEP 2    │
│  (validate) │
└────┬────────┘
     │
    ...
     │
     ▼
┌─────────────┐
│  STEP N     │
│  (validate) │
└────┬────────┘
     │ (if passed)
     ▼
┌─────────────┐
│  FINALIZE   │ ← operation: "finalize"
│  (create)   │
└────┬────────┘
     │
     ▼
┌─────────────┐
│   DELETE    │ ← cleanup draft
│   DRAFT     │
└─────────────┘
```

## Expiration

Drafts automatically expire after 24 hours. The `DraftManager` includes a cleanup method:

```typescript
// Periodic cleanup (e.g., run every hour)
setInterval(() => {
  const removed = draftManager.cleanup();
  console.log(`Cleaned up ${removed} expired drafts`);
}, 60 * 60 * 1000);
```

## Design Decisions

### Why In-Memory?
- Simple, no external dependencies
- Sufficient for 24-hour draft lifetime
- Easy to extend to Redis/database later

### Why Step-by-Step?
- Enforces best practices from the guides
- Reduces cognitive load
- Catches issues early
- Better quality output

### Why Not Skip Steps?
- Each step builds on previous ones
- Ensures completeness
- Maintains consistency
- Easier to debug

## Future Enhancements
- Persistent storage (Redis/database)
- Step rollback support
- Draft templates
- Collaborative editing
- AI-powered suggestions
