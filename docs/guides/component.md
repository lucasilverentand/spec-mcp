# Component Guide

**Goal**: Understand when and how to use Components to define system architecture.

## What is a Component?

A Component represents a structural building block of your system - an application, service, or library. It documents what the component does, its technology stack, deployment configuration, and dependencies.

## When to Use a Component

✅ **Use a Component for:**
- Applications (web, mobile, desktop)
- Backend services and APIs
- Shared libraries or packages
- Databases or infrastructure components
- Major architectural building blocks

❌ **Don't use a Component for:**
- Small utility functions
- Individual features (use Plan instead)
- Temporary scripts
- Test fixtures

## Key Components

### Required Fields
- **Component Type**: app, service, or library
- **Description**: What this component does
- **Scope**: What's in and out of scope

### Optional But Valuable
- **Tech Stack**: Technologies and frameworks used
- **Deployments**: Where and how it's deployed
- **External Dependencies**: Third-party services
- **Folder**: Location in monorepo
- **Dev Port**: Development server port

## Common Patterns

### Web Application Component
```yaml
title: Web Application
description: |
  React-based web application providing the primary user interface.
  Handles user authentication, dashboard, and settings.
component_type: app
folder: apps/web-app
dev_port: 3000
scope:
  in_scope:
    - User dashboard and profile pages
    - Authentication UI
    - Real-time notifications
  out_of_scope:
    - Admin panel (separate component)
    - Mobile app (native)
depends_on:
  - cmp-002-api-service
  - cmp-003-auth-service
tech_stack:
  - React 18.2
  - TypeScript 5.3
  - Vite 5.0
  - TailwindCSS 3.4
  - React Query 5
deployments:
  - platform: Vercel
    url: https://app.example.com
    build_command: pnpm build
    environment_vars:
      - VITE_API_URL
      - VITE_AUTH_DOMAIN
    secrets:
      - SENTRY_DSN
external_dependencies:
  - Auth0 for user authentication
  - Sentry for error tracking
  - PostHog for analytics
```

### API Service Component
```yaml
title: REST API Service
description: |
  Core API service handling business logic and data access.
  Provides REST endpoints for web and mobile clients.
component_type: service
folder: apps/api
dev_port: 3001
scope:
  in_scope:
    - User management endpoints
    - Data CRUD operations
    - Authentication middleware
  out_of_scope:
    - WebSocket connections (separate service)
    - Background jobs (separate service)
depends_on:
  - cmp-004-database
tech_stack:
  - Node.js 20
  - Express 4.18
  - Prisma ORM 5.1
  - TypeScript 5.3
deployments:
  - platform: Railway
    url: https://api.example.com
    build_command: pnpm build
    deploy_command: pnpm start:prod
    environment_vars:
      - DATABASE_URL
      - JWT_SECRET
      - REDIS_URL
external_dependencies:
  - PostgreSQL database
  - Redis for caching
  - SendGrid for emails
```

### Shared Library Component
```yaml
title: UI Component Library
description: |
  Shared React component library used across all frontend applications.
  Provides consistent design system components.
component_type: library
folder: libs/ui
scope:
  in_scope:
    - Buttons, inputs, modals, cards
    - Layout components
    - TypeScript types and utilities
  out_of_scope:
    - Business logic components
    - Application-specific components
tech_stack:
  - React 18
  - TypeScript 5
  - Storybook 7
  - Radix UI primitives
deployments:
  - platform: npm
    url: https://www.npmjs.com/package/@acme/ui
    build_command: pnpm build
notes: |
  Published to npm on every release.
  Used by web-app and admin-app components.
```

### Database Component
```yaml
title: PostgreSQL Database
description: Primary database for all application data
component_type: service
scope:
  in_scope:
    - User accounts and profiles
    - Application data storage
    - Full-text search indexes
  out_of_scope:
    - Analytics data (separate warehouse)
    - Cache data (Redis)
tech_stack:
  - PostgreSQL 15.3
  - pgvector for embeddings
  - pg_cron for scheduled jobs
deployments:
  - platform: Supabase
    url: postgresql://...
    environment_vars:
      - DATABASE_URL
    notes: Managed PostgreSQL with automatic backups
external_dependencies:
  - Supabase for managed hosting
  - pgvector extension for vector similarity search
```

## Component Types

### Application (app)
End-user facing applications:
- Web applications
- Mobile apps
- Desktop applications
- CLI tools

### Service (service)
Backend services:
- REST APIs
- GraphQL APIs
- WebSocket servers
- Background workers
- Microservices

### Library (library)
Shared code:
- Component libraries
- Utility libraries
- SDK packages
- Internal frameworks

## Tech Stack Documentation

List specific versions when helpful:

```yaml
tech_stack:
  - Next.js 14.1.0  # Specific version for framework
  - React 18        # Major version for library
  - TypeScript      # No version for language
  - TailwindCSS 3.4
  - Prisma ORM 5.1
```

## Deployment Configuration

Document how and where it's deployed:

```yaml
deployments:
  # Production deployment
  - platform: Vercel
    url: https://app.example.com
    build_command: pnpm build
    environment_vars:
      - API_URL
      - AUTH_DOMAIN
    secrets:
      - STRIPE_SECRET_KEY
    notes: Auto-deploys on push to main

  # Staging deployment
  - platform: Vercel
    url: https://staging.example.com
    build_command: pnpm build
    environment_vars:
      - API_URL
      - AUTH_DOMAIN
    notes: Auto-deploys on push to develop branch
```

## Dependencies

### Internal Dependencies (depends_on)
```yaml
depends_on:
  - cmp-002-api-service    # This component needs the API
  - cmp-005-ui-library     # Uses shared UI components
```

### External Dependencies
```yaml
external_dependencies:
  - Stripe for payment processing
  - SendGrid for transactional emails
  - AWS S3 for file storage
  - Sentry for error tracking
```

## Scope Definition

Be explicit about boundaries:

```yaml
scope:
  in_scope:
    - User-facing features
    - Public API endpoints
    - User authentication
  out_of_scope:
    - Admin features (in admin-app component)
    - Internal APIs (in internal-api component)
    - Background processing (in worker component)
```

## Best Practices

### One Component per Major Piece
Don't create components for everything, but do create them for major architectural pieces.

### Document the "Why"
```yaml
description: |
  Separate admin application for internal tools.
  Split from main app to:
  - Keep bundle size small for end users
  - Allow different authentication (internal SSO)
  - Enable admin-specific features without bloating main app
```

### Keep Tech Stack Current
Update tech stack versions when you upgrade:
```yaml
# Update during upgrades
tech_stack:
  - React 18.2  # ← Updated from 18.1
  - Next.js 14  # ← Updated from 13
```

### Link to Decisions
```yaml
references:
  - type: other
    name: Framework Choice
    description: See dec-001-use-nextjs for why Next.js was chosen
```

### Document Development Setup
```yaml
dev_port: 3000
notes: |
  Run `npm dev` to start development server.
  Requires DATABASE_URL and REDIS_URL in .env file.
  See API component README for setup instructions.
```

## Monorepo Organization

For monorepo projects, use folder paths:

```yaml
# Web app
folder: apps/web

# API service
folder: apps/api

# Shared UI library
folder: libs/ui

# Database (no folder, external)
folder: null
```

## Related Guides

- See [Decision Guide](spec-mcp://guide/decision) for documenting technology choices
- See [Choosing Spec Types](spec-mcp://guide/choosing-spec-types) for when to use Components
- View the [Component Schema](spec-mcp://schema/component) for complete field reference
