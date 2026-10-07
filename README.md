# Granular Curve Lab

Granular Curve Lab is a small browser-based Curve Lab prototype for drawing granular synthesis relationships over time. It follows the existing Audio/Timbre/Space Curve Lab frame: static HTML/CSS/JS, local browser decoding, one large curve canvas, realtime AudioWorklet preview, and a separate offline WAV renderer.

The web app is the current executable reference implementation. Product behavior, parameter mappings, DSP rules, interaction contracts, fine-tuning knowledge, and future Standalone considerations are maintained as long-term product assets in the documentation set below.

## v0.1 scope

- Mono source analysis and playback source.
- Source Window as the hard boundary for every grain read, selected by dragging on the upper waveform lane.
- Curves: Read Position, Position Spread, Grain Size, Density, Pitch Low, Pitch High.
- Grain Size uses logarithmic mapping from 5 ms to 1000 ms.
- Pitch Range is represented by two curves, Low and High.
- Standard Hann envelope fixed for v0.1.
- Realtime preview uses a 64-grain cap and automatically falls back to 32 grains when density and grain size imply high load.
- Playback uses the shared Curve Lab bottom bar with output-time scrubbing and post-DSP stereo level metering.
- Offline render is not limited by the 32/64-grain Preview cap; it calculates every scheduled grain. The current `Render 64` status text denotes the original quality target, not a literal offline voice limit.
- Gain handling is peak-risk compensation with a -1 dBFS limiter ceiling, not full loudness normalization.
- WAV export is fixed at 24-bit / 48 kHz and supports mono, stereo, quad, and 8-channel files.
- Multichannel output uses balanced grain distribution only. It deliberately avoids Space Curve Lab-style spatial composition controls.

## Reused Curve Lab patterns

- `index.html` keeps the family screen structure: topbar, transport, compact readouts, and mode buttons. The workspace is split into an upper waveform lane for Source Window selection and a lower curve canvas for musical curve editing. Final WAV format is selected beside Download, following the Space Curve Lab export flow.
- `src/styles.css` keeps the dense workbench layout and restrained controls used in the earlier Curve Labs.
- `src/app.js` owns UI state, canvas curves, loading, playback control, and export interaction.
- `src/granular-worklet.js` owns realtime sound generation.
- `src/offline-render.js` owns export rendering and direct WAV encoding.
- `src/granular-core.js` contains shared curve sampling, musical mappings, envelopes, interpolation, balanced channel selection, and WAV encoding so realtime/export behavior does not drift unnecessarily.

## Current prototype limits

This remains a focused v0.1 prototype. Real-file browser lifecycle, curve editing, responsive layout, and 1/2/4/8-channel render calculations have been verified. Formal listening approval across representative source material, a broader browser/codec matrix, persistent presets, and Standalone conformance fixtures are still to be documented.

## Product knowledge documentation

- [`AGENTS.md`](AGENTS.md): repository rules for future coding agents.
- [`DEVELOPMENT_GUIDELINES.md`](DEVELOPMENT_GUIDELINES.md): architecture and development policy.
- [`CURVE_LAB_DESIGN_SYSTEM.md`](CURVE_LAB_DESIGN_SYSTEM.md): Granular application of the shared design system.
- [`docs/FEATURE_REGISTRY.md`](docs/FEATURE_REGISTRY.md): implemented, verified, absent, and future features.
- [`docs/PARAMETER_SPEC.md`](docs/PARAMETER_SPEC.md): stable IDs, ranges, defaults, mappings, and tuning gaps.
- [`docs/INTERACTION_SPEC.md`](docs/INTERACTION_SPEC.md): platform-independent user interaction contracts.
- [`docs/DSP_BEHAVIOR.md`](docs/DSP_BEHAVIOR.md): signal flow, algorithms, gain, randomization, and Preview/Render parity.
- [`docs/DECISIONS.md`](docs/DECISIONS.md): durable product decisions and rationale.
- [`docs/STANDALONE_MIGRATION.md`](docs/STANDALONE_MIGRATION.md): portability inventory and native migration risks.
- [`docs/LISTENING_REFERENCE.md`](docs/LISTENING_REFERENCE.md): listening protocol, reference-source requirements, sonic intent, and approval log.
- [`docs/TUNING_HISTORY.md`](docs/TUNING_HISTORY.md): current tuning constants, reasons, evidence level, and future change history.
- [`docs/DEVELOPMENT_HISTORY.md`](docs/DEVELOPMENT_HISTORY.md): important UI/DSP iterations, rejected directions, and lessons to preserve.
- [`docs/CONFORMANCE_SPEC.md`](docs/CONFORMANCE_SPEC.md): deterministic mappings, random sequences, channel order, and future golden-render contract.
- [`docs/PERFORMANCE_BASELINE.md`](docs/PERFORMANCE_BASELINE.md): realtime/offline performance behavior, memory model, and measurement matrix.
- [`docs/STATE_SCHEMA.md`](docs/STATE_SCHEMA.md): draft versioned product-state contract and unresolved source-file policy.

Documentation baseline: 2026-09-30. Items not established by code or a recorded listening test are marked `UNKNOWN` or `TO BE DOCUMENTED` rather than inferred.

## Local identity pilot

Latest local UI update: Output Duration is now always visible below the parameter toolbar, with no toggle. The disclosure description below is historical. Actual short mono 24-bit/48 kHz WAV download was verified for this revision; long multichannel stability remains unverified. No commit or publication is included in this update.

Local Duration update (2026-10-05): the Duration toolbar button opens a horizontal slider, with 1–60 seconds and 1–10 minutes ranges. Changes stop/reset Preview and preserve normalized curve points. Canvas yields space to the panel and wrapped toolbar, retaining a 220 px minimum. Verified in-app at 1280x800 and approximately 1366x768, including real-file load, duration-change stop/reset, point preservation and short WAV render completion. Ten-minute multichannel stability, actual saved WAV for this revision, and cross-browser listening remain unverified. No publication is included in this update.

Hub v0.10 brand color and icons are applied locally. See
[identity pilot](docs/IDENTITY_PILOT.md) for scope and verification.
GitHub/Pages publication authorized on 2026-10-04.

Keyboard transport respects disabled Play while importing/rendering. Run `node tests/transport-keyboard.test.mjs` for focused routing regression checks.

- Safari: opening an audio file before Play no longer waits for playback activation.
