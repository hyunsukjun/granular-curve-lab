# Parameter Specification

Version: 1.0  
Baseline: 2026-09-29

This document records stable identity and current code-derived behavior. Perceptual claims not established by a documented listening test are marked `UNKNOWN` or `TO BE DOCUMENTED`.

## Parameter Summary

| Parameter ID | Display Name | Unit | Domain | Default | Mapping | Curve |
|---|---|---:|---:|---:|---|---|
| `position` | Read Position | % in Source Window | 0–1 | 0.5 | Linear | Yes |
| `spread` | Spread | % of Source Window | 0–1 | 0.08 | Linear | Yes |
| `size` | Grain Size | ms | 5–1000 | 80 | Logarithmic | Yes |
| `density` | Density | grains/s | 1–80 | 18 | Logarithmic | Yes |
| `pitchLow` | Pitch Low | semitone | -24–+24 | 0 | Linear | Yes |
| `pitchHigh` | Pitch High | semitone | -24–+24 | 0 | Linear | Yes |
| `durationSeconds` | Output Duration | s | 1–180 | 20 | Linear numeric | No |
| `rangeStart` | Source Window Start | normalized source | 0–1 | 0 | Linear | No |
| `rangeEnd` | Source Window End | normalized source | 0–1 | source-dependent | Linear | No |
| `format` | Output Format | channels | 1/2/4/8 | 1 | Discrete | No |
| `renderSampleRate` | Render Sample Rate | Hz | 48000 | 48000 | Fixed | No |
| `renderBitDepth` | Render Bit Depth | bit | 24 | 24 | Fixed PCM | No |
| `envelope` | Grain Envelope | enum | `hann` | `hann` | Fixed | No |
| `maxPreviewGrains` | Preview Grain Limit | grains | 32/64 | 64 | Automatic | No |
| `outputGain` | Output Gain | scalar | internal | 0.92 | Linear | No |

`renderSampleRate` and `renderBitDepth` are fixed output specifications rather than user-editable controls. Preview continues at the browser audio device sample rate.

## Common Curve Semantics

- Normalized curve range: `x,y in [0,1]`.
- `x`: fraction of Output Duration.
- `y`: normalized parameter value.
- Default: two points at `x=0` and `x=1` with equal `y`.
- Interpolation: cubic smoothstep `t^2(3-2t)` between adjacent sorted points.
- Outside point range: nearest endpoint value.
- Smoothing: no separate temporal smoothing stage; smoothstep curve interpolation and grain-level sampling provide the current transition behavior.
- Resolution: floating-point internally; display rounding varies by parameter.
- Preview/Render: both evaluate curves over normalized output time.

## `position`

**Display Name:** Read Position  
**Module:** Source selection / granular read  
**Purpose:** Select the center position inside the current Source Window.

- Type: continuous float
- Unit: normalized ratio; displayed as percent in window
- Minimum / Maximum / Default: `0 / 1 / 0.5`
- Mapping: linear
- Automation intent: continuous trajectory over output time
- Preview behavior: maps into `[rangeStart, rangeEnd]` when a grain spawns
- Render behavior: same mapping
- Edge cases: final grain start is further clamped so the pitched grain remains inside Source Window

**Perceptual / Musical Tuning**

- Useful Range: full range is operational; musical useful range is TO BE DOCUMENTED
- Sweet Spot: UNKNOWN
- Transition Regions: determined by source content and Source Window; UNKNOWN
- Extreme Behavior: `0` favors window start, `1` favors window end
- Interaction With Other Parameters: Spread randomizes around the position; Size and Pitch constrain valid read start
- Audible Artifacts: source-boundary crowding at extreme position/large size/high pitch requires listening documentation
- Recommended Smoothing: no additional smoothing currently approved
- Reason For Current Mapping: direct spatial analogy within selected source material
- Verification Date: code/runtime baseline 2026-09-29; listening approval TO BE DOCUMENTED

## `spread`

**Display Name:** Spread  
**Module:** Grain randomization  
**Purpose:** Randomize each grain's source center around Read Position.

- Type: continuous float
- Unit: fraction/percent of Source Window
- Minimum / Maximum / Default: `0 / 1 / 0.08`
- Mapping: linear
- Processing: `jitter = (random - 0.5) * spread * windowWidth`
- Effective offset: up to half the displayed spread on either side before boundary clamping
- Random distribution: uniform
- Preview behavior: seeded pseudo-random stream initialized with `42`, then continued across playback resets
- Render behavior: deterministic stream initialized with `7321` for each render
- Edge cases: clamped at Source Window boundaries

**Perceptual / Musical Tuning**

- Useful Range: TO BE DOCUMENTED by listening
- Sweet Spot: default `8%` is product baseline; reason is not documented
- Extreme Behavior: `0%` removes position jitter; `100%` permits a full-window-width distribution before clamping
- Interaction With Other Parameters: larger windows create larger absolute jitter; position near a boundary skews the realized distribution through clamping
- Audible Artifacts: boundary clustering at extremes is possible; listening status UNKNOWN
- Approved Value / Mapping: linear mapping and 8% default are implemented, not yet accompanied by a formal listening record

## `size`

**Display Name:** Grain Size  
**Module:** Grain duration  
**Purpose:** Control requested grain length.

- Type: continuous float
- Unit: milliseconds
- Minimum / Maximum / Default: `5 / 1000 / 80 ms`
- Normalized default: approximately `0.5233`
- Mapping: `5 * (1000/5)^y`, equivalent to `5 * 200^y`
- Display mapping: rounded integer milliseconds
- Actual size: minimum of requested duration and available Source Window duration, with at least 16 output samples
- Preview/Render: same conceptual clamp; Preview length is measured at output sample rate and read rate follows pitch

