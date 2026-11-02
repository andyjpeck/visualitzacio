# Track 13: Responsive Toolbar Overflow & Wrapping

This track fixes the issue where buttons on the right side of the floating toolbar become inaccessible when horizontal real estate is constrained, by introducing semantic control clustering, flexbox multi-row wrapping, right-aligned stacking, and subtle adaptive scaling down to 320px.

## Documents

- [**Track Specification (`spec.md`)**](./spec.md): Functional, responsive, and architectural requirements.
- [**Implementation Plan (`plan.md`)**](./plan.md): Phased TDD implementation plan.
- [**Metadata (`metadata.json`)**](./metadata.json): Track status, type, and branch tracking.

## Key Deliverables

1. **Semantic Control Clustering:** Grouping toolbar elements into non-fragmenting clusters (Playback + Sources, Scrubber + Preset Selector, Action Tools).
2. **Responsive Multi-Row Wrapping:** Graceful wrapping via `flex-wrap` and right-alignment (`justify-end`), preventing horizontal canvas clipping.
3. **Adaptive Scale & Bounds Safety:** Accurate container dimension measurement and graceful scaling fallback for extreme constraints (< 360px).
4. **Comprehensive Test Suite:** Vitest component tests and Playwright E2E verification across narrow viewports down to 320px.
