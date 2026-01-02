/**
 * Visual Styling Layer - Default Tokens and Style Resolver
 * 
 * RESPONSIBILITIES:
 * - Map nodes to visual styles based on hierarchy and theme
 * - Handle color assignments for data-bound slices
 * 
 * FORBIDDEN:
 * - No layout logic
 * - No SVG path generation
 */

import type { NodeStyle, ResolvedStyle, ChartTheme } from './types';
import { NodeType } from '../scene/types';
import type { SceneNode } from '../scene/types';

export const DEFAULT_PALETTE = [
    '#4E79A7', '#F28E2B', '#E15759', '#76B7B2', '#59A14F',
    '#EDC948', '#B07AA1', '#FF9DA7', '#9C755F', '#BAB0AC'
];

export const DEFAULT_THEME: ChartTheme = {
    primaryColors: DEFAULT_PALETTE,
    backgroundColor: '#FFFFFF',
    defaultTypography: {
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
        fontSize: 14,
        fontColor: '#1e293b' // slate-800
    },
    nodeOverrides: new Map(),
    nodeTransforms: new Map()
};

/**
 * Resolves the visual style for a specific node.
 */
export function resolveNodeStyle(
    node: SceneNode,
    theme: ChartTheme,
    sliceIndex: number = 0
): ResolvedStyle {
    const base: NodeStyle = {
        fill: 'none',
        fillOpacity: 1,
        stroke: 'none',
        strokeWidth: 0,
        opacity: 1,
        fontFamily: theme.defaultTypography.fontFamily,
        fontSize: theme.defaultTypography.fontSize,
        fontColor: theme.defaultTypography.fontColor,
        textAnchor: 'middle'
    };

    // Type-based defaults
    if (node.type === NodeType.ARC) {
        base.fill = theme.primaryColors[sliceIndex % theme.primaryColors.length];
        base.stroke = '#FFFFFF';
        base.strokeWidth = 2;
        base.className = 'hover:fill-opacity-80 cursor-pointer';
    } else if (node.type === NodeType.LABEL) {
        base.fill = theme.defaultTypography.fontColor;
        base.fontSize = 14;
        base.fontWeight = 600;
        base.className = 'select-none cursor-pointer hover:font-black';
    } else if (node.type === NodeType.LEADER_LINE) {
        base.stroke = '#999999';
        base.strokeWidth = 1;
    } else if (node.type === NodeType.CENTER_CONTAINER) {
        base.fill = '#FFFFFF';
    } else if (node.type === NodeType.CIRCLE || node.type === NodeType.RECT) {
        base.fill = '#E2E8F0'; // slate-200
        base.stroke = '#94A3B8'; // slate-400
        base.strokeWidth = 1;
    } else if (node.type === NodeType.IMAGE) {
        base.opacity = 1;
    } else if (node.type === NodeType.PERCENTAGE_LABEL) {
        base.fontColor = theme.backgroundColor === '#FFFFFF' ? '#000000' : '#FFFFFF';
        base.fontSize = 12;
        base.fontWeight = 900;
        base.textAnchor = 'middle';
    }

    // Apply overrides from theme if any
    const override = theme.nodeOverrides.get(node.id);

    const merged = { ...base, ...override };

    return {
        ...merged,
        fill: merged.fill!,
        fillOpacity: merged.fillOpacity!,
        stroke: merged.stroke!,
        strokeWidth: merged.strokeWidth!,
        strokeDashArray: merged.strokeDashArray ?? "",
        opacity: merged.opacity!,
        fontFamily: merged.fontFamily!,
        fontSize: merged.fontSize!,
        fontWeight: merged.fontWeight ?? 400,
        fontColor: merged.fontColor!,
        textAnchor: merged.textAnchor!,
        iconName: merged.iconName,
        iconSize: merged.iconSize,
        iconColor: merged.iconColor,
        className: merged.className
    };
}
