# Ellie Specification-Driven Development Workflow

## Executive Summary

The Ellie project implements a **Specification-Driven Development (SDD)** methodology that ensures every line of code traces back to documented requirements and acceptance criteria. This system creates a paradigm shift from ad-hoc development to systematic, specification-first engineering.

### Vision

Create a development environment where specifications are the single source of truth, eliminating ambiguity between business intent and technical implementation.

### Innovation

- **MCP (Model Context Protocol) Server**: Custom specification management server
- **Systematic Prompts**: Enforced methodologies for research, planning, and implementation
- **Enforcement Architecture**: Technical barriers preventing spec-less development

### Core Principles

1. **Specification First**: No code without specifications
2. **Systematic Research**: Mandatory methodology-driven analysis
3. **Continuous Validation**: Real-time spec-code alignment checking
4. **Complete Traceability**: Bidirectional links between specs and implementation

## System Architecture Overview

### MCP Specification Server (`packages/spec-mcp/`)

The heart of the SDD system is a custom MCP server that:

- Manages all specifications through validated APIs
- Enforces schema compliance and referential integrity
- Provides systematic prompts for research and planning
- Blocks direct file system access to specification files

### Claude Code Integration

The `.claude/` directory configures Claude Code for spec-driven development:

- **Permissions**: Blocks direct `.specs/` access, forces MCP tool usage
- **Output Styles**: `spec-aware` (encouraging) vs `spec-strict` (enforcing)

### Specification Structure (`.specs/`)

```
.specs/
├── requirements/     # Business requirements (req-*)
│   ├── req-001-app-nav.yaml
│   ├── req-002-auth-accounts.yaml
│   └── ...
├── components/       # System components (app-*, pkg-*)
│   ├── app-001-user-app.yaml
│   ├── pkg-001-database.yaml
│   └── ...
└── plans/           # Implementation plans (plan-*)
    ├── plan-001-nav-state-indicators.yaml
    └── ...
```

## Core Workflow Phases

### Phase 1: Research & Discovery

**Purpose**: Comprehensive codebase and external research before development

#### Systematic Research Methodology

1. **Codebase Discovery** (`codebase-discovery` prompt)
   - Systematic exploration of existing patterns
   - Architecture mapping and component analysis
   - Technology stack identification

2. **Pattern Analysis** (`existing-patterns` prompt)
   - Discover established conventions
   - Identify reusable components
   - Document architectural consistency

3. **Impact Assessment** (`impact-analysis` prompt)
   - Analyze proposed changes on existing systems
   - Risk assessment and mitigation planning
   - Integration point identification

4. **External Research** (`external-documentation` prompt)
   - Framework and library documentation research
   - Best practice analysis
   - Technology validation against project needs

### Phase 2: Specification & Planning

**Purpose**: Transform research into actionable specifications and implementation plans

#### Specification Creation Workflow

1. **Requirements Analysis** (`research-before-planning` prompt)
   - Systematic requirement gathering methodology
   - Stakeholder need identification
   - Technical constraint analysis

2. **Specification Authoring**
   - Create detailed requirements with acceptance criteria
   - Define component specifications with capabilities
   - Establish proper priority classification

3. **Implementation Planning** (`create-plan-from-requirement` prompt)
   - Automated plan generation from requirements
   - Task decomposition and dependency mapping
   - Risk assessment and mitigation strategies

4. **Plan Optimization** (`implementation-order-guide` prompt)
   - Optimal task sequencing
   - Dependency-based ordering
   - Parallel work identification

### Phase 3: Implementation

**Purpose**: Transform specifications into working code following established patterns

#### Spec-Driven Implementation Rules

- **NO CODE WITHOUT SPECS**: All implementations must reference valid spec IDs
- **Pattern Following**: Use existing architectural patterns discovered in research
- **Code Annotation**: Include spec references in implementation comments
- **Task Tracking**: Update spec task status throughout development

#### Implementation Methodology

1. **Specification Loading**: Always start with `mcp__ellie-specs__get-spec`
2. **Pattern Research**: Use discovery prompts to understand existing patterns
3. **External Research**: Research third-party libraries and frameworks
4. **Implementation**: Write code that satisfies acceptance criteria
5. **Status Updates**: Mark tasks as completed and update spec progress

### Phase 4: Testing

**Purpose**: Create comprehensive test suites based on acceptance criteria

#### Testing Strategy

1. **Coverage Analysis** (`test-coverage-analysis` prompt)
   - Map tests to acceptance criteria
   - Identify coverage gaps
   - Generate comprehensive test reports

2. **Error Scenario Generation** (`error-scenario-generator` prompt)
   - Create robust error handling tests
   - Network, validation, and edge case scenarios
   - Performance and security testing

