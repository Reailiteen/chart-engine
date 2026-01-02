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
    }
];
