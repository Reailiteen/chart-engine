/**
 * Visual Styling Layer - Type Definitions
 * 
 * This module defines the "Paint System".
 * It answers: "How does each object look?"
 */

export interface ColorStop {
    offset: number;
    color: string;
    opacity?: number;
}

export interface GradientStyle {
    type: 'linear' | 'radial';
    stops: ColorStop[];
    angle?: number; // for linear
    cx?: number;    // for radial
    cy?: number;
    r?: number;
}

export interface ShadowStyle {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
}

/**
 * Visual properties for a node.
 */
export interface NodeStyle {
    fill?: string | GradientStyle;
    fillOpacity?: number;
    stroke?: string;
    strokeWidth?: number;
    strokeDashArray?: string;
    opacity?: number;
    shadow?: ShadowStyle;

    // Typography for text nodes
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: string | number;
    fontColor?: string;
    textAnchor?: 'start' | 'middle' | 'end';

    // Icon support
    iconName?: string;
    iconSize?: number;
    iconColor?: string;

    /** Tailwind or custom CSS classes */
    className?: string;
}

/**
 * A ResolvedStyle is one that's ready for the renderer (no missing props).
 */
export interface ResolvedStyle extends Required<Omit<NodeStyle, 'fill' | 'shadow' | 'className' | 'iconName' | 'iconSize' | 'iconColor'>> {
    fill: string | GradientStyle;
    shadow?: ShadowStyle;
    className?: string;
    iconName?: string;
    iconSize?: number;
    iconColor?: string;
}

/**
 * Transformation overrides for a node.
 */
export interface NodeTransform {
    x?: number;
    y?: number;
    scale?: number;
    rotate?: number;
}

/**
 * Theme configuration.
 */
export interface ChartTheme {
    primaryColors: string[];
    backgroundColor: string;
    defaultTypography: {
        fontFamily: string;
        fontSize: number;
        fontWeight?: string | number;
        fontColor: string;
        textAnchor?: 'start' | 'middle' | 'end';
    };
    nodeOverrides: Map<string, NodeStyle>;
    nodeTransforms: Map<string, NodeTransform>;
}
