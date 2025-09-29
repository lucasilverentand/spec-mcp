export interface OperationResult<TData = unknown, TError = string> {
	success: boolean;
	data?: TData;
	error?: TError;
	warnings?: string[];
	timestamp?: Date;
}

export interface ValidationResult {
	valid: boolean;
	errors: string[];
	warnings: string[];
	timestamp?: Date;
}

export interface AnalysisResult<TData = unknown> {
	success: boolean;
	data: TData;
	metadata?: {
		executionTime?: number;
		version?: string;
		source?: string;
	};
	warnings?: string[];
	errors?: string[];
}

export type Result<T, E = Error> =
	| { success: true; data: T; error?: never }
	| { success: false; error: E; data?: never };
