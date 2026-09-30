# Product State and Preset Schema Direction

Version: 0.1-draft  
Baseline: 2026-09-30  
Implementation status: NOT IMPLEMENTED

This document reserves stable product vocabulary before Web or Standalone persistence is built. It does not authorize adding a preset feature.

## 1. Goals

- Preserve musical state independently of DOM, Canvas pixels, and native UI geometry.
- Keep Web and Standalone capable of reading the same conceptual state.
- Version parameter meanings and mappings before public presets exist.
- Separate product state from source-audio storage and platform paths.

## 2. Draft Top-Level Shape

```json
{
  "schemaVersion": 1,
  "product": "granular-curve-lab",
  "productStateVersion": "0.1",
  "parameters": {
    "durationSeconds": 20,
    "rangeStart": 0,
    "rangeEnd": 0.005,
    "format": "mono",
    "envelope": "hann"
  },
  "curves": {
    "position": [{"x": 0, "y": 0.5}, {"x": 1, "y": 0.5}],
    "spread": [{"x": 0, "y": 0.08}, {"x": 1, "y": 0.08}],
    "size": [{"x": 0, "y": 0.523296082591251}, {"x": 1, "y": 0.523296082591251}],
    "density": [{"x": 0, "y": 0.6595970309777159}, {"x": 1, "y": 0.6595970309777159}],
    "pitchLow": [{"x": 0, "y": 0.5}, {"x": 1, "y": 0.5}],
    "pitchHigh": [{"x": 0, "y": 0.5}, {"x": 1, "y": 0.5}]
  },
  "source": null,
  "metadata": {}
}
```

The Size and Density values above are the normalized forms of the current 80 ms and 18 grains/s defaults. Serialization must retain sufficient precision to preserve their mapped values.

## 3. Required Semantics

- Curve coordinates are normalized floating-point values in `[0,1]`.
- Curve `x` is output-time fraction, not source time or seconds.
- Points are serialized in ascending `x` order without display rounding.
- Unknown parameter IDs must not silently change existing sound.
- `rangeStart` and `rangeEnd` are normalized source positions and are ordered on load.
- `format` values are `mono`, `stereo`, `quad`, or `octo`.
- `envelope` remains `hann` in v0.1 even though dormant helper code exists.
- Render sample rate and bit depth are product output constants, not necessary per-preset controls unless the product contract changes.

## 4. Source-Audio Policy Is Unresolved

The `source` field must not be finalized until a product decision chooses among:

- external file reference with native security bookmark
- embedded audio
- relative project/package asset
- checksum-only association requiring relink

Record original filename, channel-selection policy, source sample rate, duration, and checksum when legally and technically appropriate. Absolute browser or macOS paths must not be treated as portable identity.

## 5. Random State Policy Is Unresolved

Current Render is deterministic from seed 7321, while Preview seed 42 evolves across transport operations. Decide whether a preset stores:

- no seed, using product defaults
- a render seed only
- complete Preview random state

Do not serialize implementation-private PRNG state accidentally. Any choice changes repeatability and requires a decision record.

## 6. Migration Rules

- Increment `schemaVersion` for structural incompatibility.
- Increment product parameter/state version when a mapping, default, range, or meaning changes.
- Preserve explicit migration functions and fixtures for every released schema.
- Never reinterpret an old normalized curve using a new mapping without migration.
- Reject malformed numeric values safely; document clamping and fallback behavior.
- Keep UI-only state, hover state, Canvas dimensions, meter animation, and current playback time out of the musical preset unless separately justified.

## 7. Required Tests Before Implementation

1. Round-trip all six curves without precision loss that changes conformance fixtures.
2. Load reordered and malformed points safely.
3. Migrate at least one prior schema fixture.
4. Relink a missing source without altering product state.
5. Confirm Web and Standalone produce matching scalar/event fixtures from the same state.
6. Confirm unknown future fields do not corrupt known state.

This schema remains a design asset, not an implemented user feature.
