# Component Specification

## Purpose

A Component defines the **architecture** of your system by specifying individual building blocks with clear boundaries, explicit scope, responsibilities, and dependencies. Components describe how your system is structured to fulfill requirements.

Key aspects captured:
- **Boundaries & Scope**: What's in-scope and out-of-scope (with reasoning)
- **Technical Setup**: Tech stack, testing configuration, deployment platform
- **Dependencies**: Internal component and external library dependencies

Components come in three types:

- **App** (`app`) - Applications for users (web, mobile, desktop, API)
- **Service** (`service`) - Backend services and microservices
- **Library** (`library`) - Reusable code libraries and packages

Components are created **after** requirements and **before** implementation plans.

## Schema and Fields

### Core Fields (All Component Types)

| Field                    | Type                                 | Required | Description                                                       |
| ------------------------ | ------------------------------------ | -------- | ----------------------------------------------------------------- |
| `type`                   | `"app" \| "service" \| "library"`    | ✅       | Component subtype                                                 |
| `number`                 | `number`                             | ✅       | Auto-assigned sequential number                                   |
| `slug`                   | `string`                             | ✅       | URL-friendly identifier (lowercase, hyphens)                      |
| `name`                   | `string`                             | ✅       | Display name                                                      |
| `description`            | `string`                             | ✅       | Brief summary of the component's purpose and what it does         |
| `folder`                 | `string`                             | ✅       | Relative path from repository root (default: `"."`)               |
| `tech_stack`             | `string[]`                           | ✅       | Technologies and frameworks used (default: `[]`)                  |
| `testing_setup`          | `TestingSetup`                       | ✅       | Structured testing configuration                                  |
| `deployment`             | `Deployment`                         | ✅       | Structured deployment configuration                               |
| `scope`                  | `ComponentScope`                     | ✅       | Explicit scope definition with in-scope and out-of-scope items    |
| `depends_on`             | `ComponentId[]`                      | ✅       | Other components this relies on (default: `[]`)                   |
| `external_dependencies`  | `string[]`                           | ✅       | Third-party services/libraries (default: `[]`)                    |
| `created_at`             | `string` (ISO datetime)              | ✅       | Auto-generated creation timestamp                                 |
| `updated_at`             | `string` (ISO datetime)              | ✅       | Auto-generated update timestamp                                   |

### Computed Field

| Field | Type     | Description                                                                                     |
| ----- | -------- | ----------------------------------------------------------------------------------------------- |
| `id`  | `string` | Computed from type, number, and slug (format: `app-XXX-slug`, `svc-XXX-slug`, `lib-XXX-slug`) |

### Testing Setup Schema

The `testing_setup` field uses a structured schema to capture comprehensive testing configuration.

| Field                | Type          | Required | Description                                                              |
| -------------------- | ------------- | -------- | ------------------------------------------------------------------------ |
| `frameworks`         | `string[]`    | ✅       | Testing frameworks used (e.g., Jest, Vitest, Pytest)                    |
| `coverage_target`    | `number`      | ✅       | Overall test coverage target percentage (default: `90`)                  |
| `unit_tests`         | `TestSuite`   | ❌       | Unit test configuration and location                                     |
| `integration_tests`  | `TestSuite`   | ❌       | Integration test configuration and location                              |
| `e2e_tests`          | `TestSuite`   | ❌       | End-to-end test configuration and location                               |
| `test_commands`      | `object`      | ✅       | Commands to run different test suites (default: `{}`)                    |
| `mocking_strategy`   | `string`      | ❌       | Approach to mocking external dependencies                                |
| `test_patterns`      | `string[]`    | ✅       | Testing patterns followed (default: `[]`)                                |

### Test Suite Schema

Each test suite (`unit_tests`, `integration_tests`, `e2e_tests`) has the following structure:

| Field              | Type     | Required | Description                                                   |
| ------------------ | -------- | -------- | ------------------------------------------------------------- |
| `location`         | `string` | ✅       | Directory or pattern where tests are located                  |
| `pattern`          | `string` | ❌       | Test file pattern (e.g., `*.test.ts`, `*.spec.js`)            |
| `coverage_target`  | `number` | ❌       | Target coverage percentage for this specific test suite       |

