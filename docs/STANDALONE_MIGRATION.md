# Standalone Migration Knowledge

Version: 1.0  
Baseline: 2026-09-29

No native framework is selected. This document identifies what must be reproduced and what is currently web-specific. Migration means product-behavior parity, not line-by-line code reuse.

## 1. Product Data to Preserve

- Stable parameter IDs and versioned mappings.
- Curves as normalized `{x,y}` points over output time.
- Smoothstep interpolation semantics.
- Normalized Source Window boundaries.
- Output Duration and format semantics.
- Fixed Hann envelope decision.
- Preview 64/32 disclosure and full Render intent.
- Grain scheduling, pitch-bound behavior, source clamps, randomization policy, gain rules, and channel assignment.
- Interaction contracts for Pen, Eraser, modifiers, Clear, Reset, and seeking.
- Fine-tuning history and listening results as they are established.

## 2. Future State Schema Direction

There is no current persistent state format. A future schema should be designed before either Web or Standalone persistence is added.

```json
{
  "schemaVersion": 1,
  "product": "granular-curve-lab",
  "module": "granular",
  "parameters": {
    "durationSeconds": 20,
    "rangeStart": 0,
    "rangeEnd": 0.005,
    "format": "mono",
    "envelope": "hann"
  },
  "curves": {
    "position": [{ "x": 0, "y": 0.5 }, { "x": 1, "y": 0.5 }]
  },
  "settings": {}
}
```

This is a direction, not an implemented schema. Source-file references, embedding policy, random seed, and platform paths require product decisions.

## 3. Migration Inventory

### Source File Loading

**Current Web Implementation:** File input, ArrayBuffer, `decodeAudioData`.  
**Platform-Independent Behavior:** Local audio becomes channel-0 mono source with preserved sample rate/duration.  
**Reusable Data/Algorithm:** Waveform peak reduction; source metadata semantics.  
**Web-Specific Dependency:** Browser codec support and file chooser.  
**Standalone Replacement Needed:** Native file panel and decoder.  
**Migration Risk:** Medium; codec support and sandbox bookmarks differ.  
**Priority:** High.

### Curve Model and Interpolation

**Current Web Implementation:** JavaScript arrays sampled by shared/worklet functions.  
**Platform-Independent Behavior:** Normalized points, sorted time, smoothstep interpolation, endpoint extension.  
**Reusable Data/Algorithm:** Directly portable formulas and data semantics.  
**Web-Specific Dependency:** Canvas pointer conversion only.  
**State/Preset Requirement:** Stable IDs and point precision.  
**Migration Risk:** Low algorithmically; high if endpoint behavior is changed accidentally.  
**Priority:** Critical.

### Curve Editor Interaction

**Current Web Implementation:** Pointer Events, Canvas hit testing, DOM buttons, custom SVG cursor.  
**Platform-Independent Behavior:** Pen add/move, Eraser existing-point-only deletion, endpoint protection, temporary modifier erase.  
**Reusable Algorithm:** Normalized hit conversion and nearest-point ellipse test.  
**Web-Specific Dependency:** Pointer capture, browser cursor URL, Command/Ctrl event fields.  
**Standalone Replacement Needed:** Native gesture and cursor system.  
**Migration Risk:** Medium. Current endpoints are deletion-protected but movable; reproduce or formally change with migration.  
**Priority:** High.

### Source Window

**Current Web Implementation:** Waveform Canvas pointer gestures.  
**Platform-Independent Behavior:** Normalized hard read bounds; click minimum 5 ms; bidirectional drag expansion.  
**Fine-Tuning Data:** 5 ms minimum; 0.008 gesture threshold; 10 px is display-only and should not become product data.  
**Standalone Replacement Needed:** Native waveform selection overlay.  
**Migration Risk:** Medium due confusion between display and stored width.  
**Priority:** Critical.

### Realtime Granular Engine

**Current Web Implementation:** Stereo `AudioWorkletProcessor`.  
**Platform-Independent Behavior:** Scheduling, mappings, source bounds, cubic interpolation, Hann envelope, per-grain pitch/randomization, L/R balance, risk gain.  
**Reusable Algorithm:** DSP formulas; code may serve as reference rather than production native code.  
**Web-Specific Dependency:** Worklet lifecycle, message port, browser sample quantum.  
**Standalone Replacement Needed:** Native realtime audio callback with allocation-safe grain management.  
**Migration Risk:** High. Current worklet uses dynamic arrays/splice and duplicated helpers; native realtime safety requires different implementation without changing sound.  
**Priority:** Critical.

### Preview Load Fallback

**Current Web Implementation:** Main-thread heuristic selects 32/64 and worklet removes oldest grains.  
**Platform-Independent Behavior:** Preserve responsive preview and disclose quality/voice state.  
**Fine-Tuning Data:** Threshold `2600`; formal hardware rationale UNKNOWN.  
**Standalone Replacement Needed:** Native CPU/voice policy may differ, but behavior changes require listening comparison.  
**Migration Risk:** Medium.  
**Priority:** Medium.

### Offline Render