### Phase 5: Validation

**Purpose**: Ensure implementation matches specifications and maintain status accuracy

#### Validation Workflow

1. **Implementation Verification**: Check each acceptance criteria against actual code
2. **Status Synchronization**: Ensure spec status matches implementation reality
3. **Gap Analysis**: Identify discrepancies between specs and code
4. **Compliance Reporting**: Generate alignment status reports

### Phase 6: Version Control

**Purpose**: Create structured commits with specification references

#### Commit Standards

- Reference relevant spec IDs in commit messages
- Organize changes into logical, atomic commits
- Follow conventional commit standards
- Maintain traceability between commits and specifications

## MCP Prompt System

The MCP server provides systematic prompts that enforce methodological approaches:

### Research Prompts

- `codebase-discovery`: Systematic codebase exploration
- `existing-patterns`: Architectural pattern analysis
- `impact-analysis`: Change impact assessment
- `research-before-planning`: Pre-planning research methodology

### Implementation Prompts

- `create-plan-from-requirement`: Automated plan generation
- `implementation-order-guide`: Optimal task sequencing
- `create-component-guided`: Type-specific component creation
- `review-plan`: Plan quality analysis

### Testing Prompts

- `test-coverage-analysis`: Comprehensive coverage analysis
- `error-scenario-generator`: Robust error scenario creation

### Flow Design Prompts

- `user-flow-design`: User journey mapping
- `data-flow-design`: Data architecture planning

## Specification Types & Structure

### Requirements (req-\*)

Business requirements with acceptance criteria, priorities, and user value propositions.

```yaml
id: req-001-app-nav
name: App Navigation Requirements
priority: must-have
overview: Navigation system for Ellie mobile app...
acceptanceCriteria:
  - description: Users can navigate between main app sections
  - description: Visual feedback shows current navigation state
```

### Components (app-_, pkg-_)

System architecture definitions with capabilities, dependencies, and technology specifications.

```yaml
id: app-001-user-app
name: Ellie App
type: application
overview: Main language learning mobile application...
techStack: [React Native, Expo, TypeScript]
keyCapabilities:
  - Personalized learning experiences
  - Progress tracking
```

### Plans (plan-\*)

Detailed implementation strategies with tasks, flows, tests, and error handling.

```yaml
id: plan-001-nav-state-indicators
name: Navigation State Indicators Implementation Plan
priority: high
overview: Comprehensive implementation plan for navigation state indicators...
tasks:
  - description: Create navigation context provider
    component: app-001-user-app
    priority: high
```

## Enforcement Mechanisms

### Claude Configuration (`.claude/settings.json`)

```json
{
  "permissions": {
    "deny": [
      "Read(.specs/)",
      "Write(.specs/)",
      "Edit(.specs/)",
      "Glob(.specs/**)"
    ]
  }
}
```

### MCP Server Integration (`.mcp.json`)

```json
{
  "mcpServers": {
    "ellie-specs": {
      "command": "npm",
      "args": ["run", "start", "--prefix", "./packages/spec-mcp"]
    }
  }
}
```

### Output Styles

- **spec-aware**: Encourages spec-driven development with gentle reminders
- **spec-strict**: Enforces strict compliance, blocks non-spec development

## Developer Workflows

### New Feature Development

1. **Research**: Use `codebase-discovery` prompt for systematic analysis
2. **Requirements**: Create requirement specification with acceptance criteria
3. **Planning**: Create automated planning using MCP prompts
4. **Implementation**: Use systematic pattern research for implementation
5. **Testing**: Validate acceptance criteria through comprehensive testing
6. **Validation**: Ensure spec-code alignment through validation processes
7. **Commit**: Create structured version control with specification references

### Bug Fixing with Spec Updates

1. **Identify**: Locate relevant specifications affected by bug
2. **Update**: Modify acceptance criteria if bug represents missing requirement
3. **Fix**: Implement fix following spec-driven methodology
4. **Validate**: Ensure fix satisfies updated acceptance criteria
5. **Test**: Add tests covering the bug scenario

### Refactoring with Spec Alignment

1. **Impact Analysis**: Use `impact-analysis` prompt to understand changes
2. **Pattern Research**: Use `existing-patterns` to maintain consistency
3. **Spec Review**: Update component specifications if architecture changes
4. **Implementation**: Refactor while maintaining acceptance criteria satisfaction
5. **Validation**: Verify all existing functionality still works

## MCP Integration Reference

### Automated Planning Process

Creates comprehensive implementation plan from existing specification through systematic prompt execution:

**Process**:

