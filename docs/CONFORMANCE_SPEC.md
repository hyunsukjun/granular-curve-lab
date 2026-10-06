# Web and Standalone Conformance Specification

Version: 1.0  
Baseline: 2026-09-30  
Golden-audio status: NOT YET CREATED

This specification defines deterministic product behavior that a future Standalone implementation can test without copying the Web implementation. Audible acceptance still requires `LISTENING_REFERENCE.md`.

## 1. Conformance Levels

1. **Data parity:** stable IDs, domains, defaults, and normalized state.
2. **Scalar parity:** curve interpolation, mappings, pitch bounds, envelope, PRNG, and channel sequence.
3. **Event parity:** grain times, random choices, source bounds, and voice-removal behavior.
4. **Render parity:** sample rate, duration, channels, PCM format, deterministic output, and numerical tolerances.
5. **Perceptual parity:** listening approval using the Reference Sound Set.

Levels 1 and most of 2 are specified below. Levels 3–5 still need committed fixtures.

## 2. Stable Parameter Contract

Required IDs are `position`, `spread`, `size`, `density`, `pitchLow`, `pitchHigh`, `durationSeconds`, `rangeStart`, `rangeEnd`, and `format`. Domains and defaults are authoritative in `PARAMETER_SPEC.md`.

Curves are sorted normalized `{x,y}` points. `x` is output-time fraction; `y` is normalized parameter value. Values outside the first/last point use the nearest endpoint value.

## 3. Scalar Fixtures

### Smoothstep Curve

Fixture curve:

```json
[{"x":0,"y":0},{"x":0.5,"y":1},{"x":1,"y":0}]
```

| x | Expected y |
|---:|---:|
| 0 | 0 |
| 0.125 | 0.15625 |
| 0.25 | 0.5 |
| 0.375 | 0.84375 |
| 0.5 | 1 |
| 0.625 | 0.84375 |
| 0.75 | 0.5 |
| 0.875 | 0.15625 |
| 1 | 0 |

Scalar acceptance tolerance: absolute error `<= 1e-6` unless a stricter fixture is later approved.

### Parameter Mappings

| Normalized y | Grain Size ms | Density grains/s | Pitch st |
|---:|---:|---:|---:|
| 0 | 5 | 1 | -24 |
| 0.5 | 70.710678118655 | 8.944271909999 | 0 |
| 1 | 1000 | 80 | 24 |

Pitch bounds must reorder crossed Low/High values before choosing a grain pitch.

### Hann Envelope

`0.5 - 0.5*cos(2*pi*phase)` for clamped phase `[0,1]`. Expected values at phases `0, 0.25, 0.5, 0.75, 1` are `0, 0.5, 1, 0.5, 0`.

## 4. Cubic Source Reader

The current reader is a four-point cubic polynomial. For fractional position `f` and samples `xm1, x0, x1, x2`:

```text
a = -0.5*xm1 + 1.5*x0 - 1.5*x1 + 0.5*x2
b = xm1 - 2.5*x0 + 2*x1 - 0.5*x2
c = -0.5*xm1 + 0.5*x1
result = ((a*f + b)*f + c)*f + x0
```

A read returns zero when position is below zero or at/above `sourceLength - 3`. Grain-start bounds reserve three source samples at the high end. Exact interpolation vectors still need a machine-readable fixture.

## 5. Deterministic Random Generator

The generator is a 32-bit unsigned LCG:

```text
state = (state*1664525 + 1013904223) modulo 2^32
result = state / 2^32
```

First six outputs:

| Seed | Expected sequence |
|---:|---|
| 42 | 0.252345174784, 0.088125045411, 0.577281198232, 0.222554265987, 0.375660197111, 0.025663904846 |
| 7321 | 0.073339291848, 0.320831668330, 0.568795559462, 0.664681724505, 0.583550488576, 0.613065426936 |
| 48024 | 0.847885733237, 0.236185105983, 0.249604605371, 0.341823357157, 0.759640409378, 0.688488445710 |

Each grain consumes one random value for position jitter and then one for pitch. Changing this order changes deterministic Render output. Preview starts from seed 42 when its processor is constructed and does not reset the PRNG on transport reset. Render restarts seed 7321 for each file.

## 6. Channel Assignment

Expected first eight grain channels:

| Channels | Sequence |
|---:|---|
| 1 | 0,0,0,0,0,0,0,0 |
| 2 | 0,1,0,1,0,1,0,1 |
| 4 | 0,1,2,3,0,1,2,3 |
| 8 | 0,3,6,1,4,7,2,5 |

These numbers are abstract file-channel indexes and do not imply speaker positions.

## 7. Render Contract

- Fixed 48,000 Hz output.
- Interleaved signed 24-bit PCM RIFF/WAVE.
- 1, 2, 4, or 8 channels.
- Frame count `ceil(durationSeconds*48000)`.
- All scheduled grains are calculated; the Preview 32/64 cap does not apply.
- Global peak-risk pass uses ceiling `0.89125`, output gain `0.92`, and `tanh`.
- TPDF dither uses seed 48024 and noise `(random1-random2)/2^23` before 24-bit quantization.
- No channel-layout metadata beyond channel count.

## 8. Golden Artifacts Still Required

Commit or preserve externally with stable checksums:

1. A small JSON parameter/curve fixture.
2. A short mono source WAV with explicit licensing and SHA-256.
3. Expected grain event trace: frame, length, source start, rate, channel.
4. Expected mono/stereo/quad/8-channel output WAVs.
5. Header, duration, peak, channel occupancy, and checksum manifest.
6. A tolerance policy for native floating-point differences if byte identity is not practical.

Until these exist, “Standalone parity” may describe formulas but cannot prove output parity.


### Natural-end stereo restart regression (2026-10-06)

With 48 kHz output, 3 seconds, 2 grains/s, 100 ms Hann grains, spread zero and fixed zero-semitone pitch, natural completion followed by seek(0)/play must restart channel assignment from the left channel, as Stop/reset does. A Node host-shim probe of the actual worklet confirms equal PCM across these two fixed-setting passes after the natural-end index reset. Randomized repeats remain intentionally different. Browser transport and listening verification remain pending.

Browser follow-up: real AudioWorklet first pass, natural-end replay, and Stop/reset replay produced equal fixed-setting PCM. Product UI reopened a saved WAV, completed a 3-second pass, restarted, and returned to zero on Stop, without console errors. This is transport verification, not listening approval.

Worker candidate: browser 1-second Mono/Stereo/Quad/Octo WAVs are byte-identical to direct offline renderer output. Source stays intact. Three abort/recover cycles, pre-aborted requests and cancellation at the encoding boundary pass. Evidence in shared work/CurveLabWebV1/evidence/granular-worker-contract.json. Follow-up: actual Brave Save produced a 20s/8ch/48k/24-bit WAV (960000 frames), reopened and played/stopped in the app. Physical multichannel listening remains unverified.
