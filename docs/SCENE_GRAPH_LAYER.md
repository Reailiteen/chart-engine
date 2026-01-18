# Scene Graph Layer

## Definition
Hierarchical graph of typed visual nodes defining **what exists** and **how objects connect**—not how they look or where they're placed.

## Responsibilities

### ✅ Can Do
- Define nodes: Chart root, Rings, Slice groups, Labels, Leader lines, Center containers, Badges, Icons, Callouts
- Allow multiple nodes per data point (slice with primary label, secondary label, icon, badge)
- Add, delete, duplicate nodes dynamically at runtime
- Maintain stable object identity across updates
- Store manual overrides: dragged label offsets, hidden/shown state, custom grouping
- Bind nodes to data entities and geometry anchors

### ❌ Cannot Do
- Recompute geometry (comes from Geometry Layer)
- Aggregate data or perform calculations (handled by Data Layer)
- Decide colors, fonts, strokes, effects (handled by Visual Styling Layer)
- Perform collision detection or label placement algorithms (may delegate, but doesn't own)

## Capabilities Enabled
- **Multiple labels per slice** (category + percentage)
- **Independent badges, icons, callouts**
- **Center content containers** (donut hole content)
- **Drag-and-drop editing** with persisted offset overrides
- **Conditional visibility** via rules or user actions

## Outputs
- Hierarchical tree of typed nodes with stable IDs
- Data bindings to source entities
- References to geometry anchors
- Stored user overrides (offsets, visibility, grouping)
- Structure ready for decoration by Visual Styling Layer

## Example Node Structure
```
Chart
├── Ring
│   ├── Slice Group (Product A)
│   │   ├── Arc
│   │   ├── Primary Label
│   │   ├── Secondary Label
│   │   ├── Leader Line
│   │   └── Badge
│   └── Slice Group (Product B)
│       ├── Arc
│       └── Primary Label
└── Center Container
    ├── Total Value
    └── Icon
```
