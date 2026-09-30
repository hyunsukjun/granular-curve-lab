# Listening Reference and Sonic Character

Version: 1.0  
Baseline: 2026-09-30  
Approval status: NOT YET LISTENING-APPROVED

This record preserves what the instrument should sound like, why a tuning is accepted, and what a future Standalone implementation must reproduce. Code behavior and successful file export are not listening approval.

## 1. Current Sonic Intent

The current product intent is a focused granular instrument in which drawn relationships remain audible:

- Read Position should reveal movement through the selected source material.
- Spread should change source cohesion into controlled scattering without implying spatial movement.
- Grain Size should move from microtexture toward longer fragments with useful resolution in the short-grain region.
- Density should increase event activity and energy; gain protection must not flatten that musical relationship into equal loudness.
- Pitch Low/High should define a per-grain transposition field. Pitch also changes source read rate; there is no independent Speed behavior.
- The fixed Hann window should provide a dependable onset/release baseline without adding an envelope-choice workflow.
- Source Window must remain an audible hard boundary.
- Multichannel Render should distribute activity evenly without adding direction, distance, or spatial trajectory.

These are approved product intentions. The exact perceptual ranges and final sound-quality approval remain unrecorded.

## 2. Reference Sound Set

No Reference Sound Set is approved or stored in the repository at this baseline. A future set should use redistributable or privately controlled files and record a stable checksum for each file.

| ID | Required source role | What it reveals | Approved file / checksum | Status |
|---|---|---|---|---|
| RS-01 | Sustained pitched tone or bowed string | Grain continuity, pitch quality, beating | TO BE SELECTED | OPEN |
| RS-02 | Percussive/transient source | Position accuracy, boundary truncation, smear | TO BE SELECTED | OPEN |
| RS-03 | Speech or vocal phrase | Read Position legibility, medium/long grain identity | TO BE SELECTED | OPEN |
| RS-04 | Broadband/noisy texture | Density, overlap, high-frequency roughness | TO BE SELECTED | OPEN |
| RS-05 | Low-frequency material | Window clicks, gain buildup, limiter character | TO BE SELECTED | OPEN |
| RS-06 | Stereo or multichannel input | Confirm intentional channel-0 mono-source policy | TO BE SELECTED | OPEN |

The previously used short mono WAV verifies file lifecycle and export behavior only. It is not an approved sonic reference.

## 3. Monitoring Record

Complete this block for every formal listening session.

| Field | Required record |
|---|---|
| Date / build or commit | TO BE RECORDED |
| Listener | TO BE RECORDED |
| Computer / OS | TO BE RECORDED |
| Browser or Standalone build | TO BE RECORDED |
| Audio interface / device sample rate | TO BE RECORDED |
| Buffer size / reported latency | TO BE RECORDED |
| Headphones / speakers / room | TO BE RECORDED |
| Monitoring level or calibration method | TO BE RECORDED |
| Reference source IDs and checksums | TO BE RECORDED |

## 4. Required Listening Passes

1. Default state: Position 50%, Spread 8%, Size 80 ms, Density 18/s, Pitch 0..0 st.
2. Each parameter alone at low, default, and high values while all others remain at default.
3. Short Source Window at 5 ms and progressively wider windows.
4. Position near both boundaries with large Size, Spread, and positive Pitch.
5. Gentle versus abrupt curves for every parameter.
6. Dense/high-overlap cases on Preview 64, Preview 32 fallback, and Offline Render.
7. Pitch at 0, +/-12, and +/-24 st, with special attention to interpolation artifacts.
8. Mono, stereo, quad, and 8-channel Render occupancy and peak behavior.
9. Preview versus Render comparison using matched output-time regions.

## 5. Evaluation Vocabulary

Record observations using consequences rather than only preference:

- continuity versus audible grains
- source identity versus abstraction
- focused versus scattered source selection
- transient clarity versus smear
- smoothness versus roughness/aliasing
- energy growth versus excessive gain suppression
- boundary crowding, truncation, or silence
- clicks, discontinuities, clipping, pumping, or instability
- Preview/Render similarity and musically significant differences

## 6. Approval Log

No item is approved until a named listener, environment, source, settings, result, and decision are present.

| Test ID | Source | Settings / curve gesture | Observation | Decision | Preserve in Standalone | Date |
|---|---|---|---|---|---|---|
| LR-001 | TO BE TESTED | Default state | UNKNOWN | OPEN | UNKNOWN | - |

## 7. Current Knowledge Gaps

- Approved useful ranges and sweet spots for all six curves.
- Reason for Spread 8%, Size 80 ms, and Density 18/s defaults.
- Accepted character of `outputGain=0.92`, active factor `0.55`, and soft saturation.
- Acceptable cubic-interpolation quality at extreme pitch.
- Acceptable audible difference between Preview 32/64 and Offline Render.
- Perceptual effect of source-boundary clamping.

