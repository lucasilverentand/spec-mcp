import { SpecsManager } from "@spec-mcp/data";
import { AnalysisError, ErrorFactory } from "../shared/errors/index.js";
import type { IAnalyzer } from "../shared/types/analyzer.js";
import type { SpecConfig } from "../shared/types/config.js";
import { toDataConfig } from "../shared/types/config.js";
import type { AnalysisResult } from "../shared/types/results.js";

export abstract class BaseAnalyzer<TResult = unknown>
	implements IAnalyzer<TResult>
{
	protected manager: SpecsManager;
	protected config: Partial<SpecConfig>;
	protected startTime?: Date;
	protected endTime?: Date;

	abstract readonly name: string;
	abstract readonly version: string;

	constructor(config: Partial<SpecConfig> = {}) {
		this.config = config;
		this.manager = new SpecsManager(toDataConfig(config));
	}

	abstract analyze(): Promise<AnalysisResult<TResult>>;

	configure(config: Partial<SpecConfig>): void {
		this.config = { ...this.config, ...config };
		this.manager = new SpecsManager(toDataConfig(this.config));
	}

	reset(): void {
		delete this.startTime;
		delete this.endTime;
	}

	protected startAnalysis(): void {
		this.startTime = new Date();
	}

	protected endAnalysis(): void {
		this.endTime = new Date();
	}

	protected getExecutionTime(): number {
		if (!this.startTime || !this.endTime) {
			return 0;
		}
		return this.endTime.getTime() - this.startTime.getTime();
	}

	protected createSuccessResult<T>(
		data: T,
		warnings: string[] = [],
	): AnalysisResult<T> {
		return {
			success: true,
			data,
			metadata: {
				executionTime: this.getExecutionTime(),
				version: this.version,
				source: this.name,
			},
			warnings,
			errors: [],
		};
	}

	protected createErrorResult<T>(
		error: string | AnalysisError,
		data?: T,
	): AnalysisResult<T> {
		const analysisError =
			typeof error === "string" ? ErrorFactory.analysis(error) : error;

		return {
			success: false,
			data: data as T,
			metadata: {
				executionTime: this.getExecutionTime(),
				version: this.version,
				source: this.name,
			},
			warnings: [],
			errors: [analysisError.message],
		};
	}

	protected async safeAnalyze<T>(
		operation: () => Promise<T>,
		context?: Record<string, unknown>,
	): Promise<AnalysisResult<T>> {
		try {
			this.startAnalysis();
			const result = await operation();
			this.endAnalysis();
			return this.createSuccessResult(result);
		} catch (error) {
			this.endAnalysis();
			const analysisError =
				error instanceof AnalysisError
					? error
					: ErrorFactory.analysis(
							error instanceof Error ? error.message : "Unknown analysis error",
							context,
						);
			return this.createErrorResult(analysisError);
		}
	}

	protected validateConfig(): void {
		if (!this.config) {
			throw ErrorFactory.configuration(
				"Configuration is required for analysis",
			);
		}
	}

	protected async getEntities() {
		try {
			return await this.manager.getAllEntities();
		} catch (error) {
			throw ErrorFactory.analysis(
				`Failed to retrieve entities: ${error instanceof Error ? error.message : "Unknown error"}`,
				{ source: this.name },
			);
		}
	}
}
