# Granular Curve Lab

Current default/example: [Bach Prelude No.1 · mallet ·72BPM ·15s MP3](docs/DEFAULT_SOURCE.md). Prepared automatically without autoplay; Open Audio replaces it.

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
- WAV export is fixed at 24-bit / 48 kHz. The web selector offers stereo, quad and 8-channel output; mono remains an internal/historical capability.
- Multichannel output uses balanced grain distribution only. It deliberately avoids Space Curve Lab-style spatial composition controls.

## Reused Curve Lab patterns

- `index.html` keeps the family screen structure: topbar, transport, compact readouts, and mode buttons. The workspace is split into an upper waveform lane for Source Window selection and a lower curve canvas for musical curve editing. Final WAV format is selected beside Download, following the Space Curve Lab export flow.
- `src/styles.css` keeps the dense workbench layout and restrained controls used in the earlier Curve Labs.
- `src/app.js` owns UI state, canvas curves, loading, playback control, and export interaction.
- `src/granular-worklet.js` owns realtime sound generation.
- `src/offline-render.js` owns export rendering and direct WAV encoding.
- `src/granular-core.js` contains shared curve sampling, musical mappings, envelopes, interpolation, balanced channel selection, and WAV encoding so realtime/export behavior does not drift unnecessarily.

## Current prototype limits

This remains a focused v0.1 prototype. Prior checks covered real-file browser lifecycle, curve editing, responsive layout, and internal 1/2/4/8-channel render calculations. The current web selector offers 2/4/8 channels; those checks do not validate every selectable duration/channel combination. Formal listening approval across representative source material, a broader browser/codec matrix, persistent presets, and Standalone conformance fixtures are still to be documented.

On the recorded macOS 27.0.1 / Brave 156.1.98.60 environment, checks covered a 2 s stereo WAV save and reopen, cancellation during a 60 s job followed by a 2 s retry, and native file selection. Cancellation of the 60 s job is not evidence of a completed 60 s render. The 600 s / 8-channel stability decision remains deferred. Long multichannel exports can use substantial memory; try a short excerpt first. Other channel counts and environments retain only their separately recorded test coverage. These version numbers identify the checked environment, not minimum system requirements.

Preview and offline render use different processing limits and may differ in sound and level. Scope-limited acceptance criteria have been adopted; final acceptance and release freeze remain pending.

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

- Replacing the source stops previous playback and releases the previous WAV result, including when the new file cannot be decoded.


### Portable AIFF input

AIFF (.aif/.aiff), mono/stereo 16/24-bit PCM, is converted locally on import.
AIFF-C is not supported by this importer; use PCM WAV instead. Original files
are unchanged. See [support scope and limits](docs/AIFF_IMPORT.md).


### Current transport
Bottom controls are Return to start / Play / Pause. Space toggles Play/Pause.
Pause keeps the current position; Return to start seeks to zero. The thin slider
navigates output time. Source guides, sound engines and export policies are unchanged.


### Local update 2026-10-14
Source Window isolation now includes pitched reads and cubic interpolation taps. Output Duration uses one 0–10 min slider; 0 disables playback/export. See [verification](docs/VERIFICATION_2026-10-14.md). Reset confirm/cancel and post-reset playback/WAV saving verified in Safari; release details are tracked in the verification log.

## 2026-10-15 — output controls simplification (local review)
Remove Mono1ch from web export selector; Stereo2ch is default, Quad4ch/Octo8ch retained. Internal mono renderer/source processing unchanged. Remove repeated Source Window percentage row; retain visual selection and exact percentages in source canvas title. Duration remains0–600s with1s steps, now displays mm:ss with tabular digits. Remove endpoint labels and WAV-size estimate; zero still disables rendering/playback and limits remain in slider semantics/help. No DSP changes.
Browser verified08:03,00:00/disabled,10:00, narrow390px no horizontal overflow, and real1s WAV saves in2/4/8ch at48kHz24-bit. Not committed/deployed.


## 2026-10-20 Preview update

Preview now smooths overlap-risk gain and fades capped voices before removal to reduce measured discontinuities. Offline Render is unchanged. Numerical checks passed; user listening acceptance is pending. See [diagnosis and validation](docs/PREVIEW_CONTINUITY_2026-10-20.md).

Subsequent user acceptance covers the reported Preview continuity issue; it is not approval of every source, export setting or playback environment. This updates the listening status recorded above without changing the historical test scope.

## Shift group / Option erase — 2026-10-27

Shift-drag a point and following points vertically with X fixed; Mac Option-click erases an interior point (PC Ctrl-click unchanged). Original editing, mappings and DSP remain. User-reviewed UI checks are recorded in the gesture contract; commit/deployment was explicitly authorized on 2026-10-27. See [gesture contract](docs/CURVE_GESTURE_CONTRACT.md).
