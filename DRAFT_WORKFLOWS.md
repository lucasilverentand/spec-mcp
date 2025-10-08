# Draft Workflows - Complete Flow Charts

## Overview

This document contains detailed Mermaid flow charts for all entity type draft workflows.

---

## 1. Plan Draft Workflow (Two-Phase)

```mermaid
flowchart TD
    Start([Create Plan Draft]) --> Q1{Q1: Main Goal?}
    Q1 -->|Answer| Q2{Q2: Requirement/Criteria?<br/>format: req-XXX/crit-XXX}
    Q2 -->|Answer| Q3{Q3: In Scope?}
    Q3 -->|Answer| Q4{Q4: Out of Scope?}
    Q4 -->|Answer| Q5{Q5: List Tasks?<br/>one per line}

    Q5 -->|Empty List| Error1[Error: At least<br/>one task required]
    Error1 --> Q5

    Q5 -->|Task List| Parse[Parse Task Titles<br/>Store in taskTitles array]
    Parse --> Phase2Start[Start Phase 2:<br/>Task Q&A]

    Phase2Start --> TaskLoop{More tasks?}
    TaskLoop -->|Yes| T1{Task N/M: Title<br/>Provide Description}
    T1 -->|Answer| T2{Task N/M: Title<br/>Acceptance Criteria?}
    T2 -->|Answer| StoreTask[Store task with<br/>temp-task-XXX ID]
    StoreTask --> IncrementTask[Increment<br/>currentTaskIndex]
    IncrementTask --> TaskLoop

    TaskLoop -->|No, All Done| Complete[Draft Complete]
    Complete --> Finalize[Call create_plan]
    Finalize --> Convert[Convert temp IDs<br/>to task-001, task-002, etc.]
    Convert --> CreatePlan[Create Plan Entity]
    CreatePlan --> DeleteDraft[Delete Draft File]
    DeleteDraft --> End([Plan Created])

    style Start fill:#90EE90
    style End fill:#90EE90
    style Phase2Start fill:#FFD700
    style Complete fill:#87CEEB
    style Error1 fill:#FF6B6B
```

---

## 2. Requirement Draft Workflow (Simple Linear)

```mermaid
flowchart TD
    Start([Create Requirement Draft]) --> Q1{Q1: Main Purpose?}
    Q1 -->|Answer| Q2{Q2: Acceptance Criteria?<br/>one per line}
    Q2 -->|Answer| Q3{Q3: Priority Level?<br/>critical/high/medium/low}
    Q3 -->|Answer| Complete[Draft Complete]

    Complete --> Finalize[Call create_requirement]
    Finalize --> ParseCriteria[Parse criteria lines<br/>into crit-001, crit-002, etc.]
    ParseCriteria --> CreateReq[Create Requirement Entity]
    CreateReq --> DeleteDraft[Delete Draft File]
    DeleteDraft --> End([Requirement Created])

    style Start fill:#90EE90
    style End fill:#90EE90
    style Complete fill:#87CEEB
```

---

## 3. Component Draft Workflow (Simple Linear)

```mermaid
flowchart TD
    Start([Create Component Draft]) --> Q1{Q1: Purpose?}
    Q1 -->|Answer| Q2{Q2: Component Type?<br/>app/service/library}
    Q2 -->|Answer| Q3{Q3: Folder Path?}
    Q3 -->|Answer| Q4{Q4: Technologies?<br/>comma-separated}
    Q4 -->|Answer| Complete[Draft Complete]

    Complete --> Finalize[Call create_component]
    Finalize --> ParseType[Parse component type<br/>default: service]
    ParseType --> ParseTech[Parse tech stack<br/>split by comma]
    ParseTech --> CreateComp[Create Component Entity]
    CreateComp --> DeleteDraft[Delete Draft File]
    DeleteDraft --> End([Component Created])

    style Start fill:#90EE90
    style End fill:#90EE90
    style Complete fill:#87CEEB
```

---

## 4. Constitution Draft Workflow (Simple Linear)