### Deployment Schema

The `deployment` field captures deployment configuration.

| Field              | Type       | Required | Description                                                    |
| ------------------ | ---------- | -------- | -------------------------------------------------------------- |
| `platform`         | `string`   | ✅       | Deployment platform (e.g., "AWS ECS", "Vercel", "Kubernetes") |
| `url`              | `string`   | ❌       | Production URL or endpoint                                     |
| `build_command`    | `string`   | ❌       | Command to build the component                                 |
| `deploy_command`   | `string`   | ❌       | Command to deploy the component                                |
| `environment_vars` | `string[]` | ✅       | Required environment variables (default: `[]`)                 |
| `secrets`          | `string[]` | ✅       | Required secrets (default: `[]`)                               |
| `notes`            | `string`   | ❌       | Additional deployment notes or instructions                    |

**Example:**
```yaml
deployment:
  platform: AWS EKS
  url: https://auth.example.com
  build_command: docker build -t auth-service:latest .
  deploy_command: kubectl apply -f k8s/
  environment_vars:
    - DATABASE_URL
    - REDIS_URL
    - JWT_SECRET
  secrets:
    - DB_PASSWORD
    - API_KEY
  notes: Deployed via ArgoCD. See k8s/ directory for manifests.
```

### Component Scope Schema

The `scope` field uses a structured schema to explicitly define what's in and out of scope for the component.

| Field         | Type           | Required | Description                                                |
| ------------- | -------------- | -------- | ---------------------------------------------------------- |
| `in_scope`    | `ScopeItem[]`  | ✅       | Items explicitly within this component's responsibility    |
| `out_of_scope`| `ScopeItem[]`  | ✅       | Items explicitly outside this component's responsibility   |

### Scope Item Schema

Each scope item has the following structure:

| Field       | Type     | Required | Description                                              |
| ----------- | -------- | -------- | -------------------------------------------------------- |
| `item`      | `string` | ✅       | Description of the responsibility or concern             |
| `reasoning` | `string` | ✅       | Rationale for why this is in-scope or out-of-scope       |

**Example:**
```yaml
scope:
  in_scope:
    - item: User authentication (email/password, OAuth)
      reasoning: Core responsibility - validating user identity is central to this service
    - item: Session token generation and validation
      reasoning: Tightly coupled with authentication flow, requires secure token handling
    - item: Password security (hashing, reset flows)
      reasoning: Critical security function that must be centralized
  out_of_scope:
    - item: User profile management
      reasoning: Belongs to user-service to maintain separation of concerns
    - item: Authorization and permissions
      reasoning: Handled by permissions-service to allow independent scaling
    - item: Audit logging
      reasoning: Cross-cutting concern handled by logging-service for consistency
```

### App-Specific Fields

| Field                 | Type                                                      | Required | Description                                |
| --------------------- | --------------------------------------------------------- | -------- | ------------------------------------------ |
| `deployment_targets`  | `("ios" \| "android" \| "web" \| "desktop" \| "api")[]`   | ✅       | Where the app deploys (default: `[]`)      |
| `environments`        | `("development" \| "staging" \| "production")[]`          | ✅       | Available environments (default: all three)|

### Service-Specific Fields

| Field      | Type                   | Required | Description                 |
| ---------- | ---------------------- | -------- | --------------------------- |
| `dev_port` | `number` (1-65535)     | ❌       | Local development port      |

### Library-Specific Fields

| Field          | Type     | Required | Description                                    |
| -------------- | -------- | -------- | ---------------------------------------------- |
| `package_name` | `string` | ❌       | Package name (e.g., `@company/ui-components`)  |

### Deployment Target Values

| Value     | Description                     |
| --------- | ------------------------------- |
| `ios`     | iOS mobile application          |
| `android` | Android mobile application      |
| `web`     | Web browser application         |
| `desktop` | Desktop application (Electron)  |
| `api`     | API-only application            |

### Environment Values

| Value         | Description                         |
| ------------- | ----------------------------------- |
| `development` | Local development environment       |
| `staging`     | Pre-production staging environment  |
| `production`  | Production environment              |

## Capabilities (Derived Field)

