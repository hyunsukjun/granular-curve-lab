# Development History and Lessons

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
**Current direction:** Read Position is a curve over output time. The source waveform shows the corresponding read marker only when it communicates the curve's initial/current value or active playback movement. Decorative center indicators were removed.  
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

