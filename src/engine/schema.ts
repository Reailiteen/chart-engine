import { z } from 'zod';
import { ChartDataSchema } from '../data/schema';
import { GeometryConfigSchema, GeometryOverridesSchema } from '../geometry/schema';
import { ChartThemeSchema } from '../styles/schema';

/**
 * Unified Board State Schema
 * Captures all 4 layers of the architectural breakdown.
 */
export const BoardStateSchema = z.object({
    metadata: z.object({
        version: z.string().default('1.0.0'),
        timestamp: z.number().default(() => Date.now()),
    }).optional(),

    // Layer 1: Data
    rawData: ChartDataSchema,

    // Layer 2: Geometry Configuration & Overrides
    geometryConfig: GeometryConfigSchema,
    overrides: GeometryOverridesSchema,

    // Layer 3: Scene Graph (Usually derived, excluded from core persistence unless needed)

    // Layer 4: Visual Theme & Styling
    theme: ChartThemeSchema,
});

export type BoardState = z.infer<typeof BoardStateSchema>;
