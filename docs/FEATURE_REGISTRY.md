# Feature Registry

## Always-Visible Duration (2026-10-05)

Supersedes the disclosure UI described below: Output Duration is permanently visible below the parameter toolbar, following the Oscillator layout reference. Toggle and summary button are removed. Duration ranges, value clamping, playback reset, render locking, DSP and WAV encoding are unchanged. Verified real-file Play/Stop, duration changes, resize/point deletion and actual 1 s mono 24-bit/48 kHz WAV download. At 1280x800 and approximately 1366x768 the row stays on one line; narrow layouts wrap and scroll above transport.

## Duration Panel Update (2026-10-05)

Duration disclosure in the curve toolbar replaces the header numeric input. A linear slider provides 1–60 s and 60–600 s ranges, current value and estimated WAV size. Closing the panel preserves the selected curve and duration. Timeline changes stop/reset Preview without changing curve points. Render uses the same 600 s maximum. Extra toolbar/panel height is measured for responsive Canvas sizing. Long multichannel rendering requires further device testing.

Version: 1.0  
Baseline: 2026-09-29

Statuses describe the current repository, not proposed future work.

## GCL-F001: Local Mono Source Loading

**CATEGORY:** Input  
**STATUS:** VERIFIED

**PURPOSE:** Supply source material without uploading it to a service.  
**USER BEHAVIOR:** The user chooses a local audio file. The waveform appears and transport/export become available.  
**INPUT:** Browser-decodable `audio/*` file.  
**OUTPUT:** Mono source buffer using channel 0 and a 4000-bucket peak waveform.  
**DATA MODEL:** Source samples, source sample rate, duration.  
**EDGE CASES:** Decode failure clears the source and reports recommended formats. Multichannel inputs do not mix down; only channel 0 is used.  
**CURRENT WEB IMPLEMENTATION:** `loadAudioFile`, `decodeAudioFile`, and `buildWaveform` in `src/app.js`.  
**PLATFORM-INDEPENDENT REQUIREMENTS:** Local source import, deterministic choice of source channel, duration/sample-rate preservation.  
**STANDALONE NOTES:** Native decoding must define supported formats explicitly.  
**TESTS:** Real mono WAV load verified; broader codec matrix remains TO BE DOCUMENTED.

## GCL-F002: Source Window Selection

**CATEGORY:** Source / Material  
**STATUS:** VERIFIED

**PURPOSE:** Define the hard source boundary from which grains may read.  
**USER BEHAVIOR:** Click creates the minimum window at the chosen source location; drag expands the window in either direction.  
**DATA MODEL:** Normalized `rangeStart` and `rangeEnd`.  
**PROCESSING:** Grain size and read positions are clamped to the available source range.  
**EDGE CASES:** Minimum window equals 5 ms of the loaded source; selection is clamped to `[0,1]`. A 10 px minimum display width improves visibility without changing the stored range.  
**PLATFORM-INDEPENDENT REQUIREMENTS:** Visual width must never replace the normalized stored boundaries.  
**TESTS:** Click minimum and drag expansion verified.

## GCL-F003: Six-Curve Parameter Editor

**CATEGORY:** Common Curve Editor / Granular Parameters  
**STATUS:** VERIFIED

**PURPOSE:** Define time-varying granular behavior across output duration.  
**PARAMETERS:** `position`, `spread`, `size`, `density`, `pitchLow`, `pitchHigh`.  
**DATA MODEL:** Sorted normalized `{x,y}` points, with `x` as output-time fraction.  
**PROCESSING:** Smoothstep interpolation between points.  
**INTERACTION:** Mode selection, add, drag, erase, clear current, reset all.  
**EDGE CASES:** First/last points cannot be erased. Current dragging can move endpoint coordinates; see migration risk.  
**PLATFORM-INDEPENDENT REQUIREMENTS:** Curve data and interpolation must be independent of screen pixels.  
**TESTS:** All modes and core point operations verified.

## GCL-F004: Pen and Eraser Tool Contract

**CATEGORY:** Common Interaction  
**STATUS:** VERIFIED

**PURPOSE:** Make curve editing explicit and consistent across Curve Labs.  
**USER BEHAVIOR:** Pen adds or moves points. Eraser removes one existing non-endpoint point and does nothing in empty space. Command-click on macOS or Ctrl-click on PC temporarily erases while Pen remains selected.  
**EDGE CASES:** Start/end points are protected from deletion.  
**CURRENT WEB IMPLEMENTATION:** `selectedTool`, `isErasing`, `findPointNearPointer`, and `.eraseMode`.  
**STANDALONE NOTES:** Map modifier behavior to native platform conventions without changing the semantic contract.

