/**
 * Geometry Layer - Pie Calculations
 * 
 * This module handles the mathematical transformations from processed data
 * to spatial geometries for pie and donut charts.
 * 
 * RESPONSIBILITIES:
 * - Calculate start/end angles for slices
 * - Calculate centroids and edge points
 * - Generate SVG path data for arcs
 * - Apply spatial overrides (explode, inner/outer radius)
 * 
 * FORBIDDEN:
 * - No visual styling
 * - No data aggregation
 */

import type { ProcessedPieData } from '../data/types';
import type {
    PieGeometryState,
    SliceGeometry,
    Point,
    Vector,
    PieGeometryConfig,
    GeometryOverrides
} from './types';

// ============================================================================
// Mathematical Helpers
// ============================================================================

/**
 * Converts polar coordinates to Cartesian (x, y).
 */
export function polarToCartesian(centerX: number, centerY: number, radius: number, angleInRadians: number): Point {
    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
    };
}

/**
 * Generates an SVG arc path string.
 * Handles both pie (innerRadius = 0) and donut (> 0) slices.
 */
export function createArcPath(
    center: Point,
    innerRadius: number,
    outerRadius: number,
    startAngle: number,
    endAngle: number,
    padAngle: number = 0
): string {
    // Apply padding to angles if requested
    const actualStart = startAngle + (padAngle / 2);
    const actualEnd = endAngle - (padAngle / 2);

    // If slice is too small after padding, return empty path
    if (actualEnd <= actualStart) return "";

    const largeArcFlag = actualEnd - actualStart <= Math.PI ? "0" : "1";

    const p1 = polarToCartesian(center.x, center.y, outerRadius, actualStart);
    const p2 = polarToCartesian(center.x, center.y, outerRadius, actualEnd);
    const p3 = polarToCartesian(center.x, center.y, innerRadius, actualEnd);
    const p4 = polarToCartesian(center.x, center.y, innerRadius, actualStart);

    if (innerRadius <= 0) {
        // Pie slice
        return [
            `M ${center.x} ${center.y}`,
            `L ${p1.x} ${p1.y}`,
            `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${p2.x} ${p2.y}`,
            "Z"
        ].join(" ");
    } else {
        // Donut slice
        return [
            `M ${p1.x} ${p1.y}`,
            `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${p2.x} ${p2.y}`,
            `L ${p3.x} ${p3.y}`,
            `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${p4.x} ${p4.y}`,
            "Z"
        ].join(" ");
    }
}

// ============================================================================
// Core Geometry Logic
// ============================================================================

/**
 * Computes the complete geometry state for a pie chart given processed data.
 */
export function computePieGeometry(
    data: ProcessedPieData,
    config: PieGeometryConfig,
    overrides: GeometryOverrides
): PieGeometryState {
    const { slices: processedSlices } = data;
    const geometrySlices = new Map<string, SliceGeometry>();

    const totalRange = config.endAngle - config.startAngle;
    let currentAngle = config.startAngle;

    processedSlices.forEach((slice) => {
        const sliceOverride = overrides.slices.get(slice.sliceId);

        // Calculate angles based on percentage
        const sliceAngleSpan = (slice.percentage / 100) * totalRange;
        const startAngle = currentAngle;
        const endAngle = currentAngle + sliceAngleSpan;
        const midAngle = startAngle + (sliceAngleSpan / 2);

        // Radii with overrides
        const innerRadius = sliceOverride?.innerRadius ?? config.innerRadius;
        const baseOuterRadius = sliceOverride?.outerRadius ?? config.outerRadius;
        const outerRadius = baseOuterRadius + (sliceOverride?.outerRadiusOffset ?? 0);

        // Explode calculation
        const explodeAmount = sliceOverride?.explodeAmount ?? 0;
        const explodeOffset: Vector = {
            dx: Math.cos(midAngle) * explodeAmount,
            dy: Math.sin(midAngle) * explodeAmount
        };

        // Effective center after explode
        const effectiveCenter: Point = {
            x: config.center.x + explodeOffset.dx,
            y: config.center.y + explodeOffset.dy
        };

        // Characteristic points
        const centroid = polarToCartesian(
            effectiveCenter.x,
            effectiveCenter.y,
            (innerRadius + outerRadius) / 2,
            midAngle
        );

        const outerEdgePoint = polarToCartesian(
            effectiveCenter.x,
            effectiveCenter.y,
            outerRadius,
            midAngle
        );

        const innerEdgePoint = polarToCartesian(
            effectiveCenter.x,
            effectiveCenter.y,
            innerRadius,
            midAngle
        );

        // Generate path
        const pathData = createArcPath(
            effectiveCenter,
            innerRadius,
            outerRadius,
            startAngle,
            endAngle,
            config.padAngle
        );

        geometrySlices.set(slice.sliceId, {
            sliceId: slice.sliceId,
            startAngle,
            endAngle,
            midAngle,
            innerRadius,
            outerRadius,
            center: config.center,
            centroid,
            outerEdgePoint,
            innerEdgePoint,
            explodeOffset,
            pathData
        });

        currentAngle = endAngle;
    });

    return {
        config,
        slices: geometrySlices,
        labels: [], // Populated in next step
        leaderLines: [], // Populated in next step
        annotations: [], // Populated from overrides in scene layer
        overrides,
        lastUpdated: Date.now()
    };
}
