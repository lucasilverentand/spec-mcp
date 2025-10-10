import { resolve } from "node:path";
import type {
	BusinessRequirement,
	Component,
	Constitution,
	Decision,
	Plan,
	TechnicalRequirement,
} from "@spec-mcp/schemas";
import {
	createBusinessRequirementsManager,
	createComponentsManager,
	createConstitutionsManager,
	createDecisionsManager,
	createPlansManager,
	createTechRequirementsManager,
} from "./entities";
import type { EntityManager } from "./entity-manager";

export class SpecManager {
	private specsPath: string;

	public readonly business_requirements: EntityManager<BusinessRequirement>;
	public readonly tech_requirements: EntityManager<TechnicalRequirement>;
	public readonly plans: EntityManager<Plan>;
	public readonly components: EntityManager<Component>;
	public readonly constitutions: EntityManager<Constitution>;
	public readonly decisions: EntityManager<Decision>;

	/**
	 * Create a new SpecManager
	 * @param specsPath - Path to the .specs folder (defaults to "./specs")
	 */
	constructor(specsPath: string = "./specs") {
		this.specsPath = specsPath;

		this.business_requirements = createBusinessRequirementsManager(
			this.specsPath,
		);
		this.tech_requirements = createTechRequirementsManager(this.specsPath);
		this.plans = createPlansManager(this.specsPath);
		this.components = createComponentsManager(this.specsPath);
		this.constitutions = createConstitutionsManager(this.specsPath);
		this.decisions = createDecisionsManager(this.specsPath);
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
		await Promise.all([
			this.business_requirements.ensureFolder(),
			this.tech_requirements.ensureFolder(),
			this.plans.ensureFolder(),
			this.components.ensureFolder(),
			this.constitutions.ensureFolder(),
			this.decisions.ensureFolder(),
		]);
	}
}
