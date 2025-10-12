import { resolve } from "node:path";
import type {
	BusinessRequirement,
	Component,
	Constitution,
	Decision,
	EntityType,
	Milestone,
	Plan,
	TechnicalRequirement,
} from "@spec-mcp/schemas";
import {
	createBusinessRequirementsManager,
	createComponentsManager,
	createConstitutionsManager,
	createDecisionsManager,
	createMilestonesManager,
	createPlansManager,
	createTechRequirementsManager,
} from "./entities/index.js";
import type { EntityManager } from "./entity-manager.js";
import { FileManager } from "./file-manager.js";

/**
 * Centralized counter structure stored in specs.yml
 */
interface SpecsMetadata {
	counters: {
		business_requirements: number;
		tech_requirements: number;
		plans: number;
		components: number;
		constitutions: number;
		decisions: number;
		milestones: number;
		tasks: number; // Global task counter across all plans
	};
}

export class SpecManager {
	private specsPath: string;
	private fileManager: FileManager;
	private originalPath: string; // Track original path for switching back
	private currentWorktreePath: string | null = null; // Track current worktree

	public business_requirements: EntityManager<BusinessRequirement>;
	public tech_requirements: EntityManager<TechnicalRequirement>;
	public plans: EntityManager<Plan>;
	public components: EntityManager<Component>;
	public constitutions: EntityManager<Constitution>;
	public decisions: EntityManager<Decision>;
	public milestones: EntityManager<Milestone>;

	/**
	 * Create a new SpecManager
	 * @param specsPath - Path to the .specs folder (defaults to "./specs")
	 */
	constructor(specsPath: string = "./specs") {
		this.specsPath = specsPath;
		this.originalPath = specsPath;
		this.fileManager = new FileManager(specsPath);

		this.business_requirements = createBusinessRequirementsManager(
			this.specsPath,
		);
		this.tech_requirements = createTechRequirementsManager(this.specsPath);
		this.plans = createPlansManager(this.specsPath);
		this.components = createComponentsManager(this.specsPath);
		this.constitutions = createConstitutionsManager(this.specsPath);
		this.decisions = createDecisionsManager(this.specsPath);
		this.milestones = createMilestonesManager(this.specsPath);
	}

	/**
	 * Get the base path of the specs folder
	 */
	getBasePath(): string {
		return resolve(this.specsPath);
	}

	/**
	 * Ensure the specs folder and all entity folders exist
	 */
	async ensureFolders(): Promise<void> {
		await this.fileManager.ensureFolder();
		await Promise.all([
			this.business_requirements.ensureFolder(),
			this.tech_requirements.ensureFolder(),
			this.plans.ensureFolder(),
			this.components.ensureFolder(),
			this.constitutions.ensureFolder(),
			this.decisions.ensureFolder(),
			this.milestones.ensureFolder(),
		]);
	}

	/**
	 * Get the entity manager for a given type
	 */
	private getManagerForType(
		type: EntityType,
	): EntityManager<
		| BusinessRequirement
		| TechnicalRequirement
		| Plan
		| Component
		| Constitution
		| Decision
		| Milestone
	> {
		switch (type) {
			case "business-requirement":
				return this.business_requirements;
			case "technical-requirement":
				return this.tech_requirements;
			case "plan":
				return this.plans;
			case "component":
				return this.components;
			case "constitution":
				return this.constitutions;
			case "decision":
				return this.decisions;
			case "milestone":
				return this.milestones;
			default:
				throw new Error(`Unknown entity type: ${type}`);
		}
	}

	/**
	 * Get the counter field name for a given type
	 */
	private getCounterKey(type: EntityType): keyof SpecsMetadata["counters"] {
		switch (type) {
			case "business-requirement":
				return "business_requirements";
			case "technical-requirement":
				return "tech_requirements";
			case "plan":
				return "plans";
			case "component":
				return "components";
			case "constitution":
				return "constitutions";
			case "decision":
				return "decisions";
			case "milestone":
				return "milestones";
			default:
				throw new Error(`Unknown entity type: ${type}`);
		}
	}

	/**
	 * Read specs metadata (creates with defaults if doesn't exist)
	 */
	private async readMetadata(): Promise<SpecsMetadata> {
		try {
			if (await this.fileManager.exists("specs.yml")) {
				return await this.fileManager.readYaml<SpecsMetadata>("specs.yml");
			}
		} catch {
			// Fall through to create default
		}

		// Return default metadata
		return {
			counters: {
				business_requirements: 0,
				tech_requirements: 0,
				plans: 0,
				components: 0,
				constitutions: 0,
				decisions: 0,
				milestones: 0,
				tasks: 0,
			},
		};
	}

