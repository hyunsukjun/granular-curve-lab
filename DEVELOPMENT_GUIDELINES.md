# Granular Curve Lab Development Guidelines

Version: 1.1  
Baseline: 2026-09-30

## 1. Architectural Model

Maintain three conceptual layers:

1. **Product Behavior**: what the musician experiences, including curve editing, source-window selection, playback, Preview, and Render.
2. **Processing / Data Model**: normalized curves, parameter mappings, interpolation, granular scheduling, gain behavior, and export rules.
3. **Platform Implementation**: HTML, CSS, Canvas, Pointer Events, Web Audio, AudioWorklet, and browser download APIs.

Product behavior must not be defined by CSS pixels, DOM placement, or a browser-specific event. Platform code may implement the behavior, but the specifications in `docs/` define what must survive a future implementation.

## 2. Current Code Organization

- `index.html`: semantic controls and workspace structure.
- `src/styles.css`: Curve Lab design tokens, layout, control states, responsive rules, and motion policy.
- `src/app.js`: UI state, normalized curve model, Canvas painting, file decoding, transport coordination, worklet messages, and export interaction.
- `src/granular-core.js`: shared mappings, smoothstep curve sampling, pitch bounds, envelopes, cubic source reading, random generator, channel assignment, and WAV encoding.
- `src/granular-worklet.js`: self-contained realtime stereo granular engine.
- `src/output-meter.js`: unity-gain post-DSP stereo analysis for RMS, peak, hold, and CLIP display.
- `src/offline-render.js`: offline mono/stereo/quad/8-channel render and WAV creation.
- `src/eraser-cursor.svg`: established eraser cursor asset.

The worklet duplicates selected core helpers because relative imports in AudioWorklet modules may be browser-sensitive. Any duplicated algorithm must be reviewed for parity when one copy changes.

## 3. State Management

Runtime state currently lives in `src/app.js`; there is no persistent preset system.

- Curves are arrays of normalized `{ x, y }` points.
- `x` is normalized output time from `0` to `1`.
- `y` is a normalized parameter value from `0` to `1`.
- `sourceWindow.start` and `sourceWindow.end` are normalized source positions.
- Output duration and format remain DOM-backed settings.
- Playback state is mirrored between the main thread and AudioWorklet using tokens to reject stale messages.

Do not turn Canvas coordinates into stored musical data. Resize, zoom, and device-pixel ratio must not alter curve values.

## 4. Parameter Architecture

Parameter IDs, units, mappings, defaults, and edge cases are defined in `docs/PARAMETER_SPEC.md`. UI labels are presentation; IDs are durable identity.

When adding a parameter:

1. Define its ID, unit, domain, default, normalized mapping, interpolation, and automation intent.
2. Define Preview and Render behavior.
3. Define state/preset serialization needs, even if persistence is not yet implemented.
4. Record perceptual tuning and unknowns without guessing.
5. Update DSP and interaction documentation where applicable.

## 5. Curve Data Model

Curve sampling uses smoothstep interpolation between sorted points:

`s(t) = t^2 * (3 - 2t)`

Values outside the first/last point use the nearest endpoint value. Initial curves contain two points at `x=0` and `x=1`. The current editor protects the first and last points from deletion, but dragging is not constrained to keep their `x` values at exactly `0` and `1`; this is a documented migration risk, not an invitation to change behavior without approval.

## 6. Canvas and Rendering

- Base curve workspace: 1800 x 560 CSS pixels.
- Source waveform lane: 1800 x 150 CSS pixels.
- Backing-store dimensions multiply CSS dimensions by `devicePixelRatio`.
- The current minimum workspace width remains 1800 pixels and is clipped by its frame on smaller screens.
- Pointer conversion always uses the live Canvas bounding rectangle.
- Grid, waveform, curve, point, tooltip, and playhead paint are visual layers only.

Do not change normalized coordinate behavior while refining paint or responsive layout.

## 7. Audio Processing Separation

Realtime Preview and offline Render are separate implementations sharing the same product parameter model.

- Preview: stereo AudioWorklet, up to 64 or 32 active grains depending on current load.
- Render: main-thread asynchronous offline calculation, always using the full render design target and the selected output channel count.
- Both use normalized curves, smoothstep interpolation, log grain-size/density mapping, pitch bounds, cubic source reading, and Hann envelope.
- Their random seeds and gain algorithms currently differ. See `docs/DSP_BEHAVIOR.md`.

