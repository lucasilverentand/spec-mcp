import type { AnyComponent } from "@spec-mcp/data";
import { ErrorFactory } from "../shared/errors/index.js";
import type {
	CoverageAnalysisResult,
	CoverageReport,
	ICoverageAnalyzer,
} from "../shared/types/analyzer.js";
import type { AnalysisResult } from "../shared/types/results.js";
import { BaseAnalyzer } from "./base-analyzer.js";

export class CoverageAnalyzer
	extends BaseAnalyzer<CoverageAnalysisResult>
	implements ICoverageAnalyzer
{
	readonly name = "CoverageAnalyzer";
	readonly version = "2.0.0";

	async analyze(): Promise<AnalysisResult<CoverageAnalysisResult>> {
		return this.safeAnalyze(async () => {
			const reportResult = await this.generateReport();
			if (!reportResult.success) {
				throw ErrorFactory.coverageAnalysis(
					"Failed to generate coverage report",
				);
			}

			const recommendations = this.generateRecommendations(reportResult.data);

			return {
				report: reportResult.data,
				recommendations,
				trends: {
					// This would be populated from historical data in a real implementation
					improvement: 0,
				},
			};
		});
	}

	async generateReport(): Promise<AnalysisResult<CoverageReport>> {
		return this.safeAnalyze(async () => {
			const { requirements, plans, components } = await this.getEntities();

			const totalSpecs = requirements.length + plans.length + components.length;
			let coveredSpecs = 0;
			const uncoveredSpecs: string[] = [];
			const orphanedSpecs: string[] = [];

			// Analyze requirement coverage
			const requirementCoverage = await this.analyzeRequirementCoverage(
				requirements as Array<{
					criteria: Array<{ id: string }>;
					number: number;
					slug: string;
				}>,
				plans as Array<{ number: number; slug: string; criteria_id?: string }>,
			);
			coveredSpecs += requirementCoverage.covered;
			uncoveredSpecs.push(...requirementCoverage.uncovered);

			// Analyze plan coverage
			const planCoverage = await this.analyzePlanCoverage(
				requirements as Array<{ criteria: Array<{ id: string }> }>,
				plans as Array<{
					number: number;
					slug: string;
					id: string;
					criteria_id?: string;
					depends_on?: string[];
				}>,
			);
			coveredSpecs += planCoverage.covered;
			orphanedSpecs.push(...planCoverage.orphaned);

			// Analyze component coverage
			const componentCoverage = await this.analyzeComponentCoverage(
				plans,
				components,
			);
			coveredSpecs += componentCoverage.covered;
			orphanedSpecs.push(...componentCoverage.orphaned);

			const coveragePercentage =
				totalSpecs > 0 ? Math.round((coveredSpecs / totalSpecs) * 100) : 0;

			// Generate by-category breakdown
			const byCategory = {
				requirements: {
					total: requirements.length,
					covered: requirementCoverage.covered,
					percentage:
						requirements.length > 0
							? Math.round(
									(requirementCoverage.covered / requirements.length) * 100,
								)
							: 0,
				},
				plans: {
					total: plans.length,
					covered: planCoverage.covered,
					percentage:
						plans.length > 0
							? Math.round((planCoverage.covered / plans.length) * 100)
							: 0,
				},
				components: {
					total: components.length,
					covered: componentCoverage.covered,
					percentage:
						components.length > 0
							? Math.round(
									(componentCoverage.covered / components.length) * 100,
								)
							: 0,
				},
			};

			return {
				totalSpecs,
				coveredSpecs,
				coveragePercentage,
				uncoveredSpecs,
				orphanedSpecs,
				byCategory,
			};
		});
	}

	async findUncovered(): Promise<AnalysisResult<string[]>> {
		return this.safeAnalyze(async () => {
			const reportResult = await this.generateReport();
			if (!reportResult.success) {
				throw ErrorFactory.coverageAnalysis("Failed to find uncovered specs");
			}
			return reportResult.data.uncoveredSpecs;
		});
	}

	async findOrphans(): Promise<AnalysisResult<string[]>> {
		return this.safeAnalyze(async () => {
			const reportResult = await this.generateReport();
			if (!reportResult.success) {
				throw ErrorFactory.coverageAnalysis("Failed to find orphaned specs");
			}
			return reportResult.data.orphanedSpecs;
		});
	}

	private async analyzeRequirementCoverage(
		requirements: Array<{
			criteria: Array<{ id: string }>;
			number: number;
			slug: string;
		}>,
		plans: Array<{ number: number; slug: string; criteria_id?: string }>,
	) {
		let covered = 0;
		const uncovered: string[] = [];

		for (const requirement of requirements) {
			const hasLinkedPlans = requirement.criteria.some((criteria) => {
				return plans.some((plan) => plan.criteria_id === criteria.id);
			});

			if (hasLinkedPlans) {
				covered++;
			} else {
				uncovered.push(
					`req-${requirement.number.toString().padStart(3, "0")}-${requirement.slug}`,
				);
			}
		}

		return { covered, uncovered };
	}

	private async analyzePlanCoverage(
		requirements: Array<{ criteria: Array<{ id: string }> }>,
		plans: Array<{
			number: number;
			slug: string;
			id: string;
			criteria_id?: string;
			depends_on?: string[];
		}>,
	) {
		let covered = 0;
		const orphaned: string[] = [];

		// Get all criteria IDs from requirements
		const criteriaIds = new Set<string>();
		for (const requirement of requirements) {
			for (const criteria of requirement.criteria) {
				criteriaIds.add(criteria.id);
			}
		}

		for (const plan of plans) {
			const planId = `pln-${plan.number.toString().padStart(3, "0")}-${plan.slug}`;

			// Plan is covered if it references a valid criteria_id
			if (plan.criteria_id && criteriaIds.has(plan.criteria_id)) {
				covered++;
			} else {
				// Check if plan is referenced by other plans as dependency
				const isReferencedByOtherPlans = plans.some(
					(otherPlan) => otherPlan.depends_on?.includes(planId) ?? false,
				);

				if (isReferencedByOtherPlans) {
					covered++;
				} else {
					orphaned.push(planId);
				}
			}
		}

		return { covered, orphaned };
	}

	private async analyzeComponentCoverage(
		plans: Array<{
			components?: Array<{ component_id: string }>;
			test_cases?: Array<{ components: string[] }>;
		}>,
		components: AnyComponent[],
	) {
		let covered = 0;
		const orphaned: string[] = [];

		// Get all component IDs referenced by plans
		const referencedComponentIds = new Set<string>();
		for (const plan of plans) {
			for (const testCase of plan.test_cases ?? []) {
				for (const componentId of testCase.components) {
					referencedComponentIds.add(componentId);
				}
			}
		}

		// Also check component dependencies
		for (const component of components) {
			for (const depId of component.depends_on) {
				referencedComponentIds.add(depId);
			}
		}

		for (const component of components) {
			const componentId = this.getComponentId(component);

			if (referencedComponentIds.has(componentId)) {
				covered++;
			} else {
				orphaned.push(componentId);
			}
		}

		return { covered, orphaned };
	}

	private generateRecommendations(report: CoverageReport): string[] {
		const recommendations: string[] = [];

		if (report.coveragePercentage < 70) {
			recommendations.push(
				"Coverage is below 70%. Consider adding more comprehensive test coverage.",
			);
		}

		if (report.orphanedSpecs.length > 0) {
			recommendations.push(
				`${report.orphanedSpecs.length} orphaned specifications need attention.`,
			);
		}

		if (report.uncoveredSpecs.length > 0) {
			recommendations.push(
				`${report.uncoveredSpecs.length} specifications lack proper coverage.`,
			);
		}

		if (
			report.byCategory?.requirements &&
			report.byCategory.requirements.percentage < 80
		) {
			recommendations.push(
				"Requirements coverage is low. Ensure all requirements have associated plans.",
			);
		}

		if (
			report.byCategory?.components &&
			report.byCategory.components.percentage < 90
		) {
			recommendations.push(
				"Component coverage could be improved. Verify all components are properly tested.",
			);
		}

		if (recommendations.length === 0) {
			recommendations.push(
				"Coverage looks good! Consider maintaining or improving current levels.",
			);
		}

		return recommendations;
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