## GCL-F005: Output-Time Transport

**CATEGORY:** Common Transport  
**STATUS:** VERIFIED

**PURPOSE:** Preview the complete output timeline independently of source duration.  
**USER BEHAVIOR:** Bottom-bar Play/Stop, Spacebar toggle, Position scrubber and curve double-click seek, natural end, and restart.  
**DATA MODEL:** `playheadSeconds` over `durationSeconds`.  
**EDGE CASES:** Stop and natural completion reset time and Position to zero.  
**PLATFORM-INDEPENDENT REQUIREMENTS:** Output time and source read position remain separate concepts.  
**TESTS:** Play/Stop, Spacebar, natural end, and restart verified.

## GCL-F006: Realtime Granular Preview

**CATEGORY:** DSP / Preview  
**STATUS:** VERIFIED

**PURPOSE:** Hear the evolving granular texture while editing.  
**INPUT:** Mono source, six curves, source window, output duration, fixed Hann envelope.  
**OUTPUT:** Stereo preview.  
**PROCESSING:** Grain scheduling by Density, random source-position jitter by Spread, random pitch between Low/High, cubic source interpolation, Hann envelope, balanced L/R assignment, active-grain risk gain, soft saturation, and ceiling scaling.  
**EDGE CASES:** Active grain list is capped at 64 or 32. Source reads remain inside Source Window.  
**DEPENDENCIES:** Web Audio and AudioWorklet.  
**STANDALONE NOTES:** Reproduce sound behavior, not the worklet message architecture.

## GCL-F007: Automatic Preview Load Fallback

**CATEGORY:** Performance / Preview  
**STATUS:** VERIFIED

**PURPOSE:** Reduce realtime overload while keeping full-quality offline rendering.  
**PROCESSING:** Current playhead values select 32 grains when `density * sizeMs > 2600`; otherwise 64.  
**OUTPUT:** Status strip displays either `Preview 64 / Render 64` or `Preview 32 / Render 64`. `Render 64` is the retained quality-target label; Offline Render actually computes all scheduled grains without the Preview voice cap.  
**EDGE CASES:** Threshold is a product heuristic, not a measured CPU benchmark.  
**STANDALONE NOTES:** Re-evaluate performance on native hardware but preserve disclosure and musical intent.  
**TESTS:** Formula and both limit outcomes verified.

## GCL-F008: Pitch Range

**CATEGORY:** Granular DSP  
**STATUS:** VERIFIED

**PURPOSE:** Define a time-varying random transposition interval for each grain.  
**USER BEHAVIOR:** Edit Pitch Low and Pitch High independently; the area between them is filled.  
**PROCESSING:** Bounds are reordered if curves cross. Each grain receives a uniform random semitone value between the bounds. Pitch determines source read rate; there is no independent Speed parameter.  
**EDGE CASES:** Low may be drawn above High without invalidating processing.  
**STANDALONE NOTES:** Preserve bound reordering and random distribution.

## GCL-F009: Fixed Hann Grain Envelope

**CATEGORY:** Granular DSP  
**STATUS:** IMPLEMENTED

**PURPOSE:** Window every grain with a standard smooth onset and release.  
**USER BEHAVIOR:** No envelope selector is exposed in v0.1.  
**PROCESSING:** `0.5 - 0.5*cos(2*pi*phase)`.  
**EDGE CASES:** Triangle and Gaussian helpers remain in code but are not current product features.  
**TESTS:** Formula is exercised by Preview and Render; comparative listening is TO BE DOCUMENTED.

## GCL-F010: Offline WAV Render

**CATEGORY:** Output / Render  
**STATUS:** VERIFIED

**PURPOSE:** Produce a complete file independent of realtime Preview load limits.  
**OUTPUT:** 24-bit PCM WAV at fixed 48 kHz in mono, stereo, quad, or 8-channel format.  
**PROCESSING:** Deterministic seeded random render, source/output sample-rate compensation in the cubic reader, balanced grain-channel assignment, peak-risk scaling, soft saturation, `-1 dBFS` ceiling coefficient, and deterministic TPDF dither at final quantization.  
**INTERACTION:** Download starts rendering; the same button becomes Cancel; progress appears in the status strip.  
**EDGE CASES:** Changes invalidate the prior render status.  
**TESTS:** 1/2/4/8-channel 24-bit/48-kHz headers, deterministic output, 22.05-kHz source-rate conversion, and a real 8-channel browser render were verified on 2026-09-29.

