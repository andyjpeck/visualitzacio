# Track 12: Toolbar Preset Selector & Overwrite Confirmation Guard

This track adds a dynamic preset selector directly in the upper floating toolbar (`Toolbar`), dynamically discovering all presets in `presets/*.json` and protecting non-empty scenes with an overwrite confirmation modal dialog.

## Documents

- [**Track Specification (`spec.md`)**](./spec.md): Functional and architectural requirements.
- [**Implementation Plan (`plan.md`)**](./plan.md): Phased TDD implementation plan with pause gate after Phase 2 for manual testing.
- [**Metadata (`metadata.json`)**](./metadata.json): Track status, type, and branch tracking.

## Key Deliverables

1. **Dynamic Preset Catalog (`preset-catalog.ts`):** Zero-hardcoded discovery of presets in `presets/*.json` using Vite glob import.
2. **Scene Emptiness Detection (`hasChildLayers`):** Evaluates if the current canvas has any child layers beyond `master-frame-buffer`.
3. **Preset Selector Component (`PresetSelector`):** Cyberpunk glassmorphic select dropdown integrated into `Toolbar`.
4. **Overwrite Confirmation Guard (`BaseModalDialog`):** Accessible portal confirmation dialog warning user before overwriting existing layers, with full 100-step undo integration (`Ctrl+Z`).
