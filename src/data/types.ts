/**
 * Data Layer - Type Exports
 * 
 * Re-exports all types from the data layer for clean imports.
 * This is the public API for the data layer types.
 */

export type {
    DimensionType,
    Dimension,
    AggregationType,
    Measure,
    Series,
    DataRow,
    Meta,
    ChartData,
} from './schema';

// ============================================================================
// Processed Data Types (Output of Data Layer)
// ============================================================================

/**
 * A processed slice ready to be consumed by the Geometry layer.
 * Contains all derived values computed from raw data.
 * 
 * IMPORTANT: This contains NO geometry (angles, radius, positions).
 * Only data semantics.
 */
export interface ProcessedSlice {
    /** Stable unique identifier for this slice */
    sliceId: string;
    /** The category label for this slice */
    label: string;
    /** The raw aggregated value */
    rawValue: number;
    /** Percentage of total (0-100) */
    percentage: number;
    /** Reference to original data rows that contributed to this slice */
    originalRowIndices: number[];
    /** Optional color hint from data (not enforced, styling layer decides) */
    colorHint?: string;
}

/**
 * The complete processed output from the data layer.
 * This is what gets passed to the Geometry layer.
 */
export interface ProcessedPieData {
    /** Array of processed slices */
    slices: ProcessedSlice[];
    /** Total sum of all values */
    total: number;
    /** The field ID used for categories */
    categoryField: string;
    /** The field ID used for values */
    valueField: string;
}
