# Specification: Track 15 — Editor & Performance Settings Section in Toolbar Menu (#15)

## 1. Overview
Visualització currently exposes only preset-scoped performance and DSP settings (`target_fps`, `resolution_scale`, and `audioBands`) inside the toolbar Settings modal (`PresetSettingsModal`), all of which serialize into the portable preset JSON file. Global editor and client preferences—such as toggling **Layer Complexity Cost Estimates** in the Layers panel and toggling the **Debug Telemetry Overlay** (FPS & Audio HUD)—do not yet have a dedicated section in the Settings modal and must be persisted locally in `localStorage` without ever polluting exported preset JSON files.

This track adds a dedicated **Editor & Performance Settings** section to the toolbar Settings modal, wires persistent `localStorage`-backed preferences in `useAppStore` (`showLayerComplexity` and `showDebugData`), and ensures strict separation between portable preset configuration and local client/editor preferences.

---

## 2. Functional Requirements

### FR-1: Persistent Editor & Performance Preferences in `useAppStore` (`src/ui/store/app-store.ts`)
- Add a persistent boolean state property `showLayerComplexity: boolean` (default `true`) to `AppState`, backed by `localStorage` under the key `STORAGE_KEY_SHOW_LAYER_COMPLEXITY = 'visualitzacio_show_layer_complexity'`.
- Provide actions `setShowLayerComplexity(show: boolean): void` and `toggleLayerComplexity(): void` that update the Zustand store and persist the value to `localStorage`.
- Persist the existing `showDebugData` (and alias `showFpsOverlay`) boolean state to `localStorage` under `STORAGE_KEY_SHOW_DEBUG_DATA = 'visualitzacio_show_debug_data'` (default `true`) whenever `toggleDebugData()` or `setShowDebugData(show: boolean)` is called, initializing from `localStorage` on store creation.

### FR-2: Editor & Performance Settings Section in Toolbar Settings Modal (`src/ui/settings/preset-settings-modal.tsx`)
- Update `PresetSettingsModal` to clearly distinguish between:
  1. **Preset Performance & DSP Settings** (portable with the preset: Target FPS, Render Resolution Scale, and Audio Frequency Bands).
  2. **Editor & Performance Settings (Local Preferences)** (saved to `localStorage`, never exported in preset JSON):
     - **Layer Complexity Cost Estimates** (`data-testid="setting-layer-complexity-toggle"`): Interactive toggle/segmented control (`On (Cost Estimates)` / `Off`) controlling `showLayerComplexity`, with helper description explaining that it displays static computational complexity badges on nodes in the Layers panel.
     - **Debug Telemetry Overlay (FPS & Audio HUD)** (`data-testid="setting-debug-overlay-toggle"`): Interactive toggle/segmented control (`Visible` / `Hidden`) controlling `showDebugData`, synchronized with the toolbar Activity button.

### FR-3: Strict Preset Serialization Isolation
- Verify that `serializePreset` and `serializePresetToJson` never include `showLayerComplexity` or `showDebugData` in the exported preset JSON object, and that loading/deserializing a preset (`loadPreset`) preserves the user's `showLayerComplexity` and `showDebugData` editor preferences.

---

## 3. Non-Functional Requirements
- **Zero Runtime Overhead:** Storing and toggling editor preferences occurs strictly in the UI Control Plane (`useAppStore` + `localStorage`) with zero per-frame overhead on the Render Data Plane.
- **Accessibility & Responsive Layout:** All new toggle controls in the Settings modal must have explicit `aria-label` / `aria-pressed` attributes, keyboard focus styles, and scroll cleanly within `max-h-[90vh]` on narrow and mobile viewports.

---

## 4. Acceptance Criteria
- [x] Users can open the Settings modal from the toolbar and access the **Editor & Performance Settings** section alongside Preset Performance & DSP settings.
- [x] Toggling **Layer Complexity Cost Estimates** (`showLayerComplexity`) and **Debug Telemetry Overlay** (`showDebugData`) updates `useAppStore` and persists across page reloads via `localStorage`.
- [x] Exporting a preset to JSON or loading a new preset leaves editor preferences (`showLayerComplexity`, `showDebugData`) untouched and absent from the serialized JSON.
- [x] Unit tests, preset serialization tests, and Playwright E2E actionability tests pass cleanly.

---

## 5. Out of Scope
- Rendering the computational complexity badge indicators on individual layer tree rows and calculating per-node static complexity scores (tracked separately in Issue #16).
