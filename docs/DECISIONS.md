# Product Decisions

Version: 1.0  
Baseline recorded: 2026-09-29

This log records durable product decisions, not every conversation. Dates below indicate documentation/baseline capture when the original decision date is not encoded in the repository.

## GCL-D001: Focused v0.1 Instead of a General Granular Workstation

**STATUS:** APPROVED / IMPLEMENTED  
**RECORDED:** 2026-09-29

**DECISION:** Keep v0.1 centered on Source Window, Read Position, Spread, Grain Size, Density, Pitch Range, fixed envelope, Preview, and Render.  
**REASON:** Preserve a teachable Curve Lab instrument in which musical relationships remain visible.  
**ALTERNATIVES CONSIDERED:** Additional generators and DAW-like controls.  
**RESULT:** Small direct interface; proposed features are not treated as implemented.  
**AFFECTS:** Feature scope, UI, documentation, Standalone.

## GCL-D002: Scan Is Not a Product Parameter

**STATUS:** APPROVED / IMPLEMENTED  
**RECORDED:** 2026-09-29

**DECISION:** Do not expose Scan Position. Read Position is drawn directly.  
**REASON:** A separate Scan control would duplicate or obscure the primary curve relationship.  
**RESULT:** No Scan generator or state exists.  
**AFFECTS:** UI, parameter identity, preset compatibility.

## GCL-D003: Source Window Is a Hard Read Boundary

**STATUS:** APPROVED / IMPLEMENTED  
**RECORDED:** 2026-09-29

**DECISION:** Position, Spread, Size, and pitch-derived read span may not read beyond the selected Source Window. Requested Grain Size is shortened when necessary.  
**REASON:** What the user selects visually must match the material available to the DSP.  
**RESULT:** Source start and grain span are clamped.  
**AFFECTS:** DSP, interaction, visual feedback, Standalone.

## GCL-D004: Grain Size Uses Logarithmic Mapping

**STATUS:** APPROVED / IMPLEMENTED  
**RECORDED:** 2026-09-29

**DECISION:** Map normalized Grain Size to 5–1000 ms logarithmically.  
**REASON:** Linear mapping would compress the important short-grain region.  
**RESULT:** `5 * 200^y`, default 80 ms.  
**AFFECTS:** Parameter mapping, curve response, preset compatibility.

## GCL-D005: Pitch Range Replaces Independent Speed

**STATUS:** APPROVED / IMPLEMENTED  
**RECORDED:** 2026-09-29

**DECISION:** Use Pitch Low/High to determine per-grain read rate; do not add a separate Speed parameter in v0.1.  
**REASON:** Keep the musical relationship direct and avoid overlapping controls.  
**RESULT:** Semitone selection maps to playback ratio.  
**AFFECTS:** UI, DSP, parameter identity.

## GCL-D006: Fixed Hann Envelope

**STATUS:** APPROVED / IMPLEMENTED  
**RECORDED:** 2026-09-29

**DECISION:** Use a standard Hann grain envelope and remove the envelope selector from v0.1.  
**REASON:** Reduce control breadth while retaining a dependable standard window.  
**ALTERNATIVES CONSIDERED:** User-selectable Hann, Gaussian, Triangle.  
**RESULT:** `envelope="hann"`; dormant helpers do not constitute features.  
**AFFECTS:** UI, DSP, state.

## GCL-D007: 64-Grain Design Target With Visible 32-Grain Preview Fallback

**STATUS:** APPROVED / IMPLEMENTED  
**RECORDED:** 2026-09-29

**DECISION:** Use up to 64 grains for normal Preview, automatically reduce Preview to 32 under the current load heuristic, disclose this in status, and keep Render at the full design target. Offline Render computes every scheduled grain and does not apply a 64-grain voice cap.  
**REASON:** Protect realtime responsiveness without hiding a potentially audible engine-state difference.  
**RESULT:** Threshold `density * sizeMs > 2600`. The current `Render 64` status phrase is a quality-target label rather than a literal offline cap.  
**AFFECTS:** DSP, CPU, UI, verification.

