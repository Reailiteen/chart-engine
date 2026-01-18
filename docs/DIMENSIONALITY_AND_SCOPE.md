# Supported Dimensionality and Chart Scope

## Dimensionality Limits
**Maximum:** 3 simultaneous encodings across dimensions and measures

```
Total encodings ≤ 3 (dimensions + measures combined)
```

### Definitions

| Type | Purpose | Examples |
|------|---------|----------|
| **Dimensions** | Categorical, ordinal, numeric, or time-based fields for grouping, ordering, axes, series separation | category, time, region, product, series |
| **Measures** | Quantitative fields representing magnitude; aggregated (sum, average, count, percentage, etc.) | value, revenue, count, score |

### Validation
If a chart spec exceeds these limits, the system **must fail validation** and surface a clear, user-readable error explaining which encodings exceeded the limit and why.

---

## Supported Chart Types

### 1. Pie / Donut Charts (Radial)
**Encodings:** 1 dimension (category) + 1 measure (value)

**Features:**
- Single series only
- Measure aggregates to whole (derives percentages)
- Donut (inner radius > 0)
- Exploded slices (per-slice geometry overrides)
- Multi-label slices
- Center content (text, icons, containers)

**Why in scope:** Simple dimensionality, strong radial geometry fit, ideal for validating 4-layer architecture

---

### 2. Bar Charts (Including Variations)
**Encodings:** 1–2 dimensions + 1 measure

**Patterns:**
| Pattern | Encodings |
|---------|-----------|
| **Simple bar** | Category (x) + measure (height) |
| **Grouped bar** | Category (x) + series (dimension 2) + measure |
| **Stacked bar** | Category (x) + series (dimension 2) + measure (stacked) |

**Constraints:**
- Total encodings ≤ 3
- Stacking is geometry/layout concern, not data concern

**Why in scope:** Canonical cartesian chart, demonstrates dimensional grouping and stacking, works cleanly with geometry + scene graph model

---

### 3. Line Charts (Including Multi-Line)
**Encodings:** 1 dimension (time/ordered category) + 1–2 measures

**Patterns:**
| Pattern | Encodings |
|---------|-----------|
| **Single line** | x-dimension + measure |
| **Multi-line** | x-dimension + series OR x-dimension + two measures |

**Constraints:**
- All lines share same x-dimension
- Dual-measure lines limited to 2 measures max

**Why in scope:** Temporal and ordered data representation, supports comparisons and trends, demonstrates continuous geometry and path generation

---

### 4. Scatter and Bubble Charts
**Encodings:** 2 dimensions (x, y) + 1 measure (size)

**Notes:**
- Bubble charts are scatter plot specialization
- Size always derived from measure
- Optional color via styling, not as additional encoding

**Why in scope:** Fits exactly within dimensionality limits, reinforces multi-channel encoding without adding complexity

---

### 5. Heat Maps
**Encodings:** 2 dimensions (x, y categories) + 1 measure (value → color intensity)

**Patterns:**
- Category (x)
- Category (y)
- Measure (color)

**Constraints:**
- Measure must map to color or intensity
- No additional size or shape encoding allowed

**Why in scope:** Clear 3-encoding use case, demonstrates matrix-based geometry, no higher-order relationships needed

---

### 6. Radial Charts (Beyond Pie)
**Encodings:** Same limits as cartesian equivalents

**Examples:**
- Radial bar charts
- Radial stacked bars
- Circular progress charts

**Why in scope:** Geometry differs, but data semantics don't; reuses same data and scene graph principles; expands visual variety without increasing data complexity

---

## Out of Scope

### 1. Network and Flow Charts
**Examples:** Sankey diagrams, Graphs (nodes/edges), Chord diagrams

**Why out of scope:**
- Require relational (edge-based) data models
- Cannot be expressed as dimensions + measures
- Geometry depends on graph layout algorithms, not scales

---

### 2. Geographic / Map-Based Charts
**Examples:** Choropleth maps, Point maps, Region overlays

**Why out of scope:**
- Require geographic projections
- Depend on external spatial data
- Introduce coordinate systems incompatible with current geometry layer

---

### 3. Hierarchical Radial Charts
**Examples:** Sunburst, Treemap, Icicle charts

**Why out of scope:**
- Require hierarchical data (tree structures)
- Break flat row-based data assumptions
- Need recursive layout algorithms
