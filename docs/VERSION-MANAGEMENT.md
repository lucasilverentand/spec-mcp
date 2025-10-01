# Version Management

This document describes how version synchronization works across all packages in the spec-mcp monorepo.

## Overview

The spec-mcp project uses automated version synchronization to ensure all packages maintain the same version number. This prevents version mismatches and enables fully automated releases.

## How It Works

### Version Sync Script

The `scripts/sync-versions.js` script automatically updates the `version` field in all package.json files across the monorepo.

**Usage:**
```bash
# Sync all packages to version 1.0.0
pnpm version:sync 1.0.0

# The script accepts any valid semver version
pnpm version:sync 2.1.3-beta.1
```

**What it does:**
- Updates the version field in all package.json files (except the root workspace)
- Skips the root workspace package.json (it's private and has no version)
- Validates the version format (semantic versioning)
- Provides clear output showing which packages were updated

### Automated Release Process

Version synchronization is integrated into the release workflow (`.github/workflows/release.yml`):

1. **Create a Release Tag**: Create a git tag following the format `v{version}` (e.g., `v1.0.0`)
2. **Trigger Release**: Push the tag or create a GitHub release
3. **Automated Steps**:
   - Extract version from tag
   - Sync all package versions using `pnpm version:sync`
   - Build all packages
   - Publish to npm
   - Upload release assets to GitHub

**Example:**
```bash
# Create and push a release tag
git tag v1.0.0
git push origin v1.0.0

# Or create a GitHub release through the UI
# This will automatically trigger the release workflow
```

## Package Structure

The monorepo contains the following packages:

- **Root workspace** (`/package.json`): Private workspace package (no version)
- **@spec-mcp/core** (`/packages/core/package.json`): Core business logic
- **@spec-mcp/data** (`/packages/data/package.json`): Data management and schemas
- **@spec-mcp/server** (`/packages/server/package.json`): MCP server implementation
- **@spec-mcp/tsconfig** (`/packages/tsconfig/package.json`): Shared TypeScript configs

## Manual Version Sync

If you need to manually sync versions (e.g., during development):

```bash
# Sync all packages to a specific version
pnpm version:sync 0.4.0

# Commit the changes
git add .
git commit -m "chore: bump version to 0.4.0"
```

## Version Format

Versions must follow [Semantic Versioning](https://semver.org/) format:

- **Format**: `MAJOR.MINOR.PATCH[-PRERELEASE][+BUILD]`
- **Examples**:
  - `1.0.0` - Standard release
  - `2.1.3-beta.1` - Pre-release version
  - `1.5.0+20130313144700` - With build metadata

## Benefits

✅ **Consistency**: All packages always have the same version number
✅ **Automation**: No manual version editing required
✅ **Reliability**: Prevents version mismatches that can cause issues
✅ **Simplicity**: Single command to update all packages
✅ **CI/CD Ready**: Fully integrated with automated release workflow

## Troubleshooting

### Script fails with "Invalid version format"
Make sure you're using a valid semver format: `MAJOR.MINOR.PATCH`

```bash
# ✓ Valid
pnpm version:sync 1.0.0
pnpm version:sync 2.1.3-beta.1

# ✗ Invalid
pnpm version:sync 1.0
pnpm version:sync v1.0.0  # Don't include 'v' prefix
```

### Workflow fails during release
1. Check that the tag format is correct (`v{version}`, e.g., `v1.0.0`)
2. Ensure all dependencies are properly installed
3. Verify that the `NPM_TOKEN` secret is configured in GitHub

## Future Enhancements

Potential improvements for the version management system:

- [ ] Pre-commit hook to prevent version mismatches
- [ ] Automated changelog generation
- [ ] Version bump commands (major, minor, patch)
- [ ] Interactive version selection wizard
- [ ] Workspace dependency version updates
