# Plan Interview Process

This document describes the interview process for creating a Plan entity.

## Overview

A Plan entity represents a technical implementation plan for a requirement. It includes tasks, flows, test cases, API contracts, and data models.

## Interview Stages

### Stage 1: Main Questions

These questions gather the core information about the plan:

#### Q-001: Title
**Question:** What is the title of this plan?

**Example Answer:** "Implement User Authentication System"

---

#### Q-002: Description
**Question:** Provide a detailed description of this plan.

**Example Answer:** "This plan covers the implementation of a complete user authentication system including registration, login, password reset, and session management. It will integrate with our existing user database and provide JWT-based authentication tokens."

---

#### Q-003: Requirement ID
**Question:** What requirement ID does this fulfill? (format: brd-XXX-slug or prd-XXX-slug)

**Example Answer:** "brd-001-user-authentication"

---

#### Q-004: Criteria ID
**Question:** What criteria ID does this fulfill? (format: crit-XXX)

**Example Answer:** "crit-001"

---

### Stage 2: Array Fields

After answering the main questions, you'll be asked about collection fields. For each collection, you first list the items, then answer questions for each item.

#### Tasks Collection

**Collection Question:** List the tasks (comma-separated descriptions, e.g., 'implement authentication', 'write unit tests')

**Example Answer:** "Setup authentication middleware, Create user login endpoint, Implement password hashing, Add JWT token generation"

For each task listed, you'll answer:

1. **Describe this task in detail**
   - Example: "Create Express middleware that validates JWT tokens and attaches user information to the request object"

2. **What is the priority? (low, medium, high, critical)**
   - Example: "high"

3. **List task IDs this depends on (comma-separated, e.g., 'task-001,task-002', or leave blank)**
   - Example: "task-001" or leave blank if no dependencies

4. **What should be considered while performing this task? (comma-separated, optional)**
   - Example: "Security best practices, Token expiration handling, Error responses"

5. **What is the status? (pending, in-progress, completed, blocked)**
   - Example: "pending"

---

#### Flows Collection

**Collection Question:** List the flows (comma-separated names, e.g., 'user login flow', 'payment processing flow')

**Example Answer:** "User login flow, Password reset flow, Token refresh flow"

For each flow listed, you'll answer:

1. **What type of flow is this? (user, system, data)**
   - Example: "user"

2. **What is the name of this flow?**
   - Example: "User login flow"

3. **Describe the purpose of this flow (optional)**
   - Example: "Allows users to authenticate and receive access tokens"

4. **Describe the steps in this flow (comma-separated)**
   - Example: "User enters credentials, System validates credentials, System generates JWT token, User receives token and user data"

---

#### Test Cases Collection

**Collection Question:** List the test cases (comma-separated names, e.g., 'valid login', 'invalid password', 'session timeout')

**Example Answer:** "Valid login with correct credentials, Invalid password attempt, Expired token handling"

For each test case listed, you'll answer:

1. **What is the name of this test case?**
   - Example: "Valid login with correct credentials"

2. **Describe what this test case covers**
   - Example: "Verifies that users can successfully log in with correct email and password"

3. **List the steps to execute this test (comma-separated)**
   - Example: "Create test user, Send POST request to /auth/login with valid credentials, Verify response status is 200, Verify JWT token is returned, Verify user data is included"

4. **What is the expected result?**
   - Example: "User receives a valid JWT token and their user profile data"

---

#### API Contracts Collection

**Collection Question:** List the API contracts (comma-separated names, e.g., 'POST /auth/login', 'GET /users/:id')

**Example Answer:** "POST /auth/login, POST /auth/register, POST /auth/refresh-token"

For each API contract listed, you'll answer:

1. **What is the name of this API?**
   - Example: "POST /auth/login"

2. **Describe what this API does**
   - Example: "Authenticates a user and returns a JWT token"

3. **What type of contract is this? (rest, graphql, grpc, library, cli, websocket, etc.)**
   - Example: "rest"

4. **Provide the API specification (OpenAPI, GraphQL schema, TypeScript definitions, etc.)**
   - Example:
     ```json
     {
       "endpoint": "/auth/login",
       "method": "POST",
       "body": {
         "email": "string",
         "password": "string"
       },
       "response": {
         "token": "string",
         "user": {
           "id": "string",
           "email": "string",
           "name": "string"
         }
       }
     }
     ```

---

#### Data Models Collection

**Collection Question:** List the data models (comma-separated names, e.g., 'User', 'Post', 'Comment')

**Example Answer:** "User, AuthToken, RefreshToken"

For each data model listed, you'll answer:

1. **What is the name of this data model?**
   - Example: "User"

2. **Describe what this data model represents**
   - Example: "Represents a user account in the system"

3. **What format/notation is used? (json-schema, sql, typescript, protobuf, etc.)**
   - Example: "typescript"

4. **Provide the actual model definition/schema**
   - Example:
     ```typescript
     interface User {
       id: string;
       email: string;
       password_hash: string;
       name: string;
       created_at: Date;
       updated_at: Date;
     }
     ```

---

### Stage 3: Finalization

After all questions are answered and all array items are finalized, the system will generate the complete Plan entity with:
- Computed fields (type, number, slug)
- Status tracking (created_at, updated_at, completed, verified)
- All provided data structured according to the Plan schema

## Tips

1. **Be Specific**: Provide detailed, actionable information
2. **Use Consistent IDs**: When referencing other entities, use the correct ID format
3. **Optional Fields**: It's okay to leave optional fields blank or answer with "none"
4. **Comma Separation**: When listing multiple items, separate them with commas
5. **Array Fields**: You can skip array fields by providing an empty answer if they're optional
