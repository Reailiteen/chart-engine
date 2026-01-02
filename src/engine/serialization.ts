import { z } from 'zod';

/**
 * Serialization Utilities
 * 
 * Helper functions to handle Map <-> Object conversion for Zod-compatible JSON.
 */

/**
 * Converts a Map to a plain Record/Object.
 */
export function mapToRecord<K extends string | number | symbol, V>(map: Map<K, V> | undefined): Record<K, V> {
    if (!map) return {} as Record<K, V>;
    const record: Record<K, V> = {} as Record<K, V>;
    map.forEach((value, key) => {
        record[key] = value;
    });
    return record;
}

/**
 * Converts a plain Record/Object back to a Map.
 */
export function recordToMap<K extends string | number | symbol, V>(record: Record<K, V> | undefined): Map<K, V> {
    if (!record) return new Map<K, V>();
    return new Map(Object.entries(record)) as Map<K, V>;
}

/**
 * Metadata schema for board states
 */
export const BoardMetadataSchema = z.object({
    version: z.string().default('1.0.0'),
    timestamp: z.number().default(() => Date.now()),
});