Component capabilities are **not stored as a field**. Instead, they are **derived** from:

1. **Requirements**: What acceptance criteria does this component satisfy?
2. **Plans**: What tasks and features are implemented on this component?

This approach:
- ✅ Eliminates redundancy (capabilities would duplicate requirement criteria)
- ✅ Maintains single source of truth (requirements define capabilities)
- ✅ Enables automatic capability tracking through traceability
- ✅ Simplifies component specification (fewer fields to maintain)

To understand a component's capabilities, analyze:
- Which requirements trace to this component (requirement → component link)
- Which plan tasks target this component (plan → component link)

## Scope vs Constraints

Components use a **structured `scope` object** instead of a simple constraints array. The `scope` field explicitly defines:

- **In-scope items**: What this component IS responsible for (with reasoning)
- **Out-of-scope items**: What this component IS NOT responsible for (with reasoning)

### Why Structured Scope?

**Traditional constraints approach** (❌ Not used):
```yaml
constraints:
  - Must handle 1000 concurrent requests
  - GDPR compliant
  - Also handles user profiles  # Wait, is this in scope or a constraint?
  - Not responsible for logging  # This is scope, not a constraint!
```

**Structured scope approach** (✅ Used):
```yaml
scope:
  in_scope:
    - item: User authentication
      reasoning: Core responsibility of this service
  out_of_scope:
    - item: User profile management
      reasoning: Belongs to user-service per separation of concerns
```

Benefits:
- ✅ **Clear boundaries**: Explicitly separate in-scope vs out-of-scope
- ✅ **Justified decisions**: Every boundary has documented reasoning
- ✅ **No ambiguity**: "Not responsible for X" is clearly out-of-scope, not a constraint
- ✅ **Better maintainability**: Easy to understand and update boundaries over time
- ✅ **Reduces scope creep**: Explicit out-of-scope items prevent unplanned expansion

**Note**: Quality attributes (performance, security, compliance) should be captured in requirements' acceptance criteria, not in component scope.

## Creation Flow

Components are created using a **simple 9-11 step flow** that captures essential component information.

### Draft State Management

**After each step submission:**
1. The field value is validated
2. The draft is updated and saved to `.specs/.drafts/draft-cmp-{slug}-{timestamp}.draft.yml`
3. The next step is determined by reading the draft state and finding the next empty field
4. Progress can be resumed at any time by continuing with the next empty field

**Automatic finalization:**
- When all required fields are filled (saturated state), the draft is automatically finalized
- The component is created via `operations.createComponent()`
- The draft file is removed from `.specs/.drafts/`
- This ensures drafts are temporary and only active components persist

### Stage 1: Identity & Basics (Steps 1-4)

**Step 1: slug, name, and type**
- **Prompt**: "Provide the slug, name, and type for this component as an object:\n- slug: URL-friendly identifier (lowercase, hyphens only)\n- name: Display name\n- type: Component type (app, service, or library)"
- **Type**: object `{ slug: string, name: string, type: string }`
- **Example**:
  ```json
  {
    "slug": "auth-service",
    "name": "Authentication Service",
    "type": "service"
  }
  ```
- **Validation**:
  - slug: Lowercase, hyphens only, must be unique
  - name: Non-empty, 3-100 characters
  - type: Must be one of: "app", "service", "library"
- **Next**: Draft file created at `.specs/.drafts/draft-cmp-{slug}-{timestamp}.draft.yml`. Now provide a brief description.

**Step 2: description**
- **Prompt**: "Provide a brief summary of this component's purpose and what it does. Keep it concise (1-3 sentences)."
- **Type**: string
- **Example**: "Authentication service that handles user registration, login, and session management. Supports email/password and OAuth authentication methods. Issues and validates JWT tokens for authenticated sessions."
- **Validation**: Non-empty, 20-500 characters
- **Next**: Draft updated with description. Now specify the folder location.

**Step 3: folder**
- **Prompt**: "Specify the relative path from repository root where this component lives."
- **Type**: string
- **Example**: `"services/auth"`
- **Validation**: Non-empty string
- **Next**: Draft updated with folder. Now list the technologies used.