1. Load specification and validate
2. Execute `research-before-planning` prompt
3. Run `create-plan-from-requirement` prompt
4. Apply `implementation-order-guide` for optimization
5. Generate detailed implementation plan

### MCP Tool Patterns

- `mcp__ellie-specs__create-requirement`: Create new requirements
- `mcp__ellie-specs__create-component`: Define system components
- `mcp__ellie-specs__create-plan`: Create implementation plans
- `mcp__ellie-specs__get-spec`: Retrieve specifications
- `mcp__ellie-specs__update-spec`: Update spec content and status
- `mcp__ellie-specs__validate-specs`: Full system validation

### Systematic Workflow Integration

The development process follows systematic prompt-driven workflows:

- **Research Phase**: Use `codebase-discovery` and `existing-patterns` prompts
- **Planning Phase**: Use `create-plan-from-requirement` and `implementation-order-guide` prompts
- **Implementation Phase**: Follow spec-driven development patterns with systematic research

## Quality Assurance

### Specification Validation

- **Schema Compliance**: All specs must match defined schemas
- **Reference Integrity**: All spec ID references must be valid
- **Dependency Analysis**: Circular dependencies are detected and prevented
- **Orphan Detection**: Broken references are identified and reported

### Status Synchronization

- **Task Tracking**: Implementation progress tracked against spec tasks
- **Acceptance Criteria**: Each AC mapped to actual implementation
- **Test Coverage**: Tests mapped to acceptance criteria
- **Continuous Validation**: Real-time spec-code alignment checking

### Test Coverage Mapping

Every test must trace back to acceptance criteria:

```typescript
// test: req-001-auth AC-1.1 - User can sign in with valid email/password
describe("User Authentication", () => {
  it("should allow sign in with valid credentials", () => {
    // Implements: [spec:req-001-auth] AC-1.1
  });
});
```

## Best Practices

### Specification Creation

1. **Start with User Value**: Every requirement should have clear user benefit
2. **Acceptance Criteria First**: Define measurable completion criteria
3. **Proper Prioritization**: Use must-have, should-have, nice-to-have classification
4. **Component Mapping**: Link requirements to specific components
5. **Dependency Documentation**: Explicit dependency relationships

### Implementation Standards

1. **Spec References**: Include spec ID in implementation comments
2. **Pattern Following**: Use existing architectural patterns
3. **Task Updates**: Mark task progress throughout development
4. **Status Accuracy**: Ensure completion status matches implementation
5. **Code Quality**: Follow project coding standards and conventions

### Maintenance Practices

1. **Regular Validation**: Run spec validation frequently
2. **Status Synchronization**: Keep spec status aligned with code reality
3. **Gap Analysis**: Identify and address spec-code misalignments
4. **Documentation Updates**: Keep specs current with implementation changes

## Anti-patterns to Avoid

### Development Anti-patterns

- **Spec-less Implementation**: Writing code without specifications
- **Ad-hoc Changes**: Making changes without updating relevant specs
- **Status Misalignment**: Marking tasks complete when they're not
- **Pattern Deviation**: Ignoring established architectural patterns
- **Direct Spec Access**: Bypassing MCP tools to modify specs directly

### Specification Anti-patterns

- **Vague Acceptance Criteria**: Non-measurable completion criteria
- **Missing Dependencies**: Undocumented component relationships
- **Outdated Status**: Spec status not reflecting implementation reality
- **Orphaned References**: References to non-existent specs
- **Poor Prioritization**: All requirements marked as "must-have"

## Advanced Features

### Systematic Prompt Chaining

The system supports chaining multiple prompts for comprehensive analysis:

```bash
research-before-planning → codebase-discovery → impact-analysis → external-documentation
```

### Automated Plan Generation

The systematic planning process orchestrates multiple prompts:

1. Research methodology application
2. Plan generation from requirements
3. Task optimization and sequencing
4. Quality validation and review

### Real-time Validation

Continuous validation ensures:

- Spec-code alignment
- Reference integrity
- Status accuracy
- Dependency consistency

## Conclusion

The Ellie Specification-Driven Development workflow represents a paradigm shift toward systematic, traceable, and quality-focused software development. By enforcing specifications as the single source of truth and providing systematic methodologies for research, planning, and implementation, this system ensures that every development decision is deliberate, documented, and aligned with business objectives.

The integration of MCP tools and systematic prompts creates a development environment where quality is built-in rather than bolted-on, and where the gap between business requirements and technical implementation is eliminated through rigorous specification-driven practices.

This methodology scales from individual features to entire system architectures, providing a foundation for sustainable, maintainable, and high-quality software development that serves the long-term success of the Ellie language learning platform.