	/**
	 * Write specs metadata
	 */
	private async writeMetadata(metadata: SpecsMetadata): Promise<void> {
		await this.fileManager.writeYaml("specs.yml", metadata);
	}

	/**
	 * Get next available number for an entity type (thread-safe via centralized counter)
	 */
	async getNextNumber(type: EntityType): Promise<number> {
		const counterKey = this.getCounterKey(type);
		const manager = this.getManagerForType(type);

		try {
			// Read current metadata
			const metadata = await this.readMetadata();
			let currentCounter = metadata.counters[counterKey];

			// If counter is 0, initialize from existing files
			if (currentCounter === 0) {
				const existingMax = await manager.getMaxNumber();
				currentCounter = existingMax;
			}

			// Increment counter
			const nextNumber = currentCounter + 1;
			metadata.counters[counterKey] = nextNumber;

			// Save updated metadata
			await this.writeMetadata(metadata);

			return nextNumber;
		} catch (_error) {
			// On any error, fall back to scanning files
			const maxNumber = await manager.getMaxNumber();
			return maxNumber + 1;
		}
	}

	/**
	 * Get next available task ID (globally unique across all plans)
	 */
	async getNextTaskId(): Promise<string> {
		try {
			// Read current metadata
			const metadata = await this.readMetadata();
			let currentCounter = metadata.counters.tasks;

			// If counter is 0, initialize by scanning all plans
			if (currentCounter === 0) {
				currentCounter = await this.getMaxTaskNumber();
			}

			// Increment counter
			const nextNumber = currentCounter + 1;
			metadata.counters.tasks = nextNumber;

			// Save updated metadata
			await this.writeMetadata(metadata);

			return `task-${String(nextNumber).padStart(3, "0")}`;
		} catch (_error) {
			// On any error, fall back to scanning all plans
			const maxNumber = await this.getMaxTaskNumber();
			const nextNumber = maxNumber + 1;
			return `task-${String(nextNumber).padStart(3, "0")}`;
		}
	}

	/**
	 * Get the maximum task number across all plans
	 */
	private async getMaxTaskNumber(): Promise<number> {
		const plans = await this.plans.list();
		let maxTaskNum = 0;

		for (const plan of plans) {
			if (!plan.tasks) continue;

			for (const task of plan.tasks) {
				const match = task.id.match(/^task-(\d+)$/);
				if (match?.[1]) {
					const num = Number.parseInt(match[1], 10);
					if (num > maxTaskNum) {
						maxTaskNum = num;
					}
				}
			}
		}

		return maxTaskNum;
	}

	/**
	 * Switch to a worktree specs directory
	 * @param worktreePath - Path to the worktree root (e.g., ../plan/pln-001-feature)
	 */
	async switchToWorktree(worktreePath: string): Promise<void> {
		const newSpecsPath = resolve(worktreePath, "specs");

		// Update the specs path
		this.specsPath = newSpecsPath;
		this.currentWorktreePath = worktreePath;

		// Reinitialize all managers with the new path
		this.fileManager = new FileManager(newSpecsPath);
		this.business_requirements =
			createBusinessRequirementsManager(newSpecsPath);
		this.tech_requirements = createTechRequirementsManager(newSpecsPath);
		this.plans = createPlansManager(newSpecsPath);
		this.components = createComponentsManager(newSpecsPath);
		this.constitutions = createConstitutionsManager(newSpecsPath);
		this.decisions = createDecisionsManager(newSpecsPath);
		this.milestones = createMilestonesManager(newSpecsPath);

		// Ensure folders exist in the worktree
		await this.ensureFolders();
	}

	/**
	 * Switch back to the original specs directory
	 */
	async switchToMain(): Promise<void> {
		// Reset to original path
		this.specsPath = this.originalPath;
		this.currentWorktreePath = null;

		// Reinitialize all managers with the original path
		this.fileManager = new FileManager(this.originalPath);
		this.business_requirements = createBusinessRequirementsManager(
			this.originalPath,
		);
		this.tech_requirements = createTechRequirementsManager(this.originalPath);
		this.plans = createPlansManager(this.originalPath);
		this.components = createComponentsManager(this.originalPath);
		this.constitutions = createConstitutionsManager(this.originalPath);
		this.decisions = createDecisionsManager(this.originalPath);
		this.milestones = createMilestonesManager(this.originalPath);
	}

	/**
	 * Get the current worktree path (null if on main)
	 */
	getCurrentWorktree(): string | null {
		return this.currentWorktreePath;
	}

	/**
	 * Check if currently in a worktree
	 */
	isInWorktree(): boolean {
		return this.currentWorktreePath !== null;
	}
}
