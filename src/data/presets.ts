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
            dimensions: [
                { id: "category", label: "Item", type: "category" }
            ],
            measures: [
                { id: "value", label: "Value", type: "number", aggregation: "sum" }
            ],
            data: [
                { category: "Item 01", value: 29 },
                { category: "Item 02", value: 17 },
                { category: "Item 03", value: 27 },
                { category: "Item 04", value: 14 },
                { category: "Item 05", value: 13 }
            ],
            meta: {
                mapping: { x: "category", value: "value" }
            }
        },
        geometryConfig: {
            center: { x: 0, y: 0 },
            outerRadius: 160,
            innerRadius: 60,
            startAngle: -1.5707963267948966,
            endAngle: 4.71238898038469,
            padAngle: 0,
            cornerRadius: 0,
            labelAnchorMode: "outside",
            labelRadiusOffset: 49,
            sortOrder: "none"
        },
        overrides: {
            slices: new Map([
                ["slice-item-01", { outerRadiusOffset: 40 }],
                ["slice-item-02", { outerRadiusOffset: 0 }],
                ["slice-item-03", { outerRadiusOffset: 20 }],
                ["slice-item-04", { outerRadiusOffset: -20 }],
                ["slice-item-05", { outerRadiusOffset: -30 }]
            ]),
            labels: new Map([
                ["slice-item-01-label-0", {
                    positionOffset: { dx: -428, dy: 352 },
                    anchorMode: "edge",
                    isManuallyPositioned: true,
                    text: "Netflix"
                }],
                ["slice-item-03-label-0", {
                    positionOffset: { dx: -252, dy: 137 },
                    anchorMode: "edge",
                    isManuallyPositioned: true,
                    text: "Disney Plus"
                }],
                ["slice-item-02-label-0", {
                    positionOffset: { dx: 366, dy: 130 },
                    anchorMode: "edge",
                    isManuallyPositioned: true,
                    text: "Amazon Prime"
                }],
                ["slice-item-04-label-0", {
                    positionOffset: { dx: 101, dy: 273 },
                    anchorMode: "edge",
                    isManuallyPositioned: true,
                    text: "Hulu"
                }],
                ["slice-item-05-label-0", {
                    positionOffset: { dx: 133, dy: 417 },
                    anchorMode: "edge",
                    isManuallyPositioned: true,
                    text: "Others"
                }]
            ]),
            annotations: new Map([
                ["anno-1767380465262", { id: "anno-1767380465262", type: "CIRCLE", x: -300, y: 226, radius: 30 }],
                ["anno-1767380486760", { id: "anno-1767380486760", type: "CIRCLE", x: -86, y: 229, radius: 30 }],
                ["anno-1767380493194", { id: "anno-1767380493194", type: "CIRCLE", x: -198, y: 311, radius: 30 }],
                ["anno-1767380505811", { id: "anno-1767380505811", type: "CIRCLE", x: 48, y: 309, radius: 30 }],
                ["anno-1767380514110", { id: "anno-1767380514110", type: "CIRCLE", x: 118, y: 232, radius: 30 }]
            ])
        },
        theme: {
            primaryColors: ["#7bc9a4", "#55bda5", "#4d69b3", "#946cb3", "#fefefe"],
            backgroundColor: "#00042d",
            defaultTypography: {
                fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\", \"Noto Color Emoji\"",
                fontSize: 14,
                fontWeight: 500,
                fontColor: "#ffffff",
                textAnchor: "start"
            },
            nodeOverrides: new Map([
                ["center-container", { fill: "#0a1128" }],
                ["slice-item-05-label-0", { fontColor: "#ffffff" }],
                ["slice-item-01-label-0", { fontColor: "#ffffff" }],
                ["slice-item-03-label-0", { fontColor: "#ffffff" }],
                ["slice-item-02-label-0", { fontColor: "#ffffff" }],
                ["slice-item-04-label-0", { fontColor: "#ffffff" }],
                ["slice-item-01-arc", {
                    fill: {
                        type: "linear",
                        stops: [
                            { offset: 0.44, color: "#1da161" },
                            { offset: 1, color: "#5ff118" }
                        ],
                        angle: 81
                    },
                    strokeWidth: 0
                }],
                ["slice-item-03-arc", {
                    fill: {
                        type: "linear",
                        stops: [
                            { offset: 0.03, color: "#00c7fc" },
                            { offset: 0.66, color: "#0042aa" }
                        ],
                        angle: 292
                    },
                    strokeWidth: 0
                }],
                ["slice-item-02-arc", {
                    fill: {
                        type: "linear",
                        stops: [
                            { offset: 0, color: "#6366f1" },
                            { offset: 1, color: "#6366f1" }
                        ],
                        angle: 45
                    },
                    strokeWidth: 0
                }],
                ["slice-item-04-arc", {
                    fill: {
                        type: "linear",
                        stops: [
                            { offset: 0, color: "#946cb3" },
                            { offset: 1, color: "#6366f1" }
                        ],
                        angle: 311
                    },
                    strokeWidth: 0
                }],
                ["slice-item-05-arc", { strokeWidth: 0 }],
                ["anno-1767380465262", { fill: "#77bb41" }],
                ["anno-1767380486760", { fill: "#00c7fc" }],
                ["anno-1767380514110", { fill: "#4d22b3" }],
                ["anno-1767380493194", { fill: "#be38f3" }]
            ]),
            nodeTransforms: new Map([
                ["slice-item-01-label-0", { rotate: 1 }],
                ["slice-item-03-label-0", { y: 2, rotate: -2 }],
                ["anno-1767380465262", { y: 230, scale: 0.5 }],
                ["anno-1767380514110", { x: 120, y: 230, scale: 0.5 }],
                ["anno-1767380486760", { x: -90, y: 230, scale: 0.5 }],
                ["anno-1767380505811", { x: 5, y: 300, scale: 0.5 }],
                ["anno-1767380493194", { x: -193, y: 300, scale: 0.5 }],
                ["slice-item-04-label-0", { y: -1 }]
            ])
        }
    }
];
