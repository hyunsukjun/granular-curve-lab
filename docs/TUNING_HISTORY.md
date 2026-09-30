# DSP and Interaction Tuning History

Version: 1.0  
Baseline: 2026-09-30

This document preserves tuning values together with their reason, audible consequence, and evidence. It does not infer historical values that are absent from the repository.

## 1. Current Baseline

| Item | Current value | Why it exists | Sound / interaction consequence | Evidence status |
|---|---:|---|---|---|
| Read Position default | 50% | Neutral center of Source Window | Starts from the middle of selected material | Product baseline; listening reason not recorded |
| Spread default | 8% | Current focused baseline | Adds limited source-position variation | Listening reason UNKNOWN |
| Grain Size range | 5–1000 ms, logarithmic | Preserve resolution in short-grain region | Fine control from microtexture toward long fragments | Mapping reason approved; range approval incomplete |
| Grain Size default | 80 ms | Current baseline | Medium-short grains with overlap dependent on Density | Listening reason UNKNOWN |
| Density range | 1–80 grains/s, logarithmic | Preserve control at sparse event rates | Moves from isolated grains to dense overlap | Mapping reason approved; range approval incomplete |
| Density default | 18 grains/s | Current baseline | Moderate overlap at default Size | Listening reason UNKNOWN |
| Pitch range | -24..+24 st | Two-octave operational domain | Quarter-speed to four-times source read rate before sample-rate compensation | Extreme-quality approval incomplete |
| Output Duration | 1–180 s; default 20 s | Separate finished duration from source duration | Curves span the complete result | Preferred duration rationale UNKNOWN |
| Minimum Source Window | 5 ms | Match minimum Grain Size | Click selection can target the smallest grain-scale range | Product reason recorded |
| Source drag threshold | 0.008 normalized | Distinguish click from drag | Small movement retains minimum selection | Interaction value; device study incomplete |
| Source display minimum | 10 px | Keep tiny ranges visible | Visual width can exceed stored range | Display-only rule |
| Curve interpolation | Smoothstep `t^2(3-2t)` | Avoid hard linear corners and remain platform independent | Zero slope at each control point; no extra temporal smoother | Approved baseline |
| Grain envelope | Hann | Dependable standard window with narrow v0.1 scope | Smooth onset/release; no user envelope choice | Approved baseline; comparative listening absent |
| Preview normal cap | 64 active grains | Realtime design target | Retains more overlapping grains | Product baseline |
| Preview fallback | 32 when `density*sizeMs > 2600` | Reduce overload risk and disclose state | Oldest active grains are removed above cap | Formula verified; hardware rationale UNKNOWN |
| Preview risk factor | `0.55` per active grain | Reduce overlap peak risk | Gain falls with estimated active overlap | Listening rationale UNKNOWN |
| Output gain | `0.92` | Current headroom/tone scalar | Drives `tanh` less than unity input | Listening rationale UNKNOWN |
| Ceiling coefficient | `0.89125` | Approximate -1 dBFS safety target | Protected output remains below full scale | Numerical intent recorded |
| Preview random seed | 42, evolving | Current implementation | Replay after transport operations is not always sample-identical | Product intent not approved |
| Render random seed | 7321, restart per render | Deterministic file output | Identical state produces identical grain choices | Implemented and verified |
| WAV dither seed | 48024 | Deterministic TPDF quantization | Repeatable 24-bit output including dither | Code-derived baseline |
| Render format | 24-bit PCM / 48 kHz | Stable high-quality compatible output contract | Fixed export rate and quantization | Approved and verified |

## 2. Known Product Decisions

- Scan Position was removed because it duplicated or obscured Read Position.
- An independent Speed parameter was not added because pitch already determines read rate.
- Gaussian and Triangle remained dormant helpers; Hann is the sole product envelope.
- Loudness normalization was rejected in favor of peak-risk handling so Density and Size remain energetically meaningful.
- Spatial controls were excluded; multichannel output is balanced distribution only.
- Preview load adaptation is visible because a 32/64 change can alter the audible result.

The complete decision rationale remains in `DECISIONS.md`.

## 3. History Limit

The repository does not contain reliable previous numeric values for the constants above. Do not manufacture a before/after history. Earlier values may be added only when supported by a commit, dated note, or reproducible listening record.

## 4. Required Entry for Future Changes

Append one entry per tuning change:

```text
ID / date / build:
Parameter or algorithm:
Previous value and status:
New value:
Reason for test:
Reference sources:
Monitoring environment:
Expected sound effect:
Observed sound effect:
CPU, latency, or compatibility effect:
Decision: accepted / rejected / provisional
Standalone requirement:
Evidence links or render checksums:
```

Rejected trials stay in this file. They are evidence against repeating the same unsuccessful approach.

