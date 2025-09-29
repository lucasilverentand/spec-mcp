import type { ServerConfig } from "../config/index.js";
import { ErrorCode, McpError } from "../utils/error-codes.js";
import { logger } from "../utils/logger.js";

interface RateLimitEntry {
	count: number;
	resetAt: number;
}

/**
 * Simple in-memory rate limiter
 * Tracks requests per client/operation within a time window
 */
export class RateLimiter {
	private limits = new Map<string, RateLimitEntry>();
	private readonly enabled: boolean;
	private readonly maxRequests: number;
	private readonly windowMs: number;

	constructor(config: ServerConfig["rateLimit"]) {
		this.enabled = config.enabled;
		this.maxRequests = config.maxRequests;
		this.windowMs = config.windowMs;

		// Clean up expired entries every minute
		if (this.enabled) {
			setInterval(() => this.cleanup(), 60000);
		}
	}

	/**
	 * Check if a request should be rate limited
	 * @param key Unique identifier for the client/operation
	 * @throws McpError if rate limit exceeded
	 */
	check(key: string): void {
		if (!this.enabled) {
			return;
		}

		const now = Date.now();
		const entry = this.limits.get(key);

		if (!entry || now >= entry.resetAt) {
			// Start new window
			this.limits.set(key, {
				count: 1,
				resetAt: now + this.windowMs,
			});
			return;
		}

		if (entry.count >= this.maxRequests) {
			const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
			logger.warn(
				{ key, count: entry.count, retryAfter },
				"Rate limit exceeded",
			);
			throw new McpError(
				ErrorCode.RATE_LIMIT_EXCEEDED,
				`Rate limit exceeded. Try again in ${retryAfter} seconds.`,
				{ key, retryAfter },
			);
		}

		entry.count++;
	}

	/**
	 * Remove expired entries
	 */
	private cleanup(): void {
		const now = Date.now();
		for (const [key, entry] of this.limits.entries()) {
			if (now >= entry.resetAt) {
				this.limits.delete(key);
			}
		}
	}

	/**
	 * Reset rate limit for a specific key
	 */
	reset(key: string): void {
		this.limits.delete(key);
	}

	/**
	 * Clear all rate limits
	 */
	clear(): void {
		this.limits.clear();
	}
}
