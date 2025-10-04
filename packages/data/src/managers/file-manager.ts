import { exec } from "node:child_process";
import {
	access,
	mkdir,
	readdir,
	readFile,
	stat,
	unlink,
	writeFile,
} from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { promisify } from "node:util";
import z from "zod";
import type { AnyEntity, EntityType } from "../entities/index.js";
import { formatYaml, parseYaml } from "../utils/yaml-formatter.js";

export const FileManagerConfigSchema = z.object({
	path: z.string().optional().describe("Path to the specifications directory"),
	autoDetect: z
		.boolean()
		.optional()
		.default(true)
		.describe("Automatically detect specs folder location"),
});

export type FileManagerConfig = z.input<typeof FileManagerConfigSchema>;

/**
 * FileManager handles all file I/O operations for spec entities
 * Responsibilities:
 * - Path resolution and management
 * - Reading/writing YAML files
 * - Directory structure management
 * - File existence checks
 */
export class FileManager {
	private resolvedPath?: string;
	private config: Required<FileManagerConfig>;

	constructor(config: FileManagerConfig = {}) {
		const parsedConfig = FileManagerConfigSchema.parse(config);
		this.config = {
			path: parsedConfig.path || "",
			autoDetect: parsedConfig.autoDetect,
		};
	}

	// === PATH MANAGEMENT ===

	async getSpecsPath(): Promise<string> {
		if (this.resolvedPath) {
			return this.resolvedPath;
		}

		if (this.config.path) {
			this.resolvedPath = resolve(this.config.path);
			return this.resolvedPath;
		}

		if (this.config.autoDetect) {
			this.resolvedPath = await this.autoDetectSpecsPath();
			return this.resolvedPath;
		}

		this.resolvedPath = resolve("./specs");
		return this.resolvedPath;
	}

	private async autoDetectSpecsPath(): Promise<string> {
		const searchPaths: string[] = [];

		try {
			// Try to find git repository root
			const gitRoot = await this.findGitRoot();
			if (gitRoot) {
				searchPaths.push(join(gitRoot, ".specs"));
				searchPaths.push(join(gitRoot, "specs"));
			}
		} catch {
			// Silently fail git detection
		}

		// Add current working directory
		searchPaths.push(join(process.cwd(), ".specs"));
		searchPaths.push(join(process.cwd(), "specs"));

		// Look for existing specs folder in search paths
		for (const path of searchPaths) {
			if ((await this.pathExists(path)) && (await this.isDirectory(path))) {
				return path;
			}
		}

		// If no existing specs folder found, default to .specs in git root or cwd
		const gitRoot = await this.findGitRoot().catch(() => null);
		const defaultPath = gitRoot
			? join(gitRoot, ".specs")
			: join(process.cwd(), ".specs");

		return defaultPath;
	}

	private async findGitRoot(): Promise<string | null> {
		const execAsync = promisify(exec);
		try {
			const { stdout } = await execAsync("git rev-parse --show-toplevel", {
				cwd: process.cwd(),
			});
			return stdout.trim();
		} catch {
			return null;
		}
	}

	async pathExists(path: string): Promise<boolean> {
		try {
			await access(path);
			return true;
		} catch {
			return false;
		}
	}

	async isDirectory(path: string): Promise<boolean> {
		try {
			const stats = await stat(path);
			return stats.isDirectory();
		} catch {
			return false;
		}
	}

	getEntityPath(entityType: EntityType, id: string): string {
		const folder =
			entityType === "requirement"
				? "requirements"
				: entityType === "plan"
					? "plans"
					: entityType === "constitution"
						? "constitutions"
						: "components";
		return `${folder}/${id}.yml`;
	}

	async getFullEntityPath(entityType: EntityType, id: string): Promise<string> {
		const specsPath = await this.getSpecsPath();
		return join(specsPath, this.getEntityPath(entityType, id));
	}

	// === DIRECTORY MANAGEMENT ===

	async ensureDirectoryStructure(): Promise<void> {
		const specsPath = await this.getSpecsPath();
		const directories = [
			join(specsPath, "requirements"),
			join(specsPath, "plans"),
			join(specsPath, "components"),
			join(specsPath, "constitutions"),
		];

		for (const dir of directories) {
			await this.ensureDirectory(dir);
		}
	}

