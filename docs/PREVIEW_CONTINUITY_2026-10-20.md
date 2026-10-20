# Preview continuity correction — 2026-10-20

## Report and diagnosis

The user reported clicks in low-frequency material during web Preview, more noticeable at high Density. High-frequency material did not noticeably exhibit the same symptom. Grain window shape/size was a hypothesis, not an established cause. Exact user settings and input were unavailable. This report is independent of the older Space noise report corrected in LISTENING_REFERENCE.md.

Silent synthetic 55 Hz and 1 kHz tests identified two separable mechanisms: instantaneous whole-signal gain changes when the active count changes, and oldest-grain removal at the Preview cap. In the 500 ms / 80 grains/s / cap 32 case, a grain was cut at phase 0.8, with Hann weight 0.34549. This is a technical reproduction of discontinuities, not an exact reproduction of the user's recording or a listening approval. CLIP remained zero; clipping detection alone cannot rule out clicks.

## Authorized correction

User authorized application, commit and deployment for listening review. Preview now smooths its existing risk-gain target with a sample-rate-derived one-pole coefficient `1-exp(-1/(0.005*sampleRate))`. 5 ms is the time constant, not the full settling duration. Gain state resets to one on cleared playback/seek/source resets.

Excess oldest voices now retire through a half-cosine fade over at most 5 ms, shortened to the remaining natural lifetime. Fade endpoints include one and zero. The cap still limits non-retiring voices to 32/64; short release tails may temporarily exceed that count. Natural Hann envelope, source window, pitch, scheduling, seeds, saturation and parameter mappings remain unchanged. Offline Render is unchanged and no new WAV was generated.

5 ms is a conservative initial technical tuning value, not an established musical optimum. Smoothing can slightly increase transient peaks relative to instantaneous attenuation; the existing tanh ceiling remains. Release tails add bounded work: measured high-density steady case 33 voices instead of 32; cap-transition stress stayed at or below 65. This is not device CPU/dropout certification. Never enlarge the cap alone as a presumed fix.

## Validation

`tests/preview-continuity.mjs` compares the prior release with this implementation at 44.1/48/96 kHz. All six low-frequency discontinuity comparisons passed, alongside finite output/headroom, bounded release tails, DC cap transition, one-source-sample high-pitch window and transport reset checks.

48 kHz, amplitude 0.25, fixed position, spread zero, pitch zero; adjacent-sample maximum after 0.5 seconds:

| Size / Density | Before | After |
| --- | ---: | ---: |
| 80 ms / 40 per second | 0.01419595 | 0.00113112 |
| 500 ms / 80 per second | 0.01571236 | 0.00006776 |

These FS differences are fixture-specific, not perceived improvement percentages or a general sound-quality score. Repeated sine phase/cancellation makes extrapolation inappropriate.

Real browser AudioWorklet smoke check: 48 kHz, 55 Hz memory signal, downstream mute, two-second processing; 60 status messages, maximum 33 voices, no processor error. This uses the actual worklet but is separate from original UI audio comparison.

Original UI loaded the existing X01 silence file and completed Play/Pause and natural completion; browser error log empty. No new audio file was generated. Existing duration, keyboard, grid, source-color and time-format tests passed. Three import/lifecycle tests initially failed because their mocks omitted an existing export-status UI helper; the harness mocks were repaired without changing product import behavior, and all three passed. Existing full WAV-render regression was not run because this change is Preview-only and no new WAV is requested.

## Listening acceptance — pending

Listen to the original low source at the previously problematic Density/Size/Source Window, then compare low and high Density. Note clicks during steady playback separately from seeking, start/stop and natural end. Record browser/device/sample rate and exact curves/settings where possible. Check texture, level and continuity, not only absence of clips. Product deployment is not subjective approval; no listening success is claimed here.

## Shared native-engine lesson

Treat envelope shape, voice-limit lifetime management and normalization continuity as separate contracts. A zero-ended envelope does not protect a voice cut before its end. Carry the numerical fixtures and this distinction to Standalone; do not assume browser code or the 5 ms tuning should be copied unchanged.