**Current Web Implementation:** Async JavaScript loops, periodic yielding, Blob WAV.  
**Platform-Independent Behavior:** Full timeline, deterministic random sequence, selected channels, same curves/mappings/bounds/envelope, render gain pass.  
**Reusable Algorithm:** Grain render at fixed 48 kHz, cubic source-rate compensation, balanced channel function, 24-bit PCM encoding, and deterministic TPDF dither.  
**Web-Specific Dependency:** Blob, object URL, browser download, `setTimeout` yield.  
**Standalone Replacement Needed:** Background render job, progress/cancel, file save panel.  
**Migration Risk:** High for DSP parity and cancellation; low for standard 24-bit PCM WAV container basics.  
**Priority:** Critical.

### Gain and Limiter Behavior

**Current Web Implementation:** Different Preview and Render risk strategies followed by `tanh` and `0.89125` coefficient.  
**Platform-Independent Behavior:** Reduce clipping risk without full loudness normalization.  
**Fine-Tuning Data:** `outputGain=0.92`, Preview active factor `0.55`, ceiling coefficient `0.89125`. Listening rationale incomplete.  
**Standalone Replacement Needed:** Equivalent numerics and denormal/realtime review.  
**Migration Risk:** High because small differences are audible.  
**Priority:** Critical.

### Multichannel Output

**Current Web Implementation:** Offline channel arrays and balanced per-grain assignment.  
**Platform-Independent Behavior:** 1/2/4/8 channels, balanced occupancy, no spatial composition.  
**Web-Specific Dependency:** Browser WAV download only.  
**Standalone Replacement Needed:** File channel layout and optional device routing.  
**State/Preset Requirement:** Preserve format enum; do not infer speaker positions.  
**Migration Risk:** Medium.  
**Priority:** High.

### Transport and Playhead

**Current Web Implementation:** Bottom DOM transport, Position range input, Spacebar handler, and worklet messages at about 30 Hz.  
**Platform-Independent Behavior:** Output-time Play/Stop/seek/natural-end reset; separate source read marker; post-DSP stereo RMS/peak/hold/CLIP monitoring.  
**Web-Specific Dependency:** Keyboard event focus rules and message latency.  
**Standalone Replacement Needed:** Native commands, UI timer synchronized to audio state, and a non-invasive final-output meter tap.  
**Migration Risk:** Medium.  
**Priority:** High.

### Design System

**Current Web Implementation:** CSS custom properties, media queries, Canvas paint.  
**Platform-Independent Behavior:** Deep navy workbench, Coral identity, semantic parameter colors, geometry hierarchy, status strip, focus/disabled states, reduced motion.  
**Reusable Data:** Tokens in `CURVE_LAB_DESIGN_SYSTEM.md`.  
**Standalone Replacement Needed:** Native theme/token layer and accessible control states.  
**Migration Risk:** Low to medium.  
**Priority:** Medium.

## 4. Preview / Render Parity Risks

1. Different random seeds and reset behavior.
2. Different gain compensation strategies.
3. Preview stereo versus selectable Render channel counts.
4. Preview voice cap versus uncapped scheduled offline grains.
5. Separate duplicated DSP helpers in the worklet.

These differences must be reproduced intentionally or changed through documented listening and product decisions.

## 5. Native Realtime Engineering Risks

- Avoid allocation and container mutation in the realtime callback while matching current voice-stealing behavior.
- Define parameter automation/update rate without changing audible stepping or smoothness.
- Preserve source/output sample-rate compensation.
- Specify deterministic versus evolving Preview random behavior.
- Establish measured latency and buffer-size behavior.
- Decide how source files are retained across sessions.
- Add versioned preset migration before public Standalone presets exist.

## 6. Knowledge Still Needed

- Approved listening ranges and sweet spots for all six curves.
- Monitoring environment and reference source set.
- Acceptable Preview/Render perceptual difference.
- Endpoint anchoring policy.
- Random-seed product intent.
- Native channel-layout naming and routing.
- Preset source-file reference/embedding policy.
- Plugin automation requirements, if an Audio Plug-in is pursued.
- Host tempo/sync behavior, if any; none exists in the web product.

## 7. Preservation Assets

- Listening approval and Reference Sound Set: `LISTENING_REFERENCE.md`.
- Fine-tuning values and reasons: `TUNING_HISTORY.md`.
- Development trials and rejected directions: `DEVELOPMENT_HISTORY.md`.
- Deterministic Web/Standalone fixtures: `CONFORMANCE_SPEC.md`.
- Device, CPU, latency, memory, and render measurements: `PERFORMANCE_BASELINE.md`.
- Versioned product state and unresolved source-file policy: `STATE_SCHEMA.md`.

These records distinguish code-derived facts from measured or listening-approved evidence. Empty approval tables are intentional until the relevant test is performed.

## 8. Migration Principle

Do not begin with framework selection. Begin with parameter conformance tests, curve interpolation fixtures, DSP reference renders, interaction acceptance tests, and listening references derived from this product documentation.

## Identity Asset Pilot

STANDALONE ASSET: `assets/identity/granular-app.svg`, symbol/micro variants
and canonical palette. Native packaging/Dock validation remains separate.

Export scheduling is now separated from DSP in the local Worker candidate. Preserve seeded WAV byte equivalence and start-time snapshots when replacing the browser Worker with a native background job. Cancellation must also cover final WAV encoding; source ownership stays with Preview.
