# Testing Subsystem (`src/test/`)

This directory houses global Vitest setup configurations, testing helpers, and mock fixtures.

## Overview

The testbed uses Vitest with JSDOM and Testing Library for unit and component testing. Strict decoupled interfaces allow running 100% of the WebGL and Web Audio tests without a physical GPU or hardware audio card.

## Subdirectories

- [**`fixtures/`**](file:///C:/Users/andyj/Documents/visualitzacio/src/test/fixtures/README.md)
  Mock factories and virtual clock schedulers for testing `AudioContext`, `WebGLRenderer`, and animation frame timing.

## Files

- [**`setup.ts`**](file:///C:/Users/andyj/Documents/visualitzacio/src/test/setup.ts):
  Global test suite configuration, polyfilling `ResizeObserver` and extending `@testing-library/jest-dom` matchers.
