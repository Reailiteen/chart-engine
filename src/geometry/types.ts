/**
 * Geometry Layer - Type Definitions
 * 
 * This module defines all types related to spatial calculations.
 * These types describe WHERE things exist in space.
 * 
 * RESPONSIBILITIES:
 * - Define position, angle, radius types
 * - Define slice geometry structures
 * - Define label geometry structures
 * - Define geometry state container
 * 
 * FORBIDDEN:
 * - No colors, fills, strokes
 * - No fonts or typography
 * - No shadows, gradients, glow
 * - No data processing
 */

// ============================================================================
// Basic Geometric Primitives
// ============================================================================

/** A 2D point in chart space */
export interface Point {
    x: number;
    y: number;
}

/** A 2D vector for translations/offsets */
export interface Vector {
    dx: number;
    dy: number;
}

/** A bounding box for collision detection */
export interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

// ============================================================================
// Slice Geometry
// ============================================================================

/**
 * Complete geometry for a single pie/donut slice.
 * All angles are in radians, measured from the positive x-axis (3 o'clock).
 */
export interface SliceGeometry {
    /** The slice ID this geometry belongs to */
    sliceId: string;

    /** Starting angle in radians */
    startAngle: number;

    /** Ending angle in radians */
    endAngle: number;

    /** Middle angle (for label positioning, tooltips) */
    midAngle: number;

    /** Inner radius (0 for pie, > 0 for donut) */
    innerRadius: number;

    /** Outer radius */
    outerRadius: number;

    /** Center point of the entire chart */
    center: Point;

    /** Centroid of the slice (geometric center of the arc segment) */
    centroid: Point;

    /** Point on the outer edge at midAngle (for leader lines) */
    outerEdgePoint: Point;

    /** Point on the inner edge at midAngle (for donut charts) */
    innerEdgePoint: Point;

    /** Explode offset (translation from center) */
    explodeOffset: Vector;

    /** The SVG path d attribute for rendering */
    pathData: string;
}

// ============================================================================
// Label Geometry
// ============================================================================

/** Where a label should be anchored relative to its slice */
export type LabelAnchorMode = 'centroid' | 'edge' | 'outside';

/** Which side of the chart the label should appear on */
export type LabelSide = 'left' | 'right' | 'auto';

/**
 * Geometry for a single label attached to a slice.
 * A slice can have multiple labels.
 */
export interface LabelGeometry {
    /** The slice ID this label belongs to */
    sliceId: string;

    /** Index of this label within the slice's labels */
    labelIndex: number;

    /** Unique ID for this label */
    labelId: string;

    /** The computed position of the label anchor point */
    anchorPoint: Point;

    /** The anchor mode used */
    anchorMode: LabelAnchorMode;

    /** Offset from the computed position (for manual adjustments) */
    offset: Vector;

    /** Which side of the chart */
    side: LabelSide;

    /** Estimated bounding box (for collision detection) */
    boundingBox: BoundingBox;

    /** Whether this label has been manually positioned */
    isManuallyPositioned: boolean;
}

// ============================================================================
// Leader Line Geometry
// ============================================================================

/**
 * Geometry for a leader line connecting a label to its slice.
 */
export interface LeaderLineGeometry {
    /** The slice ID this leader line belongs to */
    sliceId: string;

    /** The label index this leader line connects to */
    labelIndex: number;

    /** Starting point (on the slice edge) */
    startPoint: Point;

    /** Ending point (at the label) */
    endPoint: Point;

    /** Optional elbow point for bent leader lines */
    elbowPoint?: Point;

    /** The SVG path d attribute for rendering */
    pathData: string;
}

// ============================================================================
// Board Annotations (Custom Nodes)
// ============================================================================

export type AnnotationType = 'CIRCLE' | 'RECT' | 'TEXT' | 'ICON' | 'IMAGE';

/**
 * Custom annotation node on the chart board.
 */
export interface Annotation {
    /** Unique ID for the annotation */
    id: string;
    /** Category of annotation */
    type: AnnotationType;
    /** Relative X position to center */
    x: number;
    /** Relative Y position to center */
    y: number;
    /** Width for shapes/images */
    width?: number;
    /** Height for shapes/images */
    height?: number;
    /** Radius for circles */
    radius?: number;
    /** Custom text for labels */
    text?: string;
    /** Name of Lucide icon */
    iconName?: string;
    /** URL for external images */
    imageUrl?: string;
    /** Custom metadata */
    metadata?: Record<string, any>;
}

