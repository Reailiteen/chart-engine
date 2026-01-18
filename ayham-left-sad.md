# Chart Engine Documentation

## 📚 Documentation Structure

This documentation describes the chart engine's four-layer architecture designed for universal, scalable, and customizable charts.

### Core Documentation

- **[Architecture Overview](docs/ARCHITECTURE.md)** - Complete system architecture, layers, flow, and design benefits
- **[Data Layer](docs/DATA_LAYER.md)** - Source of truth, dimensions, measures, and data purity principles
- **[Geometry/Layout Layer](docs/GEOMETRY_LAYER.md)** - Spatial intelligence, positioning, and layout algorithms
- **[Scene Graph Layer](docs/SCENE_GRAPH_LAYER.md)** - Object structure, hierarchies, and node management
- **[Visual Styling Layer](docs/VISUAL_STYLING_LAYER.md)** - Appearance, themes, and presentation
- **[Dimensionality & Scope](docs/DIMENSIONALITY_AND_SCOPE.md)** - Supported chart types and system limits

### Quick Reference

#### The Four Questions
1. **Data:** What is the data?
2. **Geometry:** Where do things go?
3. **Scene Graph:** What objects exist?
4. **Visual Styling:** How should it look?

#### Processing Flow
```
Data → Geometry → Scene Graph → Visual Styling → Rendering
```

#### Key Principle
**Strict top-down flow. No upward dependencies. Each layer owns one concern.**