**Perceptual / Musical Tuning**

- Useful Range: 5–1000 ms operational; musical subregions TO BE DOCUMENTED
- Sweet Spot: default 80 ms is product baseline; formal reason UNKNOWN
- Transition Regions: likely source-dependent and must be listening-tested
- Extreme Behavior: 5 ms approaches microtexture; 1000 ms approaches long overlapping fragments, but exact character is source/density dependent
- Interaction With Other Parameters: Density controls overlap; Source Window may shorten grains; Pitch changes source span; large `density * sizeMs` triggers 32-grain Preview
- Audible Artifacts: very short windows and extreme pitch require dedicated listening tests
- Reason For Current Mapping: logarithmic mapping gives more control in the musically sensitive short-grain region

## `density`

**Display Name:** Density  
**Module:** Grain scheduler  
**Purpose:** Control grain spawn rate.

- Type: continuous float
- Unit: grains per second
- Minimum / Maximum / Default: `1 / 80 / 18`
- Normalized default: approximately `0.6595`
- Mapping: `80^y`
- Scheduling interval: `round(sampleRate / density)`, minimum one sample
- Display mapping: one decimal place in live readout
- Preview/Render: same event-rate model

**Perceptual / Musical Tuning**

- Useful Range: TO BE DOCUMENTED
- Sweet Spot: default 18/s is baseline; formal listening reason UNKNOWN
- Extreme Behavior: 1/s exposes separate grains; 80/s produces dense overlap depending on Size
- Interaction With Other Parameters: overlap is governed strongly by Grain Size; load fallback uses `density * sizeMs`
- Audible Artifacts: high overlap can cause level build-up and CPU pressure; current gain protection mitigates but does not normalize loudness
- Reason For Current Mapping: logarithmic mapping preserves useful control at low event rates

## `pitchLow` and `pitchHigh`

**Display Names:** Pitch Low / Pitch High  
**Module:** Grain transposition and source read speed  
**Purpose:** Define the random pitch interval assigned to each new grain.

- Type: continuous float
- Unit: semitone
- Minimum / Maximum / Default: `-24 / +24 / 0 st`
- Mapping: `-24 + 48*y`
- Randomization: uniform semitone selection between evaluated bounds
- Crossing behavior: values are reordered into low/high bounds at processing time
- Read-rate mapping: `2^(semitone/12)` multiplied by source/output sample-rate ratio in both Preview and fixed-48-kHz Render
- Speed relationship: there is no independent Speed parameter; pitch transposition determines read rate
- Display mapping: signed one-decimal semitone tooltip and combined status range

**Perceptual / Musical Tuning**

- Useful Range: full two-octave domain is operational; preferred musical region UNKNOWN
- Sweet Spot: 0..0 st is neutral default
- Extreme Behavior: -24 st reads at quarter speed; +24 st reads at four times speed before sample-rate compensation
- Interaction With Other Parameters: higher pitch increases source span for a given output grain length and can tighten available valid start positions
- Audible Artifacts: extreme transposition quality with cubic interpolation needs formal listening documentation
- Recommended Smoothing: per-grain random values are intentionally stepped at grain boundaries; no additional smoothing is specified

## `durationSeconds`

**Display Name:** Output Duration

- Type: numeric float input
- Unit: seconds
- Minimum / Maximum / Default / Step: `1 / 180 / 20 / 0.5`
- Purpose: define complete output timeline independently of source duration
- Curve Support: no; all curve `x` values map across this duration
- Preview/Render: shared duration setting
- Edge Cases: invalid input falls back to 20 s and is clamped to range
- Fine-Tuning Notes: range rationale and preferred classroom values are TO BE DOCUMENTED

## `rangeStart` and `rangeEnd`

**Display Name:** Source Window

- Type: normalized floats
- Unit: fraction of source duration
- Domain: `[0,1]`, ordered and clamped
- Initial pre-load state: `0..0.005`
- After load/reset: starts at 0 with width `5 ms / sourceDuration`, clamped to `[0.0001,1]`
- Selection: click sets minimum width; drag expands; stored values are independent of the 10 px minimum visual width
- Grain behavior: hard read boundary for Position, Spread, Size, and Pitch-derived source span
- Fine-Tuning Notes: 5 ms minimum matches minimum Grain Size; broader default-window listening preference is not defined

## `format`

**Display Name:** Final output format

- Type: discrete enum
- Values: `mono`, `stereo`, `quad`, `octo`
- Output channels: `1`, `2`, `4`, `8`
- Default: `mono`
- Preview behavior: no effect; Preview remains stereo
- Render behavior: selects channel count and balanced grain distribution
- Edge Cases: channel order is abstract output-channel order, not speaker-position metadata

## Internal Processing Settings

### `envelope`

- Current value: `hann`
- User control: none
- Formula: `0.5 - 0.5*cos(2*pi*phase)`
- Triangle/Gaussian helper code is not an approved selectable feature.

### `maxPreviewGrains`

- Values: `64` or `32`
- Automatic rule: `density * sizeMs > 2600` selects 32
- Render: does not use this cap as a render-quality switch
- Fine-Tuning Notes: threshold rationale is CPU-risk based; device-specific validation is TO BE DOCUMENTED

### `outputGain`

- Current value: `0.92`
- User control: none
- Preview: multiplied after active-grain risk compensation and before `tanh`
- Render: multiplied with peak-risk scale before `tanh`
- Fine-Tuning Notes: value is implemented; formal listening comparison and headroom rationale are TO BE DOCUMENTED

## Parameter Versioning

All entries are version `1.0`. Any future change to ID, domain, mapping, default, interpolation, or semantic meaning requires a decision record and state-migration note.
