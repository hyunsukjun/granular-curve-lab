# Development History and Lessons

## 2026-10-05: Duration Always Visible

Final spacing pass reserves an additional 12 px above transport. Final 1280x800 Canvas measurement is about 268 px; the 280/248 px figures below describe the initial pass. Low-window scroll-end clearance and wide-window clearance were checked after this adjustment.

User requested alignment with Oscillator's persistent Duration row for immediate access. Removed the disclosure button and hidden-panel state; retained measured control height, source waveform and normalized curve coordinates. At 1280x800 removing the wrapped toggle restores toolbar space: Canvas is 280 px, slider about 709 px. At approximately 1366x768 Canvas is 248 px and slider about 795 px. These are browser measurements, not fixed dimensions. Actual short WAV download verified; long multichannel stability remains outside this UI change.

## 2026-10-05: Duration Toolbar Disclosure

The user preferred gestural duration control near curve modes to a header number field or Canvas dropdown. Added Short/Long slider ranges and extended offline duration to 600 seconds. A fixed Canvas subtraction did not account for toolbar wrapping; actual toolbar/panel growth now determines available editing height. Preserve normalized curves and the source/output-time distinction in standalone. Long-render device stability remains unverified.

Version: 1.0  
Baseline: 2026-09-30

This is a retrospective record of product-shaping changes visible in the current project and its decision history. Original dates and numeric before-values are not assigned where they cannot be verified.

## 1. Scope Was Reduced to Preserve the Instrument

**Earlier direction:** Scan Position, selectable envelopes, an independent Speed control, and richer multichannel behavior were considered.  
**Current direction:** Draw Read Position directly, use fixed Hann, let Pitch determine read rate, and keep multichannel output to balanced grain distribution.  
**Why:** Each removed control duplicated another relationship or crossed into another Curve Lab's domain.  
**Preserve:** Granular Curve Lab must remain a teachable curve instrument rather than expand into a general granular workstation.

## 2. Source Range Became a Direct Waveform Gesture

**Earlier direction:** Source Start and Source End numeric fields exposed the selected range.  
**Observed problem:** The pair added interpretation work and did not make selecting source material feel direct.  
**Current direction:** Click the waveform for the minimum range; drag in either direction to enlarge it. The status can show values without making them the primary interaction.  
**Further correction:** Click selection was made consistent and its minimum was reduced to the 5 ms minimum Grain Size. A 10 px visual minimum remains display-only.  
**Preserve:** Native UI should store normalized boundaries, keep direct bidirectional selection, and never convert display width into DSP range.

## 3. Read Position Was Separated From Source Time

**Observed problem:** A vertical source-time representation and a permanently centered red marker made Read Position difficult to understand.  
**Current direction:** Read Position is a curve over output time. The source waveform shows the corresponding read marker only during playback, following the current Read Position curve value. The marker is hidden while stopped, and decorative center indicators were removed.
**Preserve:** Output playhead, curve time, and source read position are distinct concepts and require distinct visual roles.

## 4. Curve Visibility Was Standardized

**Observed problem:** Active/inactive lines did not always differ consistently, and translucent inactive curves became too faint. Similar parameter colors also reduced identification.  
**Current direction:** Active state is communicated primarily by stronger thickness and parameter controls while inactive curves remain clearly visible. Semantic colors remain distinct; Spread uses a deliberately strong yellow because visibility and differentiation outweighed avoiding yellow.  
**Preserve:** Brand Coral identifies the product, while parameter colors encode musical meaning. Do not recolor all curves with the brand color.

## 5. Explicit Pen and Eraser Replaced Ambiguous Deletion

**Current direction:** Pen is default, Eraser deletes only an existing interior point, empty Eraser clicks do nothing, endpoints are deletion-protected, and Command/Ctrl temporarily erases from Pen.  
**Why:** Tool state and cursor make destructive behavior predictable and align Curve Labs.  
**Preserve:** Do not reintroduce deletion gestures that conflict with point creation or movement.

## 6. Transport Moved to a Shared Bottom Bar

**Earlier direction:** Play/Stop and time information were distributed in the upper interface.  
**Observed problem:** Output Duration and transport information competed with micro-level granular parameters, and duplicate time displays weakened hierarchy.  
**Current direction:** Bottom bar contains Play/Stop, one output-time display, Position scrubber, and final Preview L/R meter. Stop and natural completion reset to zero.  
**Preserve:** Metering observes final post-DSP Preview at unity gain; it must not alter sound.

## 7. Gain Protection Was Limited Deliberately

