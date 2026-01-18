# Visual Styling Layer

## Definition
Rendering-time layer that maps scene graph nodes to visual properties. Answers "How should this object look?" without touching data, geometry, or structure.

## Responsibilities

### ✅ Can Do
- **Fills:** solid colors, gradients, patterns
- **Strokes:** borders, line styles, caps, joins, dash arrays
- **Typography:** fonts, weights, sizes, letter spacing, alignment
- **Effects:** shadows, glows, blurs, filters
- **Opacity and blending modes**
- **Animations and transitions** (enter, update, exit, interaction states)
- **Themes and color palettes** (global and component-scoped)
- **Conditional styling rules** based on node state (selected, hovered, muted, threshold flags)
- **Store and reapply user style overrides** as patches

### ❌ Cannot Do
- Change positions, sizes, angles, or geometry
- Add, remove, or reorder scene graph nodes
- Aggregate or transform data
- Perform layout, label placement, or collision detection
- Modify object structure or hierarchy

## Key Principles

| Principle | Explanation |
|-----------|-------------|
| **Decorative only** | Never alters data correctness or spatial layout |
| **No recomputation** | Changes don't require recomputing data, geometry, or structure |
| **Swappable themes** | Entire themes can be swapped without touching earlier layers |
| **Patch-based edits** | User edits stored as style patches and reapplied each render |

## Examples

### Pie Chart
- Apply palette to slices
- Style leader lines
- Set label fonts
- Add slice drop shadows

### Bar Chart
- Gradient bar fills
- Stroke widths
- Hover/focus states with opacity and glow

### Theme Swap
The same scene graph styled with different themes yields visually distinct charts.

## Outputs
Render-ready visual properties per node:
- Colors, strokes, fonts, effects
- Opacity, blending
- Animations
- Style sheets, theme definitions, user override patches
- Renderer instructions that modify **appearance only**
