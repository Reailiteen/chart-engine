# Geometry/Layout Layer

## Definition
Determines where things exist in space. Translates data into pure spatial definitions using math and layout rules, with **no awareness** of color, typography, or aesthetics.

## Responsibilities

### ✅ Can Do
- Convert data values into positions, angles, sizes
- Compute chart-specific spatial primitives
- Define anchor points for labels and attachments
- Apply per-element geometry overrides (exploded slice, custom radius)
- Recompute deterministically on data changes

### ❌ Cannot Do
- Choose colors, gradients, shadows, fonts
- Create or destroy visual objects
- Perform label layout, collision resolution, or styling
- Render anything or issue drawing commands

## Chart-Specific Primitives

### Pie Chart
For each category with percentage `p`:
1. **Angles:** Compute cumulative `startAngle` and `endAngle` (radians)
2. **Radii:** Assign `innerRadius` and `outerRadius` (with optional per-slice overrides)
3. **Centroid:** Calculate slice centroid (polar midpoint → Cartesian)
4. **Label Anchor:**
   - Anchor point at `outerRadius + padding` along slice bisector
   - Side assignment (left/right) based on anchor x
5. **Leader Line Geometry:**
   - Segment from arc midpoint on outer edge to hinge point
   - Optional horizontal segment to label anchor

### Bar Chart
- **x/y positions**
- **widths, heights**
- **baselines**

### Line Chart
- **Ordered points**
- **Path segments**
- **Interpolation control points**

### Bubble Chart
- **x/y positions**
- **radius**

## Outputs
**Numbers and coordinates only:**
- Points, rectangles, radii, angles, paths
- Anchors per element
- Stable, deterministic geometry structures

All results are numeric coordinates and angles, enabling any renderer to draw arcs, leaders, and place labels.