```mermaid
flowchart TD
    Start([Create Constitution Draft]) --> Q1{Q1: Purpose?}
    Q1 -->|Answer| Q2{Q2: Core Articles?<br/>one per line<br/>format: Title: Principle}
    Q2 -->|Answer| Complete[Draft Complete]

    Complete --> Finalize[Call create_constitution]
    Finalize --> ParseArticles[Parse articles<br/>split by colon<br/>generate art-001, art-002, etc.]
    ParseArticles --> AddDefaults[Add default fields:<br/>rationale, examples,<br/>exceptions, status]
    AddDefaults --> CreateConst[Create Constitution Entity]
    CreateConst --> DeleteDraft[Delete Draft File]
    DeleteDraft --> End([Constitution Created])

    style Start fill:#90EE90
    style End fill:#90EE90
    style Complete fill:#87CEEB
```

---

## 5. Decision Draft Workflow (Simple Linear)

```mermaid
flowchart TD
    Start([Create Decision Draft]) --> Q1{Q1: What Decision?}
    Q1 -->|Answer| Q2{Q2: Context/Problem?}
    Q2 -->|Answer| Q3{Q3: Alternatives?<br/>comma-separated, optional}
    Q3 -->|Answer| Q4{Q4: Status?<br/>proposed/accepted/<br/>deprecated/superseded}
    Q4 -->|Answer| Complete[Draft Complete]

    Complete --> Finalize[Call create_decision]
    Finalize --> ParseAlts[Parse alternatives<br/>split by comma]
    ParseAlts --> ParseStatus[Parse status<br/>default: proposed]
    ParseStatus --> CreateDec[Create Decision Entity]
    CreateDec --> DeleteDraft[Delete Draft File]
    DeleteDraft --> End([Decision Created])

    style Start fill:#90EE90
    style End fill:#90EE90
    style Complete fill:#87CEEB
```

---

## Combined Overview: All Entity Types

```mermaid
flowchart TD
    Start([User Creates Draft]) --> ChooseType{Choose Entity Type}

    ChooseType -->|plan| PlanFlow[Plan Workflow<br/>2 Phases: Main + Tasks]
    ChooseType -->|requirement| ReqFlow[Requirement Workflow<br/>3 Questions]
    ChooseType -->|component| CompFlow[Component Workflow<br/>4 Questions]
    ChooseType -->|constitution| ConstFlow[Constitution Workflow<br/>2 Questions]
    ChooseType -->|decision| DecFlow[Decision Workflow<br/>4 Questions]

    PlanFlow --> PlanQ[Phase 1: 5 questions<br/>Phase 2: N tasks × 2 questions]
    ReqFlow --> ReqQ[Purpose → Criteria → Priority]
    CompFlow --> CompQ[Purpose → Type → Folder → Tech]
    ConstFlow --> ConstQ[Purpose → Articles]
    DecFlow --> DecQ[Decision → Context → Alts → Status]

    PlanQ --> PlanComplete{All Tasks<br/>Detailed?}
    ReqQ --> ReqComplete{All Questions<br/>Answered?}
    CompQ --> CompComplete{All Questions<br/>Answered?}
    ConstQ --> ConstComplete{All Questions<br/>Answered?}
    DecQ --> DecComplete{All Questions<br/>Answered?}

    PlanComplete -->|No| PlanQ
    ReqComplete -->|No| ReqQ
    CompComplete -->|No| CompQ
    ConstComplete -->|No| ConstQ
    DecComplete -->|No| DecQ

    PlanComplete -->|Yes| CreatePlan[create_plan]
    ReqComplete -->|Yes| CreateReq[create_requirement]
    CompComplete -->|Yes| CreateComp[create_component]
    ConstComplete -->|Yes| CreateConst[create_constitution]
    DecComplete -->|Yes| CreateDec[create_decision]

    CreatePlan --> EntityCreated[Entity Created & Saved]
    CreateReq --> EntityCreated
    CreateComp --> EntityCreated
    CreateConst --> EntityCreated
    CreateDec --> EntityCreated

    EntityCreated --> Cleanup[Draft File Deleted]
    Cleanup --> End([Complete])

    style Start fill:#90EE90
    style End fill:#90EE90
    style PlanFlow fill:#FFD700
    style ReqFlow fill:#87CEEB
    style CompFlow fill:#DDA0DD
    style ConstFlow fill:#F0E68C
    style DecFlow fill:#98FB98
```

---

## Detailed Question Reference

### Plan (2-Phase Workflow)

**Phase 1: Main Questions (5)**
| # | Question | Format | Example |
|---|----------|--------|---------|
| 1 | What is the main goal of this plan? | Free text | "Implement user authentication" |
| 2 | Which requirement and criteria does this plan fulfill? | `req-XXX-slug/crit-XXX` | "req-001-user-auth/crit-001" |
| 3 | What is in scope for this plan? | Free text | "Login, registration, password reset" |
| 4 | What is explicitly out of scope? | Free text | "OAuth, social login" |
| 5 | List the tasks you want to add | One per line | "Login form\nPassword hashing\nSession management" |

