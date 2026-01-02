/**
 * Geometry Layer - Label & Leader Line Calculations
 * 
 * This module handles positioning labels and connecting them back to slices.
 */

import type {
    Point,
    SliceGeometry,
    LabelGeometry,
    LeaderLineGeometry,
    PieGeometryConfig,
    GeometryOverrides
} from './types';
import { polarToCartesian } from './pie';

/**
 * Computes labels and leader lines for the provided slice geometries.
 */
export function computeLabelGeometry(
    slices: Map<string, SliceGeometry>,
    config: PieGeometryConfig,
    overrides: GeometryOverrides
): { labels: LabelGeometry[]; leaderLines: LeaderLineGeometry[] } {
    const labels: LabelGeometry[] = [];
    const leaderLines: LeaderLineGeometry[] = [];

    slices.forEach((slice, sliceId) => {
        // We start with one label per slice for now as per prototype
        const labelIndex = 0;
        const labelId = `${sliceId}-label-${labelIndex}`;
        const override = overrides.labels.get(labelId);

        const anchorMode = override?.anchorMode ?? config.labelAnchorMode;
        let anchorPoint: Point;

        const explodeOffset = slice.explodeOffset;
        const center = {
            x: slice.center.x + explodeOffset.dx,
            y: slice.center.y + explodeOffset.dy
        };

        // Calculate initial anchor based on mode
        if (anchorMode === 'centroid') {
            anchorPoint = slice.centroid;
        } else if (anchorMode === 'edge') {
            anchorPoint = slice.outerEdgePoint;
        } else { // outside
            anchorPoint = polarToCartesian(
                center.x,
                center.y,
                slice.outerRadius + config.labelRadiusOffset,
                slice.midAngle
            );
        }

        // Apply manual offset if present
        const offset = override?.positionOffset ?? { dx: 0, dy: 0 };
        const finalPoint: Point = {
            x: anchorPoint.x + offset.dx,
            y: anchorPoint.y + offset.dy
        };

        // Determine side
        const side = Math.cos(slice.midAngle) >= 0 ? 'right' : 'left';

        labels.push({
            sliceId,
            labelIndex,
            labelId,
            anchorPoint: finalPoint,
            anchorMode,
            offset,
            side,
            boundingBox: { x: finalPoint.x, y: finalPoint.y, width: 60, height: 20 }, // Placeholder
            isManuallyPositioned: override?.isManuallyPositioned ?? false
        });

        // Create leader line if outside
        if (anchorMode === 'outside') {
            const startPoint = slice.outerEdgePoint;
            const endPoint = finalPoint;

            // Path: Move to start, Line to end
            const pathData = `M ${startPoint.x} ${startPoint.y} L ${endPoint.x} ${endPoint.y}`;

            leaderLines.push({
                sliceId,
                labelIndex,
                startPoint,
                endPoint,
                pathData
            });
        }
    });

    return { labels, leaderLines };
}
