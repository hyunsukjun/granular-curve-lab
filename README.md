# Granular Curve Lab

Granular Curve Lab is a small browser-based Curve Lab prototype for drawing granular synthesis relationships over time. It follows the existing Audio/Timbre/Space Curve Lab frame: static HTML/CSS/JS, local browser decoding, one large curve canvas, realtime AudioWorklet preview, and a separate offline WAV renderer.

## v0.1 scope

- Mono source analysis and playback source.
- Source Window as the hard boundary for every grain read, selected by dragging on the upper waveform lane.
- Curves: Read Position, Position Spread, Grain Size, Density, Pitch Low, Pitch High.
- Grain Size uses logarithmic mapping from 5 ms to 1000 ms.
- Pitch Range is represented by two curves, Low and High.
- Standard Hann envelope fixed for v0.1.
- Realtime preview uses up to 64 grains and automatically shows `Preview 32 / Render 64` when density and grain size imply high load.
- Offline render always uses the full 64-grain design target.
- Gain handling is peak-risk compensation with a -1 dBFS limiter ceiling, not full loudness normalization.
- WAV export supports mono, stereo, quad, and 8-channel files.
- Multichannel output uses balanced grain distribution only. It deliberately avoids Space Curve Lab-style spatial composition controls.

## Reused Curve Lab patterns

- `index.html` keeps the family screen structure: topbar, transport, compact readouts, and mode buttons. The workspace is split into an upper waveform lane for Source Window selection and a lower curve canvas for musical curve editing. Final WAV format is selected beside Download, following the Space Curve Lab export flow.
- `src/styles.css` keeps the dense workbench layout and restrained controls used in the earlier Curve Labs.
- `src/app.js` owns UI state, canvas curves, loading, playback control, and export interaction.
- `src/granular-worklet.js` owns realtime sound generation.
- `src/offline-render.js` owns export rendering and direct WAV encoding.
- `src/granular-core.js` contains shared curve sampling, musical mappings, envelopes, interpolation, balanced channel selection, and WAV encoding so realtime/export behavior does not drift unnecessarily.

## Current prototype limits

This is the first minimum prototype. It has passed syntax checks, but realtime browser audio and downloaded WAVs still need an actual short-file listening pass in Chrome or Edge before treating the tool as class-ready.
