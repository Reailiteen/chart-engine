import { z } from 'zod';

export const PointSchema = z.object({
    x: z.number(),
    y: z.number(),
});

export const VectorSchema = z.object({
    dx: z.number(),
    dy: z.number(),
});

export const LabelAnchorModeSchema = z.enum(['centroid', 'edge', 'outside']);

export const GeometryConfigSchema = z.object({
    center: PointSchema,
    outerRadius: z.number().min(0),
    innerRadius: z.number().min(0),
    startAngle: z.number(),
    endAngle: z.number(),
    padAngle: z.number().min(0),
    cornerRadius: z.number().min(0),
    labelAnchorMode: LabelAnchorModeSchema,
    labelRadiusOffset: z.number(),
    sortOrder: z.enum(['none', 'ascending', 'descending']),
});

export const SliceGeometryOverrideSchema = z.object({
    explodeAmount: z.number().optional(),
    innerRadius: z.number().optional(),
    outerRadius: z.number().optional(),
    outerRadiusOffset: z.number().optional(),
});

export const LabelGeometryOverrideSchema = z.object({
    positionOffset: VectorSchema.optional(),
    anchorMode: LabelAnchorModeSchema.optional(),
    isManuallyPositioned: z.boolean().optional(),
    text: z.string().optional(), // Support custom label names
});

export const AnnotationSchema = z.object({
    id: z.string(),
    type: z.enum(['CIRCLE', 'RECT', 'TEXT', 'ICON', 'IMAGE']),
    x: z.number(),
    y: z.number(),
    width: z.number().optional(),
    height: z.number().optional(),
    radius: z.number().optional(),
    text: z.string().optional(),
    iconName: z.string().optional(),
    imageUrl: z.string().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
});

export const GeometryOverridesSchema = z.object({
    slices: z.record(z.string(), SliceGeometryOverrideSchema),
    labels: z.record(z.string(), LabelGeometryOverrideSchema),
    annotations: z.record(z.string(), AnnotationSchema),
});
