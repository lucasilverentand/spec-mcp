# Release Process

This document describes the automated release process for spec-mcp.

## Setup

⚠️ **Manual Setup Required**: Due to GitHub permissions, the workflow file needs to be manually moved:

```bash
# Move the workflow file from docs to .github/workflows
mkdir -p .github/workflows
cp docs/workflows/auto-release.yml .github/workflows/auto-release.yml
git add .github/workflows/auto-release.yml
git commit -m "ci: add automated release workflow"
git push origin main
```

After this one-time setup, the automated release process will be active.

## Overview

The spec-mcp repository uses **semantic-release** to automate the creation of versioned GitHub releases. Every push to the `main` branch triggers an automated workflow that:

1. Analyzes commit messages using conventional commits format
2. Determines the appropriate version bump
3. Updates version numbers across all packages in the monorepo
4. Generates a changelog
5. Creates a GitHub release
6. Triggers package publication to npm (via the existing release workflow)

## Conventional Commits

All commits to the `main` branch should follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Commit Types and Version Bumps

| Type | Description | Version Bump | Example |
|------|-------------|--------------|---------|
| `feat` | New feature | **Minor** (0.6.5 → 0.7.0) | `feat: add query pagination support` |
| `fix` | Bug fix | **Patch** (0.6.5 → 0.6.6) | `fix: resolve validation error for empty specs` |
| `perf` | Performance improvement | **Patch** (0.6.5 → 0.6.6) | `perf: optimize dependency graph traversal` |
| `refactor` | Code refactoring | **Patch** (0.6.5 → 0.6.6) | `refactor: simplify query builder logic` |
| `revert` | Revert previous commit | **Patch** (0.6.5 → 0.6.6) | `revert: undo feat(query): add pagination` |
| `docs` | Documentation only | **No release** | `docs: update README installation steps` |
| `style` | Code style/formatting | **No release** | `style: format with Biome` |
| `test` | Add/update tests | **No release** | `test: add coverage for validation edge cases` |
| `chore` | Maintenance tasks | **No release** | `chore: update dependencies` |
| `build` | Build system changes | **No release** | `build: configure turbo cache` |
| `ci` | CI/CD changes | **No release** | `ci: add coverage reporting` |

### Breaking Changes

To trigger a **major** version bump (0.6.5 → 1.0.0), include `BREAKING CHANGE:` in the commit footer or add `!` after the type:

```
feat!: redesign query API

BREAKING CHANGE: The query() function now requires an options object instead of positional arguments.
```

Or:

```
feat(api)!: remove deprecated methods

Removed createSpec() in favor of start_draft() workflow.
```

## How It Works

### 1. Commit to Main

When code is pushed to `main` (typically via merged PR):

```bash
git push origin main
```

### 2. Auto-Release Workflow

The `.github/workflows/auto-release.yml` workflow automatically:

1. **Analyzes Commits**: Examines commit messages since the last release
2. **Determines Version**: Calculates the next version based on commit types
3. **Updates Versions**: Runs `scripts/sync-versions.js` to update all package.json files
4. **Generates Changelog**: Creates/updates `CHANGELOG.md` with release notes
5. **Commits Changes**: Commits version bumps and changelog (tagged with `[skip ci]`)
6. **Creates Git Tag**: Tags the commit with the new version (e.g., `v0.7.0`)
7. **Creates GitHub Release**: Publishes a release with auto-generated notes

### 3. Release Workflow

Once the GitHub release is created, the existing `.github/workflows/release.yml` workflow triggers automatically to:

1. Build all packages
2. Publish `@spec-mcp/server` to npm
3. Upload release assets (tarballs) to the GitHub release

## Configuration Files

### `.releaserc.json`

Configures semantic-release behavior:

- **Commit Analysis**: Defines which commit types trigger releases
- **Release Notes**: Configures changelog generation format
- **Version Sync**: Runs the monorepo version sync script
- **Git Assets**: Specifies which files to commit during release
- **GitHub Release**: Controls release creation options

