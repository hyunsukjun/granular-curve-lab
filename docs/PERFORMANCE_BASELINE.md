# Performance and Stability Baseline

Duration extension (2026-10-05): UI and offline render now allow 600 s. At 48 kHz/24-bit, ten minutes of eight-channel WAV needs approximately 691.2 MB of PCM; Float32 output arrays alone require 921.6 MB, before encoding and browser copies. The UI estimate describes file payload, not peak RAM. No ten-minute eight-channel browser stability benchmark has been completed. Short-render completion is not proof of this upper bound.

Version: 1.0  
Baseline: 2026-09-30  
Measured hardware baseline: NOT YET ESTABLISHED

This document separates implemented protection from measured performance. The current heuristic is not a promise that every device will remain glitch-free.

## 1. Current Realtime Behavior

- Preview runs in a stereo AudioWorklet at the audio device sample rate.
- Normal active-grain cap: 64.
- Fallback cap: 32 when current `density*sizeMs > 2600`.
- When the active list exceeds the cap, oldest grains are removed.
- Position/status messages are reduced to approximately 30 Hz.
- Final Preview gain uses active-grain risk scaling, `tanh`, and the `0.89125` ceiling coefficient.
- The post-DSP output meter is an observation path and must remain unity gain.

The threshold `2600` is a code-verified heuristic. It has no approved device-performance or listening rationale yet.

## 2. Current Offline Behavior

- Render uses fixed 48 kHz and calculates all scheduled grains without a 32/64 voice cap.
- The renderer yields to the page when progress advances by more than roughly 1% or more than 60 ms has elapsed.
- Cancellation is checked inside the frame loop.
- Output channel arrays are allocated for the complete result before rendering.
- WAV encoding allocates a second complete interleaved output buffer.

## 3. Code-Derived Memory Model

For duration `D`, sample rate `R`, and channel count `C`:

```text
Float32 render arrays = D*R*C*4 bytes
24-bit WAV data       = D*R*C*3 bytes + 44-byte header
```

Worst selectable case, 180 seconds at 48 kHz and 8 channels:

- Float32 channel arrays: 276,480,000 bytes, approximately 263.67 MiB.
- Encoded WAV buffer: 207,360,044 bytes, approximately 197.75 MiB.
- Both may coexist: approximately 461.42 MiB before source data, grain work, object overhead, browser copies, and download handling.

This is a material browser-memory risk. Actual peak memory and failure behavior are not measured.

## 4. Native Realtime Risks

- The Web worklet uses dynamic arrays and removes grains with `splice`; this is not a native realtime-safe implementation pattern.
- A native engine should preallocate voices while preserving current oldest-grain removal semantics.
- Denormal handling, callback allocation, lock use, thread priority, and device changes need native-specific design.
- Sample-rate and buffer-size changes must not alter parameter mappings or source/output rate compensation.
- Any replacement of the 32/64 policy requires both performance evidence and listening comparison.

## 5. Required Measurement Matrix

Record a row for each tested environment. No row is approved at this baseline.

| Test ID | Device / OS | Browser or build | Device rate / buffer | Duration / channels | Curve case | Mean / peak CPU | Underruns | Peak memory | Render time | Result |
|---|---|---|---|---|---|---:|---:|---:|---:|---|
| PB-001 | TO BE TESTED | - | - | - | Default | - | - | - | - | OPEN |

Required cases:

1. Default 20-second state.
2. Maximum Density with short grains.
3. Large Size and Density just below and above threshold 2600.
4. Extreme positive/negative Pitch.
5. Repeated seek, Play/Stop, and source replacement.
6. 180-second mono and 8-channel Render.
7. Render cancellation at early, middle, and late progress.

## 6. Acceptance Criteria To Establish

- Supported minimum hardware and OS/browser matrix.
- Supported device sample rates and buffer sizes.
- Maximum acceptable realtime CPU and zero-underrun test duration.
- Maximum acceptable UI stall and render cancellation latency.
- Peak-memory ceiling and graceful failure behavior.
- Acceptable audible impact of Preview 32 fallback.
- Measured end-to-end latency and playhead error.

Until these values are measured and approved, performance status remains provisional rather than Standalone-ready.

## 2026-10-06 dense export browser probe

Local browser, 48k, 60-second Octo, 80 grains/s, 1000ms grains: 4800 scheduled grains, WAV 69,120,044 bytes, about 4.08 seconds elapsed. 20ms main-thread timer fired112 times; maximum gap503.8ms. Three abort/recover cycles succeeded. This does not certify low-end devices or 5/10-minute loads. Peak compensation and WAV encoding remain synchronous; isolate their costs before choosing a performance change. Evidence: shared work/CurveLabWebV1/evidence/granular-browser-contract.json.