**Rejected direction:** Strong automatic loudness compensation based on Density and Size.  
**Why rejected:** It would erase the audible energy relationship the user drew.  
**Current direction:** Preview estimates active-grain risk; Render uses a global peak-risk pass. Both use soft saturation and an approximately -1 dBFS coefficient.  
**Preserve:** Safety may reduce clipping risk, but Density must remain energetically meaningful.

## 8. Preview Adaptation Was Made Visible

**Problem:** Silent automatic reduction from 64 to 32 active grains could make the heard result differ from the intended render without explanation.  
**Current direction:** The state is disclosed. Offline Render is not capped at 64 and computes all scheduled grains; `Render 64` is retained UI terminology rather than a literal cap.  
**Open issue:** The threshold 2600 and wording still need hardware/listening validation.  
**Preserve:** Never hide an automatic quality state that may alter sound.

## 9. Final Output Became a Fixed Contract

**Current direction:** WAV output is fixed at 24-bit PCM / 48 kHz, with deterministic TPDF dither, mono/stereo/quad/8-channel choices beside Download, and no spatial composition controls.  
**Why:** A fixed specification improves compatibility, predictability, and future parity testing.  
**Preserve:** Changes require a product decision, migration note, and updated conformance fixtures.

## 10. Evidence Gaps

The history above explains product direction but does not replace empirical evidence. Missing assets are:

- dated screenshots or version tags for earlier UI states
- before/after listening renders
- measured CPU results for the Preview threshold
- approved reference sources and monitoring records
- commit-linked numeric tuning changes

Future rejected experiments must remain recorded in `TUNING_HISTORY.md` rather than being erased after a final value is selected.

## 2026-10-04 - Hub identity pilot

PROJECT-SPECIFIC: Coral to canonical Pink #EF4FA4 and original Hub v0.10 grain
icons. Desktop/narrow visual checks, JS syntax/hash checks and source SVG counts
passed. Audio processing unchanged. No file playback/export validation performed
for this visual-only change. See `IDENTITY_PILOT.md`. Stop before commit.

## 2026-10-06 — Sample-rate / export boundary audit (no DSP change)

Four source rates × four output formats passed 60-second 48k/24-bit WAV duration/header checks. Actual app saved an 8ch/20-second WAV from a 6-second source and reopened it as the existing first-channel mono source. High-frequency tests exposed aliasing: 30 kHz at 96k, Pitch 0, folds to 18 kHz at 48k output. At Pitch -12 it legitimately becomes 15 kHz. A blanket 48k source conversion would remove that pitch-down material. At native 48k, 18 kHz pitched +12 aliases to 12 kHz. Rate-dependent grain filtering must be evaluated for Preview and Render together, retaining cubic as A/B baseline and measuring CPU cost. No implementation or listening approval claimed. Local audit evidence is in work/CurveLabWebV1/GRANULAR_RATE_REVIEW.md in the shared workspace.

## 2026-10-06 — User decision: defer alias correction to family listening phase

Retain the current cubic Preview/Render as the A/B baseline. The measured alias issue remains OPEN/DEFERRED, not resolved or accepted as a sonic preference. Revisit during the six-Lab reference-sound fine-tuning phase, comparing pitch-down preservation, pitch-up alias rejection, level-matched Preview/Render, and CPU cost. Continue independent duration/export/stability checks. No DSP change is authorized by this deferral; resolve or explicitly accept a documented limitation before Web v1 freeze. Shared workboard decision: WEB-D010.

## 2026-10-06 — Natural-end Preview channel sequence

Reset the grain channel index at natural completion, matching Stop/reset. Fixed-setting browser AudioWorklet passes before/after natural end and Stop have identical channel PCM. Product UI file loading/replay/Stop passed. Cache versions updated. Gain, random seed, voice cap and offline DSP remain unchanged. Dense 60-second Octo and three cancel/recover cycles passed; maximum main-thread gap about504ms remains a separate performance finding. Listening and low-end-device approval remain open.

## 2026-10-06 — Worker export local candidate

Keep WAV48k/24bit per user decision. Move unchanged offline renderer into disposable Worker, snapshot render settings, preserve original source, terminate on abort/result/error. Four-format WAV parity and browser responsiveness/cancel recovery pass. Actual app completed60s8ch and restored controls on Cancel. Local only; saved WAV reopen remains pending before release.

Worker follow-up: actual20s8chWAV saved/reopened/PlayStop verified;20 alternating60s completion/cancel cycles stabilize in Node after warmup. Release-ready locally; not yet committed/deployed. Memory and physical listening limitations remain documented.

Release approval: user authorized shipping the verified Worker bundle. Full-buffer memory costs, low-end hardware and long-duration listening remain separate follow-up work.
