import type { SpecsManager } from "@spec-mcp/data";
import type { CoverageAnalyzer } from "../analysis/coverage-analyzer.js";
import type { DependencyAnalyzer } from "../analysis/dependency-analyzer.js";
import type { ValidationEngine } from "../validation/validation-engine.js";
import type { HealthScore, SpecReport } from "../shared/types/service.js";
import type { OperationResult } from "../shared/types/results.js";

export class HealthService {
	constructor(
		private manager: SpecsManager,
		private coverageAnalyzer: CoverageAnalyzer,
		private dependencyAnalyzer: DependencyAnalyzer,
		private validationEngine: ValidationEngine,
	) {}

	async getHealthScore(): Promise<OperationResult<HealthScore>> {
		try {
			const [coverageResult, depResult, validationResult] = await Promise.all([
				this.coverageAnalyzer.analyze(),
				this.dependencyAnalyzer.analyze(),
				this.validationEngine.runFullValidation(),
			]);

			const coverageScore =
				(coverageResult.success &&
					coverageResult.data?.report.coveragePercentage) ||
				0;
			const dependencyScore =
				(depResult.success && depResult.data?.health.score) || 0;
			const validationScore = validationResult.valid
				? 100
				: Math.max(0, 100 - validationResult.errors.length * 10);

			const overall = Math.round(
				(coverageScore + dependencyScore + validationScore) / 3,
			);

			const issues: string[] = [
				...validationResult.errors,
				...(depResult.success && depResult.data?.health.issues
					? depResult.data.health.issues
					: ["Dependency analysis failed"]),
				...(coverageResult.success &&
				coverageResult.data?.report.orphanedSpecs &&
				coverageResult.data.report.orphanedSpecs.length > 0
					? [
							`${coverageResult.data.report.orphanedSpecs.length} orphaned specs`,
						]
					: []),
			];

			const recommendations: string[] = [
				...(depResult.success && depResult.data?.health.recommendations
					? depResult.data.health.recommendations
					: []),
				...(coverageResult.success && coverageResult.data?.recommendations
					? coverageResult.data.recommendations
					: []),
				...(coverageScore < 80 ? ["Improve spec coverage"] : []),
				...(validationResult.errors.length > 0
					? ["Fix validation errors"]
					: []),
			];

			return {
				success: true,
				data: {
					overall,
					breakdown: {
						coverage: coverageScore ?? 0,
						dependencies: dependencyScore ?? 0,
						validation: validationScore,
					},
					issues,
					recommendations,
					timestamp: new Date(),
				},
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Failed to calculate health score",
			};
		}
	}

	async generateReport(
		getHealthScore: () => Promise<OperationResult<HealthScore>>,
		analyzeCoverage: () => Promise<
			OperationResult<import("../shared/types/analyzer.js").CoverageAnalysisResult>
		>,
		detectCycles: () => Promise<
			OperationResult<import("../shared/types/analyzer.js").CycleAnalysis>
		>,
		detectOrphans: () => Promise<
			OperationResult<import("../shared/types/analyzer.js").OrphanAnalysis>
		>,
		runFullValidation: () => Promise<
			import("../shared/types/results.js").ValidationResult
		>,
	): Promise<OperationResult<SpecReport>> {
		try {
			const [healthScore, coverage, validation, cycles, orphans] =
				await Promise.all([
					getHealthScore(),
					analyzeCoverage(),
					runFullValidation(),
					detectCycles(),
					detectOrphans(),
				]);

			if (
				!healthScore.success ||
				!coverage.success ||
				!cycles.success ||
				!orphans.success
			) {
				throw new Error("Failed to generate complete report");
			}

			const entities = await this.manager.getAllEntities();
			const totalSpecs =
				entities.requirements.length +
				entities.plans.length +
				entities.components.length;

			return {
				success: true,
				data: {
					summary: {
						totalSpecs: totalSpecs ?? 0,
						healthScore: healthScore.data?.overall ?? 0,
						issues: healthScore.data?.issues.length ?? 0,
						lastUpdated: new Date(),
					},
					coverage: coverage.data ?? {
						report: {
							totalSpecs: 0,
							coveredSpecs: 0,
							coveragePercentage: 0,
							uncoveredSpecs: [],
							orphanedSpecs: [],
						},
						recommendations: [],
					},
					validation,
					dependencies: {
						cycles: cycles.data?.summary.totalCycles ?? 0,
						health: healthScore.data?.breakdown.dependencies ?? 0,
						graph: {
							nodes: 0,
							edges: 0,
						},
					},
					orphans: orphans.data ?? {
						orphans: [],
						summary: { totalOrphans: 0, byType: {} },
					},
				},
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error ? error.message : "Failed to generate report",
			};
		}
	}
}
