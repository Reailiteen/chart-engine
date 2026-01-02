'use client';

import React, { useState, useCallback } from 'react';
import { useChartEngine } from '@/engine';
import { SVGRenderer } from '@/renderer/SVGRenderer';
import type { ChartData } from '@/data';
import {
    Settings,
    Activity,
    Layers,
    Palette,
    Box,
    Type,
    Sparkles,
    Zap,
    Move,
    Maximize,
    ChevronRight,
    ChevronLeft,
    MousePointer2,
    Database,
    Image as ImageIcon,
    Sun,
    Moon,
    Layout,
    Clock,
    Heart,
    Star,
    Shield,
    Coffee,
    Circle,
    Focus,
    Target,
    Trash2
} from 'lucide-react';
import { NodeType } from '@/scene/types';
import { PRESETS } from '@/data/presets';
import { createEmptyOverrides, DEFAULT_PIE_GEOMETRY_CONFIG } from '@/geometry';
import { mapToRecord, recordToMap } from '@/engine/serialization';
import { BoardStateSchema } from '@/engine/schema';
import * as LucideIcons from 'lucide-react';

const INITIAL_DATA: ChartData = {
    dimensions: [{ id: 'category', label: 'Department', type: 'category' }],
    measures: [{ id: 'value', label: 'Sales', type: 'number', aggregation: 'sum' }],
    data: [
        { category: 'Service', value: 450 },
        { category: 'Innovation', value: 320 },
        { category: 'Growth', value: 210 },
        { category: 'Support', value: 150 },
        { category: 'Talent', value: 80 }
    ],
    meta: { mapping: { x: 'category', value: 'value' } }
};

type Tab = 'geometry' | 'scene' | 'visual' | 'data';