**Phase 2: Task Questions (2 per task)**
| # | Question | Format | Example |
|---|----------|--------|---------|
| 1 | Task N/M: "Title" - Provide a detailed description | Free text | "Build a React login form with email and password fields" |
| 2 | Task N/M: "Title" - What are the acceptance criteria? | Free text | "Form validates email format, shows error messages" |

---

### Requirement (Linear Workflow)

| # | Question | Format | Example |
|---|----------|--------|---------|
| 1 | What is the main purpose of this requirement? | Free text | "Allow users to log in securely" |
| 2 | What are the acceptance criteria? | One per line | "User can login\nPassword is hashed\nSession expires" |
| 3 | What is the priority level? | critical/high/medium/low/nice-to-have | "high" |

---

### Component (Linear Workflow)

| # | Question | Format | Example |
|---|----------|--------|---------|
| 1 | What is the purpose of this component? | Free text | "Authentication service for user login" |
| 2 | What type of component is this? | app/service/library | "service" |
| 3 | What is the folder path for this component? | Path | "packages/auth" |
| 4 | What technologies does this component use? | Comma-separated | "Node.js, Express, Passport, JWT" |

---

### Constitution (Linear Workflow)

| # | Question | Format | Example |
|---|----------|--------|---------|
| 1 | What is the purpose of this constitution? | Free text | "Define code quality standards" |
| 2 | What are the core articles/principles? | One per line: `Title: Principle` | "Code Review: All PRs require review\nTesting: 80% coverage minimum" |

---

### Decision (Linear Workflow)

| # | Question | Format | Example |
|---|----------|--------|---------|
| 1 | What decision is being made? | Free text | "Use PostgreSQL for database" |
| 2 | What is the context or problem that prompted this decision? | Free text | "Need reliable relational database with good scaling" |
| 3 | What alternatives were considered? | Comma-separated | "MongoDB, MySQL, SQLite" |
| 4 | What is the status? | proposed/accepted/deprecated/superseded | "accepted" |

---

## State Machine Diagram

```mermaid
stateDiagram-v2
    [*] --> DraftCreated: create_draft(type, name)

    DraftCreated --> AnsweringQuestions: First question returned

    AnsweringQuestions --> AnsweringQuestions: submit_draft_answer<br/>(more questions)

    AnsweringQuestions --> TaskCollection: submit_draft_answer<br/>(Plan: task list provided)

    TaskCollection --> TaskCollection: submit_draft_answer<br/>(more tasks to detail)

    AnsweringQuestions --> DraftComplete: submit_draft_answer<br/>(last question answered)

    TaskCollection --> DraftComplete: submit_draft_answer<br/>(last task detailed)

    DraftComplete --> EntityCreated: create_<entity>(draft_id)

    EntityCreated --> [*]: Draft deleted,<br/>Entity saved

    note right of AnsweringQuestions
        Simple entities:
        - Requirement
        - Component
        - Constitution
        - Decision
    end note

    note right of TaskCollection
        Complex entities:
        - Plan (Phase 2)
        - Future: Requirements with
          detailed criteria, etc.
    end note
```

---

## Draft File Structure Examples

### Plan Draft (During Phase 2)

```yaml
id: draft-001
type: plan
name: Sprint 1 Authentication
slug: sprint-1-authentication
questions:
  - question: What is the main goal of this plan?
    answer: Implement user authentication
  - question: Which requirement and criteria does this plan fulfill?
    answer: req-001-user-auth/crit-001
  - question: What is in scope for this plan?
    answer: Login, registration, password reset
  - question: What is explicitly out of scope?
    answer: OAuth, social login
  - question: List the tasks you want to add
    answer: |
      Login form
      Password hashing
      Session management
currentQuestionIndex: 5
tasks:
  - id: temp-task-001
    title: Login form
    description: Build a React login form with email and password fields
    acceptance_criteria: Form validates email format, shows error messages
  - id: temp-task-002
    title: Password hashing
    description: Use bcrypt to hash passwords before storage
    acceptance_criteria: null  # Currently being asked
taskTitles:
  - Login form
  - Password hashing
  - Session management
currentTaskIndex: 1
created_at: '2025-10-09T12:00:00Z'
```

