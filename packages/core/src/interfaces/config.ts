export interface SpecConfig {
	specsPath?: string;
	autoDetect?: boolean;
	schemaValidation?: boolean;
	referenceValidation?: boolean;

	// Analysis configuration
	analysis?: {
		enableCycleDetection?: boolean;
		enableOrphanDetection?: boolean;
		enableCoverageAnalysis?: boolean;
		maxAnalysisDepth?: number;
		cacheResults?: boolean;
	};

	// Validation configuration
	validation?: {
		strictMode?: boolean;
		allowPartialValidation?: boolean;
		customValidators?: string[];
		skipPatterns?: string[];
	};

	// Performance configuration
	performance?: {
		maxConcurrency?: number;
		timeout?: number;
		enableProfiling?: boolean;
	};

	// Logging configuration
	logging?: {
		level?: "error" | "warn" | "info" | "debug";
		enableMetrics?: boolean;
		output?: "console" | "file" | "none";
	};
}

export interface ServiceConfig extends SpecConfig {
	services?: {
		enabledServices?: string[];
		serviceTimeout?: number;
		retryAttempts?: number;
	};
}