// ============================================================================
// Geometry Configuration
// ============================================================================

/**
 * Global configuration for pie chart geometry.
 */
export interface PieGeometryConfig {
    /** Center point of the chart */
    center: Point;

    /** Outer radius of the pie */
    outerRadius: number;

    /** Inner radius (0 for pie, > 0 for donut) */
    innerRadius: number;

    /** Starting angle in radians (default: -π/2, i.e., 12 o'clock) */
    startAngle: number;

    /** Ending angle in radians (default: 3π/2 for full circle) */
    endAngle: number;

    /** Padding between slices in radians */
    padAngle: number;

    /** Corner radius for rounded slice edges */
    cornerRadius: number;

    /** Default label anchor mode */
    labelAnchorMode: LabelAnchorMode;

    /** Default label radius offset from outer edge */
    labelRadiusOffset: number;

    /** Sort order for slices: 'none' | 'ascending' | 'descending' */
    sortOrder: 'none' | 'ascending' | 'descending';
}

/**
 * Default geometry configuration.
 */
export const DEFAULT_PIE_GEOMETRY_CONFIG: PieGeometryConfig = {
    center: { x: 0, y: 0 },
    outerRadius: 150,
    innerRadius: 0,
    startAngle: -Math.PI / 2, // 12 o'clock
    endAngle: Math.PI * 1.5,  // Full circle
    padAngle: 0.02,
    cornerRadius: 0,
    labelAnchorMode: 'outside',
    labelRadiusOffset: 30,
    sortOrder: 'none',
};

// ============================================================================
// Geometry Overrides
// ============================================================================

/**
 * Per-slice geometry overrides.
 * These are applied after initial geometry calculation.
 */
export interface SliceGeometryOverride {
    /** Explode offset amount (distance from center) */
    explodeAmount?: number;

    /** Override inner radius */
    innerRadius?: number;

    /** Override outer radius */
    outerRadius?: number;

    /** Radius offset (added to global outer radius) */
    outerRadiusOffset?: number;
}

/**
 * Per-label geometry overrides.
 */
export interface LabelGeometryOverride {
    /** Manual position offset from computed position */
    positionOffset?: Vector;

    /** Override anchor mode */
    anchorMode?: LabelAnchorMode;

    /** Mark as manually positioned */
    isManuallyPositioned?: boolean;

    /** Custom text for this label */
    text?: string;
}

/**
 * Container for all geometry overrides.
 */
export interface GeometryOverrides {
    slices: Map<string, SliceGeometryOverride>;
    labels: Map<string, LabelGeometryOverride>;
    annotations: Map<string, Annotation>;
}

/**
 * Creates an empty geometry overrides container.
 */
export function createEmptyOverrides(): GeometryOverrides {
    return {
        slices: new Map(),
        labels: new Map(),
        annotations: new Map(),
    };
}

// ============================================================================
// Geometry State
// ============================================================================

/**
 * Complete geometry state for a pie chart.
 * This is the output of the geometry layer.
 */
export interface PieGeometryState {
    /** Configuration used to generate this state */
    config: PieGeometryConfig;

    /** Geometry for each slice, keyed by slice ID */
    slices: Map<string, SliceGeometry>;

    /** Geometry for all labels */
    labels: LabelGeometry[];

    /** Geometry for all leader lines */
    leaderLines: LeaderLineGeometry[];

    /** Custom board annotations */
    annotations: Annotation[];

    /** Applied overrides */
    overrides: GeometryOverrides;

    /** Timestamp of last update (for debugging/optimization) */
    lastUpdated: number;
}

/**
 * Creates an empty geometry state.
 */
export function createEmptyGeometryState(config?: Partial<PieGeometryConfig>): PieGeometryState {
    return {
        config: { ...DEFAULT_PIE_GEOMETRY_CONFIG, ...config },
        slices: new Map(),
        labels: [],
        leaderLines: [],
        annotations: [],
        overrides: createEmptyOverrides(),
        lastUpdated: Date.now(),
    };
}