	private async ensureDirectory(path: string): Promise<void> {
		try {
			await mkdir(path, { recursive: true });
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code !== "EEXIST") {
				throw error;
			}
		}
	}

	// === FILE READING ===

	async readEntity(
		entityType: EntityType,
		id: string,
	): Promise<AnyEntity | null> {
		try {
			const filePath = await this.getFullEntityPath(entityType, id);
			const content = await readFile(filePath, "utf8");
			return parseYaml<AnyEntity>(content);
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === "ENOENT") {
				return null;
			}
			throw error;
		}
	}

	async entityExists(entityType: EntityType, id: string): Promise<boolean> {
		try {
			const filePath = await this.getFullEntityPath(entityType, id);
			return await this.pathExists(filePath);
		} catch {
			return false;
		}
	}

	async listEntityIds(entityType: EntityType): Promise<string[]> {
		try {
			const specsPath = await this.getSpecsPath();
			const folder =
				entityType === "requirement"
					? "requirements"
					: entityType === "plan"
						? "plans"
						: entityType === "constitution"
							? "constitutions"
							: "components";

			const folderPath = join(specsPath, folder);
			const files = await readdir(folderPath);

			return files
				.filter((file) => file.endsWith(".yml") || file.endsWith(".yaml"))
				.map((file) =>
					basename(file, file.endsWith(".yml") ? ".yml" : ".yaml"),
				);
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === "ENOENT") {
				return [];
			}
			throw error;
		}
	}

	// === FILE WRITING ===

	async writeEntity(
		entityType: EntityType,
		id: string,
		entity: AnyEntity,
	): Promise<void> {
		const filePath = await this.getFullEntityPath(entityType, id);

		// Ensure directory exists
		await this.ensureDirectory(dirname(filePath));

		// Write YAML content with consistent formatting
		const yamlContent = formatYaml(entity);

		await writeFile(filePath, yamlContent, "utf8");
	}

	async deleteEntity(entityType: EntityType, id: string): Promise<boolean> {
		try {
			const filePath = await this.getFullEntityPath(entityType, id);
			await unlink(filePath);
			return true;
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === "ENOENT") {
				return false;
			}
			throw error;
		}
	}

	// === BATCH OPERATIONS ===

	async batchWrite(
		operations: Array<{
			entityType: EntityType;
			id: string;
			entity: AnyEntity;
		}>,
	): Promise<void> {
		// Ensure directory structure exists
		await this.ensureDirectoryStructure();

		// Write all entities
		await Promise.all(
			operations.map((op) => this.writeEntity(op.entityType, op.id, op.entity)),
		);
	}

	async batchWriteWithTransaction(
		operations: Array<{
			entityType: EntityType;
			id: string;
			entity: AnyEntity;
		}>,
	): Promise<void> {
		const backups: Array<{
			filePath: string;
			backupPath: string;
			existed: boolean;
		}> = [];

		try {
			// Create backups
			for (const op of operations) {
				const filePath = await this.getFullEntityPath(op.entityType, op.id);
				const backupPath = `${filePath}.backup.${Date.now()}`;
				const existed = await this.pathExists(filePath);

				if (existed) {
					const originalContent = await readFile(filePath, "utf8");
					await writeFile(backupPath, originalContent, "utf8");
				}

				backups.push({ filePath, backupPath, existed });
			}

			// Perform writes
			await this.batchWrite(operations);

			// Clean up backups on success
			for (const backup of backups) {
				if (backup.existed && (await this.pathExists(backup.backupPath))) {
					await unlink(backup.backupPath);
				}
			}
		} catch (error) {
			// Restore backups on failure
			for (const backup of backups) {
				if (backup.existed && (await this.pathExists(backup.backupPath))) {
					const backupContent = await readFile(backup.backupPath, "utf8");
					await writeFile(backup.filePath, backupContent, "utf8");
					await unlink(backup.backupPath);
				} else if (
					!backup.existed &&
					(await this.pathExists(backup.filePath))
				) {
					// Remove file that didn't exist before
					await unlink(backup.filePath);
				}
			}
			throw error;
		}
	}

	// === UTILITY METHODS ===

	getComponentTypeFromId(id: string): EntityType {
		if (id.startsWith("app-")) return "app";
		if (id.startsWith("svc-")) return "service";
		if (id.startsWith("lib-")) return "library";
		throw new Error(`Invalid component ID format: ${id}`);
	}

	async getNextNumber(entityType: EntityType): Promise<number> {
		const ids = await this.listEntityIds(entityType);
		const prefix = this.shortenEntityType(entityType);
		const numbers = ids
			.filter((id) => id.startsWith(prefix))
			.map((id) => {
				const match = id.match(new RegExp(`^${prefix}-(\\d{3})-`));
				return match?.[1] ? parseInt(match[1], 10) : 0;
			})
			.filter((num) => num > 0);

		return numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
	}

	private shortenEntityType(entityType: EntityType): string {
		switch (entityType) {
			case "requirement":
				return "req";
			case "plan":
				return "pln";
			case "app":
				return "app";
			case "service":
				return "svc";
			case "library":
				return "lib";
			case "constitution":
				return "con";
			default:
				throw new Error(`Unknown entity type: ${entityType}`);
		}
	}
}