### Requirement Draft (Simple)

```yaml
id: draft-002
type: requirement
name: User Authentication
slug: user-authentication
questions:
  - question: What is the main purpose of this requirement?
    answer: Allow users to log in securely
  - question: What are the acceptance criteria?
    answer: |
      User can login with email/password
      Password is hashed with bcrypt
      Session expires after 24 hours
  - question: What is the priority level?
    answer: high
currentQuestionIndex: 3
created_at: '2025-10-09T12:00:00Z'
```

---

## Workflow Comparison Table

| Entity Type | Total Questions | Phases | Collections | Complexity |
|-------------|----------------|--------|-------------|------------|
| **Plan** | 5 + (N tasks × 2) | 2 | tasks, taskTitles | High |
| **Requirement** | 3 | 1 | - | Low |
| **Component** | 4 | 1 | - | Low |
| **Constitution** | 2 | 1 | - | Low |
| **Decision** | 4 | 1 | - | Low |

---

## Error Handling Flows

```mermaid
flowchart TD
    Submit[submit_draft_answer] --> CheckExists{Draft Exists?}
    CheckExists -->|No| Error1[Error: Draft not found]
    CheckExists -->|Yes| CheckType{Correct Type?}
    CheckType -->|No| Error2[Error: Type mismatch]
    CheckType -->|Yes| CheckIndex{Valid Question<br/>Index?}
    CheckIndex -->|No| Error3[Error: All questions<br/>answered]
    CheckIndex -->|Yes| CheckAnswer{Answer Valid?}
    CheckAnswer -->|Empty| Error4[Error: Answer required]
    CheckAnswer -->|Invalid Format| Error5[Error: Invalid format]
    CheckAnswer -->|Valid| UpdateDraft[Update Draft]
    UpdateDraft --> SaveFile[Save to File]
    SaveFile --> ReturnNext[Return Next Question<br/>or Completion]

    Error1 --> End([Return Error])
    Error2 --> End
    Error3 --> End
    Error4 --> End
    Error5 --> End
    ReturnNext --> Success([Success])

    style Error1 fill:#FF6B6B
    style Error2 fill:#FF6B6B
    style Error3 fill:#FF6B6B
    style Error4 fill:#FF6B6B
    style Error5 fill:#FF6B6B
    style Success fill:#90EE90
```

---

## Implementation Architecture

```mermaid
classDiagram
    class BaseDraftManager {
        <<abstract>>
        #fileManager: FileManager
        #draftsFolder: string
        #entityType: EntityType
        +getDraft(draftId) Draft
        +deleteDraft(draftId) void
        +listDrafts() string[]
        #getDraftFilePath(draftId) string
        #getNextDraftId() string
        #saveDraft(draft) void
        +createDraft(name, description)* CreateDraftResult
        +submitAnswer(draftId, answer)* SubmitAnswerResult
        +isComplete(draftId)* boolean
        +createFromDraft(draftId)* Entity
    }

    class PlanDraftManager {
        #entityType: "plan"
        +createDraft(name, description) CreateDraftResult
        +submitAnswer(draftId, answer) SubmitAnswerResult
        +isComplete(draftId) boolean
        +createFromDraft(draftId) Plan
        -handlePhase1(draft, answer) SubmitAnswerResult
        -handlePhase2(draft, answer) SubmitAnswerResult
    }

    class RequirementDraftManager {
        #entityType: "requirement"
        +createDraft(name, description) CreateDraftResult
        +submitAnswer(draftId, answer) SubmitAnswerResult
        +isComplete(draftId) boolean
        +createFromDraft(draftId) Requirement
    }

    class ComponentDraftManager {
        #entityType: "component"
        +createDraft(name, description) CreateDraftResult
        +submitAnswer(draftId, answer) SubmitAnswerResult
        +isComplete(draftId) boolean
        +createFromDraft(draftId) Component
    }

    class ConstitutionDraftManager {
        #entityType: "constitution"
        +createDraft(name, description) CreateDraftResult
        +submitAnswer(draftId, answer) SubmitAnswerResult
        +isComplete(draftId) boolean
        +createFromDraft(draftId) Constitution
    }

    class DecisionDraftManager {
        #entityType: "decision"
        +createDraft(name, description) CreateDraftResult
        +submitAnswer(draftId, answer) SubmitAnswerResult
        +isComplete(draftId) boolean
        +createFromDraft(draftId) Decision
    }

    BaseDraftManager <|-- PlanDraftManager
    BaseDraftManager <|-- RequirementDraftManager
    BaseDraftManager <|-- ComponentDraftManager
    BaseDraftManager <|-- ConstitutionDraftManager
    BaseDraftManager <|-- DecisionDraftManager

    class Draft {
        <<union>>
        +id: string
        +type: EntityType
        +name: string
        +slug: string
        +questions: DraftQuestion[]
        +currentQuestionIndex: number
        +created_at: string
    }

    class PlanDraft {
        +type: "plan"
        +tasks: DraftTask[]
        +taskTitles: string[]
        +currentTaskIndex: number
    }

    class DraftTask {
        +id: string
        +title: string
        +description: string
        +acceptance_criteria: string?
    }

    Draft <|-- PlanDraft
    PlanDraft *-- DraftTask
```

