# Global Application Store (`src/ui/store/`)

This directory provides centralized state management for low-frequency UI states (<10 Hz) using Zustand.

## Files

- [**`app-store.ts`**](file:///C:/Users/andyj/Documents/visualitzacio/src/ui/store/app-store.ts):
  - **Audio & Transport State:** `isPlaying`, `sourceType` (`'sample' | 'file' | 'mic'`), `volume`, `audioFileName`, `audioError`, `isAudioLoading`, `audioLoadingProgress`, `audioLoadingStage`.
  - **Dialog Navigation Stack:** `dialogStack: DialogId[]` enforcing single active dialog invariant, history walk-back, and derived flags (`isPresetSettingsOpen`, `isFormulaTestbedOpen`, `isTemplateSelectorOpen`).
  - **Performance & DSP Presets:** `currentFps`, `targetFps`, `resolutionScale`, `showFpsOverlay`, `audioBands` (`bassMin`, `bassMax`, `midMin`, `midMax`, `trebleMin`, `trebleMax`).
  - **Dynamic Formula State:** `activeFormula`, `bindFormulaToScene`, `isFormulaPresetsOpen`, `isFormulaReferenceOpen`.
  - **Frame Buffer & Feedback:** `selectedTemplateId`, `feedbackEnabled`, `feedbackBlendMode`, `feedbackOpacity`, `feedbackScale`, `feedbackRotation`, `feedbackPositionX`, `feedbackPositionY`, `isCustomFeedbackConfig`.
  - **Actions:** Unified stack actions (`openDialog`, `closeDialog`, `toggleDialog`, `closeAllDialogs`), template applicators, audio progress setters, and DSP tuning reducers.
- [**`app-store.test.ts`**](file:///C:/Users/andyj/Documents/visualitzacio/src/ui/store/app-store.test.ts):
  - Comprehensive unit test suite covering audio loading progress stages, mutual exclusion, stack history navigation, and DSP band resets.
