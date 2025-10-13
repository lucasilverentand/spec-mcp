# Component Interview Process

This document describes the interview process for creating a Component entity.

## Overview

A Component entity represents a deployable unit of code such as an application, service, or library. It includes deployment configurations, tech stack, and dependencies.

## Interview Stages

### Stage 1: Main Questions

These questions gather the core information about the component:

#### Q-001: Name
**Question:** What is the name of this component?

**Example Answer:** "User Authentication Service"

---

#### Q-002: Description
**Question:** Provide a detailed description of this component.

**Example Answer:** "A microservice responsible for handling user authentication, registration, and session management. Exposes REST APIs for login, logout, token refresh, and user profile management."

---

#### Q-003: Component Type
**Question:** What type of component is this? (app, service, library)

**Example Answer:** "service"

---

#### Q-004: Folder Path
**Question:** What is the relative folder path from the repository root? (default: .)

**Example Answer:** "services/auth-service"

---

#### Q-005: Dev Port
**Question:** What is the dev server port? (optional)

**Example Answer:** "3001"

---

#### Q-006: Notes
**Question:** Any additional notes about this component? (optional)

**Example Answer:** "This service requires Redis for session storage and PostgreSQL for user data"

---

### Stage 2: Array Fields

After answering the main questions, you'll be asked about collection fields.

#### Deployments Collection

**Collection Question:** List the deployment environments (comma-separated, e.g., 'production', 'staging', 'development')

**Example Answer:** "Production, Staging"

For each deployment listed, you'll answer:

1. **What platform is this deployed to? (e.g., AWS ECS, Vercel, Railway)**
   - Example: "AWS ECS"

2. **What is the production URL or endpoint? (optional)**
   - Example: "https://auth.myapp.com"

3. **What is the build command? (optional)**
   - Example: "npm run build"

4. **What is the deploy command? (optional)**
   - Example: "npm run deploy"

5. **List required environment variables (comma-separated, optional)**
   - Example: "DATABASE_URL, REDIS_URL, JWT_SECRET, API_BASE_URL"

6. **List required secrets (comma-separated, optional)**
   - Example: "JWT_SECRET, DATABASE_PASSWORD, REDIS_PASSWORD"

7. **Any additional deployment notes? (optional)**
   - Example: "Requires VPC configuration for database access. Health check endpoint is /health"

---

### Stage 3: Finalization

After all questions are answered and all array items are finalized, the system will generate the complete Component entity with:
- Computed fields (type, number, slug)
- Status tracking (created_at, updated_at, completed, verified)
- Tech stack information
- Dependency information
- Scope definition
- All provided data structured according to the Component schema

## Tips

1. **Folder Path**: Use relative paths from repository root (e.g., "packages/api" not "/packages/api")
2. **Port Numbers**: Use the standard development port for the service
3. **Platform Names**: Be specific (e.g., "AWS ECS" not just "AWS")
4. **Environment Variables**: List all required vars, not just secrets
5. **Optional Fields**: It's okay to leave optional fields blank
6. **Deployments**: You can have multiple deployments for different environments
