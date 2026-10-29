# Granular parameter-color distinction — 2026-10-30

Status: user reviewed the local candidate and explicitly authorized commit/deployment on2026-10-30. Publication evidence is recorded separately; this document does not certify it before that check. Baseline19e59364f8249fc64745da098d68bfbafcc26732. No DSP, mapping, time, channel or interaction change.

## Scope and current screen

User identified confusion between Read Position and Density. Retain the current basic editing layout, value captions, units, graph scales, selection/focus states, Source Window and all edit/playback semantics. Before/after copies and exact starting hashes are recorded in the QA folder listed below.

## Visual contract

| Role | Before | Candidate | Reason |
|---|---|---|---|
| Read Position line/points and Source Window | #6DE0C0 | #6DE0C0 unchanged | Preserve source-reading identity |
| Density line/points/point-tooltip border | #4FB06F | #F4A261 | Separate grain rate from source position by a warm/cool contrast |
| Density selected button fill | #183D27 | #4A2F1E | Match Density role without recoloring neutral controls |
| Density selected button text | #D8F5E1 | #FFE5CE | Preserve readable contrast on selected fill |

Density button border uses the same semantic Density token. Brand Pink and the other four parameter colors are unchanged. Neutral DOM parameter-help styling, hover rules, focus outline, hit targets, fonts and spacing remain unchanged. Color supplements the existing names, units and selected state; it is not the sole identifier.

Existing CSS variable and Canvas color map are reused. Do not create another component family or alter the logarithmic1–80grains/s mapping, position normalization, engine caps or audio samples to achieve this visual result.

## Verification and limits

- Chrome156.0.8078.48 and Brave156.0.8078.74: before/after at1100×850 and390×700, each with Read Position and Density active;16recorded states in4passing runs.
- Same seeded demonstration curves/data and sizes for each before/after pair. Geometry, normalized curves, settings and Source Window match exactly; no horizontal overflow.
- Selected Density CSS colors and actual Canvas readback agree with the new role; unchanged Read pixels agree before/after within2readback levels. Numeric contrast: Density line on graph8.29:1, selected text10.11:1. This is not full accessibility/color-vision acceptance.
- Pointer add/move/Option erase, endpoint protection, Tab/Enter activation and visible independent keyboard focus checked. Actual default MP3 load and Play/Pause/return-to-start UI checked with audio muted.
- Four existing focused command suites passed: gesture integration, group model, source-window readout and clock formatting. Syntax checked separately in final record.
- Raster QA was corrected after the first assertion treated an antialiased inactive line as the solid token; the same pixel was present before/after. The failed assertion is retained. No product change was made to satisfy it.
- No new held-modifier physical test, native125%/150%browser zoom, touch, Windows, WAV or listening certification. No Native implementation, product-wide completion, commit or release.

QA: `work/CurveLabWebV1/qa/space-hrtf-components-20261030` under the verification workspace. See `granular-ui.json`, screenshots, `granular-color-metrics.json`, `focused-checks.json` and `post-integrity.json`.


### Release authorization — 2026-10-30

User approved the reviewed Density/Read Position distinction for commit and deployment. Preserve the earlier test boundary and unrelated user edits; public success requires separate exact-release verification. No DSP, Native or listening acceptance change.
