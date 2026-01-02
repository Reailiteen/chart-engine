import { z } from 'zod';

export const TransformSchema = z.object({
    x: z.number().default(0),
    y: z.number().default(0),
    scale: z.number().default(1),
    rotate: z.number().default(0),
});

export const NodeTypeSchema = z.enum([
    'ROOT',
    'RING',
    'SLICE_GROUP',
    'ARC',
    'LABEL',
    'LEADER_LINE',
    'CENTER_CONTAINER',
    'CENTER_CONTENT',
    'ANNOTATION_ROOT',
    'CIRCLE',
    'RECT',
    'TEXT',
    'IMAGE',
    'ICON',
    'PERCENTAGE_LABEL'
]);

// Use lazy schema for recursive children
export const SceneNodeSchema: z.ZodType<any> = z.lazy(() => z.object({
    id: z.string(),
    type: NodeTypeSchema,
    parentId: z.string().nullable(),
    children: z.array(SceneNodeSchema),
    dataId: z.string().optional(),
    transform: TransformSchema.optional(),
    interactive: z.boolean().default(true),
    visible: z.boolean().default(true),
    locked: z.boolean().default(false),
    zIndex: z.number().default(0),
}));

export const SceneGraphSchema = z.object({
    root: SceneNodeSchema,
    nodes: z.record(z.string(), SceneNodeSchema),
    lastUpdated: z.number(),
});
