# DSP Behavior

Version: 1.0  
Baseline: 2026-09-29

## 1. Musical Intent

Granular Curve Lab turns a selected region of one mono source into an output-time texture. Curves describe how the engine reads, scatters, sizes, schedules, and transposes grains over the finished output duration. It is not a spatial composer: multichannel Render distributes grains evenly without direction or movement controls.

## 2. Signal Flow

```text
Local audio file
  -> browser decode
  -> channel 0 mono source
  -> Source Window hard boundary
  -> output-time curve evaluation
  -> grain scheduler
  -> per-grain position jitter and pitch choice
  -> bounded cubic source read
  -> Hann grain envelope
  -> balanced output-channel assignment
  -> gain-risk control and soft saturation
  -> stereo Preview -> unity-gain output meter -> audio destination
  OR PCM WAV Render
```

## 3. Curve Evaluation

For each parameter curve, points are sorted by normalized output time. Between adjacent points `a` and `b`:

```text
t = (x - a.x) / (b.x - a.x)
eased = t*t*(3 - 2*t)
value = a.y + (b.y - a.y)*eased
```

No separate control-rate smoothing stage exists. Realtime values are sampled for grain scheduling and status; individual grains retain their assigned values for their lifetime.

## 4. Parameter Mapping

```text
grainSizeMs = 5 * 200^sizeNorm
density = 80^densityNorm
semitone = -24 + 48*pitchNorm
pitchRate = 2^(semitone/12)
```

Preview and Render pitch rates also multiply by `sourceSampleRate / outputSampleRate`. Preview follows the audio device rate; Render is fixed at 48 kHz. Existing four-point cubic reads therefore perform source-rate conversion without a separate browser resampler.

There is no independent Speed parameter. Grain read speed is the acoustic consequence of pitch transposition.

## 5. Grain Scheduling

At output-time fraction `t`:

```text
intervalSamples = max(1, round(sampleRate / density(t)))
```

Whenever the scheduler reaches zero, it spawns a grain and advances by the interval. The scheduler may spawn multiple grains in one sample if needed by state, though the documented density range normally avoids pathological accumulation.

## 6. Source Window and Grain Bounds

Source Window is ordered and clamped to `[0,1]`. Its available duration is at least one source sample.

```text
requestedSeconds = grainSizeMs / 1000
actualSeconds = min(requestedSeconds, sourceWindowSeconds)
lengthSamples = max(16, round(actualSeconds * outputSampleRate))
```

Read Position maps linearly inside Source Window. Spread adds uniform jitter:

```text
position = rangeStart + windowWidth*positionCurve
jitter = (random - 0.5)*windowWidth*spreadCurve
sourceCenter = clamp(position + jitter, rangeStart, rangeEnd)
```

The pitch-derived source span is calculated, then the grain start is clamped so cubic reading stays within the Source Window. This can compress realized Position/Spread behavior near boundaries.

## 7. Pitch Range and Randomization

Pitch Low and High are evaluated independently and reordered if necessary. Each grain receives a uniform random semitone value between them. The value is converted to a playback-rate ratio and remains fixed for that grain.

Random behavior differs intentionally or historically between engines:

- Preview seed starts at `42` when the worklet is constructed and is not reset on transport reset.
- Render seed starts at `7321` for every render, making repeated renders deterministic for identical state.

The resulting Preview and Render textures are behaviorally related but not sample-identical.

## 8. Source Interpolation

Source samples are read with four-point cubic interpolation. Reads outside valid source positions return zero. Grain-start bounds reserve additional samples needed by the interpolator.

Interpolation quality at extreme pitch is code-implemented but formal comparative listening is TO BE DOCUMENTED.

## 9. Envelope

Current product envelope is fixed Hann:

```text
0.5 - 0.5*cos(2*pi*phase)
```

The codebase includes Triangle and Gaussian helper branches, but no current UI/state exposes them. They are dormant implementation possibilities, not active product features.

## 10. Realtime Preview

