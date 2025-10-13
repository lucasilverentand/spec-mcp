# Publishing Guide

This guide explains how to publish new versions of the Spec MCP packages to npm.

## Packages

The monorepo contains two publishable apps:

- `spec-mcp` - MCP server for specification management (located in `apps/mcp`)
- `@spec-mcp/cli` - CLI tool for managing specifications (located in `apps/cli`)

Both apps bundle their workspace dependencies (`@spec-mcp/core`, `@spec-mcp/schemas`, etc.) to avoid the need for separate package publishing.

## Automated Publishing (Recommended)

Packages are automatically published to npm when a new GitHub release is created.

### Steps

1. **Ensure all changes are committed and pushed to main**
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Build and test locally**
   ```bash
   pnpm install
   pnpm build
   pnpm test
   ```

3. **Create a new GitHub release**

   Go to [GitHub Releases](https://github.com/lucapug/spec-mcp/releases/new) and:

   - Click "Draft a new release"
   - Create a new tag with format `v{version}` (e.g., `v0.2.0`)
   - Set the release title to the version number (e.g., `0.2.0`)
   - Add release notes describing the changes
   - Click "Publish release"

4. **Monitor the release workflow**

   The GitHub Actions workflow will automatically:
   - Build both apps (and their bundled dependencies)
   - Update version numbers in package.json files
   - Publish `spec-mcp` to npm
   - Publish `@spec-mcp/cli` to npm
   - Create release archives (.tgz files)
   - Attach archives to the GitHub release

   Check the workflow at: https://github.com/lucapug/spec-mcp/actions

## Manual Publishing (Emergency Only)

If you need to publish manually (not recommended):

### Prerequisites

1. **NPM Authentication**
   ```bash
   npm login
   # Follow prompts to authenticate
   ```

2. **Ensure you have publish permissions**
   - You must be added as a maintainer for `@spec-mcp` scope on npm

### Publishing Steps

1. **Build packages**
   ```bash
   pnpm install
   pnpm build
   ```

2. **Update versions**
   ```bash
   cd apps/mcp
   npm version {major|minor|patch}

   cd ../cli
   npm version {major|minor|patch}
   ```

3. **Publish apps**
   ```bash
   # From the monorepo root
   cd apps/mcp
   pnpm publish --access public

   cd ../cli
   pnpm publish --access public
   ```

4. **Tag and push**
   ```bash
   git tag v{version}
   git push origin main --tags
   ```

## Version Strategy

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (x.0.0) - Breaking changes
- **MINOR** (0.x.0) - New features, backward compatible
- **PATCH** (0.0.x) - Bug fixes, backward compatible

Both apps should generally be published with the same version number.

## Pre-publish Checks

The `prepublishOnly` script in each package automatically runs:

1. `clean` - Remove old build artifacts
2. `build` - Build TypeScript to JavaScript
3. `test` - Run all tests

If any step fails, the publish will be aborted.

## Published Files

Each app publishes only the necessary files (configured in `package.json` `files` field):

**spec-mcp:**
- `dist/` - Bundled JavaScript including all `@spec-mcp/*` dependencies and type definitions
- External dependencies required at runtime: `@modelcontextprotocol/sdk`, `yaml`, `pino`, `ws`, `chokidar`

**@spec-mcp/cli:**
- `dist/` - Bundled JavaScript including all `@spec-mcp/*` dependencies and CLI entry point
- `README.md` - CLI usage documentation
- `LICENSE` - MIT License
- External dependencies required at runtime: `@inquirer/prompts`, `commander`, `yaml`, `chokidar`, `ws`, `pino`

## Troubleshooting

### Package already exists error

If you get an error that the version already exists:
- Ensure you've bumped the version number
- Check existing versions: `npm view @spec-mcp/cli versions`

### Authentication issues

If you get a 401/403 error:
- Run `npm logout` then `npm login` again
- Verify you're authenticated: `npm whoami`
- Ensure you have permissions for the `@spec-mcp` scope

### Build failures

If the build fails during publish:
- Run `pnpm build` locally to see detailed errors
- Check TypeScript compilation errors
- Ensure all dependencies are installed: `pnpm install`

### Missing NPM_TOKEN in CI

If the GitHub Actions workflow fails with authentication error:
- Ensure `NPM_TOKEN` secret is configured in GitHub repository settings
- The token must have publish permissions for the `@spec-mcp` scope
- Generate a new token at https://www.npmjs.com/settings/YOUR_USERNAME/tokens

## Post-publish Verification

After publishing, verify the packages:

1. **Check npm registry**
   ```bash
   npm view spec-mcp
   npm view @spec-mcp/cli
   ```

2. **Test installation**
   ```bash
   # In a temporary directory
   mkdir test-install && cd test-install
   npm init -y
   npm install spec-mcp
   npm install -g @spec-mcp/cli
   spec-mcp --version
   ```

3. **Check package contents**
   ```bash
   npm pack @spec-mcp/cli --dry-run
   ```

## Links

- [npm registry - spec-mcp](https://www.npmjs.com/package/spec-mcp)
- [npm registry - @spec-mcp/cli](https://www.npmjs.com/package/@spec-mcp/cli)
- [GitHub Repository](https://github.com/lucasilverentand/spec-mcp)
- [GitHub Actions](https://github.com/lucasilverentand/spec-mcp/actions)
