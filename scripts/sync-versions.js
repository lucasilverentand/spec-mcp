#!/usr/bin/env node

/**
 * Synchronizes version numbers across all package.json files in the monorepo.
 *
 * Usage:
 *   node scripts/sync-versions.js <version>
 *   node scripts/sync-versions.js 1.0.0
 *
 * This script will:
 * - Update the version field in all package.json files (except root workspace)
 * - Maintain all other fields unchanged
 * - Skip the root workspace package.json (it's private with no version)
 */

import { readFile, writeFile } from 'node:fs/promises';
import { glob } from 'glob';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

async function syncVersions(newVersion) {
  if (!newVersion) {
    console.error('Error: Version argument is required');
    console.error('Usage: node scripts/sync-versions.js <version>');
    console.error('Example: node scripts/sync-versions.js 1.0.0');
    process.exit(1);
  }

  // Validate version format (basic semver check)
  const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/;
  if (!semverRegex.test(newVersion)) {
    console.error(`Error: Invalid version format: ${newVersion}`);
    console.error('Expected format: MAJOR.MINOR.PATCH (e.g., 1.0.0, 2.1.3-beta.1)');
    process.exit(1);
  }

  console.log(`\nSynchronizing all packages to version ${newVersion}...\n`);

  // Find all package.json files
  const packageFiles = await glob('**/package.json', {
    cwd: rootDir,
    ignore: ['**/node_modules/**', '**/dist/**'],
    absolute: true,
  });

  const rootPackageJson = join(rootDir, 'package.json');
  let updatedCount = 0;
  let skippedCount = 0;

  for (const packageFile of packageFiles) {
    // Skip root workspace package.json (it's private and doesn't have a version)
    if (packageFile === rootPackageJson) {
      console.log(`⊘ Skipped: ${packageFile.replace(rootDir, '.')}`);
      console.log('  (root workspace is private)\n');
      skippedCount++;
      continue;
    }

    // Read and parse package.json
    const content = await readFile(packageFile, 'utf-8');
    const pkg = JSON.parse(content);

    const oldVersion = pkg.version || 'none';

    // Update version
    pkg.version = newVersion;

    // Write back with proper formatting (2-space indent, newline at end)
    await writeFile(
      packageFile,
      JSON.stringify(pkg, null, '\t') + '\n',
      'utf-8'
    );

    console.log(`✓ Updated: ${packageFile.replace(rootDir, '.')}`);
    console.log(`  ${oldVersion} → ${newVersion}\n`);
    updatedCount++;
  }

  console.log('═'.repeat(50));
  console.log(`Summary: ${updatedCount} package(s) updated, ${skippedCount} skipped`);
  console.log('═'.repeat(50));
}

// Get version from command line argument
const newVersion = process.argv[2];
syncVersions(newVersion).catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