## GCL-D008: Peak-Risk Compensation, Not Loudness Normalization

**STATUS:** APPROVED / IMPLEMENTED  
**RECORDED:** 2026-09-29

**DECISION:** Reduce overlap/clipping risk without erasing the musical energy change caused by Density and Size.  
**REASON:** Density should remain audibly meaningful.  
**RESULT:** Preview active-grain risk gain; Render global peak-risk scale; soft saturation and approximately -1 dBFS coefficient.  
**AFFECTS:** DSP, listening behavior, Render parity.

## GCL-D009: Balanced Multichannel Without Spatial Composition

**STATUS:** APPROVED / IMPLEMENTED  
**RECORDED:** 2026-09-29

**DECISION:** Support mono, stereo, quad, and 8-channel WAV through balanced grain distribution only.  
**REASON:** Preserve output flexibility without overlapping Space Curve Lab's musical domain.  
**RESULT:** No direction, distance, panning path, or speaker-layout controls.  
**AFFECTS:** Render, channel behavior, UI, Standalone.

## GCL-D010: Curves Use Normalized Output Time and Smoothstep Interpolation

**STATUS:** IMPLEMENTED / BASELINE LOCKED  
**RECORDED:** 2026-09-29

**DECISION:** Store curves as normalized points and use smoothstep interpolation.  
**REASON:** Platform-independent data survives viewport and implementation changes while avoiding hard linear corners.  
**RESULT:** Canvas pixels remain presentation only.  
**AFFECTS:** Data model, DSP, state/preset, Standalone.

## GCL-D011: Curve Lab Design System With Separate Brand/Parameter Color Roles

**STATUS:** APPROVED / IMPLEMENTED  
**RECORDED:** 2026-09-29

**DECISION:** Apply the shared deep navy/charcoal workbench and Coral brand identity while retaining parameter semantic colors.  
**REASON:** Establish family identity without removing musical information.  
**RESULT:** Coral is restrained to brand/focus/action accents; curves keep distinct colors.  
**AFFECTS:** Design system, accessibility, future native UI.

## GCL-D012: Product Knowledge Portability Before Code Portability

**STATUS:** APPROVED  
**DATE:** 2026-09-29

**DECISION:** Prepare for Standalone by preserving behavior, mappings, tuning, and decisions rather than prematurely rewriting the web code in a native framework.  
**REASON:** Framework choice is not yet approved; product knowledge is the durable asset.  
**RESULT:** Documentation baseline and migration inventory created without DSP refactor.  
**AFFECTS:** Development process, documentation, future architecture.

## GCL-D013: Fixed 24-bit / 48 kHz Final WAV

**STATUS:** APPROVED / IMPLEMENTED  
**RECORDED:** 2026-09-29

**DECISION:** Final WAV Render uses interleaved 24-bit PCM at a fixed 48 kHz for every source and channel format. Preview remains at the browser audio device rate. Source/output rate differences are handled by the existing cubic grain reader, and deterministic TPDF dither is applied only during final integer quantization.  
**REASON:** Provide one predictable production and future Standalone delivery format while preserving internal floating-point processing, browser compatibility, and current granular behavior.  
**RESULT:** Source rates no longer determine file format; repeated identical renders remain byte-deterministic. Lower-rate sources are standardized but do not gain source detail through upsampling.  
**AFFECTS:** Offline Render, WAV encoding, output UI, verification, Standalone conformance.

## GCL-D014: Shared Bottom Playback Bar and Post-DSP Meter

**STATUS:** APPROVED / IMPLEMENTED  
**RECORDED:** 2026-09-30

**DECISION:** Move Play, Stop, the single output-time display, Position scrubber, and L/R meter into the shared Curve Lab bottom bar. Measure the final stereo Preview through a unity-gain analyser path between the granular worklet and destination.  
**REASON:** Remove duplicate transport information, align the Curve Lab family, and expose truthful final-output level feedback without changing Granular DSP.  
**RESULT:** Stop and natural completion return to zero; scrubbing updates UI and audio together; meter/CLIP state is observational only.  
**AFFECTS:** Layout, transport interaction, realtime audio graph, accessibility, Standalone monitoring contract.