### `.github/workflows/auto-release.yml`

GitHub Actions workflow that:

- Triggers on push to `main`
- Installs semantic-release dependencies
- Runs the release process with proper permissions

## Manual Release (Not Recommended)

If you need to manually trigger a release:

1. Navigate to **Actions** → **Auto Release** in GitHub
2. Click **Run workflow** → **Run workflow** button
3. The workflow will analyze commits and create a release if appropriate

**Note**: This is rarely needed as releases happen automatically on every push to `main`.

## Skipping Releases

To push to `main` without triggering a release, ensure all commit messages use types that don't trigger releases (`docs`, `style`, `test`, `chore`, `build`, `ci`).

Example:
```bash
git commit -m "docs: update API documentation"
git push origin main
# No release will be created
```

## Version Strategy

- **Patch** (0.0.X): Bug fixes, performance improvements, refactoring
- **Minor** (0.X.0): New features (backward compatible)
- **Major** (X.0.0): Breaking changes (not backward compatible)

Before version 1.0.0, the project follows these conventions:
- Breaking changes may occur in minor versions
- Version 1.0.0 will be released when the API is considered stable

## Troubleshooting

### No Release Created

If you expected a release but none was created:

1. **Check Commit Messages**: Ensure at least one commit since the last release uses `feat`, `fix`, `perf`, `refactor`, or `revert`
2. **View Workflow Logs**: Check the Auto Release workflow run in GitHub Actions
3. **Verify Branch**: Ensure commits were pushed to `main`, not another branch

### Release Failed

If the Auto Release workflow fails:

1. Check the workflow logs for error messages
2. Common issues:
   - **Permission errors**: Ensure `GITHUB_TOKEN` has `contents: write` permission
   - **Merge conflicts**: The changelog or version files may have conflicts
   - **Invalid commits**: Commit messages may not follow conventional format

### Wrong Version Number

If semantic-release calculated the wrong version:

1. Review commit messages since the last release
2. Verify commit types match your intention (e.g., `feat` vs `fix`)
3. For breaking changes, ensure `BREAKING CHANGE:` or `!` is present

## Best Practices

1. **Write Clear Commit Messages**: Follow conventional commits strictly
2. **Use Scopes**: Add scopes for better changelog organization
   ```
   feat(query): add pagination support
   fix(validation): handle null references correctly
   ```
3. **Squash PR Commits**: When merging PRs, squash commits and use a conventional commit message
4. **Review Changelog**: After release, review the generated changelog for accuracy
5. **Test Before Merging**: Ensure CI passes before merging to `main`

## Related Documentation

- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [Semantic Release Documentation](https://semantic-release.gitbook.io/)

## Examples

### Feature Release (Minor)

```bash
# Commit a new feature
git commit -m "feat: add support for custom query filters"
git push origin main

# Result: 0.6.5 → 0.7.0
# GitHub release created with title "v0.7.0"
# Changelog includes: "Features: add support for custom query filters"
```

### Bug Fix Release (Patch)

```bash
# Commit a bug fix
git commit -m "fix: resolve race condition in validation"
git push origin main

# Result: 0.6.5 → 0.6.6
# GitHub release created with title "v0.6.6"
# Changelog includes: "Bug Fixes: resolve race condition in validation"
```

### Breaking Change Release (Major)

```bash
# Commit a breaking change
git commit -m "feat!: redesign MCP tool interfaces

BREAKING CHANGE: All tools now return Promise<ToolResult> instead of direct values."
git push origin main

# Result: 0.6.5 → 1.0.0
# GitHub release created with title "v1.0.0"
# Changelog includes breaking change notice
```

### No Release

```bash
# Commit documentation update
git commit -m "docs: improve installation instructions"
git push origin main

# Result: No version change
# No release created
```
