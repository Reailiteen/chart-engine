/**
 * Data Layer - Data Processor
 * 
 * This module transforms raw ChartData into ProcessedPieData.
 * It handles grouping, aggregation, percentage calculation, and stable ID generation.
 * 
 * RESPONSIBILITIES:
 * - Group data by category dimension
 * - Aggregate measure values
 * - Compute percentages
 * - Generate stable slice IDs
 * 
 * FORBIDDEN:
 * - No geometry calculations (angles, positions)
 * - No visual styling
 * - No layout logic
 */

import type { ChartData, DataRow } from './schema';
import type { ProcessedSlice, ProcessedPieData } from './types';

// ============================================================================
// Stable ID Generation
// ============================================================================

/**
 * Generates a stable, deterministic ID for a slice based on its label.
 * The ID should be consistent across data changes as long as the category exists.
 * 
 * @param label - The category label
 * @param index - Fallback index if label is empty
 * @returns A stable string ID
 */
export function generateSliceId(label: string, index: number): string {
    if (!label || label.trim() === '') {
        return `slice-${index}`;
    }
    // Create a URL-safe, stable ID from the label
    const normalized = label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    return `slice-${normalized || index}`;
}

// ============================================================================
// Aggregation Functions
// ============================================================================

type AggregationFn = (values: number[]) => number;

const aggregationFunctions: Record<string, AggregationFn> = {
    sum: (values) => values.reduce((acc, v) => acc + v, 0),
    avg: (values) => values.length > 0 ? values.reduce((acc, v) => acc + v, 0) / values.length : 0,
    min: (values) => values.length > 0 ? Math.min(...values) : 0,
    max: (values) => values.length > 0 ? Math.max(...values) : 0,
    count: (values) => values.length,
};

/**
 * Aggregates an array of values using the specified method.
 */
export function aggregate(values: number[], method: string): number {
    const fn = aggregationFunctions[method] ?? aggregationFunctions.sum;
    return fn(values);
}

// ============================================================================
// Percentage Calculation
// ============================================================================

/**
 * Computes percentages for an array of values.
 * Handles edge case where total is 0.
 * 
 * @param values - Array of numeric values
 * @returns Array of percentages (0-100)
 */
export function computePercentages(values: number[]): number[] {
    const total = values.reduce((acc, v) => acc + v, 0);
    if (total === 0) {
        // Equal distribution if all values are 0
        const equalShare = values.length > 0 ? 100 / values.length : 0;
        return values.map(() => equalShare);
    }
    return values.map(v => (v / total) * 100);
}

// ============================================================================
// Main Processor
// ============================================================================

export interface ProcessorConfig {
    /** Override for category field (dimension to group by) */
    categoryField?: string;
    /** Override for value field (measure to aggregate) */
    valueField?: string;
    /** Override for aggregation method */
    aggregation?: string;
}

/**
 * Processes raw ChartData into ProcessedPieData for pie/donut charts.
 * 
 * This function:
 * 1. Identifies the category dimension and value measure
 * 2. Groups data rows by category
 * 3. Aggregates values per group
 * 4. Computes percentages
 * 5. Generates stable IDs
 * 
 * @param chartData - Validated ChartData input
 * @param config - Optional configuration overrides
 * @returns ProcessedPieData ready for geometry layer
 */
export function processPieData(
    chartData: ChartData,
    config: ProcessorConfig = {}
): ProcessedPieData {
    // Determine which fields to use
    const categoryField = config.categoryField
        ?? chartData.meta?.mapping?.x
        ?? chartData.dimensions[0]?.id
        ?? 'x';

    const valueField = config.valueField
        ?? chartData.meta?.mapping?.value
        ?? chartData.measures[0]?.id
        ?? 'value';

    const aggregationMethod = config.aggregation
        ?? chartData.measures.find(m => m.id === valueField)?.aggregation
        ?? 'sum';

    // Group rows by category
    const groups = new Map<string, { values: number[]; rowIndices: number[] }>();

    chartData.data.forEach((row: DataRow, index: number) => {
        const categoryValue = String(row[categoryField] ?? 'Unknown');
        const numericValue = Number(row[valueField] ?? 0);

        if (!groups.has(categoryValue)) {
            groups.set(categoryValue, { values: [], rowIndices: [] });
        }

        const group = groups.get(categoryValue)!;
        group.values.push(isNaN(numericValue) ? 0 : numericValue);
        group.rowIndices.push(index);
    });

    // Aggregate and build slices
    const rawSlices: Array<{ label: string; rawValue: number; rowIndices: number[] }> = [];

    groups.forEach((group, label) => {
        rawSlices.push({
            label,
            rawValue: aggregate(group.values, aggregationMethod),
            rowIndices: group.rowIndices,
        });
    });

    // Sort slices by value (descending) for consistent ordering
    rawSlices.sort((a, b) => b.rawValue - a.rawValue);

    // Compute percentages
    const values = rawSlices.map(s => s.rawValue);
    const percentages = computePercentages(values);
    const total = values.reduce((acc, v) => acc + v, 0);

    // Build final processed slices with stable IDs
    const slices: ProcessedSlice[] = rawSlices.map((slice, index) => ({
        sliceId: generateSliceId(slice.label, index),
        label: slice.label,
        rawValue: slice.rawValue,
        percentage: percentages[index],
        originalRowIndices: slice.rowIndices,
    }));

    return {
        slices,
        total,
        categoryField,
        valueField,
    };
}

// ============================================================================
// Data Update Helpers
// ============================================================================

/**
 * Checks if two ProcessedPieData objects have the same slices (by ID).
 * Used to determine if scene graph needs to be rebuilt or just updated.
 */
export function hasSliceStructureChanged(
    oldData: ProcessedPieData,
    newData: ProcessedPieData
): boolean {
    if (oldData.slices.length !== newData.slices.length) {
        return true;
    }

    const oldIds = new Set(oldData.slices.map(s => s.sliceId));
    const newIds = new Set(newData.slices.map(s => s.sliceId));

    if (oldIds.size !== newIds.size) {
        return true;
    }

    for (const id of oldIds) {
        if (!newIds.has(id)) {
            return true;
        }
    }

    return false;
}
