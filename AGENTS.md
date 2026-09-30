# Granular Curve Lab Agent Rules

This repository is the product reference implementation for Granular Curve Lab. Treat its product behavior, parameter mappings, DSP response, interactions, and tuning knowledge as durable assets. The current browser implementation is replaceable.

## Before Changing Anything

1. Inspect the current project structure and the files involved in the requested behavior.
2. Prefer observed code and verified runtime behavior over assumptions or examples from another Curve Lab.
3. Check `git status` and preserve unrelated work.
4. Read the relevant documents in `docs/` before changing a feature, parameter, interaction, DSP rule, or migration assumption.
5. If code and documentation disagree, investigate the running behavior and report the discrepancy. Do not silently choose one as authoritative.

## Protection Rules

- Preserve existing audio and DSP behavior unless the request explicitly changes it.
- Keep UI/design work separate from DSP work.
- Do not rewrite working features merely to prepare for Standalone.
- Keep parameter IDs stable. A label may change; an ID is a compatibility contract.
- Preserve normalized curve coordinates, point ordering, interpolation, and output-time semantics.
- Preserve Pen/Eraser behavior, endpoint deletion protection, and Command/Ctrl temporary erase.
- Preserve Spacebar transport and other keyboard behavior.
- Preserve Preview/Render behavior and document intentional differences.
- Keep output metering post-DSP and unity-gain; it must observe the stereo Preview without changing its signal.
- Preserve local file processing and first-channel mono source behavior unless explicitly changed.
- Do not add Scan Position or another curve generator without approval.
- Do not add spatial-composition controls; multichannel export is balanced distribution only.
- Do not add an independent speed parameter without a product decision. Current read rate follows pitch transposition.
- Do not add dependencies without a clear requirement and review.
- Avoid large refactors unless specifically requested.
- Do not modify another Curve Lab from this repository task.
- Commit, push, and deploy only when explicitly requested.

## Stable Product Identities

Current public parameter IDs are:

- `position`
- `spread`
- `size`
- `density`
- `pitchLow`
- `pitchHigh`
- `durationSeconds`
- `rangeStart`
- `rangeEnd`
- `format`

Current internal processing settings include `envelope`, `maxPreviewGrains`, `outputGain`, fixed `renderSampleRate`, and fixed `renderBitDepth`. See `docs/PARAMETER_SPEC.md` before changing any of them.

## Documentation Is Part of Completion

- New or changed feature: update `docs/FEATURE_REGISTRY.md`.
- Parameter or mapping change: update `docs/PARAMETER_SPEC.md`.
- Interaction or shortcut change: update `docs/INTERACTION_SPEC.md`.
- DSP, gain, randomization, Preview, or Render change: update `docs/DSP_BEHAVIOR.md`.
- Product-level decision: append to `docs/DECISIONS.md`.
- Standalone impact or platform dependency: update `docs/STANDALONE_MIGRATION.md`.
- Design token or shared visual-language change: update `CURVE_LAB_DESIGN_SYSTEM.md`.
- Listening result or sonic approval: update `docs/LISTENING_REFERENCE.md`.
- Fine-tuning value or rationale: update `docs/TUNING_HISTORY.md` and the affected parameter/DSP document.
- Important trial, rejected approach, or correction: update `docs/DEVELOPMENT_HISTORY.md`.
- Deterministic algorithm or output-contract change: update `docs/CONFORMANCE_SPEC.md`.
- CPU, latency, memory, or device-performance finding: update `docs/PERFORMANCE_BASELINE.md`.
- Persistent state or preset contract change: update `docs/STATE_SCHEMA.md`.
- Keep `README.md` aligned with the current verified state.

Do not erase meaningful old tuning values without recording the previous value, new value, reason, and verification status.

## Verification Expectations

Scale verification to the change. For behavior-affecting work, check initialization, real-file loading, Play/Stop, Spacebar, every parameter mode, Pen/Eraser, point add/move/delete, empty eraser behavior, endpoint protection, Clear Current, Reset cancel/confirm, waveform/playhead, Preview, Render, WAV output, canvas resize, pointer mapping, narrow/wide layouts, console errors, and JavaScript syntax.

This project has no built-in default sample and no automated test suite at the documentation baseline. Do not invent either merely to satisfy a checklist; record the limitation and test with a short real audio file when audio behavior changes.
