/**
 * Data Layer - Schema Definitions
 * 
 * This module defines the universal data schema using Zod for runtime validation.
 * The schema supports multiple chart types but is chart-agnostic.
 * 
 * RESPONSIBILITIES:
 * - Define structure of dimensions, measures, series
 * - Validate incoming data at runtime
 * - Provide TypeScript types inferred from schemas
 * 
 * FORBIDDEN:
 * - No geometry calculations
 * - No visual styling
 * - No layout logic
 */

import { z } from 'zod';

// ============================================================================
// Dimension Schema
// ============================================================================

/**
 * Dimension types supported by the engine
 * - category: discrete buckets (A, B, C)
 * - number: continuous numeric axis
 * - time: timestamps/dates
 */
export const DimensionTypeSchema = z.enum(['category', 'number', 'time']);
export type DimensionType = z.infer<typeof DimensionTypeSchema>;

/**
 * A dimension describes an "input field" that behaves like an axis or category
 * Examples: x-axis categories (Jan, Feb), y-axis numeric axis, radar axes
 */
export const DimensionSchema = z.object({
  /** Key name used inside each row in "data" */
  id: z.string(),
  /** Display name for UI (axis label, legend label, etc.) */
  label: z.string(),
  /** Tells renderer how to treat this dimension */
  type: DimensionTypeSchema,
  /** Optional domain hints (format, timezone, etc.) */
  format: z.string().nullable().optional(),
});
export type Dimension = z.infer<typeof DimensionSchema>;

// ============================================================================
// Measure Schema
// ============================================================================

/**
 * Aggregation methods for combining rows
 */
export const AggregationTypeSchema = z.enum(['sum', 'avg', 'min', 'max', 'count']);
export type AggregationType = z.infer<typeof AggregationTypeSchema>;

/**
 * A measure is a numeric field that gets aggregated or plotted as a value
 * For bar/pie/line: usually 1 measure like "value"
 * For multi-metric charts: multiple measures like "sales", "profit"
 */
export const MeasureSchema = z.object({
  /** Key name used inside each row in "data" */
  id: z.string(),
  /** Display name for legends/tooltips */
  label: z.string(),
  /** Usually number */
  type: z.literal('number'),
  /** How to combine rows when a chart needs grouping */
  aggregation: AggregationTypeSchema,
});
export type Measure = z.infer<typeof MeasureSchema>;

// ============================================================================
// Series Schema
// ============================================================================

/**
 * Series is an optional grouping field used to split data into multiple lines,
 * bar groups, stacked segments, radar shapes, etc.
 */
export const SeriesSchema = z.object({
  /** Key name in rows */
  id: z.string(),
  /** Display name in legend UI */
  label: z.string(),
  /** Typically category or sometimes time */
  type: DimensionTypeSchema,
});
export type Series = z.infer<typeof SeriesSchema>;

// ============================================================================
// Data Row Schema
// ============================================================================

/**
 * A single data row containing dimension values, measure values, and optional series
 * The schema is flexible to allow any combination of fields
 */
export const DataRowSchema = z.record(z.string(), z.union([z.string(), z.number(), z.null()]));
export type DataRow = z.infer<typeof DataRowSchema>;

// ============================================================================
// Meta Schema (Chart-agnostic options)
// ============================================================================

export const BinConfigSchema = z.object({
  /** Which numeric field to bin (usually a measure id like "value") */
  field: z.string(),
  /** "count" is normal histogram (frequency), "sum" to sum another measure per bin */
  method: z.enum(['count', 'sum']),
  /** Width of each bucket (e.g., 5 means 0-5, 5-10, ...) */
  binSize: z.number().nullable().optional(),
  /** Alternative: number of bins */
  binCount: z.number().nullable().optional(),
}).nullable().optional();

export const ColorScaleConfigSchema = z.object({
  /** Which measure drives color intensity */
  field: z.string(),
  /** Type of scale */
  type: z.enum(['linear', 'quantile', 'log']),
  /** Optional explicit min/max. If null, infer from data */
  domain: z.tuple([z.number(), z.number()]).nullable().optional(),
}).nullable().optional();

export const MappingConfigSchema = z.object({
  /** Which dimension to use for x-axis */
  x: z.string().optional(),
  /** Which dimension to use for y-axis */
  y: z.string().optional(),
  /** Which measure to use for values */
  value: z.string().optional(),
  /** Which field to use for series grouping */
  series: z.string().optional(),
}).optional();

export const MetaSchema = z.object({
  /** If true and chart is bar-like, renderer stacks by series */
  stacked: z.boolean().optional(),
  /** Histogram config */
  bins: BinConfigSchema,
  /** For heatmaps or numeric color mapping */
  colorScale: ColorScaleConfigSchema,
  /** Tells renderer which ids to use for chart roles */
  mapping: MappingConfigSchema,
}).optional();
export type Meta = z.infer<typeof MetaSchema>;

// ============================================================================
// Complete Chart Data Schema
// ============================================================================

/**
 * The complete universal data schema for the chart engine.
 * This is the single source of truth for all chart types.
 */
export const ChartDataSchema = z.object({
  /** Describes the "input fields" that behave like axes or categories */
  dimensions: z.array(DimensionSchema),
  /** Numeric fields that get aggregated or plotted as values */
  measures: z.array(MeasureSchema),
  /** Optional grouping field(s) for multi-series charts */
  series: z.array(SeriesSchema).optional(),
  /** The actual dataset as flat rows (records) */
  data: z.array(DataRowSchema),
  /** Chart-agnostic options that affect interpretation */
  meta: MetaSchema,
});
export type ChartData = z.infer<typeof ChartDataSchema>;

// ============================================================================
// Validation Helper
// ============================================================================

/**
 * Validates raw data against the ChartData schema
 * @param data - Raw data to validate
 * @returns Validated ChartData or throws ZodError
 */
export function validateChartData(data: unknown): ChartData {
  return ChartDataSchema.parse(data);
}

/**
 * Safely validates raw data, returning a result object
 * @param data - Raw data to validate
 * @returns Success with parsed data or error with details
 */
export function safeValidateChartData(data: unknown): 
  | { success: true; data: ChartData }
  | { success: false; error: z.ZodError } {
  const result = ChartDataSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
