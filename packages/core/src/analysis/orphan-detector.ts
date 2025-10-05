import type { AnyComponent } from "@spec-mcp/data";
import { ErrorFactory } from "../shared/errors/index.js";
import type {
	IOrphanDetector,
	OrphanAnalysis,
} from "../shared/types/analyzer.js";
import type { AnalysisResult } from "../shared/types/results.js";
import { BaseAnalyzer } from "./base-analyzer.js";

export class OrphanDetector
	extends BaseAnalyzer<OrphanAnalysis>
	implements IOrphanDetector
{
	readonly name = "OrphanDetector";
	readonly version = "2.0.0";

	async analyze(): Promise<AnalysisResult<OrphanAnalysis>> {
		return this.detectOrphans();
	}

	async detectOrphans(): Promise<AnalysisResult<OrphanAnalysis>> {
		return this.safeAnalyze(async () => {
			const { requirements, plans, components } = await this.getEntities();

			const orphans: string[] = [];
			const byType: Record<string, number> = {
				requirements: 0,
				plans: 0,
				components: 0,
			};

			// Find orphaned plans (not referenced by requirements or other plans)
			const referencedPlanIds = new Set<string>();

			// Plans that reference requirement criteria via criteria_id
			// (these plans are not orphaned)
			for (const plan of plans) {
				if (plan.criteria_id) {
					referencedPlanIds.add(
						`pln-${plan.number.toString().padStart(3, "0")}-${plan.slug}`,
					);
				}
			}

			// Plans referenced by other plans
			for (const plan of plans) {
				for (const depId of plan.depends_on) {
					referencedPlanIds.add(depId);
				}
			}

			// Check which plans are orphaned
			for (const plan of plans) {
				const planId = `pln-${plan.number.toString().padStart(3, "0")}-${plan.slug}`;
				if (!referencedPlanIds.has(planId)) {
					orphans.push(planId);
					if (byType.plans !== undefined) {
						byType.plans++;
					}
				}
			}

			// Find orphaned components (not referenced by plans or other components)
			const referencedComponentIds = new Set<string>();

			// Components referenced by plans
			for (const plan of plans) {
				for (const testCase of plan.test_cases) {
					for (const componentId of testCase.components) {
						referencedComponentIds.add(componentId);
					}
				}
			}

			// Components referenced by other components
			for (const component of components) {
				for (const depId of component.depends_on) {
					referencedComponentIds.add(depId);
				}
			}

			// Check which components are orphaned
			for (const component of components) {
				const componentId = this.getComponentId(component);
				if (!referencedComponentIds.has(componentId)) {
					orphans.push(componentId);
					if (byType.components !== undefined) {
						byType.components++;
					}
				}
			}

			// Find orphaned requirements (requirements without linked plans)
			for (const requirement of requirements) {
				const hasLinkedPlans = requirement.criteria.some((criteria) => {
					return plans.some((plan) => plan.criteria_id === criteria.id);
				});

				if (!hasLinkedPlans) {
					const reqId = `req-${requirement.number.toString().padStart(3, "0")}-${requirement.slug}`;
					orphans.push(reqId);
					if (byType.requirements !== undefined) {
						byType.requirements++;
					}
				}
			}

			return {
				orphans,
				summary: {
					totalOrphans: orphans.length,
					byType,
				},
			};
		});
	}

	async findUnreferencedEntities(): Promise<AnalysisResult<string[]>> {
		return this.safeAnalyze(async () => {
			const orphanResult = await this.detectOrphans();
			if (!orphanResult.success) {
				throw ErrorFactory.analysis(
					"Failed to detect orphans for unreferenced entities",
				);
			}
			return orphanResult.data.orphans;
		});
	}

	private getComponentId(component: AnyComponent): string {
		switch (component.type) {
			case "app":
				return `app-${component.number.toString().padStart(3, "0")}-${component.slug}`;
			case "service":
				return `svc-${component.number.toString().padStart(3, "0")}-${component.slug}`;
			case "library":
				return `lib-${component.number.toString().padStart(3, "0")}-${component.slug}`;
		}
	}
}
