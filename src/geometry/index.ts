/**
 * Geometry Layer - Public API
 */

export * from './types';
export * from './pie';
export * from './labels';

import { computePieGeometry } from './pie';
import { computeLabelGeometry } from './labels';
import type { ProcessedPieData } from '../data/types';
import type { PieGeometryConfig, GeometryOverrides, PieGeometryState } from './types';

/**
 * Full geometry pipeline: Pieces + Labels
 */
export function resolveGeometry(
    data: ProcessedPieData,
    config: PieGeometryConfig,
    overrides: GeometryOverrides
): PieGeometryState {
    const state = computePieGeometry(data, config, overrides);
    const { labels, leaderLines } = computeLabelGeometry(state.slices, config, overrides);

    return {
        ...state,
        labels,
        leaderLines,
        annotations: Array.from(overrides.annotations.values())
    };
}