Any parity change must be deliberate, listening-tested, and documented.

## 8. File Loading

- Files are processed locally in the browser.
- The browser's decoder determines supported `audio/*` formats.
- UI guidance recommends WAV and MP3; other formats may vary by browser.
- Only channel 0 is copied into the mono granular source.
- Loading a new file resets the Source Window to the minimum 5 ms-equivalent range.
- There is no generated or bundled default sample.

## 9. WAV Export

- Export formats: 1, 2, 4, or 8 channels.
- Encoding: interleaved 24-bit PCM WAV at a fixed 48 kHz output sample rate.
- Source-rate conversion is performed inside the existing cubic grain reader; final quantization uses deterministic TPDF dither.
- Multichannel behavior is balanced grain assignment, not spatial composition.
- Export may be cancelled through the Download button while rendering.
- Edits mark the prior download result stale.

## 10. Responsive and High-DPI Behavior

- Header and toolbar reflow at 1320 px and 860 px breakpoints.
- The bottom playback bar gives the meter at least one third of wide layouts, then moves it to a full-width row below 1180 px.
- The status strip changes from 9 to 5 to 2 columns.
- Controls must not truncate their labels.
- Canvas backing stores follow device-pixel ratio.
- `prefers-reduced-motion` reduces decorative animation and transitions.

Check both narrow laptop and wide-monitor layouts after UI changes.

## 11. Performance

- Preview grain cap changes from 64 to 32 when `density * sizeMs > 2600` at the current playhead.
- Preview discards oldest grains if the active list exceeds the current cap.
- Worklet position/status messages are throttled to about 30 Hz.
- Offline render yields periodically to keep the page responsive and reports progress.
- Waveform display is reduced to 4000 peak buckets.

Do not optimize by changing sound behavior without documenting the trade-off.

## 12. Compatibility and Dependencies

- Keep the project static and dependency-free unless a requirement justifies a change.
- Core operation requires a current browser with Web Audio, AudioWorklet, Canvas, Pointer Events, ES modules, and Blob/download support.
- Serve over localhost or HTTPS; opening as an unrestricted local file is not a supported AudioWorklet path.
- Check Safari, Chrome, Edge, and Firefox when compatibility behavior changes.

## 13. Testing Policy

There is no committed automated test suite at baseline. At minimum:

- Run syntax checks for all JavaScript modules.
- Use a served page and confirm HTTP success.
- Use a real short audio file for audio lifecycle and export work.
- Verify all interactions affected by the change.
- Inspect browser console errors.
- Validate WAV channel count, duration, sample rate, and peak behavior for render changes.

Do not claim listening quality from code-only tests. Listening approval and its monitoring environment belong in the parameter/DSP documentation.

Use the dedicated preservation records for evidence that should survive a rewrite:

- `docs/LISTENING_REFERENCE.md`: approved listening material, environment, observations, and sonic acceptance.
- `docs/TUNING_HISTORY.md`: value changes with previous/new values, reason, sound effect, and verification state.
- `docs/DEVELOPMENT_HISTORY.md`: important iterations, rejected directions, and the reason the current behavior replaced them.
- `docs/CONFORMANCE_SPEC.md`: deterministic fixtures and expected results for Web/Standalone parity.
- `docs/PERFORMANCE_BASELINE.md`: measured CPU, latency, memory, underrun, and render-time results.
- `docs/STATE_SCHEMA.md`: versioned product-state vocabulary and migration policy before persistence is implemented.

## 14. Documentation Policy

Documentation updates are part of Definition of Done. Record verified facts as verified, code-derived behavior as code-derived, and unverified musical intent as `UNKNOWN` or `TO BE DOCUMENTED`.

## 15. Standalone Considerations

Do not select a native framework prematurely. Preserve:

- Stable parameter IDs and mappings.
- Normalized curve and source-window data.
- Smoothstep interpolation semantics.
- Grain scheduling, bounds, randomization, and gain rules.
- Interaction intent independent of mouse/browser events.
- Preview/Render differences and tuning history.
- A future versioned state schema.
