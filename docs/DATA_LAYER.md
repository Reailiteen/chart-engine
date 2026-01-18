# Data Layer

## Definition
Single source of truth for all values, categories, and relationships. Contains **no** visual or spatial information.

## Responsibilities

### ✅ Belongs Here
- Raw field values
- Dimension and measure mappings
- Aggregation functions (sum, average, count)
- Derived calculations (percentage, rank, running total)
- Sort order of data points
- Data point stable IDs
- Normalize and validate outputs

### ❌ Does NOT Belong Here
- X/Y coordinates
- Slice angles or radii
- Bar widths or heights
- Colors, fonts, or strokes
- Explode offsets or spacing
- Label positioning
- Layout logic or rendering instructions

## Dimensions vs Measures

### Dimensions (Grouping/Conceptual Positioning)
| Type | Description | Examples |
|------|-------------|----------|
| **Category** | Discrete buckets | Product, Country, Department |
| **Numeric** | Continuous values for ordering | Age, Score |
| **Time** | Ordered temporal values | Date, Month, Quarter |

### Measures (Aggregatable Numeric Values)
- **Examples:** Revenue, Count, Percentage, Duration
- **Operations:** sum, average, min/max, count, percentage-of-total

## Examples by Chart Type

| Chart | Dimension | Measure | Data Layer Output |
|-------|-----------|---------|-------------------|
| **Pie** | Category | Value | Percentage per category |
| **Bar** | Category | Value | Category + magnitude |
| **Line** | Time/Numeric | Value | Ordered points |
| **Bubble** | Numeric (x, y) | Size | Positions + size value (visual radius computed downstream) |

## Why Purity Matters
**Problem:** If pie percentages are calculated in Geometry Layer, changing colors incorrectly triggers recalculation.

**Solution:** Keep all data logic isolated in Data Layer.

**Benefits:**
- Chart type can change without reprocessing data
- Multiple visualizations share the same data source
- Data transformations are testable independent of rendering
- Styling changes do not trigger data recomputation

## Outputs
- Typed fields (dimensions, measures)
- Aggregation results and derived metrics
- Stable, normalized datasets for downstream consumption
