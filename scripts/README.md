# Scripts

This directory contains utility scripts for the spec-mcp project.

## generate-test-data.ts

Generates comprehensive test data for all spec types in the project. This is useful for:
- Testing the MCP server with realistic data
- Demonstrating the system's capabilities
- Developing and testing the dashboard UI
- Running integration tests

### Usage

```bash
pnpm generate:test-data
```

### What it generates

The script creates realistic test data for all spec types:

- **3 Business Requirements** - User authentication, analytics dashboard, team collaboration
- **2 Technical Requirements** - API rate limiting, database migrations
- **2 Plans** - OAuth implementation, analytics data pipeline
- **3 Components** - Web app, API server, shared UI library
- **3 Decisions** - PostgreSQL choice, monorepo structure, React framework
- **1 Constitution** - Core engineering principles with 5 articles
- **3 Milestones** - Auth launch, analytics launch, beta launch

All generated specs include:
- Proper ID formats (brd-001-slug, pln-002-slug, etc.)
- Realistic descriptions and content
- Proper relationships between entities (dependencies, references, etc.)
- Valid timestamps
- Complete schema compliance

### Output location

All files are written to the `specs/` directory in their respective subdirectories:

```
specs/
├── requirements/
│   ├── business/
│   │   ├── brd-001-user-authentication.yml
│   │   ├── brd-002-analytics-dashboard.yml
│   │   └── brd-003-team-collaboration.yml
│   └── technical/
│       ├── prd-001-api-rate-limiting.yml
│       └── prd-002-database-migrations.yml
├── plans/
│   ├── pln-001-implement-oauth-authentication.yml
│   └── pln-002-analytics-data-pipeline.yml
├── components/
│   ├── cmp-001-web-app.yml
│   ├── cmp-002-api-server.yml
│   └── cmp-003-shared-ui-library.yml
├── decisions/
│   ├── dec-001-use-postgresql.yml
│   ├── dec-002-monorepo-with-pnpm.yml
│   └── dec-003-react-for-frontend.yml
├── constitutions/
│   └── con-001-core-engineering-principles.yml
├── milestones/
│   ├── mls-001-auth-launch.yml
│   ├── mls-002-analytics-launch.yml
│   └── mls-003-beta-launch.yml
└── specs.yml (updated counters)
```

### Re-running the script

The script will overwrite existing test data files. If you have modified the test data and want to keep it, back it up before running the script again.

### Customizing test data

To customize the generated test data, edit the `generate-test-data.ts` script and modify the data structures defined at the top of the file. Each spec type has an array of objects that you can add to, remove from, or modify.
