/**
 * Scene Graph Layer - Type Definitions
 * 
 * This module defines the object-oriented structure of the chart.
 * It answers: "What objects exist and how are they related?"
 */

export const NodeType = {
    ROOT: 'ROOT',
    RING: 'RING',
    SLICE_GROUP: 'SLICE_GROUP',
    ARC: 'ARC',
    LABEL: 'LABEL',
    LEADER_LINE: 'LEADER_LINE',
    CENTER_CONTAINER: 'CENTER_CONTAINER',
    CENTER_CONTENT: 'CENTER_CONTENT',
    ANNOTATION_ROOT: 'ANNOTATION_ROOT',
    CIRCLE: 'CIRCLE',
    RECT: 'RECT',
    IMAGE: 'IMAGE',
    TEXT: 'TEXT',
    ICON: 'ICON',
    PERCENTAGE_LABEL: 'PERCENTAGE_LABEL'
} as const;

export type NodeType = (typeof NodeType)[keyof typeof NodeType];

/**
 * Base Scene Node interface.
 */
export interface SceneNode {
    /** Stable unique identifier */
    id: string;
    /** Type of node */
    type: NodeType;
    /** Parent node reference ID */
    parentId: string | null;
    /** Children nodes */
    children: SceneNode[];
    /** Reference to data ID if applicable */
    dataId?: string;
    /** Transformation metadata */
    transform?: {
        x: number;
        y: number;
        scale?: number;
        rotate?: number;
    };
    /** Interaction flags */
    interactive?: boolean;
    /** Visibility flag */
    visible?: boolean;
}

/**
 * Metadata for specific node types to link to geometry/styling.
 */
export interface SceneGraphState {
    root: SceneNode;
    /** Map for fast node lookup by ID */
    nodes: Map<string, SceneNode>;
    /** Timestamp for stability tracking */
    lastUpdated: number;
}
