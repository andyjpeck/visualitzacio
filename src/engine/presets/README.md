# Preset Serialization & Schema Engine (`src/engine/presets/`)

The `presets` directory contains the data serialization, validation, and schema definitions that allow users to save, export, load, and share Visualització compositions as portable JSON documents.

## Key Modules

- [**`preset-serializer.ts`**](file:///C:/Users/andyj/Documents/visualitzacio/src/engine/presets/preset-serializer.ts):
  - Extracts the active application state (metadata, performance settings, audio frequency bands, ping-pong feedback configuration, and node graph hierarchy) into a standardized `Preset` object.
  - Groups nodes by container and calculates deterministic `executionIndex` ordering based on vertical sibling position.
  - Strips transient canvas layout coordinates (`position`, `extent`, `measured`) so presets represent pure topological graphs capable of automatic DAG layout upon load.
  - Provides `serializePreset()` and `serializePresetToJson()`.

- [**`preset-serializer.test.ts`**](file:///C:/Users/andyj/Documents/visualitzacio/src/engine/presets/preset-serializer.test.ts):
  - Comprehensive unit test suite covering minimal graphs, multi-tier container hierarchies, parameter stripping, JSON formatting, and strict validation against `validatePreset()`.