---

## MCP Tool Call Sequences

### Create a Plan (Complete Example)

```mermaid
sequenceDiagram
    participant User
    participant MCP as MCP Server
    participant DM as PlanDraftManager
    participant FM as FileManager

    User->>MCP: create_draft("plan", "Sprint 1 Auth")
    MCP->>DM: createDraft("Sprint 1 Auth", null)
    DM->>DM: getNextDraftId() → "draft-001"
    DM->>DM: Generate 5 questions
    DM->>FM: writeYaml(".drafts/draft-001.yaml", draft)
    FM-->>DM: Success
    DM-->>MCP: {draftId: "draft-001", firstQuestion: "Main goal?"}
    MCP-->>User: Draft created, Q1: Main goal?

    User->>MCP: submit_draft_answer("draft-001", "Implement auth")
    MCP->>DM: submitAnswer("draft-001", "Implement auth")
    DM->>FM: readYaml(".drafts/draft-001.yaml")
    FM-->>DM: draft
    DM->>DM: Update Q1 answer, increment index
    DM->>FM: writeYaml(".drafts/draft-001.yaml", draft)
    DM-->>MCP: {completed: false, nextQuestion: "Requirement?"}
    MCP-->>User: Q2: Requirement?

    Note over User,FM: ... continues through Q2, Q3, Q4 ...

    User->>MCP: submit_draft_answer("draft-001", "Login\nHash password")
    MCP->>DM: submitAnswer("draft-001", "Login\nHash password")
    DM->>DM: Parse task titles → ["Login", "Hash password"]
    DM->>DM: Transition to Phase 2
    DM->>FM: writeYaml(".drafts/draft-001.yaml", draft)
    DM-->>MCP: {completed: false, nextQuestion: "Task 1/2: Login - Description?"}
    MCP-->>User: Task 1/2: Login - Description?

    User->>MCP: submit_draft_answer("draft-001", "Build login form")
    MCP->>DM: submitAnswer("draft-001", "Build login form")
    DM->>DM: Create temp-task-001
    DM->>FM: writeYaml(".drafts/draft-001.yaml", draft)
    DM-->>MCP: {completed: false, nextQuestion: "Task 1/2: Login - Criteria?"}
    MCP-->>User: Task 1/2: Login - Criteria?

    Note over User,FM: ... continues for all tasks ...

    User->>MCP: submit_draft_answer("draft-001", "Hashes with bcrypt")
    MCP->>DM: submitAnswer("draft-001", "Hashes with bcrypt")
    DM->>DM: Complete last task
    DM->>FM: writeYaml(".drafts/draft-001.yaml", draft)
    DM-->>MCP: {completed: true}
    MCP-->>User: All questions complete! Call create_plan

    User->>MCP: create_plan("draft-001")
    MCP->>DM: createFromDraft("draft-001")
    DM->>FM: readYaml(".drafts/draft-001.yaml")
    FM-->>DM: draft
    DM->>DM: isComplete() → true
    DM->>DM: Convert temp-task-001 → task-001
    DM->>DM: Build plan entity
    DM-->>MCP: plan entity
    MCP->>FM: writeYaml("plans/pln-001-sprint-1-auth.yaml", plan)
    MCP->>DM: deleteDraft("draft-001")
    DM->>FM: delete(".drafts/draft-001.yaml")
    MCP-->>User: Plan created: pln-001-sprint-1-auth
```

---

This comprehensive documentation provides complete visibility into all draft workflows and their implementation details.
