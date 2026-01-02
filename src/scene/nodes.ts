/**
 * Scene Graph Layer - Tree Builder
 * 
 * RESPONSIBILITIES:
 * - Construct the default scene hierarchy for a pie chart
 * - Maintain object identity based on stable IDs from data/geometry
 * 
 * FORBIDDEN:
 * - No layout math
 * - No styling decisions
 */

import { NodeType } from './types';
import type { SceneNode } from './types';
import type { PieGeometryState } from '../geometry/types';

/**
 * Builds a scene graph from computed geometry.
 */
export function buildPieSceneGraph(geometry: PieGeometryState): SceneNode {
    const rootId = 'chart-root';

    const root: SceneNode = {
        id: rootId,
        type: NodeType.ROOT,
        parentId: null,
        children: [],
        transform: { x: geometry.config.center.x, y: geometry.config.center.y },
        interactive: true
    };

    const ringId = 'main-ring';
    const ring: SceneNode = {
        id: ringId,
        type: NodeType.RING,
        parentId: rootId,
        children: []
    };
    root.children.push(ring);

    // Add Slices
    geometry.slices.forEach((_, sliceId) => {
        const sliceGroupId = `${sliceId}-group`;

        const sliceGroup: SceneNode = {
            id: sliceGroupId,
            type: NodeType.SLICE_GROUP,
            parentId: ringId,
            children: [],
            dataId: sliceId,
            interactive: true
        };

        // The actual arc shape
        const arcNode: SceneNode = {
            id: `${sliceId}-arc`,
            type: NodeType.ARC,
            parentId: sliceGroupId,
            children: [],
            dataId: sliceId
        };
        sliceGroup.children.push(arcNode);

        // Percentage Label node (Layer 3)
        const pctNode: SceneNode = {
            id: `${sliceId}-pct`,
            type: NodeType.PERCENTAGE_LABEL,
            parentId: sliceGroupId,
            children: [],
            dataId: sliceId,
            interactive: true
        };
        sliceGroup.children.push(pctNode);

        ring.children.push(sliceGroup);
    });

    // Add Labels and Leader Lines
    const labelRootId = 'labels-layer';
    const labelLayer: SceneNode = {
        id: labelRootId,
        type: NodeType.ROOT,
        parentId: rootId,
        children: []
    };
    root.children.push(labelLayer);

    geometry.labels.forEach((labelGeo) => {
        const labelNode: SceneNode = {
            id: labelGeo.labelId,
            type: NodeType.LABEL,
            parentId: labelRootId,
            children: [],
            dataId: labelGeo.sliceId,
            interactive: true
        };
        labelLayer.children.push(labelNode);
    });

    geometry.leaderLines.forEach((lineGeo) => {
        const lineNode: SceneNode = {
            id: `leader-line-${lineGeo.sliceId}-${lineGeo.labelIndex}`,
            type: NodeType.LEADER_LINE,
            parentId: labelRootId,
            children: [],
            dataId: lineGeo.sliceId
        };
        labelLayer.children.push(lineNode);
    });

    // Center Container
    if (geometry.config.innerRadius > 0) {
        const centerId = 'center-container';
        const centerNode: SceneNode = {
            id: centerId,
            type: NodeType.CENTER_CONTAINER,
            parentId: rootId,
            children: [{
                id: 'center-content',
                type: NodeType.CENTER_CONTENT,
                parentId: centerId,
                children: []
            }]
        };
        root.children.push(centerNode);
    }

    // Add Annotations Layer
    if (geometry.annotations.length > 0) {
        const annotationRootId = 'annotations-layer';
        const annotationLayer: SceneNode = {
            id: annotationRootId,
            type: NodeType.ANNOTATION_ROOT,
            parentId: rootId,
            children: []
        };
        root.children.push(annotationLayer);

        geometry.annotations.forEach((anno) => {
            const annoNode: SceneNode = {
                id: anno.id,
                // Map geometry type to scene type
                type: anno.type as NodeType,
                parentId: annotationRootId,
                children: [],
                transform: { x: anno.x, y: anno.y },
                interactive: true
            };
            annotationLayer.children.push(annoNode);
        });
    }

    return root;
}