## GCL-F011: Balanced Multichannel Distribution

**CATEGORY:** Output / Channel Behavior  
**STATUS:** VERIFIED

**PURPOSE:** Distribute grains across output channels without introducing spatial-composition controls.  
**PROCESSING:** Mono uses channel 0; stereo alternates; quad advances sequentially; 8-channel uses a step of 3 to distribute adjacent grains.  
**PLATFORM-INDEPENDENT REQUIREMENTS:** Preserve balanced occupancy and absence of implied spatial trajectory.  
**STANDALONE NOTES:** Channel labels/routing policy for native devices is TO BE DOCUMENTED.

## GCL-F012: Reset and Clear

**CATEGORY:** Common State  
**STATUS:** VERIFIED

**PURPOSE:** Restore one curve or the complete editable state.  
**USER BEHAVIOR:** Clear Current restores only the active curve. Reset All asks for confirmation, stops playback, restores all curves, and resets Source Window.  
**EDGE CASES:** Reset does not unload the source file or reset Output Duration/format.  
**TESTS:** Clear, Reset cancellation, and Reset confirmation verified.

## GCL-F014: Bottom Playback Bar and Stereo Output Meter

**CATEGORY:** Common Transport / Monitoring  
**STATUS:** VERIFIED

**PURPOSE:** Keep transport, output-time position, and final Preview level feedback in one shared Curve Lab control bar.  
**USER BEHAVIOR:** Play/Stop, one time display, Position scrubber, L/R RMS and peak display, peak hold, and clickable CLIP reset.  
**PROCESSING:** The stereo AudioWorklet output connects through a unity-gain meter input to the destination. Two analyser branches observe the same final signal without changing DSP or gain.  
**EDGE CASES:** The current protected Preview ceiling normally remains below the `0.999` CLIP threshold. There is no bundled default sample.  
**TESTS:** Real 22.05-kHz mono WAV verified Play, Stop, Spacebar, 65% seek, continued playback, natural-end reset, nonzero L/R readings, CLIP reset state, and WAV export. Layout had no horizontal overflow or item overlap at wide, 1180, 860, and narrow widths.

## GCL-F013: Persistent Preset / State

**CATEGORY:** State / Preset  
**STATUS:** IDEA

**PURPOSE:** Future exchange of product state between Web and Standalone.  
**CURRENT WEB IMPLEMENTATION:** None. Runtime state is not serialized.  
**PLATFORM-INDEPENDENT REQUIREMENTS:** Future schema should include `schemaVersion`, product identity, parameters, curves, source-window settings, and output settings.  
**DEPENDENCIES:** Product decision required before implementation.

## Explicitly Absent From v0.1

- Scan Position generator
- Independent Speed curve/parameter
- Envelope selector
- Spatial composition controls
- Undo/Redo
- Bundled default sample
- Persistent presets/state

These absences are not defects unless a later product decision adds them.

## GCL-IDENTITY-001: Hub Identity

IMPLEMENTED locally: canonical brand color, header symbol and favicon.
See `IDENTITY_PILOT.md`. Publication authorized on 2026-10-04.

## Keyboard transport availability (2026-10-07)

Spacebar dispatches at most one transport action per physical press. Held-key repeats are consumed, and disabled Play or an absent source blocks dispatch. Input, select, textarea and editable-text targets retain native keydown/keyup behavior. Existing Play/Stop or Play/Pause semantics and DSP are unchanged. Native confirmation dialogs keep their existing browser behavior. See `tests/transport-keyboard.test.mjs` for event-routing regression checks; these isolate command dispatch from DSP.


## 2026-10-07 — Import before playback in Safari

File import creates the decoding context without awaiting `AudioContext.resume()`. Playback still requests activation through the default context path. This prevents a pending Safari playback permission request from blocking file decoding after the file chooser closes. Existing decoding, channel policy, curves, DSP and export format remain unchanged. Regression: `tests/import-suspended-context.mjs` exercises suspended context, decode failure/retry and playback activation (plus Spectral channel/rate policy). Standalone implementations should likewise keep file decoding independent of output-device activation.


## 2026-10-08 — Source replacement lifecycle

Selecting a replacement file stops previous playback, resets the playhead and revokes the previous rendered WAV URL before decoding. A failed decode continues to clear the source and disable transport/export; a subsequent valid file restores readiness without reload. Cancelling the file chooser (no file) preserves the existing source and playback. No DSP, curves, output duration or WAV format changes. Regression: tests/file-replacement-lifecycle.mjs. Standalone implementations should keep old playback and export resources from surviving a failed replacement.