## GCL-D015: Hub v0.10 Identity Pilot

See GCL-D016 below for the subsequent Duration UI change.

2026-10-04 · PROJECT-SPECIFIC. Replace Coral #F0785A and generic waveform
with canonical Pink #EF4FA4 and directional grain cluster. Preserve parameter
colors and audio processing. Stop before commit. See `IDENTITY_PILOT.md`.

## GCL-D016: Duration Disclosure and Laptop Editing Space

2026-10-05. User-approved local implementation: replace the header numeric duration field with a Duration button and horizontal slider panel. Use 1–60 seconds normally and an explicit 1–10 minute range. Preserve normalized curves and stop/reset playback on duration changes. Measure extra control height so the Canvas gives space back when the panel closes; minimum 220 px protects editing on low windows. Offline duration clamp expands from 180 to 600 seconds to match Preview/UI. Grain DSP and WAV encoding are unchanged. Ten-minute eight-channel output is not a device-stability guarantee.

## Give editing and dialogs priority over global transport (2026-10-07)

COMMON CANDIDATE: transport shortcuts must respect the same availability as Play and must not consume form editing or modal button activation. Guard the current handlers without changing DSP or curve data. Disabled Play previously did not prevent the key handler from dispatching transport; the handler now blocks that bypass.


## 2026-10-07 — Import before playback in Safari

File import creates the decoding context without awaiting `AudioContext.resume()`. Playback still requests activation through the default context path. This prevents a pending Safari playback permission request from blocking file decoding after the file chooser closes. Existing decoding, channel policy, curves, DSP and export format remain unchanged. Regression: `tests/import-suspended-context.mjs` exercises suspended context, decode failure/retry and playback activation (plus Spectral channel/rate policy). Standalone implementations should likewise keep file decoding independent of output-device activation.


## 2026-10-08 — Source replacement lifecycle

Selecting a replacement file stops previous playback, resets the playhead and revokes the previous rendered WAV URL before decoding. A failed decode continues to clear the source and disable transport/export; a subsequent valid file restores readiness without reload. Cancelling the file chooser (no file) preserves the existing source and playback. No DSP, curves, output duration or WAV format changes. Regression: tests/file-replacement-lifecycle.mjs. Standalone implementations should keep old playback and export resources from surviving a failed replacement.


## 2026-10-08 — Cancel pending first playback

Stop and actual source replacement invalidate a pending Play even before the AudioWorklet node exists. Stop now advances the playback token unconditionally, and Play checks the captured token after asynchronous engine preparation. Forced Stop follows the same rule where present. Explicit Play after cancellation remains available. No-file chooser cancellation and each Lab's existing failed-import policy are preserved. DSP, curve semantics, and export format are unchanged.

Regression: tests/initial-play-cancel.mjs invokes actual application handlers with delayed engine preparation. Old code failed the Stop case; corrected code passes Stop, forced Stop where present, successful source replacement, and explicit retry. This proves request cancellation, not cold-start speed or physical audio onset. Standalone should preserve the same invalidation rule across asynchronous engine setup.


## AIFF input compatibility (2026-10-11)

See [AIFF import contract](AIFF_IMPORT.md): local PCM AIFF 16/24-bit mono/stereo
normalization into PCM WAV before the established decoder. Existing DSP,
resampling and Lab-specific channel policies are preserved. Browser and memory
verification limits are recorded there.