**Step 4: tech_stack**
- **Prompt**: "List the technologies and frameworks used in this component."
- **Type**: string[]
- **Example**: `["Node.js", "Express", "PostgreSQL", "Redis"]`
- **Validation**: Required, must have at least one item
- **Next**: Draft updated with tech stack. Now define scope boundaries.

### Stage 2: Scope & Dependencies (Steps 5-7)

**Step 5: scope**
- **Prompt**: "Define the component's scope boundaries. What is explicitly IN SCOPE and OUT OF SCOPE? For each item, provide reasoning. Provide as an object with two arrays: in_scope and out_of_scope, where each item has 'item' and 'reasoning' fields."
- **Type**: object (ComponentScope)
- **Example**:
  ```json
  {
    "in_scope": [
      {
        "item": "User authentication (email/password, OAuth)",
        "reasoning": "Core responsibility - validating user identity is central to this service"
      },
      {
        "item": "Session token generation and validation",
        "reasoning": "Tightly coupled with authentication flow, requires secure token handling"
      },
      {
        "item": "Password security (hashing, reset flows)",
        "reasoning": "Critical security function that must be centralized"
      },
      {
        "item": "Rate limiting for failed login attempts",
        "reasoning": "Security feature directly related to authentication"
      }
    ],
    "out_of_scope": [
      {
        "item": "User profile management",
        "reasoning": "Belongs to user-service to maintain separation of concerns"
      },
      {
        "item": "Authorization and permissions",
        "reasoning": "Handled by permissions-service to allow independent scaling"
      },
      {
        "item": "Audit logging",
        "reasoning": "Cross-cutting concern handled by logging-service for consistency"
      }
    ]
  }
  ```
- **Validation**:
  - Both in_scope and out_of_scope are required
  - Each must have at least one item
  - Each item must have both 'item' and 'reasoning' fields
- **Next**: Draft updated with scope boundaries. Now list internal dependencies.

**Step 6: depends_on**
- **Prompt**: "List internal component dependencies this component relies on. Provide as an array of component IDs."
- **Type**: ComponentId[]
- **Example**: `["svc-002-user-service", "lib-001-validation"]`
- **Validation**: Can be empty array; component IDs must follow format: `app-XXX-slug`, `svc-XXX-slug`, `lib-XXX-slug`
- **Next**: Draft updated with internal dependencies. Now list external dependencies.

**Step 7: external_dependencies**
- **Prompt**: "List external/third-party dependencies (libraries, services). Provide as an array of strings."
- **Type**: string[]
- **Example**: `["passport", "jsonwebtoken", "bcrypt", "redis"]`
- **Validation**: Can be empty array
- **Next**: Draft updated with external dependencies. Now configure testing setup.

### Stage 3: Testing, Deployment & Type-Specific Fields (Steps 8-11)

**Step 8: testing_setup**
- **Prompt**: "Configure the testing setup for this component. Provide as an object with the following fields:\n- frameworks: Array of testing frameworks (e.g., ['Jest', 'Supertest'])\n- coverage_target: Overall coverage percentage target (default: 90)\n- unit_tests: {location, pattern?, coverage_target?}\n- integration_tests: {location, pattern?, coverage_target?} (optional)\n- e2e_tests: {location, pattern?, coverage_target?} (optional)\n- test_commands: Object mapping test types to commands\n- mocking_strategy: Description of mocking approach (optional)\n- test_patterns: Array of patterns followed (optional)"
- **Type**: object (TestingSetup)
- **Example**:
  ```json
  {
    "frameworks": ["Jest", "Supertest"],
    "coverage_target": 90,
    "unit_tests": {
      "location": "__tests__",
      "pattern": "*.test.ts",
      "coverage_target": 95
    },
    "integration_tests": {
      "location": "__tests__/integration",
      "pattern": "*.integration.test.ts"
    },
    "e2e_tests": {
      "location": "e2e",
      "pattern": "*.e2e.test.ts"
    },
    "test_commands": {
      "unit": "npm test",
      "integration": "npm run test:integration",
      "e2e": "npm run test:e2e",
      "all": "npm run test:all"
    },
    "mocking_strategy": "Use jest.mock() for external dependencies. Test containers for PostgreSQL and Redis in integration/e2e tests.",
    "test_patterns": ["AAA (Arrange-Act-Assert)", "Test Pyramid"]
  }
  ```
