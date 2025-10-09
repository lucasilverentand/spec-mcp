import { promises as fs } from "node:fs";
import path from "node:path";
import YAML from "yaml";

/**
 * Base class for managing files within a specific folder
 *
 * Provides low-level file I/O operations for YAML files.
 * Can be extended by managers that need to manage files in a specific directory.
 */
export class FileManager {
	protected folderPath: string;

	constructor(folderPath: string) {
		this.folderPath = path.resolve(folderPath);
	}

	/**
	 * Get the folder path
	 */
	getFolderPath(): string {
		return this.folderPath;
	}

	/**
	 * Ensure the folder exists
	 */
	async ensureFolder(): Promise<void> {
		await fs.mkdir(this.folderPath, { recursive: true });
	}

	/**
	 * Ensure a subdirectory exists within the folder
	 */
	protected async ensureSubDir(subPath: string): Promise<void> {
		const fullPath = path.join(this.folderPath, subPath);
		await fs.mkdir(fullPath, { recursive: true });
	}

	/**
	 * Check if a file exists within the folder
	 */
	async exists(relativePath: string): Promise<boolean> {
		try {
			const fullPath = path.join(this.folderPath, relativePath);
			await fs.access(fullPath);
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Read a YAML file from the folder
	 */
	async readYaml<T>(relativePath: string): Promise<T> {
		const fullPath = path.join(this.folderPath, relativePath);
		const content = await fs.readFile(fullPath, "utf-8");
		return YAML.parse(content) as T;
	}

	/**
	 * Write a YAML file to the folder
	 */
	async writeYaml<T>(relativePath: string, data: T): Promise<void> {
		const fullPath = path.join(this.folderPath, relativePath);
		// Ensure directory exists
		await fs.mkdir(path.dirname(fullPath), { recursive: true });
		const content = YAML.stringify(data);
		await fs.writeFile(fullPath, content, "utf-8");
	}

	/**
	 * Delete a file from the folder
	 */
	async delete(relativePath: string): Promise<void> {
		const fullPath = path.join(this.folderPath, relativePath);
		await fs.unlink(fullPath);
	}

	/**
	 * List files in a subdirectory
	 */
	async listFiles(subPath: string, extension = ".yaml"): Promise<string[]> {
		const fullPath = path.join(this.folderPath, subPath);
		try {
			const files = await fs.readdir(fullPath);
			return files
				.filter((file) => file.endsWith(extension))
				.map((file) => file.replace(new RegExp(`${extension}$`), ""));
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === "ENOENT") {
				return [];
			}
			throw error;
		}
	}

	/**
	 * Get the full path for a file
	 */
	getFullPath(relativePath: string): string {
		return path.join(this.folderPath, relativePath);
	}

	/**
	 * Remove a subdirectory if it's empty
	 * Does nothing if directory has files or doesn't exist
	 */
	async removeEmptyDir(subPath: string): Promise<void> {
		const fullPath = path.join(this.folderPath, subPath);
		try {
			const files = await fs.readdir(fullPath);
			if (files.length === 0) {
				await fs.rmdir(fullPath);
			}
		} catch (error) {
			// Ignore errors - directory might not exist or might have permission issues
			// This is a best-effort cleanup operation
			if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
				// Only log if it's not a "directory doesn't exist" error
				// But don't throw - this is non-critical cleanup
			}
		}
	}
}
