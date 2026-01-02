import { ChartData } from './types';
import { PieGeometryConfig, GeometryOverrides } from '../geometry/types';
import { ChartTheme, NodeStyle, NodeTransform } from '../styles/types';

type PresetTheme = Omit<Partial<ChartTheme>, 'nodeOverrides' | 'nodeTransforms'> & {
    nodeOverrides?: Map<string, NodeStyle> | Record<string, Partial<NodeStyle>>;
    nodeTransforms?: Map<string, NodeTransform> | Record<string, Partial<NodeTransform>>;
};

export interface ChartPreset {
    id: string;
    label: string;
    description: string;
    data: ChartData;
    geometryConfig: Partial<PieGeometryConfig>;
    overrides?: any; // Simplified for now
    theme: PresetTheme;
}


export const PRESETS: ChartPreset[] = [
    {
        id: 'polar-core',
        label: 'Polar Core',
        description: 'Multi-radius variable polar chart with dark aesthetic',
        data: {
            dimensions: [{ id: 'category', label: 'Item', type: 'category' }],
            measures: [{ id: 'value', label: 'Value', type: 'number', aggregation: 'sum' }],
            data: [
                { category: 'Item 01', value: 29 },
                { category: 'Item 02', value: 17 },
                { category: 'Item 03', value: 27 },
                { category: 'Item 04', value: 14 },
                { category: 'Item 05', value: 13 }
            ],
            meta: { mapping: { x: 'category', value: 'value' } }
        },
        geometryConfig: {
            center: { x: 0, y: 0 },
            outerRadius: 160,
            innerRadius: 60,
            startAngle: -1.5707963267948966,
            endAngle: 4.71238898038469,
            padAngle: 0,
            cornerRadius: 0,
            labelAnchorMode: 'outside',
            labelRadiusOffset: 49,
            sortOrder: 'none'
        },
        overrides: {
            slices: new Map([
                ['slice-item-01', { outerRadiusOffset: 40 }],
                ['slice-item-02', { outerRadiusOffset: 0 }],
                ['slice-item-03', { outerRadiusOffset: 20 }],
                ['slice-item-04', { outerRadiusOffset: -20 }],
                ['slice-item-05', { outerRadiusOffset: -30 }]
            ]),
            labels: new Map([
                ['slice-item-01-label-0', { text: 'Netflix' }],
                ['slice-item-03-label-0', { text: 'Disney Plus' }],
                ['slice-item-02-label-0', { text: 'Amazon Prime' }],
                ['slice-item-04-label-0', { text: 'Hulu' }],
                ['slice-item-05-label-0', { text: 'Others' }]
            ]),
            annotations: new Map()
        },
        theme: {
            backgroundColor: '#00042d',
            containerColor: '#00042D',
            primaryColors: ['#7bc9a4', '#55bda5', '#4d69b3', '#946cb3', '#fefefe'],
            defaultTypography: {
                fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
                fontSize: 14,
                fontColor: '#1e293b'
            },
            nodeOverrides: new Map([
                ['center-container', { fill: '#0a1128' }],
                ['slice-item-05-label-0', { fontColor: '#ffffff' }],
                ['slice-item-01-label-0', { stroke: '#ffffff', fontColor: '#ffffff' }],
                ['slice-item-03-label-0', { stroke: '#ffffff', fontColor: '#ffffff' }],
                ['slice-item-02-label-0', { stroke: '#ffffff', fontColor: '#ffffff', fontSize: 13 }],
                ['slice-item-04-label-0', { fontSize: 14, fontColor: '#ffffff' }],
                ['slice-item-01-arc', { strokeWidth: 0 }],
                ['slice-item-03-arc', { strokeWidth: 0 }],
                ['slice-item-02-arc', { strokeWidth: 0 }],
                ['slice-item-04-arc', { strokeWidth: 0 }],
                ['slice-item-05-arc', { strokeWidth: 0 }]
            ]),
            nodeTransforms: new Map([
                ['slice-item-01-label-0', { rotate: 1 }],
                ['slice-item-03-label-0', { rotate: -2 }]
            ])
        }
    },
    {
        id: 'modern-ring',
        label: 'Modern Ring',
        description: 'Clean minimalist donut with soft shadows',
        data: {
            dimensions: [{ id: 'category', label: 'Category', type: 'category' }],
            measures: [{ id: 'value', label: 'Value', type: 'number', aggregation: 'sum' }],
            data: [
                { category: 'Design', value: 40 },
                { category: 'Research', value: 30 },
                { category: 'Build', value: 20 },
                { category: 'Launch', value: 10 }
            ],
            meta: { mapping: { x: 'category', value: 'value' } }
        },
        geometryConfig: {
            innerRadius: 140,
            outerRadius: 160,
            padAngle: 0.1,
            cornerRadius: 10
        },
        theme: {
            backgroundColor: '#ffffff',
            containerColor: 'rgba(255, 255, 255, 0.4)',
            primaryColors: ['#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1'],
            nodeOverrides: new Map([
                ['arc-slice-design', { fill: '#6366f1', shadow: { color: 'rgba(99, 102, 241, 0.2)', blur: 20, offsetX: 0, offsetY: 10 } }],
                ['arc-slice-research', { fill: '#8b5cf6', shadow: { color: 'rgba(139, 92, 246, 0.2)', blur: 20, offsetX: 0, offsetY: 10 } }],
                ['arc-slice-build', { fill: '#ec4899', shadow: { color: 'rgba(236, 72, 153, 0.2)', blur: 20, offsetX: 0, offsetY: 10 } }],
                ['arc-slice-launch', { fill: '#f43f5e', shadow: { color: 'rgba(244, 63, 94, 0.2)', blur: 20, offsetX: 0, offsetY: 10 } }]
            ])
        }
    },
    {
        id: 'neon-burst',
        label: 'Neon Burst',
        description: 'Exploded high-contrast neon aesthetic',
        data: {
            dimensions: [{ id: 'category', label: 'Status', type: 'category' }],
            measures: [{ id: 'value', label: 'Power', type: 'number', aggregation: 'sum' }],
            data: [
                { category: 'Active', value: 100 },
                { category: 'Pending', value: 80 },
                { category: 'Warning', value: 60 }
            ],
            meta: { mapping: { x: 'category', value: 'value' } }
        },
        geometryConfig: {
            innerRadius: 20,
            outerRadius: 120,
            padAngle: 0.05,
            cornerRadius: 4
        },
        overrides: {
            slices: [
                { sliceId: 'slice-active', outerRadiusOffset: 30 },
                { sliceId: 'slice-pending', outerRadiusOffset: 15 },
                { sliceId: 'slice-warning', outerRadiusOffset: 0 }
            ]
        },
        theme: {
            backgroundColor: '#000000',
            containerColor: 'rgba(255, 255, 255, 0.1)',
            primaryColors: ['#00ffcc', '#ff0066', '#ffff00'],
            nodeOverrides: new Map([
                ['arc-slice-active', { shadow: { color: '#00ffcc', blur: 40, offsetX: 0, offsetY: 0 }, fillOpacity: 0.8 }],
                ['arc-slice-pending', { shadow: { color: '#ff0066', blur: 40, offsetX: 0, offsetY: 0 }, fillOpacity: 0.8 }],
                ['arc-slice-warning', { shadow: { color: '#ffff00', blur: 40, offsetX: 0, offsetY: 0 }, fillOpacity: 0.8 }]
            ])
        }
    },
    {
        id: 'exploded-aurora',
        label: 'Exploded Aurora',
        description: 'Dramatic exploded pie with edge-anchored labels',
        data: {
            dimensions: [{ id: 'category', label: 'Item', type: 'category' }],
            measures: [{ id: 'value', label: 'Value', type: 'number', aggregation: 'sum' }],
            data: [
                { category: 'Item 01', value: 29 },
                { category: 'Item 02', value: 17 },
                { category: 'Item 03', value: 27 },
                { category: 'Item 04', value: 14 },
                { category: 'Item 05', value: 13 }
            ],
            meta: { mapping: { x: 'category', value: 'value' } }
        },
        geometryConfig: {
            center: { x: 0, y: 0 },
            outerRadius: 160,
            innerRadius: 60,
            startAngle: -1.5707963267948966,
            endAngle: 4.71238898038469,
            padAngle: 0,
            cornerRadius: 0,
            labelAnchorMode: 'outside',
            labelRadiusOffset: 49,
            sortOrder: 'none'
        },
        overrides: {
            slices: {
                'slice-item-01': { outerRadiusOffset: 70 },
                'slice-item-02': { outerRadiusOffset: 23 },
                'slice-item-03': { outerRadiusOffset: 41 },
                'slice-item-04': { outerRadiusOffset: -30 },
                'slice-item-05': { outerRadiusOffset: -33 }
            },
            labels: {
                'slice-item-01-label-0': {
                    positionOffset: { dx: -360, dy: 362 },
                    anchorMode: 'edge',
                    isManuallyPositioned: true
                },
                'slice-item-02-label-0': {
                    positionOffset: { dx: 165, dy: 109 },
                    anchorMode: 'edge',
                    isManuallyPositioned: true
                },
                'slice-item-03-label-0': {
                    positionOffset: { dx: 45, dy: 39 },
                    anchorMode: 'edge',
                    isManuallyPositioned: true
                },
                'slice-item-04-label-0': {
                    positionOffset: { dx: 103, dy: 314 },
                    anchorMode: 'edge',
                    isManuallyPositioned: true
                },
                'slice-item-05-label-0': {
                    positionOffset: { dx: 160, dy: 384 },
                    anchorMode: 'edge',
                    isManuallyPositioned: true
                }
            },
            annotations: {}
        },
        theme: {
            primaryColors: ['#7bc9a4', '#55bda5', '#4d69b3', '#946cb3', '#fefefe'],
            backgroundColor: '#00042d',
            containerColor: '#00042D',
            defaultTypography: {
                fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
                fontSize: 14,
                fontColor: '#1e293b'
            },
            nodeOverrides: {
                'center-container': { fill: '#0a1128' },
                'slice-item-01-label-0': { stroke: '#ffffff' },
                'slice-item-02-label-0': { stroke: '#ffffff' },
                'slice-item-03-label-0': { stroke: '#ffffff' },
                'slice-item-01-arc': { strokeWidth: 0 },
                'slice-item-02-arc': { strokeWidth: 0 },
                'slice-item-03-arc': { strokeWidth: 0 },
                'slice-item-04-arc': { strokeWidth: 0 },
                'slice-item-05-arc': { strokeWidth: 0 },
                'slice-item-01-pct': { fill: '#ffffff', stroke: '#ffffff' }
            },
            nodeTransforms: {
                'slice-item-01-pct': { x: 86, y: -88, scale: 1, rotate: 2 },
                'slice-item-02-pct': { x: -81, y: 49 },
                'slice-item-03-pct': { x: 137, y: 22 },
                'slice-item-04-pct': { x: -91, y: -23 },
                'slice-item-05-pct': { x: -51, y: -63 }
            }
        }
    }
];
