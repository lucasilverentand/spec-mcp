# Component Schema

Components follow this exact schema structure:

```json
{
  "type": "app" | "service" | "library" | "tool",
  "number": 1,
  "slug": "url-friendly-slug",
  "name": "Display Name",
  "description": "Detailed description of purpose and responsibilities",
  "folder": "./relative/path",
  "tech_stack": ["React", "TypeScript", "PostgreSQL"],
  "depends_on": ["app-001-dashboard", "svc-002-api"],
  "external_dependencies": ["express@4.18", "react@18"],
  "capabilities": [
    "Key functionality 1",
    "Key functionality 2"
  ],
  "constraints": [
    "Performance: <100ms response",
    "Security: OAuth 2.0 required"
  ]
}
```

## Field Rules

- **type**: One of four component types:
  - `"app"`: User-facing application
  - `"service"`: Backend service
  - `"library"`: Reusable code library
  - `"tool"`: Development/build/deployment tool
- **slug**: URL-friendly identifier (lowercase, numbers, single dashes)
- **name**: Component display name
- **description**: Purpose, role, and responsibilities
  - What does this component do?
  - Why does it exist?
  - What are its boundaries?
- **folder**: Relative path from repository root
  - Example: `./apps/dashboard`, `./services/auth-api`
- **tech_stack**: Technologies used
  - Languages: "TypeScript", "Python", "Go"
  - Frameworks: "React", "Express", "FastAPI"
  - Databases: "PostgreSQL", "Redis", "MongoDB"
- **depends_on**: Internal component dependencies
  - Array of component IDs this depends on
  - Example: `["app-001-dashboard", "svc-002-api"]`
- **external_dependencies**: Third-party packages
  - Include version when known
  - Example: `["express@4.18", "react@18", "typescript"]`
- **capabilities**: What the component can do
  - Keep focused: 3-5 capabilities max
  - Each capability is a key functionality
- **constraints**: Technical and business limitations
  - Performance requirements
  - Security requirements
  - Compatibility requirements
  - Example: "Must support 10,000 concurrent users"
- **id** (computed): Auto-generated as `{type_prefix}-XXX-slug`
  - `app-XXX-slug` for applications
  - `svc-XXX-slug` for services
  - `lib-XXX-slug` for libraries
  - `tol-XXX-slug` for tools
  - Example: `app-001-dashboard`, `svc-002-auth-api`

## Validation

Use `mcp__spec-mcp__guidance` with `spec_type: "component"` to validate against the 10-step reasoning process.