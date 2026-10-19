# Dynamic Expression Engine (`src/engine/expressions/`)

This directory contains the sandboxed mathematical expression parser, abstract syntax tree (AST) compiler, and parameter binding system for real-time visual parameter modulation.

## Contents

- `expression-engine.ts`: Core `ExpressionEngine` class based on `expr-eval`. Compiles expressions, caches ASTs in memory, manages zero-allocation telemetry scope bindings (`$VARIABLE`), and provides audio envelope/wave functions (`#FUNCTION`).
- `dynamic-param.ts`: `DynamicParam<T>` abstraction allowing any component parameter to be bound to either a static numeric constant or a dynamic mathematical formula.
- `expression-engine.test.ts`: Vitest unit tests for syntax parsing, AST caching, mathematical operators, variable substitution, error fallbacks, security constraints, and execution performance.
- `system-functions.test.ts`: Vitest unit tests for `#BEAT`, `#BEAT_FRAMES`, `#FFT`, `#WAVEFORM`, `#TRI`, `#SAW`, and `#SQR`.
- `dynamic-param.test.ts`: Vitest unit tests for static vs dynamic parameter creation and frame evaluation.
