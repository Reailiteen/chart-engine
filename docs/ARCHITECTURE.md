# Chart Engine Architecture

## Overview
Strict four-layer architecture ensuring universal, scalable, and customizable charts without fragile configuration logic.

## The Four Layers

### 1. Data Layer
**Question:** What is the data?
- Ingests sources, validates types, applies filters/transforms
- Produces canonical, queryable datasets
- **Never** contains layout or visual logic

### 2. Geometry/Layout Layer
**Question:** Where do things go?
- Computes positions, sizes, bins, scales, axes, layouts
- Deterministic algorithms map data to spatial geometry
- Pure functions of data and parameters

### 3. Scene Graph Layer
**Question:** What objects exist?
- Hierarchical graph of marks and groups (bars, lines, labels)
- Encodes structure and semantics independent of styling
- Maintains stable object identity

### 4. Visual Styling Layer
**Question:** How should it look?
- Applies colors, strokes, fonts, effects, themes
- Controls appearance without altering structure or geometry
- Decorative only—never touches data, geometry, or structure

## Processing Flow
```
Data → Geometry/Layout → Scene Graph → Visual Styling → Rendering
```

**Strict rules:**
- Flow is **top-down only**
- No upward dependencies
- User edits stored as patches at their layer
- Layers reapplied on recomputation

## Design Benefits

| Benefit | Explanation |
|---------|-------------|
| **Data correctness** | Validations and transforms before layout/styling |
| **Deterministic layout** | Pure functions = reproducible, traceable results |
| **Safe styling** | Visual changes never modify structure or geometry |
| **Extensibility** | New capabilities target appropriate layer without rewrites |

## Layer Separation Rules

| Layer | Can Do | Cannot Do |
|-------|--------|-----------|
| **Data** | Raw values, dimensions, measures, aggregations, derived calculations, stable IDs | X/Y coords, angles, radii, colors, fonts, label positioning |
| **Geometry** | Positions, sizes, angles, spatial primitives, anchor points | Colors, fonts, create/destroy objects, styling |
| **Scene Graph** | Define nodes, hierarchies, bindings, user overrides | Geometry computation, data aggregation, styling decisions |
| **Visual Styling** | Fills, strokes, typography, effects, themes, animations | Change positions/sizes, modify structure, transform data |

## Change Propagation
1. Data changes (new values, filters, aggregation)
2. Data Layer recomputes derived values
3. Geometry Layer recalculates positions/sizes
4. Scene Graph updates element structure
5. Visual Styling reapplies styles

## Stable IDs
Each data point needs a **stable identifier** that persists across updates:
- User customizations survive data refresh (exploded slice, custom color)
- Animations track state correspondence
- Selection and interaction states remain consistent

**Generate from:** Dimension values or row keys
**Never from:** Array indices
