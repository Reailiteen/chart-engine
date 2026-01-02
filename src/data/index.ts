/**
 * Data Layer - Public API
 * 
 * This is the main entry point for the data layer.
 * All public exports should go through this file.
 */

// Schema and validation
export {
    ChartDataSchema,
    DimensionSchema,
    MeasureSchema,
    SeriesSchema,
    DataRowSchema,
    validateChartData,
    safeValidateChartData,
} from './schema';

// Types
export type {
    ChartData,
    Dimension,
    DimensionType,
    Measure,
    AggregationType,
    Series,
    DataRow,
    Meta,
    ProcessedSlice,
    ProcessedPieData,
} from './types';

// Processor
export {
    processPieData,
    generateSliceId,
    aggregate,
    computePercentages,
    hasSliceStructureChanged,
    type ProcessorConfig,
} from './processor';
