# Testing Guidelines

## Test Artifact Protection

All tests in this repository follow strict guidelines to prevent test artifacts from being accidentally committed. This document outlines the protections in place and best practices for writing tests.

## Protection Mechanisms

### 1. Gitignore Rules

The following patterns are automatically ignored:

```gitignore
# Temporary files
tmp/
temp/
*.tmp

# Test artifacts
test-specs/
**/test-specs/
test-output/
**/test-output/
```

### 2. Test Implementation Standards

All file-writing tests **must**:

1. Use `mkdtemp()` to create unique temporary directories in the OS temp location
2. Clean up temporary directories in `afterEach()` hooks using `rm(..., { recursive: true, force: true })`
3. Never write to hardcoded paths like `./test-specs` or `./test-output`

### 3. Example: Proper Test Structure

```typescript
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, it } from "vitest";

describe("MyFeature", () => {
  let tempDir: string;

  beforeEach(async () => {
    // Create unique temp directory in OS temp location
    tempDir = await mkdtemp(join(tmpdir(), "my-feature-test-"));
  });

  afterEach(async () => {
    // Clean up temp directory
    await rm(tempDir, { recursive: true, force: true });
  });

  it("should test something with files", async () => {
    // All file operations use tempDir
    const filePath = join(tempDir, "test-file.yml");
    // ... test logic
  });
});
```

## Current Test Status

### ✅ Tests Using Proper Patterns

All tests in the repository currently follow best practices:

- **packages/data/tests/**: All manager tests use `mkdtemp` + `afterEach` cleanup
- **packages/core/tests/**: All analyzer tests use config-based paths (no file writes)

### 🎯 Test Coverage

The test suite includes:

- 966 total tests across both packages
- File operation tests properly isolated in OS temp directories
- No test artifacts created in the repository

## Verification

To verify no test artifacts exist in the repository:

```bash
# Check for test artifact directories
find . -name "test-specs" -o -name "test-output" -not -path "*/node_modules/*"

# Check git status for any test files
git status --porcelain | grep -E "(test-specs|test-output|\.tmp)"

# Verify gitignore patterns work
git check-ignore -v test-specs/test-file.txt test-output/test-file.txt
```

## Adding New Tests

When adding new tests that require file operations:

1. **Do NOT** create directories in the repository root
2. **Always** use `mkdtemp(join(tmpdir(), "prefix-"))`
3. **Always** clean up in `afterEach` with `rm(..., { recursive: true, force: true })`
4. **Test your test** by running it and checking `git status` afterward

## Pre-commit Checklist

Before committing:

- [ ] Run `git status` to check for any `test-specs/` or `test-output/` directories
- [ ] Verify all new tests use `mkdtemp` for temporary directories
- [ ] Confirm all tests have proper `afterEach` cleanup
- [ ] Check that no `.tmp` files exist in the working directory

## References

- Test Examples: `packages/data/tests/manager.test.ts`
- Best Practices: `packages/data/tests/README.md`
- Core Tests: `packages/core/tests/README.md`