## Common bottom transport — 2026-10-13
COMMON CANDIDATE, implemented locally. Audio reference adopted: Return to start,
Play, Pause, output-position slider, time, continuous green/yellow/red stereo meter,
CLIP. Neutral 16px icons are centered inside 38x32px buttons; 34px slider hit area.
Return to start seeks to zero while preserving playing/paused state. Pause retains
position; Play resumes; Space toggles Play/Pause outside editable controls.
Internal reset stops for import/export/settings remain distinct and unchanged.
No DSP algorithm or output format changes. Resume uses this Lab's existing engine
initialization; continuous-sample-identical resumption is not promised.
The existing waveform guides remain in their existing locations.
OUT and numeric meter values are visually removed (values remain accessible).
Meter color fields are clipped at the level, not stretched; retain analysis,
ballistics, peak hold and CLIP semantics. Shared CSS/module are vendored locally,
with per-Lab adapters and no external runtime dependency.
Oscillator retains its existing source-duration seek cap for convolution tails.
Verification covers syntax, keyboard contracts and browser layout; file-based
Labs also exercised silent-WAV pause/resume. Audible listening, Safari/Windows,
long-file performance and Oscillator mode-specific listening remain separate QA.


## 2026-10-14 — Source Window boundary / single Output Duration (local)

Preview and Render now constrain pitched grain length to the selected half-open sample window. Integer bounds are ceil(start*N) through ceil(end*N)-1, limited to the file. The maximum grain length is floor((last-first)/readRate)+1; this overrides the previous minimum-16-sample request when necessary. Cubic interpolation taps repeat the nearest in-window endpoint instead of borrowing outside samples. Empty windows produce silence. This intentionally corrects prior leakage; high-pitch grains in a narrow window can become shorter. Seed, envelope formulas, gain/cap, channel-0 source policy and alias handling remain unchanged.

Output Duration is one linear 0–600 second slider, 1-second step, default 20. Removed Short/Long selector; durationSeconds identity is retained. Zero is a non-renderable UI state: Play/Download disabled, direct render rejects zero. Positive UI durations are 1–600. Changing duration stops playback and returns its cursor to zero. Existing valid durations retain their meaning; no preset persistence is introduced.

Verification: tests/source-window-boundary.mjs and tests/duration-range.mjs. See docs/VERIFICATION_2026-10-14.md for evidence and limits. No listening approval or deployment is implied.


## 2026-10-14 — Family parameter help

Static parameter descriptions are available on the relevant buttons using the Audio help design; current values, axes and activation feedback remain visible. See `docs/PARAMETER_HELP.md` (or `PARAMETER_HELP.md` in this directory). No DSP or curve mapping changes.

## 2026-10-15 — output controls simplification (local review)
Remove Mono1ch from web export selector; Stereo2ch is default, Quad4ch/Octo8ch retained. Internal mono renderer/source processing unchanged. Remove repeated Source Window percentage row; retain visual selection and exact percentages in source canvas title. Duration remains0–600s with1s steps, now displays mm:ss with tabular digits. Remove endpoint labels and WAV-size estimate; zero still disables rendering/playback and limits remain in slider semantics/help. No DSP changes.
Browser verified08:03,00:00/disabled,10:00, narrow390px no horizontal overflow, and real1s WAV saves in2/4/8ch at48kHz24-bit. Not committed/deployed.


## Restrained typography — 2026-10-15 local review
COMMON CANDIDATE, Audio-approved visual direction. Shared typography.css gives ordinary text controls/readout values400 weight, section labels500,13px/500 transport time,10px/600 CLIP. Readout labels use natural case and zero tracking. Button dimensions and Lab-specific active/enabled colors remain; decorative highlights removed, active lower bevel1px. Duration14/600 remains intentional. Canvas excessive600/650/750 weights reduced; point tooltip13→12px where applicable; waveform headings natural case. No normalized coordinates, DSP, parameter meanings or transport logic changed.
Commit/deployment withheld for user preview. Native confirmation keyboard and comparative listening remain deferred.

### 2026-10-15 — Family typography release verification
- Approved typography refinement verified in Brave actual 125% (1189×609 CSS px, DPR 2.5) and 150% (990×508 CSS px, DPR 3). No document horizontal overflow or clipped button labels; transport remains reachable by vertical scrolling.
- Existing narrow-screen and representative parameter/playback checks retained. Granular additionally imported recovery-8s-test.wav via the native file picker: playback/meter activity, pause, resume from position, and rewind verified.
- Scope is presentation only. Native confirmation keyboard behavior and comparative listening remain deferred; this does not claim new DSP/export or cross-device certification.

