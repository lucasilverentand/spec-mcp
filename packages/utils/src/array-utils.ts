/**
 * Array utility functions for spec management
 */

export function unique<T>(array: T[]): T[] {
	return [...new Set(array)];
}

export function intersection<T>(arrayA: T[], arrayB: T[]): T[] {
	const setB = new Set(arrayB);
	return arrayA.filter((item) => setB.has(item));
}

export function difference<T>(arrayA: T[], arrayB: T[]): T[] {
	const setB = new Set(arrayB);
	return arrayA.filter((item) => !setB.has(item));
}

export function union<T>(...arrays: T[][]): T[] {
	return unique(arrays.flat());
}

export function chunk<T>(array: T[], size: number): T[][] {
	const chunks: T[][] = [];
	for (let i = 0; i < array.length; i += size) {
		chunks.push(array.slice(i, i + size));
	}
	return chunks;
}

export function groupBy<T, K extends string | number>(
	array: T[],
	keyFn: (item: T) => K,
): Record<K, T[]> {
	return array.reduce(
		(groups, item) => {
			const key = keyFn(item);
			if (!groups[key]) {
				groups[key] = [];
			}
			groups[key].push(item);
			return groups;
		},
		{} as Record<K, T[]>,
	);
}

export function sortBy<T>(
	array: T[],
	keyFn: (item: T) => string | number,
	order: "asc" | "desc" = "asc",
): T[] {
	return [...array].sort((a, b) => {
		const aKey = keyFn(a);
		const bKey = keyFn(b);

		if (aKey < bKey) return order === "asc" ? -1 : 1;
		if (aKey > bKey) return order === "asc" ? 1 : -1;
		return 0;
	});
}

export function findDuplicates<T>(array: T[]): T[] {
	const seen = new Set<T>();
	const duplicates = new Set<T>();

	for (const item of array) {
		if (seen.has(item)) {
			duplicates.add(item);
		} else {
			seen.add(item);
		}
	}

	return Array.from(duplicates);
}

export function partition<T>(
	array: T[],
	predicate: (item: T) => boolean,
): [T[], T[]] {
	const truthy: T[] = [];
	const falsy: T[] = [];

	for (const item of array) {
		if (predicate(item)) {
			truthy.push(item);
		} else {
			falsy.push(item);
		}
	}

	return [truthy, falsy];
}

export function sample<T>(array: T[], count: number = 1): T[] {
	if (count >= array.length) {
		return [...array];
	}

	const shuffled = [...array];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		const a = shuffled[i];
		const b = shuffled[j];
		if (a !== undefined && b !== undefined) {
			shuffled[i] = b;
			shuffled[j] = a;
		}
	}

	return shuffled.slice(0, count);
}

export function isEmpty<T>(array: T[] | null | undefined): boolean {
	return !array || array.length === 0;
}

export function isNotEmpty<T>(array: T[] | null | undefined): array is T[] {
	return Boolean(array && array.length > 0);
}

export function compact<T>(array: (T | null | undefined)[]): T[] {
	return array.filter((item): item is T => item != null);
}

export function flatten<T>(array: (T | T[])[]): T[] {
	const result: T[] = [];

	for (const item of array) {
		if (Array.isArray(item)) {
			result.push(...item);
		} else {
			result.push(item);
		}
	}

	return result;
}

export function deepFlatten<T>(array: readonly unknown[]): T[] {
	const result: T[] = [];

	for (const item of array) {
		if (Array.isArray(item)) {
			result.push(...deepFlatten<T>(item));
		} else {
			result.push(item as T);
		}
	}

	return result;
}

export function zip<T, U>(arrayA: T[], arrayB: U[]): [T, U][] {
	const length = Math.min(arrayA.length, arrayB.length);
	const result: [T, U][] = [];

	for (let i = 0; i < length; i++) {
		const a = arrayA[i];
		const b = arrayB[i];
		if (a !== undefined && b !== undefined) {
			result.push([a, b]);
		}
	}

	return result;
}

export function rotate<T>(array: T[], positions: number): T[] {
	if (array.length === 0) return array;

	const len = array.length;
	const pos = ((positions % len) + len) % len;

	return [...array.slice(pos), ...array.slice(0, pos)];
}

export function range(start: number, end: number, step: number = 1): number[] {
	const result: number[] = [];

	if (step > 0) {
		for (let i = start; i < end; i += step) {
			result.push(i);
		}
	} else if (step < 0) {
		for (let i = start; i > end; i += step) {
			result.push(i);
		}
	}

	return result;
}
