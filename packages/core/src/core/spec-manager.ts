import { ComponentManager } from "../managers/component-manager";
import { ConstitutionManager } from "../managers/constitution-manager";
import { DecisionManager } from "../managers/decision-manager";
import { PlanManager } from "../managers/plan-manager";
import { RequirementManager } from "../managers/requirement-manager";

/**
 * Main SPOC (Single Point of Contact) for managing the .specs folder
 *
 * This class provides access to all entity managers and coordinates
 * operations across different entity types.
 */
export class SpecManager {
	private specsPath: string;

	/** Manager for requirement entities */
	public readonly requirements: RequirementManager;

	/** Manager for plan entities */
	public readonly plans: PlanManager;

	/** Manager for component entities */
	public readonly components: ComponentManager;

	/** Manager for constitution entities */
	public readonly constitutions: ConstitutionManager;

	/** Manager for decision entities */
	public readonly decisions: DecisionManager;

	/**
	 * Create a new SpecManager
	 * @param specsPath - Path to the .specs folder (defaults to "./specs")
	 */
	constructor(specsPath = "./specs") {
		this.specsPath = specsPath;

		// Initialize entity managers
		this.requirements = new RequirementManager(specsPath);
		this.plans = new PlanManager(specsPath);
		this.components = new ComponentManager(specsPath);
		this.constitutions = new ConstitutionManager(specsPath);
		this.decisions = new DecisionManager(specsPath);
	}

	/**
	 * Get the base path of the specs folder
	 */
	getBasePath(): string {
		return this.specsPath;
	}

	/**
	 * Ensure the specs folder and all entity folders exist
	 */
	async ensureFolders(): Promise<void> {
		await Promise.all([
			this.requirements.ensureFolder(),
			this.plans.ensureFolder(),
			this.components.ensureFolder(),
			this.constitutions.ensureFolder(),
			this.decisions.ensureFolder(),
		]);
	}
}