- Output: stereo.
- Grains alternate left/right.
- Current active list is capped to `maxPreviewGrains` by removing oldest grains.
- Limit selection: 32 when `density * sizeMs > 2600`, otherwise 64.
- Status is sent to the main thread at approximately 30 Hz.

Per-sample gain behavior:

```text
active = max(1, activeGrainCount)
riskGain = 1 / sqrt(max(1, active*0.55))
output = tanh(sum * riskGain * 0.92) * 0.89125
```

This reduces overlap risk but intentionally does not preserve equal loudness across all Density/Size changes.

The stereo Preview output passes unchanged through a unity-gain meter input before the audio destination. Two channel analysers read time-domain samples for RMS, peak, one-second peak hold, and a latched `0.999` CLIP threshold. The meter is display-only and is absent from offline Render.

## 11. Offline Render

- Output sample rate is fixed at 48 kHz; source reads compensate by `sourceSampleRate / 48000`.
- Channel count is 1, 2, 4, or 8.
- Each grain is written to one channel.
- Render yields periodically and supports cancellation.
- Render uses all scheduled grains; `maxPreviewGrains` is not an offline voice cap. The UI phrase `Render 64` is a retained quality-target label, not the renderer's literal simultaneous-grain limit.

Balanced channel sequence:

- Mono: `0`
- Stereo: `0,1,...`
- Quad: `0,1,2,3,...`
- 8-channel: `0,3,6,1,4,7,2,5,...`

Post-render gain behavior:

1. Find absolute peak across all channels.
2. If peak exceeds `0.89125`, compute `riskScale = 0.89125/peak`; otherwise use 1.
3. Apply `tanh(sample * riskScale * 0.92) * 0.89125`.

`0.89125` corresponds approximately to `-1 dBFS`. This is peak-risk handling and soft limiting, not loudness normalization.

## 12. WAV Encoding

- RIFF/WAVE PCM
- 24-bit signed integer
- Interleaved frames
- Fixed 48 kHz sample rate
- Channel count from output format
- Deterministic TPDF dither at one quantization-step scale
- Floating-point samples clamped to `[-1,1]` before conversion

No channel-layout metadata is written beyond channel count.

## 13. Preview / Render Parity Matrix

| Behavior | Preview | Render | Parity |
|---|---|---|---|
| Curve interpolation | Smoothstep | Smoothstep | Yes |
| Size/Density/Pitch mapping | Same formulas | Same formulas | Yes |
| Source boundary | Hard clamp | Hard clamp | Yes conceptually |
| Envelope | Hann | Hann | Yes |
| Output channels | Stereo | 1/2/4/8 | Intentional difference |
| Random seed | 42, continuing | 7321, reset per render | Different |
| Grain cap | 32/64 | No preview cap | Intentional difference |
| Gain control | Active-grain estimate per sample | Final global peak-risk pass | Different |
| Output sample rate | Audio device rate | Fixed 48 kHz | Intentional difference |
| Final quantization | Device float output | 24-bit PCM with TPDF dither | Intentional difference |
| Result | Realtime feedback | Deterministic file | Not sample-identical |

## 14. Latency and Timing

- No latency compensation model is exposed.
- AudioWorklet block scheduling adds platform/browser buffering.
- Output playhead advances by rendered output samples.
- Grain schedule is sample-based within each engine.

Measured end-to-end latency: UNKNOWN.

## 15. Known Limitations and Tuning Gaps

- Formal source-material listening matrix: TO BE DOCUMENTED.
- Preview/Render perceptual parity under dense/high-pitch settings: TO BE DOCUMENTED.
- Threshold `2600` hardware rationale: TO BE DOCUMENTED.
- Output gain `0.92` listening rationale: TO BE DOCUMENTED.
- Boundary-clamping perceptual effect: TO BE DOCUMENTED.
- Cubic interpolation quality at ±24 st: TO BE DOCUMENTED.
- Multichannel speaker-layout interpretation: intentionally undefined.
- Preview random stream does not restart deterministically on every Play.
