# Getting Started

**Goal**: Get up and running with spec-mcp and create your first spec.

## Quick Setup

### Installation

Install spec-mcp in your project:

```bash
npx @spec-mcp/cli init
```

This creates a `./specs` directory with folders for each spec type.

### Configure Your MCP Client

Add spec-mcp to your MCP client configuration:

```json
{
  "mcpServers": {
    "spec-mcp": {
      "command": "npx",
      "args": ["-y", "@spec-mcp/cli", "server"]
    }
  }
}
```

### Verify Installation

Check that the server is accessible:

```bash
# List available tools
npx @spec-mcp/cli tools

# Create your first spec
npx @spec-mcp/cli draft plan
```

## Your First Spec: A Simple Plan

Let's create a plan for adding a new feature.

### Step 1: Start a Draft

```
Create a new plan for implementing user profile editing
```

Claude will guide you through the draft workflow, asking questions like:
- What's the title?
- What does this plan accomplish?
- What criteria does it fulfill?
- What's in scope?
- What tasks are needed?

### Step 2: Answer Questions

```yaml
Title: Implement User Profile Editing
Description: Allow users to update their profile information
Criteria:
  requirement: brd-001-user-profiles
  criteria: crit-003
Scope:
  in_scope:
    - Edit name and email
    - Profile photo upload
    - Save and cancel actions
  out_of_scope:
    - Password changes
    - Account deletion
```

### Step 3: Add Tasks

```yaml
tasks:
  - task: Create profile edit form UI
    priority: high

  - task: Add profile update API endpoint
    priority: high

  - task: Implement photo upload to cloud storage
    depends_on: [task-002]
    priority: medium

  - task: Add validation and error handling
    depends_on: [task-001, task-002]
    priority: high
```

### Step 4: Review and Save

Claude will finalize the spec and save it to `./specs/plans/pln-001-implement-user-profile-editing.yml`.

## Understanding Spec Types

### When to Create Each Type

```
Business need? → BRD (Business Requirement)
Technical approach? → PRD (Technical Requirement)
Important choice? → Decision
Implementation work? → Plan
System architecture? → Component
Team standards? → Constitution
Release grouping? → Milestone
```

### Common Starting Points

**For new features:**
1. BRD - Capture what users need
2. PRD - Define technical approach
3. Plan - Break down implementation

**For technical work:**
1. PRD - Define technical requirements
2. Decision - Document key choices
3. Plan - Organize tasks

**For architecture:**
1. Component - Define system pieces
2. Decision - Document architectural choices
3. Constitution - Establish principles

## Working with Existing Specs

### List Your Specs

```
Show me all plans
Show me all specs related to authentication
What work is pending?
```

### Query and Filter

```
Show me all high-priority plans
What's in the v2.0 milestone?
Which tasks are blocked?
```

### Update Specs

```
Add a new task to pln-001
Update the scope of pln-002
Mark task-005 as completed
```

### Get Spec Details

```
Show me pln-001
What are the acceptance criteria for brd-001?
Which plans depend on pln-003?
```

## Draft Workflow

The draft workflow is interactive and guided:

1. **Start**: Create a draft of any spec type
2. **Answer**: Respond to questions about the spec
3. **Review**: Claude generates the complete spec
4. **Save**: Spec is saved and ready to use

You can:
- Skip optional questions
- Provide detailed or brief answers
- Ask for clarification
- Restart if needed

## Common Workflows

### Feature Planning

```
1. "Create a BRD for user notifications"
2. "Create a PRD for push notification implementation"
3. "Create a plan to implement notifications"
4. "Add this plan to milestone mls-001-mobile-launch"
```

### Task Execution

```
1. "Show me next tasks to work on"
2. "Start task-001 in pln-001"
3. "Mark task-001 as completed: Implemented the database schema"
4. "Start task-002"
```

### Progress Tracking

```
1. "Show me all in-progress tasks"
2. "What's the status of pln-001?"
3. "Which plans are blocked?"
4. "Show me completed work this week"
```

## File Structure

```
./specs/
├── business-requirements/
│   ├── brd-001-user-profiles.yml
│   └── brd-002-notifications.yml
├── technical-requirements/
│   ├── prd-001-profile-api.yml
│   └── prd-002-push-notifications.yml
├── plans/
│   ├── pln-001-implement-user-profile-editing.yml
│   └── pln-002-notification-system.yml
├── decisions/
│   ├── dec-001-use-postgres.yml
│   └── dec-002-use-firebase-messaging.yml
├── components/
│   ├── cmp-001-web-app.yml
│   └── cmp-002-mobile-app.yml
├── constitutions/
│   └── cst-001-api-design-principles.yml
└── milestones/
    └── mls-001-mobile-launch.yml
```

## Best Practices from Day One

### Keep It Simple
Start with minimal specs. Add detail as needed.

❌ Don't: Create a 50-task plan for a simple feature
✅ Do: Start with 3-5 key tasks, split if it grows

### Link Things Together
Connect specs to maintain traceability.

```yaml
# In a Plan
criteria:
  requirement: brd-001-profiles  # ← Links to business need
  criteria: crit-003
```

### Update as You Go
Keep specs current with implementation.

```
"Mark task-001 as completed"
"Update pln-001 scope to exclude mobile app"
"Add a note to task-003 about the API change"
```

### Use Descriptive Names
Make IDs and titles clear.

❌ Bad: `pln-001-stuff`
✅ Good: `pln-001-implement-user-profile-editing`

## Tips for Success

### Start Small
Don't spec everything upfront. Create specs as you need them.

### Be Consistent
Follow the same patterns for similar work.

### Ask Questions
Use Claude to help:
```
"What spec type should I use for this?"
"How do I link a plan to a BRD?"
"Show me examples of good task descriptions"
```

### Review Examples
Look at existing specs in your project for patterns.

```
"Show me how other plans define test cases"
"What does a good BRD look like?"
```

## Next Steps

Now that you're set up:

1. **Learn Workflows**: See [Planning Workflow](spec-mcp://guide/planning-workflow) and [Implementation Workflow](spec-mcp://guide/implementation-workflow)

2. **Understand Spec Types**: Read [Choosing Spec Types](spec-mcp://guide/choosing-spec-types)

3. **Best Practices**: Check [Best Practices](spec-mcp://guide/best-practices)

4. **Query Data**: Learn [Query Guide](spec-mcp://guide/query-guide)

5. **Spec Details**: See individual guides:
   - [Plan Guide](spec-mcp://guide/plan)
   - [BRD Guide](spec-mcp://guide/business-requirement)
   - [Decision Guide](spec-mcp://guide/decision)

## Getting Help

```
"How do I create a decision?"
"Show me the plan schema"
"What tools are available?"
"Explain spec relationships"
```

Claude can answer questions and guide you through any workflow.
