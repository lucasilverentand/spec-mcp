# Core Package Tests

This directory contains the test suite for the `@spec-mcp/core` package.

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

## Test Structure

- **helpers.ts** - Test utilities and helpers
  - `useTempDir()` - Creates temporary test directories with automatic cleanup

- **file-manager.test.ts** - Tests for low-level file I/O operations
  - YAML reading/writing
  - File existence checks
  - Directory operations

- **entity-manager.test.ts** - Tests for entity management
  - CRUD operations
  - Auto-incrementing numbers
  - Schema validation

- **spec-manager.test.ts** - Tests for the main SpecManager
  - Integration tests
  - Multi-entity operations

- **draft-manager.test.ts** - Tests for draft creation
  - Question generation
  - Draft entity creation
  - Slug generation

## Test Cleanup

All tests use the `useTempDir()` helper which:
- Creates isolated temporary directories for each test
- Automatically cleans up after each test completes
- Prevents test pollution and side effects

The temporary folder `.tmp/` is gitignored and cleaned up automatically.

## Coverage

The test suite provides good coverage of core functionality:
- File operations: ~98%
- Entity management: ~98%
- Spec management: 100%

To view detailed coverage reports, run:
```bash
pnpm test:coverage
```

Coverage reports are generated in the `coverage/` directory.
