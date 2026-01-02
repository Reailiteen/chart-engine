'use client';

/**
 * Engine Layer - Hooks
 * 
 * This module provides the reactive orchestration of the four layers.
 */

import { useMemo, useState, useCallback } from 'react';
import { processPieData } from '../data';
import type { ChartData } from '../data';
import {
    resolveGeometry,
    DEFAULT_PIE_GEOMETRY_CONFIG,
    createEmptyOverrides
} from '../geometry';
import type { PieGeometryConfig, GeometryOverrides } from '../geometry';
import { resolveSceneGraph } from '../scene';
import { resolveAllStyles, DEFAULT_THEME } from '../styles';
import type { ChartTheme, NodeStyle, NodeTransform } from '../styles';

export interface EngineOptions {
    geometryConfig?: Partial<PieGeometryConfig>;
    theme?: Partial<ChartTheme>;
    initialOverrides?: GeometryOverrides;
}

/**
 * Main hook for the chart engine.
 * Implements the unidirectional update pipeline.
 */
export function useChartEngine(data: ChartData, options: EngineOptions = {}) {
    // 1. Data Layer - Recomputed when raw data changes
    const processedData = useMemo(() => {
        return processPieData(data);
    }, [data]);

    // Configuration and Overrides state
    const [geometryConfig, setGeometryConfig] = useState<PieGeometryConfig>(() => ({
        ...DEFAULT_PIE_GEOMETRY_CONFIG,
        ...options.geometryConfig
    }));

    const [overrides, setOverrides] = useState<GeometryOverrides>(
        () => options.initialOverrides ?? createEmptyOverrides()
    );

    const [theme, setTheme] = useState<ChartTheme>(() => ({
        ...DEFAULT_THEME,
        ...options.theme
    }));

    // 2. Geometry Layer - Recomputed when data, config, or overrides change
    const geometryState = useMemo(() => {
        return resolveGeometry(processedData, geometryConfig, overrides);
    }, [processedData, geometryConfig, overrides]);

    // 3. Scene Graph Layer - Recomputed when geometry or theme transforms change
    const sceneGraph = useMemo(() => {
        return resolveSceneGraph(geometryState, theme);
    }, [geometryState, theme]);

    // 4. Visual Styling Layer - Recomputed when scene graph or theme changes
    const resolvedStyles = useMemo(() => {
        return resolveAllStyles(sceneGraph, theme);
    }, [sceneGraph, theme]);

    // Interaction handlers - Memorized for performance
    const updateSliceOverride = useCallback((sliceId: string, update: any) => {
        setOverrides(prev => {
            const newSlices = new Map(prev.slices);
            newSlices.set(sliceId, { ...newSlices.get(sliceId), ...update });
            return { ...prev, slices: newSlices };
        });
    }, []);

    const updateLabelOverride = useCallback((labelId: string, update: any) => {
        setOverrides(prev => {
            const newLabels = new Map(prev.labels);
            newLabels.set(labelId, { ...newLabels.get(labelId), ...update });
            return { ...prev, labels: newLabels };
        });
    }, []);

    const updateNodeStyle = useCallback((nodeId: string, style: any) => {
        setTheme(prev => {
            const newOverrides = new Map(prev.nodeOverrides);
            newOverrides.set(nodeId, { ...newOverrides.get(nodeId), ...style });
            return { ...prev, nodeOverrides: newOverrides };
        });
    }, []);

    const updateNodeTransform = useCallback((nodeId: string, transform: Partial<NodeTransform>) => {
        setTheme(prev => {
            const newTransforms = new Map(prev.nodeTransforms);
            newTransforms.set(nodeId, { ...newTransforms.get(nodeId), ...transform });
            return { ...prev, nodeTransforms: newTransforms };
        });
    }, []);

    const addAnnotation = useCallback((anno: any) => {
        setOverrides(prev => {
            const newAnnos = new Map(prev.annotations);
            newAnnos.set(anno.id, anno);
            return { ...prev, annotations: newAnnos };
        });
    }, []);

    const removeAnnotation = useCallback((id: string) => {
        setOverrides(prev => {
            const newAnnos = new Map(prev.annotations);
            newAnnos.delete(id);
            return { ...prev, annotations: newAnnos };
        });
    }, []);

    return {
        processedData,
        geometryConfig,
        setGeometryConfig,
        overrides,
        updateSliceOverride,
        updateLabelOverride,
        updateNodeStyle,
        updateNodeTransform,
        geometryState,
        sceneGraph,
        resolvedStyles,
        theme,
        setTheme,
        setOverrides,
        addAnnotation,
        removeAnnotation
    };
}
