'use client';

/**
 * SVG Renderer - Stateless Component
 * 
 * RESPONSIBILITIES:
 * - Recursively render the scene graph into SVG elements
 * - Map node types to specific SVG tags (path, text, g)
 * - Map ResolvedStyles to SVG attributes
 * 
 * FORBIDDEN:
 * - No layout logic
 * - No data processing
 */

import React from 'react';
import { NodeType } from '../scene/types';
import type { SceneNode, SceneGraphState } from '../scene/types';
import type { PieGeometryState, LabelGeometry, LeaderLineGeometry } from '../geometry/types';
import type { ResolvedStyle, GradientStyle } from '../styles/types';
import * as LucideIcons from 'lucide-react';

interface SVGRendererProps {
    scene: SceneGraphState;
    geometry: PieGeometryState;
    styles: Map<string, ResolvedStyle>;
    width: number;
    height: number;
    onNodeDragStart?: (nodeId: string, event: React.PointerEvent) => void;
    onNodeClick?: (nodeId: string) => void;
    uiMode?: 'light' | 'dark';
}

export const SVGRenderer: React.FC<SVGRendererProps> = ({
    scene,
    geometry,
    styles,
    width,
    height,
    onNodeDragStart,
    onNodeClick,
    uiMode = 'light'
}) => {
    const renderNode = (node: SceneNode): React.ReactNode => {
        const style = styles.get(node.id);
        if (!style && node.type !== NodeType.ROOT && node.type !== NodeType.RING && node.type !== NodeType.SLICE_GROUP) {
            return null;
        }

        const { x = 0, y = 0, scale = 1, rotate = 0 } = node.transform || {};
        const transform = `translate(${x},${y}) scale(${scale}) rotate(${rotate})`;

        switch (node.type) {
            case NodeType.ROOT:
            case NodeType.RING:
            case NodeType.SLICE_GROUP:
                return (
                    <g
                        key={node.id}
                        id={node.id}
                        transform={transform}
                        opacity={style?.opacity ?? 1}
                        onClick={(e) => {
                            // Only select group if not clicking a child
                            if (e.target === e.currentTarget) {
                                e.stopPropagation();
                                onNodeClick?.(node.id);
                            }
                        }}
                    >
                        {node.children.map(renderNode)}
                    </g>
                );

            case NodeType.ARC: {
                const sliceId = node.dataId!;
                const sliceGeo = geometry.slices.get(sliceId);
                if (!sliceGeo) return null;

                const shadowFilter = style?.shadow
                    ? `drop-shadow(${style.shadow.offsetX}px ${style.shadow.offsetY}px ${style.shadow.blur}px ${style.shadow.color})`
                    : 'none';

                return (
                    <path
                        key={node.id}
                        id={node.id}
                        d={sliceGeo.pathData}
                        fill={typeof style?.fill === 'string' ? style.fill : `url(#grad-${node.id})`}
                        fillOpacity={style?.fillOpacity}
                        stroke={style?.stroke}
                        strokeWidth={style?.strokeWidth}
                        strokeDasharray={style?.strokeDashArray}
                        transform={transform}
                        onPointerDown={(e) => {
                            if (node.interactive) {
                                onNodeDragStart?.(node.id, e);
                            }
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onNodeClick?.(node.id);
                        }}
                        className={`transition-all duration-300 ease-in-out cursor-pointer hover:stroke-sky-400 hover:stroke-[3px] ${style?.className || ''}`}
                        style={{ filter: shadowFilter }}
                    />
                );
            }

            case NodeType.LABEL: {
                const sliceId = node.dataId!;
                const labelGeo = geometry.labels.find(l => l.labelId === node.id);
                if (!labelGeo) return null;

                const labelOverride = geometry.overrides.labels.get(node.id);
                const labelText = labelOverride?.text || sliceId.replace('slice-', '');

                // For labels, we want local transforms (scale/rotate in place)
                // So we translate the group to the anchor point, and then apply node transforms
                return (
                    <g
                        key={node.id}
                        transform={`translate(${labelGeo.anchorPoint.x}, ${labelGeo.anchorPoint.y})`}
                    >
                        <text
                            id={node.id}
                            x={0}
                            y={0}
                            transform={transform}
                            fill={style?.fontColor || (typeof style?.fill === 'string' ? style.fill : '#000')}
                            fontFamily={style?.fontFamily}
                            fontSize={style?.fontSize}
                            fontWeight={style?.fontWeight}
                            textAnchor={labelGeo.side === 'right' ? 'start' : 'end'}
                            dominantBaseline="middle"
                            onPointerDown={(e) => onNodeDragStart?.(node.id, e)}
                            onClick={(e) => {
                                e.stopPropagation();
                                onNodeClick?.(node.id);
                            }}
                            className={`cursor-move select-none touch-none hover:fill-sky-500 ${onNodeDragStart ? 'transition-none' : 'transition-all duration-300 ease-in-out'} ${style?.className || ''}`}
                        >
                            {labelText}
                        </text>
                    </g>
                );
            }

            case NodeType.LEADER_LINE: {
                const lineGeo = geometry.leaderLines.find(l => `leader-line-${l.sliceId}-${l.labelIndex}` === node.id);
                if (!lineGeo) return null;

                return (
                    <g key={node.id} transform={transform}>
                        <path
                            id={node.id}
                            d={lineGeo.pathData}
                            fill="none"
                            stroke={style?.stroke}
                            strokeWidth={(style?.strokeWidth || 1) + 10} // Hit area boost
                            strokeOpacity={0}
                            onClick={(e) => {
                                e.stopPropagation();
                                onNodeClick?.(node.id);
                            }}
                            className="cursor-pointer"
                        />
                        <path
                            key={`${node.id}-visible`}
                            d={lineGeo.pathData}
                            fill="none"
                            stroke={style?.stroke}
                            strokeWidth={style?.strokeWidth}
                            className={`transition-all duration-300 ease-in-out pointer-events-none ${style?.className || ''}`}
                        />
                    </g>
                );
            }

            case NodeType.ANNOTATION_ROOT:
                return (
                    <g key={node.id} id={node.id} transform={transform}>
                        {node.children.map(renderNode)}
                    </g>
                );

            case NodeType.CIRCLE: {
                const anno = geometry.annotations.find(a => a.id === node.id);
                return (
                    <circle
                        key={node.id}
                        id={node.id}
                        cx={0}
                        cy={0}
                        r={anno?.radius ?? 20}
                        transform={transform}
                        fill={typeof style?.fill === 'string' ? style.fill : `url(#grad-${node.id})`}
                        fillOpacity={style?.fillOpacity}
                        stroke={style?.stroke}
                        strokeWidth={style?.strokeWidth}
                        onClick={(e) => {
                            e.stopPropagation();
                            onNodeClick?.(node.id);
                        }}
                        onPointerDown={(e) => onNodeDragStart?.(node.id, e)}
                        className={`cursor-pointer transition-all hover:stroke-sky-400 ${style?.className || ''}`}
                    >
                        <title>Circle Annotation {node.id}</title>
                    </circle>
                );
            }

            case NodeType.RECT: {
                const anno = geometry.annotations.find(a => a.id === node.id);
                const w = anno?.width ?? 40;
                const h = anno?.height ?? 40;
                return (
                    <rect
                        key={node.id}
                        id={node.id}
                        x={-w / 2}
                        y={-h / 2}
                        width={w}
                        height={h}
                        transform={transform}
                        fill={typeof style?.fill === 'string' ? style.fill : `url(#grad-${node.id})`}
                        fillOpacity={style?.fillOpacity}
                        stroke={style?.stroke}
                        strokeWidth={style?.strokeWidth}
                        onClick={(e) => {
                            e.stopPropagation();
                            onNodeClick?.(node.id);
                        }}
                        onPointerDown={(e) => onNodeDragStart?.(node.id, e)}
                        className={`cursor-pointer transition-all hover:stroke-sky-400 ${style?.className || ''}`}
                    >
                        <title>Rectangle Annotation {node.id}</title>
                    </rect>
                );
            }

            case NodeType.IMAGE: {
                const anno = geometry.annotations.find(a => a.id === node.id);
                const w = anno?.width ?? 40;
                const h = anno?.height ?? 40;
                return (
                    <g key={node.id} transform={transform}>
                        {anno?.imageUrl ? (
                            <image
                                id={node.id}
                                href={anno.imageUrl}
                                x={-w / 2}
                                y={-h / 2}
                                width={w}
                                height={h}
                                aria-label={`Image Annotation ${node.id}`}
                                role="img"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onNodeClick?.(node.id);
                                }}
                                onPointerDown={(e) => onNodeDragStart?.(node.id, e)}
                                className="cursor-pointer"
                            >
                                <title>Image Annotation {node.id}</title>
                            </image>
                        ) : (
                            <rect
                                id={node.id}
                                x={-w / 2}
                                y={-h / 2}
                                width={w}
                                height={h}
                                fill="#eee"
                                stroke="#ccc"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onNodeClick?.(node.id);
                                }}
                                className="cursor-pointer"
                            >
                                <title>Image placeholder {node.id}</title>
                            </rect>
                        )}
                    </g>
                );
            }

            case NodeType.TEXT: {
                const anno = geometry.annotations.find(a => a.id === node.id);
                return (
                    <text
                        key={node.id}
                        id={node.id}
                        x={0}
                        y={0}
                        transform={transform}
                        fill={style?.fontColor || (typeof style?.fill === 'string' ? style.fill : '#000')}
                        fontFamily={style?.fontFamily}
                        fontSize={style?.fontSize}
                        fontWeight={style?.fontWeight}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        onClick={(e) => {
                            e.stopPropagation();
                            onNodeClick?.(node.id);
                        }}
                        onPointerDown={(e) => onNodeDragStart?.(node.id, e)}
                        className={`cursor-pointer select-none transition-all hover:fill-sky-500 ${style?.className || ''}`}
                    >
                        {anno?.text || 'Text Box'}
                    </text>
                );
            }

            case NodeType.PERCENTAGE_LABEL: {
                const sliceGeo = geometry.slices.get(node.dataId!);
                if (!sliceGeo) return null;

                const totalAngle = Math.abs(geometry.config.endAngle - geometry.config.startAngle);
                const sliceAngle = Math.abs(sliceGeo.endAngle - sliceGeo.startAngle);
                const percentage = Math.round((sliceAngle / totalAngle) * 100);

                const x = sliceGeo.centroid.x;
                const y = sliceGeo.centroid.y;

                return (
                    <text
                        key={node.id}
                        id={node.id}
                        x={x}
                        y={y}
                        transform={transform}
                        fill={style?.fontColor || (typeof style?.fill === 'string' ? style.fill : '#000')}
                        stroke={style?.stroke}
                        strokeWidth={style?.strokeWidth}
                        fontSize={style?.fontSize}
                        fontWeight={style?.fontWeight}
                        textAnchor={style?.textAnchor as any}
                        dominantBaseline="middle"
                        onClick={(e) => {
                            e.stopPropagation();
                            onNodeClick?.(node.id);
                        }}
                        onPointerDown={(e) => onNodeDragStart?.(node.id, e)}
                        className={`cursor-pointer select-none pointer-events-auto ${style?.className || ''}`}
                        style={{
                            textShadow: uiMode === 'dark' ? '0 1px 4px rgba(0,0,0,0.5)' : 'none',
                            opacity: node.visible === false ? 0 : 1
                        }}
                    >
                        {percentage}%
                    </text>
                );
            }

            case NodeType.ICON: {
                return (
                    <g
                        key={node.id}
                        transform={transform}
                        onClick={(e) => {
                            e.stopPropagation();
                            onNodeClick?.(node.id);
                        }}
                        onPointerDown={(e) => onNodeDragStart?.(node.id, e)}
                        className="cursor-pointer"
                    >
                        {renderIconNode(node, style!)}
                    </g>
                );
            }

            default:
                return null;
        }
    };

    /**
     * Helper to render Lucide icons in SVG
     */
    const renderIconNode = (node: SceneNode, style: ResolvedStyle) => {
        if (!style.iconName) return null;
        const IconComponent = (LucideIcons as any)[style.iconName];
        if (!IconComponent) return null;

        const { x = 0, y = 0, scale = 1, rotate = 0 } = node.transform || {};
        const size = style.iconSize || 24;

        return (
            <g transform={`translate(${x - size / 2}, ${y - size / 2}) scale(${scale}) rotate(${rotate})`}>
                <IconComponent
                    size={size}
                    color={style.iconColor || 'currentColor'}
                    strokeWidth={1.5}
                />
            </g>
        );
    };

    /**
     * Collect all gradients from the styles to define them in <defs>
     */
    const gradients = Array.from(styles.entries())
        .filter(([_, style]) => typeof style.fill !== 'string')
        .map(([id, style]) => ({ id, gradient: style.fill as GradientStyle }));

    return (
        <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className="overflow-visible"
        >
            <defs>
                {gradients.map(({ id, gradient }) => (
                    gradient.type === 'linear' ? (
                        <linearGradient
                            key={`grad-${id}`}
                            id={`grad-${id}`}
                            gradientTransform={`rotate(${gradient.angle || 0})`}
                        >
                            {gradient.stops.map((stop, i) => (
                                <stop key={i} offset={`${stop.offset * 100}%`} stopColor={stop.color} stopOpacity={stop.opacity ?? 1} />
                            ))}
                        </linearGradient>
                    ) : (
                        <radialGradient
                            key={`grad-${id}`}
                            id={`grad-${id}`}
                            cx={`${(gradient.cx ?? 0.5) * 100}%`}
                            cy={`${(gradient.cy ?? 0.5) * 100}%`}
                            r={`${(gradient.r ?? 0.5) * 100}%`}
                        >
                            {gradient.stops.map((stop, i) => (
                                <stop key={i} offset={`${stop.offset * 100}%`} stopColor={stop.color} stopOpacity={stop.opacity ?? 1} />
                            ))}
                        </radialGradient>
                    )
                ))}
            </defs>
            <g transform={`translate(${width / 2}, ${height / 2})`}>
                {renderNode(scene.root)}
            </g>
        </svg>
    );
};