- **Validation**:
  - frameworks: Required, at least one framework
  - coverage_target: Number between 0-100
  - At least one test suite (unit_tests, integration_tests, or e2e_tests) should be defined
- **Next**: Draft updated with testing setup. Now configure deployment.

**Step 9: deployment**
- **Prompt**: "Provide deployment configuration as an object:\n- platform: Deployment platform (e.g., 'AWS ECS', 'Vercel', 'Kubernetes')\n- url: Production URL (optional)\n- build_command: Command to build (optional)\n- deploy_command: Command to deploy (optional)\n- environment_vars: Required environment variables\n- secrets: Required secrets\n- notes: Additional deployment notes (optional)"
- **Type**: object (Deployment)
- **Example**:
  ```json
  {
    "platform": "AWS EKS",
    "url": "https://auth.example.com",
    "build_command": "docker build -t auth-service:latest .",
    "deploy_command": "kubectl apply -f k8s/",
    "environment_vars": ["DATABASE_URL", "REDIS_URL", "JWT_SECRET"],
    "secrets": ["DB_PASSWORD", "API_KEY"],
    "notes": "Deployed via ArgoCD. See k8s/ directory for manifests."
  }
  ```
- **Validation**:
  - platform is required
  - environment_vars and secrets can be empty arrays
- **Next**: Draft updated with deployment information. Now add type-specific fields.

**Steps 10-11: Type-specific fields (conditional based on component type)**

The final steps depend on the component type specified in Step 1.

**For service components (Step 10 only):**

**Step 10: dev_port (optional)**
- **Prompt**: "What local development port does this service use? Leave empty to skip."
- **Type**: number (1-65535) or empty
- **Example**: `3001`
- **Validation**: If provided, must be between 1 and 65535
- **Next**: All required fields complete! Finalizing component...

**For library components (Step 10 only):**

**Step 10: package_name (optional)**
- **Prompt**: "What is the package name? (e.g., @company/ui-components) Leave empty to skip."
- **Type**: string or empty
- **Example**: `"@mycompany/auth-lib"`
- **Validation**: If provided, must be non-empty
- **Next**: All required fields complete! Finalizing component...

**For app components (Steps 10-11):**

**Step 10: deployment_targets**
- **Prompt**: "What are the deployment targets? Provide as an array."
- **Type**: string[]
- **Example**: `["web", "ios", "android"]`
- **Validation**: Each must be one of: ios, android, web, desktop, api
- **Next**: Draft updated with deployment targets. Now specify environments.

**Step 11: environments**
- **Prompt**: "What environments does this app support?"
- **Type**: string[]
- **Example**: `["development", "staging", "production"]`
- **Validation**: Each must be one of: development, staging, production
- **Next**: All required fields complete! Finalizing component...

### Finalization (Automatic)

Once all required fields are provided:

1. **Auto-assign number**: Next available sequential number based on type
2. **Auto-generate timestamps**: created_at, updated_at
3. **Create the component** via `operations.createComponent()`
4. **Delete the draft**
5. **Return success** with the full component spec

### Total Steps Calculation

```
Base steps: 9
+ For service: 1 (dev_port - optional)
+ For library: 1 (package_name - optional)
+ For app: 2 (deployment_targets, environments)

Total: 9-11 steps depending on component type
```

## Example Component

