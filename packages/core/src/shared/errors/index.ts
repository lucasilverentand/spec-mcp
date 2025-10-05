export abstract class SpecError extends Error {
	abstract readonly code: string;
	abstract readonly category: ErrorCategory;
	readonly timestamp: Date;
	readonly context?: Record<string, unknown> | undefined;

	constructor(message: string, context?: Record<string, unknown> | undefined) {
		super(message);
		this.name = this.constructor.name;
		this.timestamp = new Date();
		this.context = context;
		Error.captureStackTrace(this, this.constructor);
	}

	toJSON() {
		return {
			name: this.name,
			code: this.code,
			category: this.category,
			message: this.message,
			timestamp: this.timestamp,
			context: this.context,
			stack: this.stack,
		};
	}
}

export type ErrorCategory =
	| "validation"
	| "analysis"
	| "dependency"
	| "reference"
	| "schema"
	| "configuration"
	| "io"
	| "system";

// Validation Errors
export class ValidationError extends SpecError {
	readonly code = "VALIDATION_ERROR" as const;
	readonly category: ErrorCategory = "validation";
}

export class SchemaValidationError extends SpecError {
	readonly code = "SCHEMA_VALIDATION_ERROR" as const;
	readonly category: ErrorCategory = "schema";
}

export class ReferenceValidationError extends SpecError {
	readonly code = "REFERENCE_VALIDATION_ERROR" as const;
	readonly category: ErrorCategory = "reference";
}

// Analysis Errors
export class AnalysisError extends SpecError {
	readonly code = "ANALYSIS_ERROR" as const;
	readonly category: ErrorCategory = "analysis";
}

export class CycleDetectionError extends SpecError {
	readonly code = "CYCLE_DETECTION_ERROR" as const;
	readonly category: ErrorCategory = "analysis";
}

export class DependencyAnalysisError extends SpecError {
	readonly code = "DEPENDENCY_ANALYSIS_ERROR" as const;
	readonly category: ErrorCategory = "dependency";
}

export class CoverageAnalysisError extends SpecError {
	readonly code = "COVERAGE_ANALYSIS_ERROR" as const;
	readonly category: ErrorCategory = "analysis";
}

// Configuration Errors
export class ConfigurationError extends SpecError {
	readonly code = "CONFIGURATION_ERROR" as const;
	readonly category: ErrorCategory = "configuration";
}

export class InvalidConfigError extends SpecError {
	readonly code = "INVALID_CONFIG_ERROR" as const;
	readonly category: ErrorCategory = "configuration";
}

// System Errors
export class SystemError extends SpecError {
	readonly code = "SYSTEM_ERROR" as const;
	readonly category: ErrorCategory = "system";
}

export class TimeoutError extends SpecError {
	readonly code = "TIMEOUT_ERROR" as const;
	readonly category: ErrorCategory = "system";
}

export class NotFoundError extends SpecError {
	readonly code = "NOT_FOUND_ERROR" as const;
	readonly category: ErrorCategory = "system";
}

// IO Errors
export class IOError extends SpecError {
	readonly code = "IO_ERROR" as const;
	readonly category: ErrorCategory = "io";
}

export class FileReadError extends SpecError {
	readonly code = "FILE_READ_ERROR" as const;
	readonly category: ErrorCategory = "io";
}

export class FileWriteError extends SpecError {
	readonly code = "FILE_WRITE_ERROR" as const;
	readonly category: ErrorCategory = "io";
}

// Error aggregation for batch operations
export class AggregatedError extends SpecError {
	readonly code = "AGGREGATED_ERROR" as const;
	readonly category: ErrorCategory = "system";
	readonly errors: SpecError[];

	constructor(errors: SpecError[], message?: string) {
		const defaultMessage = `Multiple errors occurred: ${errors.length} error(s)`;
		super(message || defaultMessage, { errorCount: errors.length });
		this.errors = errors;
	}

	get errorsByCategory(): Record<ErrorCategory, SpecError[]> {
		return this.errors.reduce(
			(acc, error) => {
				if (!acc[error.category]) {
					acc[error.category] = [];
				}
				acc[error.category].push(error);
				return acc;
			},
			{} as Record<ErrorCategory, SpecError[]>,
		);
	}

	get errorCounts(): Record<ErrorCategory, number> {
		return Object.entries(this.errorsByCategory).reduce(
			(acc, [category, errors]) => {
				acc[category as ErrorCategory] = errors.length;
				return acc;
			},
			{} as Record<ErrorCategory, number>,
		);
	}
}

// Error factory for creating typed errors
export const ErrorFactory = {
	validation(
		message: string,
		context?: Record<string, unknown>,
	): ValidationError {
		return new ValidationError(message, context);
	},

	schemaValidation(
		message: string,
		context?: Record<string, unknown>,
	): SchemaValidationError {
		return new SchemaValidationError(message, context);
	},

	referenceValidation(
		message: string,
		context?: Record<string, unknown>,
	): ReferenceValidationError {
		return new ReferenceValidationError(message, context);
	},

	analysis(message: string, context?: Record<string, unknown>): AnalysisError {
		return new AnalysisError(message, context);
	},

	cycleDetection(
		message: string,
		context?: Record<string, unknown>,
	): CycleDetectionError {
		return new CycleDetectionError(message, context);
	},

	dependencyAnalysis(
		message: string,
		context?: Record<string, unknown>,
	): DependencyAnalysisError {
		return new DependencyAnalysisError(message, context);
	},

	coverageAnalysis(
		message: string,
		context?: Record<string, unknown>,
	): CoverageAnalysisError {
		return new CoverageAnalysisError(message, context);
	},

	configuration(
		message: string,
		context?: Record<string, unknown>,
	): ConfigurationError {
		return new ConfigurationError(message, context);
	},

	invalidConfig(
		message: string,
		context?: Record<string, unknown>,
	): InvalidConfigError {
		return new InvalidConfigError(message, context);
	},

	system(message: string, context?: Record<string, unknown>): SystemError {
		return new SystemError(message, context);
	},

	timeout(message: string, context?: Record<string, unknown>): TimeoutError {
		return new TimeoutError(message, context);
	},

	notFound(message: string, context?: Record<string, unknown>): NotFoundError {
		return new NotFoundError(message, context);
	},

	io(message: string, context?: Record<string, unknown>): IOError {
		return new IOError(message, context);
	},

	fileRead(message: string, context?: Record<string, unknown>): FileReadError {
		return new FileReadError(message, context);
	},

	fileWrite(
		message: string,
		context?: Record<string, unknown>,
	): FileWriteError {
		return new FileWriteError(message, context);
	},

	aggregate(errors: SpecError[], message?: string): AggregatedError {
		return new AggregatedError(errors, message);
	},
};

// Type guards
export const isSpecError = (error: unknown): error is SpecError => {
	return error instanceof SpecError;
};

export const isValidationError = (error: unknown): error is ValidationError => {
	return error instanceof ValidationError;
};

export const isAnalysisError = (error: unknown): error is AnalysisError => {
	return error instanceof AnalysisError;
};

export const isConfigurationError = (
	error: unknown,
): error is ConfigurationError => {
	return error instanceof ConfigurationError;
};

export const isSystemError = (error: unknown): error is SystemError => {
	return error instanceof SystemError;
};

export const isIOError = (error: unknown): error is IOError => {
	return error instanceof IOError;
};

export const isAggregatedError = (error: unknown): error is AggregatedError => {
	return error instanceof AggregatedError;
};
