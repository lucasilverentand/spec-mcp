# Test Guidelines

## Test Artifacts

**IMPORTANT:** All tests must use temporary directories for file operations to prevent test artifacts from being committed to the repository.

### Best Practices

1. **Use OS temporary directories**: Always use `mkdtemp(join(tmpdir(), 'prefix-'))` for test directories
2. **Clean up in afterEach**: Always remove temporary directories in `afterEach` hooks
3. **Avoid hardcoded paths**: Never write to hardcoded paths like `./test-specs` or `./test-output`

### Example

```typescript
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, it } from "vitest";

describe("MyTest", () => {
  let tempDir: string;

  beforeEach(async () => {
    // Create unique temp directory
    tempDir = await mkdtemp(join(tmpdir(), "my-test-"));
  });

  afterEach(async () => {
    // Clean up temp directory
    await rm(tempDir, { recursive: true, force: true });
  });

  it("should test something", async () => {
    // Use tempDir for all file operations
  });
});
```

### Gitignore Protection

The following patterns are gitignored to catch any accidental test artifacts:

- `test-specs/`
- `test-output/`
- `*.tmp`
- `tmp/`
- `temp/`

If you need to add test fixtures that SHOULD be committed, place them in a `fixtures/` directory within the test directory.