```yaml
type: service
number: 1
slug: auth-service
name: Authentication Service
description: Authentication service that handles user registration, login, and session management. Supports email/password and OAuth authentication methods. Issues and validates JWT tokens for authenticated sessions.
folder: services/auth
tech_stack:
  - Node.js
  - Express
  - PostgreSQL
  - Redis
testing_setup:
  frameworks:
    - Jest
    - Supertest
  coverage_target: 90
  unit_tests:
    location: __tests__
    pattern: "*.test.ts"
    coverage_target: 95
  integration_tests:
    location: __tests__/integration
    pattern: "*.integration.test.ts"
  e2e_tests:
    location: e2e
    pattern: "*.e2e.test.ts"
  test_commands:
    unit: npm test
    integration: npm run test:integration
    e2e: npm run test:e2e
    all: npm run test:all
  mocking_strategy: Use jest.mock() for external dependencies. Test containers for PostgreSQL and Redis in integration/e2e tests.
  test_patterns:
    - AAA (Arrange-Act-Assert)
    - Test Pyramid
deployment:
  platform: AWS EKS
  url: https://auth.example.com
  build_command: docker build -t auth-service:latest .
  deploy_command: kubectl apply -f k8s/
  environment_vars:
    - DATABASE_URL
    - REDIS_URL
    - JWT_SECRET
  secrets:
    - DB_PASSWORD
    - API_KEY
  notes: Deployed via ArgoCD. See k8s/ directory for manifests.
scope:
  in_scope:
    - item: User authentication (email/password, OAuth)
      reasoning: Core responsibility - validating user identity is central to this service
    - item: Session token generation and validation
      reasoning: Tightly coupled with authentication flow, requires secure token handling
    - item: Password security (hashing, reset flows)
      reasoning: Critical security function that must be centralized
    - item: Rate limiting for failed login attempts
      reasoning: Security feature directly related to authentication
  out_of_scope:
    - item: User profile management
      reasoning: Belongs to user-service to maintain separation of concerns
    - item: Authorization and permissions
      reasoning: Handled by permissions-service to allow independent scaling
    - item: Audit logging
      reasoning: Cross-cutting concern handled by logging-service for consistency
depends_on:
  - svc-002-user-service
external_dependencies:
  - passport
  - jsonwebtoken
  - bcrypt
  - redis
dev_port: 3001
created_at: "2025-01-15T10:00:00Z"
updated_at: "2025-01-15T10:00:00Z"
```

## Relationship to Other Specs

Components define **system architecture** and relate to other specs through dependencies and traceability:

```
Constitution (con-001)
    ↓ principles guide
Requirement (req-001)
    ↓ informs need for
Component (svc-001) ← YOU ARE HERE
    ↓ depends on
Component (svc-002) ← depends_on references
    ↓ implemented by
Plan (pln-001) ← references components in tasks/test cases

Decision (dec-001)
    ↓ affects
Component (svc-001) ← affects_components references
```

### Incoming References

**Other Components** depend on this component via `depends_on`:
- Creates explicit dependency relationships
- Format: `depends_on: ["svc-001-auth-service"]`
- Enables dependency graph analysis

**Decisions** reference components via `affects_components`:
- Documents which components are impacted by architectural decisions
- Format: `affects_components: ["svc-001-auth-service"]`
- Provides context for design choices

**Plans** reference components in tasks and test cases:
- Tasks specify which components they implement
- Test cases specify which components they test
- Enables coverage tracking

### Outgoing References

**Components** reference other components via `depends_on`:
- Lists internal component dependencies
- Must follow valid component ID format
- Creates explicit dependency graph

**Requirements** (informal) via `description`:
- Components explain which requirements they satisfy
- No formal FK field, but strong convention
- Enables traceability analysis

**External Dependencies** via `external_dependencies`:
- Third-party libraries and services
- Not formal references within the spec system
- Useful for dependency auditing

## Best Practices

1. **Create After Requirements** - Components implement requirements, so define requirements first
2. **Create Before Plans** - Components define structure before implementation planning
3. **Single Responsibility** - Each component should have one clear purpose
4. **Clear Boundaries** - Use the `scope` field to explicitly define in-scope and out-of-scope items
5. **Explicit Scope Reasoning** - Always provide clear reasoning for both in-scope and out-of-scope items to justify boundaries
6. **Explicit Dependencies** - Always list component dependencies in `depends_on`
7. **Brief Description** - Keep description concise (1-3 sentences); use `scope` for boundaries
8. **Respect Decisions** - Component design should align with documented decisions
9. **Avoid Circular Dependencies** - Keep `depends_on` graph acyclic
10. **Capabilities from Requirements & Plans** - Component capabilities are derived from requirements it satisfies and plans that implement it, not stored separately
11. **Comprehensive Testing Setup** - Define all test types, coverage targets, and commands to ensure testability
12. **Type First** - Component type (app/service/library) should be known early as it affects other decisions