## 2026-10-15 — Source-tone waveform (local review, not released)

- Follow the Audio/Timbre source-tone palette: blue → teal → gold → peach indicates low-to-high spectral centroid of the original source. It does not represent processed output, level, clipping, or sound quality.
- Signed min/max summary up to 16,000 buckets preserves transients; display gain is normalized without changing samples. HiDPI polygon rendering replaces the coarse waveform. Static waveform raster is cached while cursor/selection overlays update independently.
- Worker analysis samples at most 1,024 Hann/FFT windows per channel (1,024 samples/window, max two channels). File replacement cancels stale work; analysis failure falls back to blue. Long files are sampled and brief events may be missed; this is a visual guide, not a spectrogram.
- Existing DSP, playback/export, normalized curves, timing and channel routing remain unchanged.
- Local source-color tests and syntax/diff checks passed. Browser import and play/pause checked. Brave at 900×700 with actual 125% and 150% zoom checked; vertical scrolling is retained on short screens. No subjective listening, Windows, or native confirmation-keyboard claim.
- Await user visual review before commit/deployment.

Granular: first-channel mono source policy retained. Selected region retains original colors, outside is dimmed, and teal selection border has a dark under-stroke. Real drag selection and playback marker checked. Existing boundary regression passed 144 rate/pitch/window cases, zero duration rejection, 8ch WAV and source preservation.

Release approval: user approved source-tone preview on 2026-10-15. Commit and Pages deployment authorized; visual-only scope retained.


## 2026-10-20 — Preview continuity correction

User authorized the diagnosed Preview correction, commit and deployment for listening review. Preserve Hann and existing cap policy; smooth gain and retire excess voices instead of abruptly deleting them. Listening acceptance remains pending.

Evidence, reproduction limits and listening checklist: [Preview continuity report](PREVIEW_CONTINUITY_2026-10-20.md).


## 10 ms playback boundary candidate — 2026-10-25

The current local candidate supersedes earlier automatic transport-boundary durations with the [10 ms playback/WAV contract](PLAYBACK_BOUNDARY.md). Source/effect envelopes are separate. See that contract for pause-state retention, existing tail-length limits and verification status. Uncommitted; listening acceptance pending.


## 2026-10-26 — Common graphite presentation revision

User-authorized six-Lab application and commit of the researched dark interface direction. Use a deeper neutral continuous shell, shallow available controls, role-based secondary information and slightly quieter minor grid lines. Preserve all layout/type metrics, module state colors, musical data and audio behavior. Store the portable contract and manifest for future Standalone work. This narrowly revises the visual baseline; it does not reopen DSP or certify listening/native behavior. See [INTERFACE_GRAPHITE_CONTRACT.md](INTERFACE_GRAPHITE_CONTRACT.md).

## Readout context family release — 2026-10-27

User approved the Audio pilot and sequential six-Lab rollout/commit/verification/deployment. Apply shared semantics selectively: Value captions identify initial/latest Preview snapshot. Source Window start/end/length is read-only source-time metadata; normalized bounds, read-position meaning and output clock unchanged. Preserve per-Lab behavior instead of forcing Audio calculations or adding nonexistent selection features. See `READOUT_CONTEXT_CONTRACT.md` for basis, source-range rules, verification boundary and portability.

## Shift group / Option erase — 2026-10-27

2026-10-27 — User approved extending the released Audio gesture contract to the other five Labs, preserving each Lab mapping and ordinary editor constraints, with web review before commit. The user subsequently reported no major issues in individual tests and explicitly authorized the five-Lab UI commit/deployment. Reuse only the proven normalized group transaction; do not merge differing coordinate decoders or engine paths. No DSP change. See [gesture contract](CURVE_GESTURE_CONTRACT.md).