export default function Home() {
    const [rawData, setRawData] = useState<ChartData>(INITIAL_DATA);
    const [activeTab, setActiveTab] = useState<Tab>('data');
    const [uiMode, setUiMode] = useState<'light' | 'dark'>('light');
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
    const [dragStart, setDragStart] = useState<{ x: number, y: number, offsetDx: number, offsetDy: number } | null>(null);
    const dragTimer = React.useRef<NodeJS.Timeout | null>(null);
    const potentialStartRef = React.useRef<{ x: number, y: number } | null>(null);
    const [isHolding, setIsHolding] = useState(false);

    // Canvas Navigation State
    const [zoom, setZoom] = useState(1);
    const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
    const [sidebarsOpen, setSidebarsOpen] = useState({ left: true, right: true });
    const [isPanning, setIsPanning] = useState(false);
    const lastPanPoint = React.useRef<{ x: number, y: number } | null>(null);

    const {
        geometryConfig,
        setGeometryConfig,
        geometryState,
        sceneGraph,
        resolvedStyles,
        updateLabelOverride,
        updateNodeStyle,
        updateNodeTransform,
        theme,
        setTheme,
        overrides,
        updateSliceOverride,
        setOverrides,
        processedData,
        addAnnotation,
        removeAnnotation
    } = useChartEngine(rawData);

    const handleNodeDragStart = useCallback((nodeId: string, e: React.PointerEvent) => {
        if (dragTimer.current) clearTimeout(dragTimer.current);

        // Try to find if it's a label, annotation, or general node
        const labelOverride = overrides.labels.get(nodeId);
        const annotation = overrides.annotations.get(nodeId);
        const nodeTransform = theme.nodeTransforms.get(nodeId);

        let initialDx = 0;
        let initialDy = 0;

        if (labelOverride) {
            initialDx = labelOverride.positionOffset?.dx ?? 0;
            initialDy = labelOverride.positionOffset?.dy ?? 0;
        } else if (annotation) {
            initialDx = annotation.x;
            initialDy = annotation.y;
        } else if (nodeTransform) {
            initialDx = nodeTransform.x ?? 0;
            initialDy = nodeTransform.y ?? 0;
        }

        setIsHolding(true);
        potentialStartRef.current = { x: e.clientX, y: e.clientY };
        dragTimer.current = setTimeout(() => {
            setDraggingNodeId(nodeId);
            setDragStart({ x: e.clientX, y: e.clientY, offsetDx: initialDx, offsetDy: initialDy });
            (e.target as Element).setPointerCapture(e.pointerId);
            setIsHolding(false);
            dragTimer.current = null;
            potentialStartRef.current = null;
        }, 1000);
    }, [overrides.labels, overrides.annotations, theme.nodeTransforms]);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (dragTimer.current && potentialStartRef.current) {
            const dx = Math.abs(e.clientX - potentialStartRef.current.x);
            const dy = Math.abs(e.clientY - potentialStartRef.current.y);
            if (dx > 10 || dy > 10) {
                clearTimeout(dragTimer.current);
                dragTimer.current = null;
                setIsHolding(false);
                potentialStartRef.current = null;
            }
            return;
        }

        if (isPanning && lastPanPoint.current) {
            const dx = e.clientX - lastPanPoint.current.x;
            const dy = e.clientY - lastPanPoint.current.y;
            setCanvasOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            lastPanPoint.current = { x: e.clientX, y: e.clientY };
            return;
        }

        if (!draggingNodeId || !dragStart) return;
        const deltaX = (e.clientX - dragStart.x) / zoom;
        const deltaY = (e.clientY - dragStart.y) / zoom;

        const newX = dragStart.offsetDx + deltaX;
        const newY = dragStart.offsetDy + deltaY;

        // Check node type to decide where to apply update
        if (overrides.labels.has(draggingNodeId)) {
            updateLabelOverride(draggingNodeId, {
                positionOffset: { dx: newX, dy: newY },
                isManuallyPositioned: true
            });
        } else if (overrides.annotations.has(draggingNodeId)) {
            const anno = overrides.annotations.get(draggingNodeId)!;
            addAnnotation({ ...anno, x: newX, y: newY });
        } else {
            // General node transform
            updateNodeTransform(draggingNodeId, { x: newX, y: newY });
        }
    }, [draggingNodeId, dragStart, zoom, updateLabelOverride, addAnnotation, updateNodeTransform, overrides.labels, overrides.annotations, isPanning]);

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
        if (dragTimer.current) {
            clearTimeout(dragTimer.current);
            dragTimer.current = null;
        }
        setIsHolding(false);

        if (draggingNodeId) {
            (e.target as Element).releasePointerCapture(e.pointerId);
            setDraggingNodeId(null);
            setDragStart(null);
        }

        if (isPanning) {
            setIsPanning(false);
            lastPanPoint.current = null;
        }
    }, [draggingNodeId, isPanning]);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            const delta = -e.deltaY;
            const factor = Math.pow(1.1, delta / 100);
            setZoom(prev => Math.min(Math.max(prev * factor, 0.1), 10));
            e.preventDefault();
        } else {
            // Scroll to pan
            setCanvasOffset(prev => ({
                x: prev.x - e.deltaX,
                y: prev.y - e.deltaY
            }));
        }
    }, []);

    const handleCanvasPointerDown = useCallback((e: React.PointerEvent) => {
        // Middle click or space+click (if we had space detection)
        if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
            setIsPanning(true);
            lastPanPoint.current = { x: e.clientX, y: e.clientY };
            (e.target as Element).setPointerCapture(e.pointerId);
        }
    }, []);

    const updateDataValue = useCallback((index: number, newValue: number) => {
        setRawData((prev) => {
            const newData = [...prev.data];
            const valueField = prev.meta?.mapping?.value || 'value';
            newData[index] = { ...newData[index], [valueField]: newValue };
            return { ...prev, data: newData };
        });
    }, []);

    const addDimension = useCallback(() => {
        setRawData(prev => {
            const id = `dim-${prev.dimensions.length}`;
            return {
                ...prev,
                dimensions: [...prev.dimensions, { id, label: 'New Dimension', type: 'category' }]
            };
        });
    }, []);

    const removeDimension = useCallback((idx: number) => {
        setRawData(prev => ({
            ...prev,
            dimensions: prev.dimensions.filter((_, i) => i !== idx)
        }));
    }, []);

    const addMeasure = useCallback(() => {
        setRawData(prev => {
            const id = `msr-${prev.measures.length}`;
            return {
                ...prev,
                measures: [...prev.measures, { id, label: 'New Measure', type: 'number', aggregation: 'sum' }]
            };
        });
    }, []);

    const removeMeasure = useCallback((idx: number) => {
        setRawData(prev => ({
            ...prev,
            measures: prev.measures.filter((_, i) => i !== idx)
        }));
    }, []);

    const createAnnotation = useCallback((type: 'CIRCLE' | 'RECT' | 'TEXT' | 'ICON' | 'IMAGE') => {
        const id = `anno-${Date.now()}`;
        const newAnno = {
            id,
            type,
            x: 0,
            y: 0,
            ...(type === 'CIRCLE' ? { radius: 30 } : {}),
            ...(type === 'RECT' ? { width: 60, height: 60 } : {}),
            ...(type === 'TEXT' ? { text: 'New Label' } : {}),
            ...(type === 'ICON' ? { iconName: 'Star' } : {}),
            ...(type === 'IMAGE' ? { width: 80, height: 80, imageUrl: '' } : {}),
        };
        addAnnotation(newAnno);
        setSelectedNodeId(id);
    }, [addAnnotation]);

    const addRow = useCallback(() => {
        setRawData(prev => {
            const firstDim = prev.dimensions[0]?.id || 'category';
            const firstMsr = prev.measures[0]?.id || 'value';
            return {
                ...prev,
                data: [...prev.data, { [firstDim]: 'New Item', [firstMsr]: 0 }]
            };
        });
    }, []);

    const removeRow = useCallback((idx: number) => {
        setRawData(prev => ({
            ...prev,
            data: prev.data.filter((_, i) => i !== idx)
        }));
    }, []);

    const updateMapping = useCallback((role: 'x' | 'value', id: string) => {
        setRawData(prev => ({
            ...prev,
            meta: { ...prev.meta, mapping: { ...prev.meta?.mapping, [role]: id } }
        }));
    }, []);

    const loadBoardState = (state: any) => {
        try {
            // Validate via Zod
            const parsed = BoardStateSchema.parse(state);

            setRawData(parsed.rawData);
            setGeometryConfig(parsed.geometryConfig);

            setOverrides({
                slices: recordToMap(parsed.overrides.slices),
                labels: recordToMap(parsed.overrides.labels),
                annotations: recordToMap(parsed.overrides.annotations)
            });

            setTheme({
                ...parsed.theme,
                nodeOverrides: recordToMap(parsed.theme.nodeOverrides as any),
                nodeTransforms: recordToMap(parsed.theme.nodeTransforms as any)
            });

            alert('Board state successfully restored!');
        } catch (err) {
            console.error('Failed to load board state:', err);
            alert('Invalid board state JSON');
        }
    };

    const loadPreset = (preset: typeof PRESETS[0]) => {
        setRawData(preset.data);
        setGeometryConfig({
            ...DEFAULT_PIE_GEOMETRY_CONFIG,
            ...preset.geometryConfig
        });

        const newOverrides = createEmptyOverrides();
        if (preset.overrides) {
            if (preset.overrides.slices) {
                if (preset.overrides.slices instanceof Map) {
                    newOverrides.slices = new Map(preset.overrides.slices);
                } else {
                    Object.entries(preset.overrides.slices).forEach(([id, s]: [string, any]) => {
                        newOverrides.slices.set(id, s);
                    });
                }
            }
            if (preset.overrides.labels) {
                if (preset.overrides.labels instanceof Map) {
                    newOverrides.labels = new Map(preset.overrides.labels);
                } else {
                    Object.entries(preset.overrides.labels).forEach(([id, l]: [string, any]) => {
                        newOverrides.labels.set(id, l);
                    });
                }
            }
            if (preset.overrides.annotations) {
                if (preset.overrides.annotations instanceof Map) {
                    newOverrides.annotations = new Map(preset.overrides.annotations);
                } else {
                    Object.entries(preset.overrides.annotations).forEach(([id, a]: [string, any]) => {
                        newOverrides.annotations.set(id, a);
                    });
                }
            }
        }
        setOverrides(newOverrides);

        setTheme(prev => ({
            ...prev,
            ...preset.theme,
            nodeOverrides: preset.theme.nodeOverrides instanceof Map
                ? new Map(preset.theme.nodeOverrides)
                : recordToMap(preset.theme.nodeOverrides as any),
            nodeTransforms: preset.theme.nodeTransforms instanceof Map
                ? new Map(preset.theme.nodeTransforms)
                : recordToMap(preset.theme.nodeTransforms as any)
        }));
    };

    const renderSceneNode = useCallback((node: any, depth = 0): React.ReactNode => {
        const isSelected = selectedNodeId === node.id;
        const getNodeIcon = (type: NodeType) => {
            switch (type) {
                case NodeType.ROOT: return <Layout size={12} />;
                case NodeType.RING: return <Focus size={12} />;
                case NodeType.SLICE_GROUP: return <Layers size={12} />;
                case NodeType.ARC: return <Box size={12} />;
                case NodeType.LABEL: return <Type size={12} />;
                case NodeType.LEADER_LINE: return <Move size={12} />;
                case NodeType.CENTER_CONTAINER: return <Circle size={12} />;
                case NodeType.CENTER_CONTENT: return <Sparkles size={12} />;
                default: return <Settings size={12} />;
            }
        };

        return (
            <div key={node.id} className="relative">
                {depth > 0 && (
                    <>
                        <div
                            className="absolute border-l-2 border-slate-100"
                            style={{
                                left: (depth - 1) * 20 + 10,
                                top: -4,
                                height: 24,
                                borderBottomLeftRadius: 8,
                                borderBottomWidth: 2
                            }}
                        />
                        <div
                            className="absolute border-t-2 border-slate-100 w-3"
                            style={{
                                left: (depth - 1) * 20 + 10,
                                top: 18
                            }}
                        />
                    </>
                )}

                <button
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all text-left mb-1.5 group relative z-10 ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg active:scale-95' : `border-slate-50 text-slate-400 hover:border-indigo-100 hover:shadow-sm hover:translate-x-1 ${uiMode === 'dark' ? 'bg-slate-800/40 border-slate-700' : 'bg-white'}`}`}
                    style={{ marginLeft: depth * 20 }}
                >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${isSelected ? 'text-white' : 'text-indigo-500 group-hover:bg-indigo-50'}`}>
                        {getNodeIcon(node.type)}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <div className={`text-[10px] font-black uppercase tracking-widest truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>{node.id}</div>
                        <div className={`text-[8px] font-bold uppercase tracking-[0.2em] ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>{node.type}</div>
                    </div>
                    {isSelected && <ChevronRight size={12} className="text-white/40 animate-pulse" />}
                </button>
                {node.children?.map((child: any) => renderSceneNode(child, depth + 1))}
            </div>
        );
    }, [selectedNodeId, setSelectedNodeId]);

    const currentNodeTransform = selectedNodeId ? theme.nodeTransforms.get(selectedNodeId) : null;
    const currentNodeStyle = selectedNodeId ? resolvedStyles.get(selectedNodeId) : null;
    const currentNode = selectedNodeId ? sceneGraph.nodes.get(selectedNodeId) : null;

    return (
        <div className={`relative h-screen w-screen overflow-hidden transition-colors duration-500 font-sans selection:bg-sky-100 selection:text-sky-900 ${uiMode === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-[#fafafa] text-slate-900'}`}>

            {/* Infinite Canvas Environment */}
            <main
                onWheel={handleWheel}
                onPointerDown={handleCanvasPointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className={`absolute inset-0 z-10 cursor-grab active:cursor-grabbing touch-none transition-colors duration-700 ${isHolding ? 'cursor-wait' : ''}`}
                style={{ backgroundColor: theme.backgroundColor }}
            >
                {/* Visual Depth Background */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
                    <div className={`absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] ${uiMode === 'dark' ? 'bg-blue-900' : 'bg-blue-100'}`}></div>
                    <div className={`absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] ${uiMode === 'dark' ? 'bg-purple-900' : 'bg-purple-100'}`}></div>
                </div>

                {/* Status Indicators Layer */}
                <div className={`absolute top-8 left-12 flex gap-4 animate-in slide-in-from-top-4 duration-1000 z-50 transition-all ${sidebarsOpen.left ? 'translate-x-72 opacity-0' : 'translate-x-0'}`}>
                    <div className={`flex items-center gap-3 px-5 py-2.5 backdrop-blur-md rounded-2xl border shadow-sm transition-all hover:shadow-md cursor-default group ${uiMode === 'dark' ? 'bg-slate-800/70 border-slate-700' : 'bg-white/70 border-white'}`}>
                        <Activity size={16} className="text-emerald-500 animate-pulse" />
                        <span className={`text-[11px] font-bold tracking-tight ${uiMode === 'dark' ? 'text-slate-300' : 'text-slate-500'}`}>SYSTEM ONLINE</span>
                    </div>
                </div>

                {/* Canvas Container */}
                <div
                    className="absolute origin-center transition-transform duration-75 ease-out"
                    style={{
                        transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoom})`,
                        left: '50%',
                        top: '50%',
                        width: '0',
                        height: '0'
                    }}
                >
                    <div className="flex items-center justify-center" style={{ transform: 'translate(-50%, -50%)' }}>
                        <SVGRenderer
                            scene={sceneGraph}
                            geometry={geometryState}
                            styles={resolvedStyles}
                            width={1000}
                            height={1000}
                            onNodeDragStart={handleNodeDragStart}
                            onNodeClick={setSelectedNodeId}
                            uiMode={uiMode}
                        />
                    </div>
                </div>

                {/* Canvas Controls Overlay */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 backdrop-blur-xl rounded-2xl border border-white/20 bg-slate-900/40 shadow-2xl z-50">
                    <button
                        onClick={() => setZoom(prev => Math.max(prev / 1.1, 0.1))}
                        className="p-2.5 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-all"
                    >
                        -
                    </button>
                    <div className="px-3 min-w-[60px] text-center text-[10px] font-black text-white/80 tabular-nums">
                        {Math.round(zoom * 100)}%
                    </div>
                    <button
                        onClick={() => setZoom(prev => Math.min(prev * 1.1, 10))}
                        className="p-2.5 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-all"
                    >
                        +
                    </button>
                    <div className="h-4 w-px bg-white/10 mx-1"></div>
                    <button
                        onClick={() => {
                            setZoom(1);
                            setCanvasOffset({ x: 0, y: 0 });
                        }}
                        className="p-2.5 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-all"
                        title="Recenter"
                    >
                        <Focus size={16} />
                    </button>
                </div>
            </main>

            {/* Floating Sidebars Toggle Controls */}
            <button
                onClick={() => setSidebarsOpen(prev => ({ ...prev, left: !prev.left }))}
                className={`absolute top-1/2 -translate-y-1/2 z-50 w-10 h-20 flex items-center justify-center backdrop-blur-xl border border-white/10 rounded-r-3xl transition-all duration-500 group ${sidebarsOpen.left ? 'left-[320px] bg-slate-900/80 text-white shadow-xl' : 'left-0 bg-white/10 text-slate-400 hover:bg-white/20'}`}
            >
                {sidebarsOpen.left ? <ChevronLeft size={20} className="transition-transform group-active:scale-95" /> : <ChevronRight size={20} className="transition-transform group-active:scale-95" />}
            </button>

            <button
                onClick={() => setSidebarsOpen(prev => ({ ...prev, right: !prev.right }))}
                className={`absolute top-1/2 -translate-y-1/2 z-50 w-10 h-20 flex items-center justify-center backdrop-blur-xl border border-white/10 rounded-l-3xl transition-all duration-500 group ${sidebarsOpen.right ? 'right-[450px] bg-slate-900/80 text-white shadow-xl' : 'right-0 bg-white/10 text-slate-400 hover:bg-white/20'}`}
            >
                {sidebarsOpen.right ? <ChevronRight size={20} className="transition-transform group-active:scale-95" /> : <ChevronLeft size={20} className="transition-transform group-active:scale-95" />}
            </button>


            {/* Left Sidebar: Presets Library (Overlay) */}
            <aside className={`absolute left-0 top-0 h-full w-[320px] border-r flex flex-col overflow-hidden shadow-2xl z-40 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${sidebarsOpen.left ? 'translate-x-0' : '-translate-x-full'} ${uiMode === 'dark' ? 'bg-slate-900/80 border-slate-800 backdrop-blur-3xl' : 'bg-white/80 border-slate-100 backdrop-blur-3xl'}`}>
                <div className="p-10 pb-6 flex-1 overflow-y-auto no-scrollbar">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6">
                                <Sparkles size={20} className="text-white" />
                            </div>
                            <div>
                                <h1 className={`text-xl font-black tracking-tight ${uiMode === 'dark' ? 'text-white' : 'text-slate-900'}`}>Presets</h1>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Library</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mb-6">
                        <button
                            title="Copy Board State JSON"
                            onClick={() => {
                                const state = {
                                    rawData,
                                    geometryConfig,
                                    overrides: {
                                        slices: mapToRecord(overrides.slices),
                                        labels: mapToRecord(overrides.labels),
                                        annotations: mapToRecord(overrides.annotations)
                                    },
                                    theme: {
                                        ...theme,
                                        nodeOverrides: mapToRecord(theme.nodeOverrides),
                                        nodeTransforms: mapToRecord(theme.nodeTransforms)
                                    }
                                };

                                // Validate and sanitize via Zod
                                const parsed = BoardStateSchema.parse(state);
                                navigator.clipboard.writeText(JSON.stringify(parsed, null, 2));
                                alert('Board state (Deep Arch) copied to clipboard!');
                            }}
                            className={`flex-1 p-2.5 rounded-xl border flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${uiMode === 'dark' ? 'bg-slate-800 border-slate-700 text-sky-400 hover:bg-slate-700' : 'bg-white border-slate-100 text-sky-600 hover:bg-sky-50'}`}
                        >
                            <Database size={14} />
                            JSON
                        </button>
                        <button
                            title="Restore Board State from JSON"
                            onClick={() => {
                                const input = prompt('Paste Board State JSON:');
                                if (input) {
                                    try {
                                        const state = JSON.parse(input);
                                        loadBoardState(state);
                                    } catch (e) {
                                        alert('Invalid JSON format');
                                    }
                                }
                            }}
                            className={`flex-1 p-2.5 rounded-xl border flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${uiMode === 'dark' ? 'bg-slate-800 border-slate-700 text-emerald-400 hover:bg-slate-700' : 'bg-white border-slate-100 text-emerald-600 hover:bg-emerald-50'}`}
                        >
                            <Zap size={14} />
                            RESTORE
                        </button>
                    </div>

                    <div className="space-y-4">
                        {PRESETS.map((preset) => (
                            <button
                                key={preset.id}
                                onClick={() => loadPreset(preset)}
                                className={`w-full group text-left p-5 rounded-[32px] border transition-all duration-300 transform hover:-translate-y-1 ${uiMode === 'dark' ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-indigo-500' : 'bg-slate-50 border-slate-100 hover:bg-white hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/10'}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className={`p-2.5 rounded-xl shadow-sm group-hover:bg-indigo-500 group-hover:text-white transition-colors ${uiMode === 'dark' ? 'bg-slate-700' : 'bg-white'}`}>
                                        {preset.id === 'polar-core' && <Box size={16} />}
                                        {preset.id === 'modern-ring' && <Circle size={16} />}
                                        {preset.id === 'neon-burst' && <Zap size={16} />}
                                        {preset.id === 'exploded-aurora' && <Target size={16} />}
                                    </div>
                                    <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-500 transform group-hover:translate-x-1 transition-all" />
                                </div>
                                <h3 className={`text-sm font-black mb-1 ${uiMode === 'dark' ? 'text-white' : 'text-slate-900'}`}>{preset.label}</h3>
                                <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-tight">{preset.description}</p>
                            </button>
                        ))}
                    </div>
                </div>

                <div className={`mt-auto p-10 border-t ${uiMode === 'dark' ? 'border-slate-800' : 'border-slate-50'}`}>
                    <div className={`p-6 rounded-[28px] border transition-colors ${uiMode === 'dark' ? 'bg-indigo-900/20 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100/50'}`}>
                        <h4 className={`text-[10px] font-black uppercase tracking-widest mb-2 ${uiMode === 'dark' ? 'text-indigo-300' : 'text-indigo-900'}`}>Pro Tip</h4>
                        <p className={`text-[11px] font-bold leading-relaxed italic ${uiMode === 'dark' ? 'text-indigo-400' : 'text-indigo-400'}`}>"Presets apply deep configuration across all four architectural layers."</p>
                    </div>
                </div>
            </aside>

            {/* Right Sidebar: Control System (Overlay) */}
            <aside className={`absolute right-0 top-0 h-full w-[450px] border-l flex flex-col overflow-hidden shadow-2xl z-40 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${sidebarsOpen.right ? 'translate-x-0' : 'translate-x-full'} ${uiMode === 'dark' ? 'bg-slate-900/80 border-slate-800 backdrop-blur-3xl' : 'bg-white/80 border-slate-100 backdrop-blur-3xl'}`}>
                {/* Theme Toggle in Right Sidebar Header */}
                <div className="absolute top-10 right-10">
                    <button
                        title="Switch Theme"
                        onClick={() => setUiMode(prev => prev === 'light' ? 'dark' : 'light')}
                        className={`p-3 rounded-2xl border transition-all ${uiMode === 'dark' ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'}`}
                    >
                        {uiMode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                </div>

                <nav className={`flex px-6 pt-10 pb-4 gap-2 overflow-x-auto no-scrollbar`}>
                    {[
                        { id: 'data', icon: Database, label: 'Data' },
                        { id: 'geometry', icon: Box, label: 'Geo' },
                        { id: 'scene', icon: Layers, label: 'Scene' },
                        { id: 'visual', icon: Palette, label: 'Visual' }
                    ].map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id as Tab)}
                            className={`flex items-center gap-2.5 px-5 py-3.5 rounded-2xl font-black text-[11px] tracking-widest uppercase transition-all whitespace-nowrap ${activeTab === t.id ? 'bg-slate-900 text-white shadow-xl shadow-slate-200 scale-105' : `hover:bg-slate-50 ${uiMode === 'dark' ? 'text-slate-500 hover:bg-slate-800' : 'text-slate-400'}`}`}
                        >
                            <t.icon size={14} className={activeTab === t.id ? 'text-sky-400' : 'text-slate-300'} />
                            {t.label}
                        </button>
                    ))}
                </nav>

                <div className="flex-1 overflow-y-auto min-h-0 px-10 py-8 no-scrollbar">
                    {activeTab === 'geometry' && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                            <header>
                                <h2 className="text-xs font-black text-sky-600 dark:text-sky-400 uppercase tracking-[0.3em] mb-1">Layer 1</h2>
                                <h3 className={`text-2xl font-black tracking-tight transition-colors ${uiMode === 'dark' ? 'text-white' : 'text-slate-900'}`}>Geometric Core</h3>
                            </header>

                            <section className={`space-y-8 p-6 rounded-[32px] border shadow-sm transition-all duration-500 ${uiMode === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white/40 border-white'}`}>
                                <div className="space-y-6">
                                    <div className="group">
                                        <div className="flex justify-between mb-3 items-end">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-900"></div>
                                                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Base Radius</label>
                                            </div>
                                            <span className="text-[10px] font-mono font-black text-sky-500 bg-sky-50 px-2 py-0.5 rounded-lg">{geometryConfig.outerRadius}px</span>
                                        </div>
                                        <input
                                            title="Outer Radius"
                                            type="range" min="100" max="250" value={geometryConfig.outerRadius}
                                            onChange={(e) => setGeometryConfig(prev => ({ ...prev, outerRadius: Number(e.target.value) }))}
                                            className={`w-full h-1.5 appearance-none rounded-full accent-slate-900 cursor-pointer ${uiMode === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`}
                                        />
                                    </div>

                                    <div className="group">
                                        <div className="flex justify-between mb-3 items-end">
                                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Hole Size (Donut)</label>
                                            <span className="text-[10px] font-mono font-black text-sky-500 bg-sky-50 px-2 py-0.5 rounded-lg">{geometryConfig.innerRadius}px</span>
                                        </div>
                                        <input
                                            title="Inner Radius"
                                            type="range" min="0" max="200" value={geometryConfig.innerRadius}
                                            onChange={(e) => setGeometryConfig(prev => ({ ...prev, innerRadius: Number(e.target.value) }))}
                                            className={`w-full h-1.5 appearance-none rounded-full accent-slate-900 cursor-pointer ${uiMode === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`}
                                        />
                                    </div>

                                    <div className="group">
                                        <div className="flex justify-between mb-3 items-end">
                                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Slice Gap</label>
                                            <span className="text-[10px] font-mono font-black text-sky-500 bg-sky-50 px-2 py-0.5 rounded-lg">{(geometryConfig.padAngle * 180 / Math.PI).toFixed(1)}°</span>
                                        </div>
                                        <input
                                            title="Pad Angle"
                                            type="range" min="0" max="0.5" step="0.01" value={geometryConfig.padAngle}
                                            onChange={(e) => setGeometryConfig(prev => ({ ...prev, padAngle: Number(e.target.value) }))}
                                            className={`w-full h-1.5 appearance-none rounded-full accent-slate-900 cursor-pointer ${uiMode === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`}
                                        />
                                    </div>

                                    <div className="group">
                                        <div className="flex justify-between mb-3 items-end">
                                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Label Distance</label>
                                            <span className="text-[10px] font-mono font-black text-sky-500 bg-sky-50 px-2 py-0.5 rounded-lg">{geometryConfig.labelRadiusOffset}px</span>
                                        </div>
                                        <input
                                            title="Label Radius Offset"
                                            type="range" min="0" max="100" value={geometryConfig.labelRadiusOffset}
                                            onChange={(e) => setGeometryConfig(prev => ({ ...prev, labelRadiusOffset: Number(e.target.value) }))}
                                            className={`w-full h-1.5 appearance-none rounded-full accent-slate-900 cursor-pointer ${uiMode === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`}
                                        />
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-4">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3 px-2">
                                    Spatial Overrides
                                    <div className="h-px flex-1 bg-slate-100"></div>
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {processedData.slices.map((slice: any, i: number) => {
                                        const isSelected = selectedNodeId === `arc-${slice.sliceId}`;
                                        const sliceOverride = overrides.slices.get(slice.sliceId);
                                        return (
                                            <div
                                                key={slice.sliceId}
                                                className={`flex flex-col gap-4 p-4 rounded-[32px] border transition-all duration-500 ${isSelected ? 'border-sky-500 bg-white dark:bg-slate-800 shadow-xl shadow-sky-100/50 scale-[1.02] relative z-10' : 'border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700'}`}
                                            >
                                                <div className="flex justify-between items-center w-full">
                                                    <button
                                                        onClick={() => setSelectedNodeId(`arc-${slice.sliceId}`)}
                                                        className="flex items-center gap-3 flex-1 text-left"
                                                    >
                                                        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: theme.primaryColors[i % theme.primaryColors.length] }}></div>
                                                        <span className={`text-[11px] font-black truncate tracking-tight ${uiMode === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>{slice.label}</span>
                                                    </button>
                                                    <span className="text-[10px] font-mono font-black text-slate-300">{slice.percentage.toFixed(0)}%</span>
                                                </div>

                                                <div className="space-y-2 px-1">
                                                    <div className="flex justify-between">
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Expansion</label>
                                                        <span className="text-[9px] font-mono font-black text-sky-500">{sliceOverride?.outerRadiusOffset ?? 0}px</span>
                                                    </div>
                                                    <input
                                                        title="Radius Offset"
                                                        type="range" min="-50" max="100" step="1"
                                                        value={sliceOverride?.outerRadiusOffset ?? 0}
                                                        onChange={(e) => updateSliceOverride(slice.sliceId, { outerRadiusOffset: Number(e.target.value) })}
                                                        className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full accent-sky-500 appearance-none cursor-pointer"
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>

                            <section className="space-y-4 pt-10">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3 px-2">
                                    Technical Blueprint (L1)
                                    <div className="h-px flex-1 bg-slate-100"></div>
                                </h3>
                                <div className={`p-4 rounded-2xl font-mono text-[9px] overflow-x-auto whitespace-pre transition-colors duration-500 ${uiMode === 'dark' ? 'bg-slate-950 text-sky-400 border border-slate-800' : 'bg-slate-50 text-sky-600 border border-slate-100'}`}>
                                    {JSON.stringify({ config: geometryConfig, overrides: overrides }, (key, value) => value instanceof Map ? Object.fromEntries(value) : value, 2)}
                                </div>
                                <button
                                    onClick={() => navigator.clipboard.writeText(JSON.stringify({ config: geometryConfig, overrides: overrides }, (key, value) => value instanceof Map ? Object.fromEntries(value) : value, 2))}
                                    className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-[9px] font-black uppercase tracking-widest text-slate-500 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Copy Layer JSON
                                </button>
                            </section>
                        </div>
                    )}

                    {activeTab === 'scene' && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                            <header>
                                <h2 className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.3em] mb-1">Layer 2</h2>
                                <h3 className={`text-2xl font-black tracking-tight transition-colors ${uiMode === 'dark' ? 'text-white' : 'text-slate-900'}`}>Scene Explorer</h3>
                            </header>

                            {/* Creation Dashboard */}
                            <section className="space-y-4">
                                <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-3 px-2">
                                    Entity Forge
                                    <div className="h-px flex-1 bg-indigo-50 dark:bg-slate-800"></div>
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { type: 'CIRCLE', icon: Circle, label: 'Circle' },
                                        { type: 'RECT', icon: Box, label: 'Rectangle' },
                                        { type: 'TEXT', icon: Type, label: 'Text Box' },
                                        { type: 'ICON', icon: Star, label: 'Lucide Icon' },
                                        { type: 'IMAGE', icon: ImageIcon, label: 'Remote Image' }
                                    ].map((item) => (
                                        <button
                                            key={item.type}
                                            onClick={() => createAnnotation(item.type as any)}
                                            className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${uiMode === 'dark' ? 'bg-slate-900 border-slate-800 hover:bg-slate-800 hover:border-indigo-500/50' : 'bg-white border-slate-100 hover:border-indigo-200 hover:bg-indigo-50'} group`}
                                        >
                                            <div className={`p-2 rounded-xl transition-colors ${uiMode === 'dark' ? 'bg-slate-800 text-indigo-400 group-hover:bg-indigo-500/10' : 'bg-slate-50 text-indigo-500 group-hover:bg-white'}`}>
                                                <item.icon size={18} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className={`text-[11px] font-black uppercase tracking-tight ${uiMode === 'dark' ? 'text-slate-200' : 'text-slate-900'}`}>{item.label}</span>
                                                <span className="text-[9px] font-bold text-slate-400">Add to board</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </section>

                            <section className="space-y-6">
                                <div className="flex items-center gap-4 p-5 bg-indigo-50 rounded-3xl border border-indigo-100">
                                    <div className="p-3 bg-white rounded-2xl shadow-sm"><Move size={20} className="text-indigo-500" /></div>
                                    <div>
                                        <h4 className="text-sm font-black text-indigo-900">Interactive Pivot</h4>
                                        <p className="text-[11px] font-bold text-indigo-400">Node Transformation overrides</p>
                                    </div>
                                </div>

                                {selectedNodeId ? (
                                    <div className={`space-y-8 p-6 rounded-[32px] border shadow-sm transition-all duration-500 ${uiMode === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white/40 border-white'}`}>
                                        <div className={`text-[10px] font-black uppercase tracking-widest mb-4 transition-colors ${uiMode === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Editing: {selectedNodeId}</div>

                                        <div className="space-y-6">
                                            <div className="group">
                                                <div className="flex justify-between mb-2 px-1">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase">Scale Factor</label>
                                                    <span className="text-[10px] font-mono font-black text-indigo-600">{(currentNodeTransform?.scale ?? currentNode?.transform?.scale ?? 1).toFixed(2)}x</span>
                                                </div>
                                                <input
                                                    title="Node Scale"
                                                    type="range" min="0.1" max="3" step="0.1"
                                                    value={currentNodeTransform?.scale ?? currentNode?.transform?.scale ?? 1}
                                                    onChange={(e) => updateNodeTransform(selectedNodeId, { scale: Number(e.target.value) })}
                                                    className={`w-full h-1 appearance-none rounded-full accent-indigo-600 cursor-pointer ${uiMode === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`}
                                                />
                                            </div>

                                            <div className="group">
                                                <div className="flex justify-between mb-2 px-1">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase">Rotation Offset</label>
                                                    <span className="text-[10px] font-mono font-black text-indigo-600">{Math.round(currentNodeTransform?.rotate ?? currentNode?.transform?.rotate ?? 0)}°</span>
                                                </div>
                                                <input
                                                    title="Node Rotation"
                                                    type="range" min="-180" max="180"
                                                    value={currentNodeTransform?.rotate ?? currentNode?.transform?.rotate ?? 0}
                                                    onChange={(e) => updateNodeTransform(selectedNodeId, { rotate: Number(e.target.value) })}
                                                    className={`w-full h-1 appearance-none rounded-full accent-indigo-600 cursor-pointer ${uiMode === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`}
                                                />
                                            </div>

                                            <div className="space-y-6">
                                                <div className="group">
                                                    <div className="flex justify-between items-end mb-2 px-1">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase">X Offset</label>
                                                        <span className="text-[10px] font-mono font-black text-indigo-600">{Math.round(currentNodeTransform?.x ?? currentNode?.transform?.x ?? 0)}px</span>
                                                    </div>
                                                    <div className="flex gap-4 items-center">
                                                        <input
                                                            title="Node X Offset"
                                                            type="range" min="-500" max="500" step="1"
                                                            value={Math.round(currentNodeTransform?.x ?? currentNode?.transform?.x ?? 0)}
                                                            onChange={(e) => updateNodeTransform(selectedNodeId, { x: Number(e.target.value) })}
                                                            className={`flex-1 h-1 appearance-none rounded-full accent-indigo-600 cursor-pointer ${uiMode === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`}
                                                        />
                                                        <input
                                                            title="Node X Number"
                                                            type="number"
                                                            value={Math.round(currentNodeTransform?.x ?? currentNode?.transform?.x ?? 0)}
                                                            onChange={(e) => updateNodeTransform(selectedNodeId, { x: Number(e.target.value) })}
                                                            className={`w-20 border rounded-xl px-2 py-1.5 text-xs font-black text-center focus:ring-1 focus:ring-indigo-200 outline-none transition-colors ${uiMode === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'}`}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="group">
                                                    <div className="flex justify-between items-end mb-2 px-1">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase">Y Offset</label>
                                                        <span className="text-[10px] font-mono font-black text-indigo-600">{Math.round(currentNodeTransform?.y ?? currentNode?.transform?.y ?? 0)}px</span>
                                                    </div>
                                                    <div className="flex gap-4 items-center">
                                                        <input
                                                            title="Node Y Offset"
                                                            type="range" min="-500" max="500" step="1"
                                                            value={Math.round(currentNodeTransform?.y ?? currentNode?.transform?.y ?? 0)}
                                                            onChange={(e) => updateNodeTransform(selectedNodeId, { y: Number(e.target.value) })}
                                                            className={`flex-1 h-1 appearance-none rounded-full accent-indigo-600 cursor-pointer ${uiMode === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`}
                                                        />
                                                        <input
                                                            title="Node Y Number"
                                                            type="number"
                                                            value={Math.round(currentNodeTransform?.y ?? currentNode?.transform?.y ?? 0)}
                                                            onChange={(e) => updateNodeTransform(selectedNodeId, { y: Number(e.target.value) })}
                                                            className={`w-20 border rounded-xl px-2 py-1.5 text-xs font-black text-center focus:ring-1 focus:ring-indigo-200 outline-none transition-colors ${uiMode === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'}`}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {currentNode?.type === NodeType.LABEL && (
                                                <div className="pt-6 border-t border-slate-100 dark:border-slate-700 space-y-6">
                                                    <div className="space-y-4">
                                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1">Label Text Content</label>
                                                        <input
                                                            title="Label Text"
                                                            type="text"
                                                            value={overrides.labels.get(selectedNodeId!)?.text || currentNode.dataId?.replace('slice-', '') || ''}
                                                            onChange={(e) => updateLabelOverride(selectedNodeId!, { text: e.target.value })}
                                                            placeholder="Enter custom label text..."
                                                            className={`w-full border rounded-xl px-4 py-3 text-xs font-black focus:ring-1 focus:ring-indigo-200 outline-none transition-all placeholder:text-slate-500 ${uiMode === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-100 text-slate-900'}`}
                                                        />
                                                    </div>

                                                    <div className="space-y-4">
                                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1">Label Anchor Position</label>
                                                        <div className="grid grid-cols-3 gap-2">
                                                            {(['centroid', 'edge', 'outside'] as const).map(mode => (
                                                                <button
                                                                    key={mode}
                                                                    onClick={() => updateLabelOverride(selectedNodeId!, { anchorMode: mode })}
                                                                    className={`py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${overrides.labels.get(selectedNodeId!)?.anchorMode === mode || (!overrides.labels.get(selectedNodeId!)?.anchorMode && geometryConfig.labelAnchorMode === mode) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 hover:border-indigo-200'}`}
                                                                >
                                                                    {mode}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        <p className="text-[9px] font-bold text-slate-400 px-1 italic">
                                                            * "Outside" mode automatically generates a connector string.
                                                        </p>
                                                    </div>

                                                    {/* Typography Styling */}
                                                    <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                                                        <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest px-1">Typography</h4>

                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <label className="text-[9px] font-black text-slate-400 uppercase px-1">Font Color</label>
                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        title="Font Color"
                                                                        type="color"
                                                                        value={currentNodeStyle?.fontColor || theme.defaultTypography.fontColor || '#1e293b'}
                                                                        onChange={(e) => updateNodeStyle(selectedNodeId!, { fontColor: e.target.value })}
                                                                        className="w-10 h-10 rounded-xl border-2 border-slate-200 cursor-pointer"
                                                                    />
                                                                    <input
                                                                        title="Font Color Hex"
                                                                        type="text"
                                                                        value={currentNodeStyle?.fontColor || theme.defaultTypography.fontColor || '#1e293b'}
                                                                        onChange={(e) => updateNodeStyle(selectedNodeId!, { fontColor: e.target.value })}
                                                                        className={`flex-1 border rounded-xl px-3 py-2 text-xs font-mono font-black ${uiMode === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'}`}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-[9px] font-black text-slate-400 uppercase px-1">Font Size</label>
                                                                <input
                                                                    title="Font Size"
                                                                    type="number"
                                                                    min="8"
                                                                    max="72"
                                                                    value={currentNodeStyle?.fontSize || theme.defaultTypography.fontSize || 14}
                                                                    onChange={(e) => updateNodeStyle(selectedNodeId!, { fontSize: Number(e.target.value) })}
                                                                    className={`w-full border rounded-xl px-3 py-2 text-xs font-black ${uiMode === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'}`}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <label className="text-[9px] font-black text-slate-400 uppercase px-1">Font Weight</label>
                                                            <div className="grid grid-cols-4 gap-2">
                                                                {(['400', '500', '600', '700'] as const).map(weight => (
                                                                    <button
                                                                        key={weight}
                                                                        onClick={() => updateNodeStyle(selectedNodeId!, { fontWeight: weight })}
                                                                        className={`py-2 rounded-xl border text-[9px] font-black transition-all ${String(currentNodeStyle?.fontWeight || '500') === weight ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 hover:border-indigo-200'}`}
                                                                    >
                                                                        {weight === '400' ? 'Normal' : weight === '500' ? 'Medium' : weight === '600' ? 'Semi' : 'Bold'}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {currentNode?.type === NodeType.PERCENTAGE_LABEL && (
                                                <div className="pt-6 border-t border-slate-100 dark:border-slate-700 space-y-6">
                                                    <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest px-1">Percentage Label Styling</h4>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <label className="text-[9px] font-black text-slate-400 uppercase px-1">Font Color</label>
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    title="Font Color"
                                                                    type="color"
                                                                    value={currentNodeStyle?.fontColor || theme.defaultTypography.fontColor || '#1e293b'}
                                                                    onChange={(e) => updateNodeStyle(selectedNodeId!, { fontColor: e.target.value })}
                                                                    className="w-10 h-10 rounded-xl border-2 border-slate-200 cursor-pointer"
                                                                />
                                                                <input
                                                                    title="Font Color Hex"
                                                                    type="text"
                                                                    value={currentNodeStyle?.fontColor || theme.defaultTypography.fontColor || '#1e293b'}
                                                                    onChange={(e) => updateNodeStyle(selectedNodeId!, { fontColor: e.target.value })}
                                                                    className={`flex-1 border rounded-xl px-3 py-2 text-xs font-mono font-black ${uiMode === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'}`}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[9px] font-black text-slate-400 uppercase px-1">Font Size</label>
                                                            <input
                                                                title="Font Size"
                                                                type="number"
                                                                min="8"
                                                                max="72"
                                                                value={currentNodeStyle?.fontSize || theme.defaultTypography.fontSize || 14}
                                                                onChange={(e) => updateNodeStyle(selectedNodeId!, { fontSize: Number(e.target.value) })}
                                                                className={`w-full border rounded-xl px-3 py-2 text-xs font-black ${uiMode === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'}`}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black text-slate-400 uppercase px-1">Font Weight</label>
                                                        <div className="grid grid-cols-4 gap-2">
                                                            {(['400', '500', '600', '700'] as const).map(weight => (
                                                                <button
                                                                    key={weight}
                                                                    onClick={() => updateNodeStyle(selectedNodeId!, { fontWeight: weight })}
                                                                    className={`py-2 rounded-xl border text-[9px] font-black transition-all ${String(currentNodeStyle?.fontWeight || '500') === weight ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 hover:border-emerald-200'}`}
                                                                >
                                                                    {weight === '400' ? 'Normal' : weight === '500' ? 'Medium' : weight === '600' ? 'Semi' : 'Bold'}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {currentNode?.type === NodeType.TEXT && (
                                                <div className="pt-6 border-t border-slate-100 dark:border-slate-700 space-y-4">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1">Text Content</label>
                                                    <input
                                                        title="Annotation Text"
                                                        type="text"
                                                        value={overrides.annotations.get(selectedNodeId!)?.text || ''}
                                                        onChange={(e) => addAnnotation({ ...overrides.annotations.get(selectedNodeId!)!, text: e.target.value })}
                                                        placeholder="Enter text..."
                                                        className={`w-full border rounded-xl px-4 py-3 text-xs font-black focus:ring-1 focus:ring-indigo-200 outline-none transition-all ${uiMode === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-100 text-slate-900'}`}
                                                    />
                                                </div>
                                            )}

                                            {currentNode?.type === NodeType.IMAGE && (
                                                <div className="pt-6 border-t border-slate-100 dark:border-slate-700 space-y-4">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1">Image URL</label>
                                                    <input
                                                        title="Image URL"
                                                        type="text"
                                                        value={overrides.annotations.get(selectedNodeId!)?.imageUrl || ''}
                                                        onChange={(e) => addAnnotation({ ...overrides.annotations.get(selectedNodeId!)!, imageUrl: e.target.value })}
                                                        placeholder="https://example.com/image.png"
                                                        className={`w-full border rounded-xl px-4 py-3 text-xs font-black focus:ring-1 focus:ring-indigo-200 outline-none transition-all ${uiMode === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-100 text-slate-900'}`}
                                                    />
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <label className="text-[9px] font-black text-slate-400 uppercase px-1">Width</label>
                                                            <input
                                                                title="Image Width"
                                                                type="number"
                                                                value={overrides.annotations.get(selectedNodeId!)?.width || 80}
                                                                onChange={(e) => addAnnotation({ ...overrides.annotations.get(selectedNodeId!)!, width: Number(e.target.value) })}
                                                                className={`w-full border rounded-xl px-3 py-2 text-xs font-black ${uiMode === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'}`}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[9px] font-black text-slate-400 uppercase px-1">Height</label>
                                                            <input
                                                                title="Image Height"
                                                                type="number"
                                                                value={overrides.annotations.get(selectedNodeId!)?.height || 80}
                                                                onChange={(e) => addAnnotation({ ...overrides.annotations.get(selectedNodeId!)!, height: Number(e.target.value) })}
                                                                className={`w-full border rounded-xl px-3 py-2 text-xs font-black ${uiMode === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'}`}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {currentNode?.type === NodeType.ICON && (
                                                <div className="pt-6 border-t border-slate-100 dark:border-slate-700 space-y-4">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1">Icon Selection</label>
                                                    <div className="grid grid-cols-4 gap-2">
                                                        {['Coffee', 'Star', 'Activity', 'Box', 'Heart', 'Zap', 'Target', 'Smile', 'Sun', 'Moon', 'Shield', 'Clock'].map(icon => (
                                                            <button
                                                                key={icon}
                                                                onClick={() => addAnnotation({ ...overrides.annotations.get(selectedNodeId!)!, iconName: icon })}
                                                                className={`p-3 rounded-xl border flex items-center justify-center transition-all ${overrides.annotations.get(selectedNodeId!)?.iconName === icon ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-700'}`}
                                                            >
                                                                {React.createElement((LucideIcons as any)[icon], { size: 16 })}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {(currentNode?.type === NodeType.CIRCLE || currentNode?.type === NodeType.RECT) && (
                                                <div className="pt-6 border-t border-slate-100 dark:border-slate-700 space-y-4">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1">Dimensions</label>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        {currentNode?.type === NodeType.CIRCLE ? (
                                                            <div className="space-y-2 col-span-2">
                                                                <label className="text-[9px] font-black text-slate-400 uppercase px-1">Radius</label>
                                                                <input
                                                                    title="Circle Radius"
                                                                    type="number"
                                                                    value={overrides.annotations.get(selectedNodeId!)?.radius || 30}
                                                                    onChange={(e) => addAnnotation({ ...overrides.annotations.get(selectedNodeId!)!, radius: Number(e.target.value) })}
                                                                    className={`w-full border rounded-xl px-3 py-2 text-xs font-black ${uiMode === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'}`}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div className="space-y-2">
                                                                    <label className="text-[9px] font-black text-slate-400 uppercase px-1">Width</label>
                                                                    <input
                                                                        title="Rectangle Width"
                                                                        type="number"
                                                                        value={overrides.annotations.get(selectedNodeId!)?.width || 60}
                                                                        onChange={(e) => addAnnotation({ ...overrides.annotations.get(selectedNodeId!)!, width: Number(e.target.value) })}
                                                                        className={`w-full border rounded-xl px-3 py-2 text-xs font-black ${uiMode === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'}`}
                                                                    />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <label className="text-[9px] font-black text-slate-400 uppercase px-1">Height</label>
                                                                    <input
                                                                        title="Rectangle Height"
                                                                        type="number"
                                                                        value={overrides.annotations.get(selectedNodeId!)?.height || 60}
                                                                        onChange={(e) => addAnnotation({ ...overrides.annotations.get(selectedNodeId!)!, height: Number(e.target.value) })}
                                                                        className={`w-full border rounded-xl px-3 py-2 text-xs font-black ${uiMode === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'}`}
                                                                    />
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {selectedNodeId?.startsWith('anno-') && (
                                                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block px-1">Actions</label>
                                                    <button
                                                        onClick={() => {
                                                            removeAnnotation(selectedNodeId!);
                                                            setSelectedNodeId(null);
                                                        }}
                                                        className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl border border-rose-100 bg-rose-50 text-rose-600 transition-all font-bold text-xs hover:bg-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400"
                                                    >
                                                        <Trash2 size={14} />
                                                        Delete Node
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-8 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-100 text-center">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">Select a node from the tree below to adjust its transform properties</p>
                                    </div>
                                )}
                            </section>

                            <section className="space-y-4">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3 px-2">
                                    Scene Graph ARCHITECTURE
                                    <div className="h-px flex-1 bg-slate-100"></div>
                                </h3>
                                <div className="space-y-1 max-h-[500px] overflow-y-auto no-scrollbar pb-10 px-1">
                                    {renderSceneNode(sceneGraph.root)}
                                </div>
                            </section>

                            <section className="space-y-4 pt-10">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3 px-2">
                                    Technical Blueprint (L2)
                                    <div className="h-px flex-1 bg-slate-100"></div>
                                </h3>
                                <div className={`p-4 rounded-2xl font-mono text-[9px] overflow-x-auto whitespace-pre transition-colors duration-500 ${uiMode === 'dark' ? 'bg-slate-950 text-indigo-400 border border-slate-800' : 'bg-slate-50 text-indigo-600 border border-slate-100'}`}>
                                    {JSON.stringify(sceneGraph, (key, value) => value instanceof Map ? Object.fromEntries(value) : value, 2)}
                                </div>
                                <button
                                    onClick={() => navigator.clipboard.writeText(JSON.stringify(sceneGraph, (key, value) => value instanceof Map ? Object.fromEntries(value) : value, 2))}
                                    className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-[9px] font-black uppercase tracking-widest text-slate-500 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Copy Layer JSON
                                </button>
                            </section>
                        </div>
                    )}

                    {activeTab === 'visual' && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                            <header>
                                <h2 className="text-xs font-black text-rose-500 uppercase tracking-[0.3em] mb-1">Layer 3</h2>
                                <h3 className="text-2xl font-black tracking-tight text-slate-900">Visual Designer</h3>
                            </header>

                            <section className="space-y-4">
                                <h3 className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-3 px-2">
                                    Global Canvas
                                    <div className="h-px flex-1 bg-rose-100"></div>
                                </h3>
                                <div className={`p-6 rounded-[32px] border shadow-sm space-y-4 ${uiMode === 'dark' ? 'bg-slate-800/50 border-rose-500/20' : 'bg-white border-rose-100'}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <label className={`text-[10px] font-black uppercase ${uiMode === 'dark' ? 'text-rose-300' : 'text-rose-900'}`}>Background Color</label>
                                            <p className="text-[9px] font-bold text-rose-300">Set the overall page background</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className={`text-[10px] font-mono font-black px-2 py-1 rounded-lg uppercase ${uiMode === 'dark' ? 'text-rose-400 bg-rose-950/30' : 'text-rose-500 bg-rose-50'}`}>{theme.backgroundColor}</div>
                                            <input
                                                title="Background Color"
                                                type="color"
                                                value={theme.backgroundColor}
                                                onChange={(e) => setTheme(prev => ({ ...prev, backgroundColor: e.target.value }))}
                                                className="w-10 h-10 rounded-xl border-none p-0 bg-transparent cursor-pointer hover:scale-110 transition-transform"
                                            />
                                        </div>
                                    </div>

                                    <div className={`h-px w-full ${uiMode === 'dark' ? 'bg-slate-700' : 'bg-rose-50'}`}></div>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <label className={`text-[10px] font-black uppercase ${uiMode === 'dark' ? 'text-rose-300' : 'text-rose-900'}`}>Container Color</label>
                                            <p className="text-[9px] font-bold text-rose-300">Set the chart area background</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className={`text-[10px] font-mono font-black px-2 py-1 rounded-lg uppercase ${uiMode === 'dark' ? 'text-rose-400 bg-rose-950/30' : 'text-rose-500 bg-rose-50'}`}>{theme.containerColor}</div>
                                            <input
                                                title="Container Color"
                                                type="text"
                                                value={theme.containerColor}
                                                onChange={(e) => setTheme(prev => ({ ...prev, containerColor: e.target.value }))}
                                                className={`text-[10px] font-mono font-black p-2 border rounded-xl w-32 outline-none focus:ring-1 focus:ring-rose-500 transition-colors ${uiMode === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-100 text-slate-900'}`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {selectedNodeId ? (
                                <div className="space-y-10">
                                    <div className={`p-8 rounded-[40px] border shadow-xl relative overflow-hidden group transition-colors duration-500 ${uiMode === 'dark' ? 'bg-slate-800/80 border-rose-500/30 shadow-rose-950/20' : 'bg-rose-50 border-rose-100/50 shadow-rose-100/20'}`}>
                                        <div className="absolute top-0 right-0 p-8 text-rose-200 group-hover:rotate-12 transition-transform duration-700">
                                            <Palette size={80} strokeWidth={1} />
                                        </div>
                                        <h4 className="text-[10px] font-black text-rose-400 dark:text-rose-300 uppercase tracking-[0.2em] mb-2">Styling Node: {selectedNodeId}</h4>
                                        <h3 className="text-xl font-black text-rose-900 dark:text-rose-100 mb-6 px-1">Fine-tuned Paint Layer</h3>

                                        <div className="space-y-8 relative z-10">
                                            <div className="space-y-6">
                                                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full">
                                                    <button
                                                        onClick={() => {
                                                            const currentFill = typeof currentNodeStyle?.fill === 'string' ? currentNodeStyle.fill : '#6366f1';
                                                            updateNodeStyle(selectedNodeId, { fill: currentFill });
                                                        }}
                                                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${typeof currentNodeStyle?.fill === 'string' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-400'}`}
                                                    >
                                                        Solid
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            const currentFill = typeof currentNodeStyle?.fill === 'string' ? currentNodeStyle.fill : '#6366f1';
                                                            updateNodeStyle(selectedNodeId, {
                                                                fill: {
                                                                    type: 'linear',
                                                                    angle: 45,
                                                                    stops: [
                                                                        { offset: 0, color: currentFill },
                                                                        { offset: 1, color: '#6366f1' }
                                                                    ]
                                                                }
                                                            });
                                                        }}
                                                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${typeof currentNodeStyle?.fill !== 'string' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-400'}`}
                                                    >
                                                        Gradient
                                                    </button>
                                                </div>

                                                {typeof currentNodeStyle?.fill === 'string' ? (
                                                    <div className="space-y-4">
                                                        <label className="text-[10px] font-black text-rose-400 dark:text-rose-300 uppercase tracking-widest block px-1">Fill Color</label>
                                                        <div className="flex items-center gap-6">
                                                            <input
                                                                title="Fill Color"
                                                                type="color"
                                                                value={currentNodeStyle.fill}
                                                                onChange={(e) => updateNodeStyle(selectedNodeId, { fill: e.target.value })}
                                                                className="w-20 h-20 rounded-[2rem] border-none p-0 bg-transparent cursor-pointer hover:scale-105 transition-transform"
                                                            />
                                                            <div className="flex-1 space-y-1">
                                                                <div className="text-[14px] font-mono font-black text-rose-900 dark:text-rose-100 uppercase">{currentNodeStyle.fill}</div>
                                                                <div className="text-[10px] font-bold text-rose-300 uppercase tracking-tighter">Primary Swatch</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-6">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-3">
                                                                <div className="flex justify-between items-center px-1">
                                                                    <label className="text-[10px] font-black text-rose-400 dark:text-rose-300 uppercase tracking-widest block">Start Stop</label>
                                                                    <span className="text-[9px] font-mono font-black text-rose-400">{Math.round((currentNodeStyle?.fill.stops[0].offset || 0) * 100)}%</span>
                                                                </div>
                                                                <input
                                                                    title="Start Color"
                                                                    type="color"
                                                                    value={currentNodeStyle?.fill.stops[0].color}
                                                                    onChange={(e) => {
                                                                        const grad = { ...(currentNodeStyle?.fill as any) };
                                                                        grad.stops[0].color = e.target.value;
                                                                        updateNodeStyle(selectedNodeId, { fill: grad });
                                                                    }}
                                                                    className="w-full h-8 rounded-lg border-none p-0 bg-transparent cursor-pointer"
                                                                />
                                                                <input
                                                                    title="Start Offset"
                                                                    type="range" min="0" max="1" step="0.01"
                                                                    value={currentNodeStyle?.fill.stops[0].offset || 0}
                                                                    onChange={(e) => {
                                                                        const grad = { ...(currentNodeStyle?.fill as any) };
                                                                        grad.stops[0].offset = Number(e.target.value);
                                                                        updateNodeStyle(selectedNodeId, { fill: grad });
                                                                    }}
                                                                    className="w-full h-1 appearance-none rounded-full accent-rose-500 bg-rose-100"
                                                                />
                                                            </div>
                                                            <div className="space-y-3">
                                                                <div className="flex justify-between items-center px-1">
                                                                    <label className="text-[10px] font-black text-rose-400 dark:text-rose-300 uppercase tracking-widest block">End Stop</label>
                                                                    <span className="text-[9px] font-mono font-black text-rose-400">{Math.round((currentNodeStyle?.fill.stops[1].offset || 0) * 100)}%</span>
                                                                </div>
                                                                <input
                                                                    title="End Color"
                                                                    type="color"
                                                                    value={currentNodeStyle?.fill.stops[1].color}
                                                                    onChange={(e) => {
                                                                        const grad = { ...(currentNodeStyle?.fill as any) };
                                                                        grad.stops[1].color = e.target.value;
                                                                        updateNodeStyle(selectedNodeId, { fill: grad });
                                                                    }}
                                                                    className="w-full h-8 rounded-lg border-none p-0 bg-transparent cursor-pointer"
                                                                />
                                                                <input
                                                                    title="End Offset"
                                                                    type="range" min="0" max="1" step="0.01"
                                                                    value={currentNodeStyle?.fill.stops[1].offset || 0}
                                                                    onChange={(e) => {
                                                                        const grad = { ...(currentNodeStyle?.fill as any) };
                                                                        grad.stops[1].offset = Number(e.target.value);
                                                                        updateNodeStyle(selectedNodeId, { fill: grad });
                                                                    }}
                                                                    className="w-full h-1 appearance-none rounded-full accent-rose-500 bg-rose-100"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-4">
                                                            <div className="flex justify-between items-end px-1">
                                                                <label className="text-[10px] font-black text-rose-400 dark:text-rose-300 uppercase tracking-widest">Gradient Angle</label>
                                                                <span className="text-[10px] font-mono font-black text-rose-500">{currentNodeStyle?.fill.angle ?? 0}°</span>
                                                            </div>
                                                            <input
                                                                title="Gradient Angle"
                                                                type="range" min="0" max="360"
                                                                value={currentNodeStyle?.fill.angle ?? 0}
                                                                onChange={(e) => {
                                                                    const grad = { ...(currentNodeStyle?.fill as any) };
                                                                    grad.angle = Number(e.target.value);
                                                                    updateNodeStyle(selectedNodeId, { fill: grad });
                                                                }}
                                                                className="w-full h-1.5 bg-rose-100 dark:bg-rose-950/30 rounded-full accent-rose-500 appearance-none cursor-pointer"
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-black text-rose-400 dark:text-rose-300 uppercase tracking-widest block px-1">Stroke Design</label>
                                                    <div className="flex items-center gap-6">
                                                        <input
                                                            title="Stroke Color"
                                                            type="color"
                                                            value={currentNodeStyle?.stroke || '#000000'}
                                                            onChange={(e) => updateNodeStyle(selectedNodeId, { stroke: e.target.value })}
                                                            className="w-16 h-16 rounded-[1.5rem] border-none p-0 bg-transparent cursor-pointer hover:scale-105 transition-transform"
                                                        />
                                                        <div className="flex-1 space-y-4">
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between items-end">
                                                                    <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Thickness</span>
                                                                    <span className="text-[10px] font-mono font-black text-rose-600">{currentNodeStyle?.strokeWidth ?? 0}px</span>
                                                                </div>
                                                                <input
                                                                    title="Stroke Width"
                                                                    type="range" min="0" max="10" step="0.5"
                                                                    value={currentNodeStyle?.strokeWidth ?? 0}
                                                                    onChange={(e) => updateNodeStyle(selectedNodeId, { strokeWidth: Number(e.target.value) })}
                                                                    className="w-full h-1 bg-rose-100 dark:bg-rose-950/30 rounded-full accent-rose-500 appearance-none cursor-pointer"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest block px-1">Alpha / Opacity</label>
                                                <div className="flex gap-4 items-center">
                                                    <input
                                                        title="Fill Opacity"
                                                        type="range" min="0.1" max="1" step="0.1" value={currentNodeStyle?.fillOpacity ?? 1}
                                                        onChange={(e) => updateNodeStyle(selectedNodeId, { fillOpacity: Number(e.target.value) })}
                                                        className={`flex-1 h-1.5 appearance-none rounded-full accent-rose-900 cursor-pointer ${uiMode === 'dark' ? 'bg-rose-950/30' : 'bg-rose-200'}`}
                                                    />
                                                    <span className="text-[10px] font-black text-rose-900 w-8">{Math.round((currentNodeStyle?.fillOpacity ?? 1) * 100)}%</span>
                                                </div>
                                            </div>

                                            {currentNode?.type === NodeType.LABEL && (
                                                <div className="pt-6 border-t border-rose-100 space-y-6">
                                                    <div className="space-y-4">
                                                        <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest block px-1">Label Text Size</label>
                                                        <div className="flex gap-4 items-center">
                                                            <input
                                                                title="Font Size"
                                                                type="range" min="8" max="32" step="1" value={currentNodeStyle?.fontSize ?? 14}
                                                                onChange={(e) => updateNodeStyle(selectedNodeId, { fontSize: Number(e.target.value) })}
                                                                className={`flex-1 h-1.5 appearance-none rounded-full accent-rose-900 cursor-pointer ${uiMode === 'dark' ? 'bg-rose-950/30' : 'bg-rose-200'}`}
                                                            />
                                                            <span className="text-[10px] font-black text-rose-900 w-8">{currentNodeStyle?.fontSize ?? 14}px</span>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest block px-1">Font Color</label>
                                                        <input
                                                            title="Font Color"
                                                            type="color"
                                                            value={currentNodeStyle?.fontColor ?? '#000000'}
                                                            onChange={(e) => updateNodeStyle(selectedNodeId, { fontColor: e.target.value })}
                                                            className="w-full h-8 rounded-lg border-none p-0 bg-transparent cursor-pointer"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {(currentNode?.type === NodeType.CENTER_CONTENT || currentNodeStyle?.iconName) && (
                                                <div className="pt-6 border-t border-rose-100 space-y-6">
                                                    <div className="space-y-4">
                                                        <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest block px-1">Icon Selection</label>
                                                        <div className="grid grid-cols-4 gap-2">
                                                            {['Coffee', 'Star', 'Activity', 'Box', 'Heart', 'Zap', 'Target', 'Smile'].map(icon => (
                                                                <button
                                                                    key={icon}
                                                                    onClick={() => updateNodeStyle(selectedNodeId, { iconName: icon })}
                                                                    className={`p-3 rounded-xl border flex items-center justify-center transition-all ${currentNodeStyle?.iconName === icon ? 'bg-rose-900 text-white' : 'bg-white text-rose-400 border-rose-100'}`}
                                                                >
                                                                    {React.createElement((LucideIcons as any)[icon], { size: 16 })}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 px-10 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-100 animate-pulse">
                                    <div className="p-4 bg-white rounded-3xl shadow-sm mb-6"><MousePointer2 size={32} className="text-slate-200" /></div>
                                    <p className="text-xs font-black text-slate-400 text-center uppercase tracking-widest leading-relaxed">Select any node from the SCENE graph or PREVIEW to customize its visual blueprint</p>
                                </div>
                            )}

                            <section className="space-y-4 pt-10 pb-20">
                                <h3 className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-3 px-2">
                                    Technical Blueprint (L3)
                                    <div className="h-px flex-1 bg-rose-100"></div>
                                </h3>
                                <div className={`p-4 rounded-2xl font-mono text-[9px] overflow-x-auto whitespace-pre transition-colors duration-500 ${uiMode === 'dark' ? 'bg-slate-950 text-rose-400 border border-rose-900/30' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                    {JSON.stringify(theme, (key, value) => value instanceof Map ? Object.fromEntries(value) : value, 2)}
                                </div>
                                <button
                                    onClick={() => navigator.clipboard.writeText(JSON.stringify(theme, (key, value) => value instanceof Map ? Object.fromEntries(value) : value, 2))}
                                    className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-[9px] font-black uppercase tracking-widest text-slate-500 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Copy Layer JSON
                                </button>
                            </section>
                        </div>
                    )}

                    {activeTab === 'data' && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500 font-sans">
                            <header>
                                <h2 className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.3em] mb-1">Layer 0</h2>
                                <h3 className={`text-2xl font-black tracking-tight transition-colors ${uiMode === 'dark' ? 'text-white' : 'text-slate-900'}`}>Data Blueprint</h3>
                            </header>

                            <section className="space-y-6">
                                <div className="flex justify-between items-center px-1">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dimensions</h4>
                                    <button onClick={addDimension} className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md hover:bg-emerald-100 transition-colors">Add Dim</button>
                                </div>
                                <div className="space-y-3">
                                    {rawData.dimensions.map((dim, i) => (
                                        <div key={i} className={`flex gap-2 p-3 rounded-2xl border shadow-sm items-center transition-all ${uiMode === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                                            <input
                                                title="Dimension Label"
                                                className={`flex-1 text-[11px] font-bold border-none bg-transparent focus:ring-0 transition-colors ${uiMode === 'dark' ? 'text-white' : 'text-slate-900'}`}
                                                value={dim.label}
                                                onChange={(e) => {
                                                    const newDims = [...rawData.dimensions];
                                                    newDims[i] = { ...newDims[i], label: e.target.value };
                                                    setRawData(prev => ({ ...prev, dimensions: newDims }));
                                                }}
                                            />
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => updateMapping('x', dim.id)}
                                                    className={`px-2 py-1 text-[9px] font-black rounded transition-all ${rawData.meta?.mapping?.x === dim.id ? (uiMode === 'dark' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white') : (uiMode === 'dark' ? 'bg-slate-900 text-slate-500' : 'bg-slate-50 text-slate-400')}`}
                                                >
                                                    USE AS X
                                                </button>
                                                <button title="Remove Dimension" onClick={() => removeDimension(i)} className="p-1 hover:text-rose-500 transition-colors opacity-30 hover:opacity-100"><Trash2 size={12} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="space-y-6">
                                <div className="flex justify-between items-center px-1">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Measures</h4>
                                    <button onClick={addMeasure} className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md hover:bg-blue-100 transition-colors">Add Msr</button>
                                </div>
                                <div className="space-y-3">
                                    {rawData.measures.map((msr, i) => (
                                        <div key={i} className={`flex gap-2 p-3 rounded-2xl border shadow-sm items-center transition-all ${uiMode === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                                            <input
                                                title="Measure Label"
                                                className={`flex-1 text-[11px] font-bold border-none bg-transparent focus:ring-0 transition-colors ${uiMode === 'dark' ? 'text-white' : 'text-slate-900'}`}
                                                value={msr.label}
                                                onChange={(e) => {
                                                    const newMsrs = [...rawData.measures];
                                                    newMsrs[i] = { ...newMsrs[i], label: e.target.value };
                                                    setRawData(prev => ({ ...prev, measures: newMsrs }));
                                                }}
                                            />
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => updateMapping('value', msr.id)}
                                                    className={`px-2 py-1 text-[9px] font-black rounded transition-all ${rawData.meta?.mapping?.value === msr.id ? (uiMode === 'dark' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white') : (uiMode === 'dark' ? 'bg-slate-900 text-slate-500' : 'bg-slate-50 text-slate-400')}`}
                                                >
                                                    USE AS VAL
                                                </button>
                                                <button title="Remove Measure" onClick={() => removeMeasure(i)} className="p-1 hover:text-rose-500 transition-colors opacity-30 hover:opacity-100"><Trash2 size={12} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="space-y-4">
                                <div className="flex justify-between items-center px-1">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rows Management</h4>
                                    <button onClick={addRow} className="text-[10px] font-black text-slate-600 bg-slate-100 px-3 py-1 rounded-md hover:bg-slate-200 transition-colors">Add Row</button>
                                </div>
                                <div className="space-y-3">
                                    {rawData.data.map((row: any, i) => (
                                        <div key={i} className={`flex gap-3 items-center p-5 rounded-3xl border group transition-all shadow-sm ${uiMode === 'dark' ? 'bg-slate-800 border-slate-700 hover:border-indigo-500' : 'bg-white border-slate-100 hover:border-slate-300'}`}>
                                            <div className="flex-1 space-y-2">
                                                <input
                                                    title="Dimension Value"
                                                    className={`w-full text-[11px] font-black border-none rounded-lg px-3 py-1 focus:ring-1 transition-colors ${uiMode === 'dark' ? 'bg-slate-900 text-white focus:ring-slate-700' : 'bg-slate-50 text-slate-900 focus:ring-slate-200'}`}
                                                    value={row[rawData.meta?.mapping?.x || 'category']}
                                                    onChange={(e) => {
                                                        const newData = [...rawData.data];
                                                        newData[i] = { ...newData[i], [rawData.meta?.mapping?.x || 'category']: e.target.value };
                                                        setRawData(prev => ({ ...prev, data: newData }));
                                                    }}
                                                />
                                                <div className="flex justify-between items-center gap-4">
                                                    <input
                                                        title="Numeric Value"
                                                        type="number"
                                                        className={`flex-1 px-3 py-1 border rounded-lg text-xs font-bold outline-none transition-colors ${uiMode === 'dark' ? 'bg-slate-900 border-slate-700 text-white focus:ring-1 focus:ring-emerald-500' : 'bg-white border-slate-100 text-slate-900 focus:ring-1 focus:ring-emerald-500'}`}
                                                        value={row[rawData.meta?.mapping?.value || 'value']}
                                                        onChange={(e) => updateDataValue(i, Number(e.target.value))}
                                                    />
                                                    <button title="Remove Row" onClick={() => removeRow(i)} className="text-rose-400 hover:text-rose-600 transition-colors"><Trash2 size={14} /></button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="space-y-4 pt-10 pb-20">
                                <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-3 px-2">
                                    Technical Blueprint (L0)
                                    <div className="h-px flex-1 bg-emerald-100"></div>
                                </h3>
                                <div className={`p-4 rounded-2xl font-mono text-[9px] overflow-x-auto whitespace-pre transition-colors duration-500 ${uiMode === 'dark' ? 'bg-slate-950 text-emerald-400 border border-slate-800' : 'bg-slate-50 text-emerald-600 border border-emerald-100'}`}>
                                    {JSON.stringify(rawData, null, 2)}
                                </div>
                                <button
                                    onClick={() => navigator.clipboard.writeText(JSON.stringify(rawData, null, 2))}
                                    className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-[9px] font-black uppercase tracking-widest text-slate-500 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Copy Layer JSON
                                </button>
                            </section>
                        </div>
                    )}
                </div>

                <footer className={`mt-auto px-10 py-8 border-t flex flex-col gap-4 transition-colors duration-500 ${uiMode === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50/50 border-slate-50'}`}>
                    <div className="flex justify-between items-center opacity-30 group hover:opacity-100 transition-opacity duration-700">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">
                            FOUR-LAYER PERSISTENCE
                        </span>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className={`w-1 h-3 rounded-full transition-all duration-500 ${activeTab === ['data', 'geometry', 'scene', 'visual'][i - 1] ? 'bg-slate-900 h-6' : 'bg-slate-200'}`}></div>
                            ))}
                        </div>
                    </div>
                </footer>
            </aside >
        </div >
    );
}
