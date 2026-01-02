import { z } from 'zod';

export const ColorStopSchema = z.object({
    offset: z.number().min(0).max(1),
    color: z.string(),
    opacity: z.number().min(0).max(1).optional(),
});

export const GradientStyleSchema = z.object({
    type: z.enum(['linear', 'radial']),
    stops: z.array(ColorStopSchema),
    angle: z.number().optional(),
});

export const FillSchema = z.union([
    z.string(), // Solid hex/rgb color
    GradientStyleSchema,
    z.object({ type: z.literal('image'), url: z.string() })
]);

export const ShadowStyleSchema = z.object({
    color: z.string(),
    blur: z.number(),
    offsetX: z.number(),
    offsetY: z.number(),
});

export const TypographySchema = z.object({
    fontFamily: z.string().default('Inter, system-ui, sans-serif'),
    fontSize: z.number().default(14),
    fontWeight: z.union([z.string(), z.number()]).default(500),
    fontColor: z.string().default('#1e293b'),
    textAnchor: z.enum(['start', 'middle', 'end']).default('start'),
    lineHeight: z.number().optional(),
    letterSpacing: z.string().optional(),
    textTransform: z.enum(['none', 'uppercase', 'lowercase', 'capitalize']).optional(),
});

export const NodeStyleSchema = z.object({
    fill: FillSchema.optional(),
    fillOpacity: z.number().min(0).max(1).optional(),
    stroke: z.string().optional(),
    strokeWidth: z.number().optional(),
    strokeDashArray: z.string().optional(),
    opacity: z.number().min(0).max(1).optional(),
    shadow: ShadowStyleSchema.optional(),
    typography: TypographySchema.optional(),
    className: z.string().optional(),
});

export const ChartThemeSchema = z.object({
    primaryColors: z.array(z.string()),
    backgroundColor: z.string(),
    defaultTypography: TypographySchema,
    nodeOverrides: z.record(z.string(), NodeStyleSchema),
    nodeTransforms: z.record(z.string(), z.object({
        x: z.number().optional(),
        y: z.number().optional(),
        scale: z.number().optional(),
        rotate: z.number().optional(),
    })),
});
