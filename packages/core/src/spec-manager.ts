import {
	type BusinessRequirement,
	BusinessRequirementSchema,
	type Component,
	ComponentSchema,
	type Constitution,
	ConstitutionSchema,
	type Decision,
	DecisionSchema,
	type Plan,
	PlanSchema,
	type TechnicalRequirement,
	TechnicalRequirementSchema,
} from "@spec-mcp/schemas";
import { resolve } from "path";
import { EntityManager } from "./entity-manager";

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

		this.business_requirements = new EntityManager<BusinessRequirement>({
			folderPath: this.specsPath,
			subFolder: "requirements/business",
			idPrefix: "brq",
			entityType: "technical-requirement",
			schema: BusinessRequirementSchema,
		});

		this.tech_requirements = new EntityManager<TechnicalRequirement>({
			folderPath: this.specsPath,
			subFolder: "requirements/technical",
			idPrefix: "trq",
			entityType: "technical-requirement",
			schema: TechnicalRequirementSchema,
		});

		this.plans = new EntityManager<Plan>({
			folderPath: this.specsPath,
			subFolder: "plans",
			idPrefix: "pln",
			entityType: "plan",
			schema: PlanSchema,
		});

		this.components = new EntityManager<Component>({
			folderPath: this.specsPath,
			subFolder: "components",
			idPrefix: "cmp",
			entityType: "component",
			schema: ComponentSchema,
		});

		this.constitutions = new EntityManager<Constitution>({
			folderPath: this.specsPath,
			subFolder: "constitutions",
			idPrefix: "cns",
			entityType: "constitution",
			schema: ConstitutionSchema,
		});

		this.decisions = new EntityManager<Decision>({
			folderPath: this.specsPath,
			subFolder: "decisions",
			idPrefix: "dcs",
			entityType: "decision",
			schema: DecisionSchema,
		});
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
