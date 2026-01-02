/**
 * Visual Styling Layer - Public API
 */

export * from './types';
export * from './resolver';

import { resolveNodeStyle } from './resolver';
import type { SceneGraphState } from '../scene/types';
import type { ChartTheme, ResolvedStyle } from './types';

/**
 * Resolves styles for all nodes in a scene graph.
 */
export function resolveAllStyles(
    scene: SceneGraphState,
    theme: ChartTheme
): Map<string, ResolvedStyle> {
    const styles = new Map<string, ResolvedStyle>();

    // Track slice index for color rotation
    const sliceIds = Array.from(scene.nodes.values())
        .filter(n => n.dataId)
        .map(n => n.dataId!);
    const uniqueSliceIds = Array.from(new Set(sliceIds));

    scene.nodes.forEach((node) => {
        let sliceIndex = 0;
        if (node.dataId) {
            sliceIndex = uniqueSliceIds.indexOf(node.dataId);
        }
        styles.set(node.id, resolveNodeStyle(node, theme, sliceIndex));
    });

    return styles;
}
