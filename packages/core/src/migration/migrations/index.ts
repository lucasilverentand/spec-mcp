/**
 * Registry of all available migrations
 *
 * When creating a new migration:
 * 1. Create a new file in this directory (e.g., migrate-1.1.0.ts)
 * 2. Export a Migration object with version, description, and migrate function
 * 3. Import and add it to the migrations array below
 *
 * Example migration file:
 *
 * ```typescript
 * import type { Migration } from "../types";
 * import { FileManager } from "../../storage/file-manager";
 *
 * export const migration_1_1_0: Migration = {
 *   version: "1.1.0",
 *   description: "Add new field to requirements",
 *   async migrate(specsPath: string): Promise<void> {
 *     const fileManager = new FileManager(specsPath);
 *     // ... migration logic
 *   }
 * };
 * ```
 */

import type { Migration } from "../types";

/**
 * All registered migrations in the system
 * Migrations will be run in version order, not array order
 */
export const migrations: Migration[] = [
	// Add migrations here as they are created
	// Example: migration_1_1_0,
];
