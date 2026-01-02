/**
 * Scene Graph Layer - Public API
 */

export * from './types';
export * from './nodes';

import { buildPieSceneGraph as build } from './nodes';
import type { PieGeometryState } from '../geometry/types';
import type { SceneGraphState, SceneNode } from './types';
import type { ChartTheme } from '../styles/types';

export function resolveSceneGraph(geometry: PieGeometryState, theme: ChartTheme): SceneGraphState {
    const root = build(geometry);
    const nodes = new Map<string, SceneNode>();

    const traverse = (node: SceneNode) => {
        // Apply transform overrides from theme if they exist
        const transformOverride = theme.nodeTransforms.get(node.id);
        if (transformOverride) {
            const base = node.transform || { x: 0, y: 0, scale: 1, rotate: 0 };
            node.transform = {
                x: transformOverride.x ?? base.x,
                y: transformOverride.y ?? base.y,
                scale: transformOverride.scale ?? base.scale,
                rotate: transformOverride.rotate ?? base.rotate
            };
        }

        nodes.set(node.id, node);
        node.children.forEach(traverse);
    };

    traverse(root);

    return {
        root,
        nodes,
        lastUpdated: Date.now()
    };
}
