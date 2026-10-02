# Interaction Specification

Version: 1.0  
Baseline: 2026-09-29

This document defines user intent independently of browser event names.

## 1. Open Audio

**Meaning:** Replace the current source material with a local audio file.

- The source is decoded locally; no upload occurs.
- Successful loading displays filename, mono-source status, and duration.
- Source Window resets to the minimum 5 ms-equivalent width at the source start.
- Transport and Download become available.
- Failure leaves no active source and reports a concise format suggestion.

Current web binding: file input with `audio/*` acceptance.

## 2. Play / Stop / Spacebar

**Play:** Begin or resume Preview from the current output playhead. If already at the end, restart at zero.  
**Stop:** Stop Preview and return output playhead to zero.  
**Spacebar:** Toggle Play/Stop when focus is not inside an input, select, or editable field. Button focus is blurred to prevent a second browser button activation.

Play, Stop, the only visible time display, Position scrubber, and L/R output meter are grouped in the bottom playback bar. Natural completion also returns the playhead and scrubber to zero.

The playhead represents output time, not source read position. During playback, Source read position is drawn separately in the Source Window lane. The marker is hidden while stopped.

## 3. Output Duration

The user sets the total output timeline in seconds. Every curve spans this duration from left to right. Changing duration does not stretch source audio; it changes the time over which granular parameter trajectories are evaluated.

## 4. Parameter Mode Selection

Selecting Read Position, Spread, Size, Density, Pitch Low, or Pitch High:

- Makes that curve the editable active curve.
- Shows its control points and thicker line.
- Updates the Curve and Points status values.
- Leaves previously edited inactive curves visible at reduced thickness.
- Does not alter the curve data.

## 5. Pen

Pen is the default editing tool.

**Add:** Clicking empty curve space inserts a point at normalized output time/value.  
**Move:** Pressing an existing point and dragging moves it continuously; points are re-sorted by time.  
**Hover:** Hovering a point shows its parameter value in the correct unit.  
**Empty-space result:** A new point is created.

Current behavior does not lock the first/last point to `x=0/1` during movement. This must be preserved unless a separate endpoint-anchoring decision is approved.

## 6. Eraser

Selecting Eraser changes both tool-button state and Canvas cursor.

- Clicking one existing interior point removes that point only.
- Clicking empty space does nothing.
- The first and last sorted points cannot be deleted.
- Erasing never creates a point.

## 7. Temporary Eraser Modifier

While Pen remains selected:

- macOS: Command-click acts as Eraser.
- PC: Ctrl-click acts as Eraser.
- Releasing the modifier returns the cursor/behavior to the selected Pen tool.

The selected tool button must not switch permanently during this gesture.

## 8. Clear Current

Clear Current restores only the active curve to its documented default two-point horizontal curve. Other curves, Source Window, source file, Output Duration, and output format remain unchanged.

## 9. Reset All

Reset All first asks for confirmation.

- Cancel: make no state change.
- Confirm: stop playback, restore all six curves, reset Source Window to its minimum width at source start, clear selection/hover, and invalidate prior render state.
- The loaded source, Output Duration, and output format are preserved by the current implementation.

## 10. Source Window Click

Clicking the waveform lane creates the minimum source range at the selected source location. The minimum product range is equivalent to the 5 ms minimum grain duration. Near the source end, the range shifts left to remain valid.

The visible selection may be widened to at least 10 px for legibility; this does not change stored normalized bounds.

## 11. Source Window Drag

Dragging in either direction defines a larger Source Window between anchor and current pointer. Movement below the current 0.008 normalized threshold remains a minimum-range click selection.

The selected range is the hard boundary for all grain reads.

## 12. Position Scrubber and Curve Double-Click Seek

Dragging the Position scrubber or double-clicking the curve workspace moves the output playhead to the corresponding normalized output time. Time text, Canvas playhead, and the AudioWorklet receive the same seek. Scrubbing during playback continues from the selected output position.

## 13. Pitch Range Visualization

Pitch Low and Pitch High are independently editable. The filled region communicates the interval even if the drawn curves cross. DSP reorders evaluated values into valid low/high bounds.

## 14. Download WAV / Cancel

With a source loaded:

- Download WAV begins offline rendering using current curves, Source Window, duration, and channel format.
- The fixed final file specification, `24-bit / 48 kHz`, appears beside the channel selector.
- Playback stops before rendering.
- Progress appears in the WAV status value.
- During rendering, the button becomes Cancel.
- Completion initiates a browser download and reports duration/channel count; the adjacent fixed specification remains visible.
- Editing after a render marks the result as needing export again.

## 15. Focus and Accessibility States

- Interactive controls expose native button/input/select semantics.
- Pen/Eraser expose `aria-pressed` state and descriptive tooltips.
- Keyboard focus is visibly indicated.
- Disabled controls remain legible but inactive.

## 16. Output Meter and CLIP Reset

- L/R RMS, peak, and held peak values are measured from the final stereo Preview signal after granular DSP and before the audio destination.
- Metering is a unity-gain observation path and must not change the signal.
- CLIP latches when either measured channel reaches the reference threshold and resets when clicked.
- The current `-1 dBFS` Preview ceiling means ordinary protected output may never trigger CLIP; the indicator remains a guard for future or unexpected overs.

## 17. Interaction Unknowns

- Touch and stylus behavior: TO BE DOCUMENTED.
- Undo/Redo contract: no current feature.
- Native Standalone modifier mapping outside macOS/Windows: TO BE DOCUMENTED.
- Endpoint anchoring versus current movable-endpoint behavior: product decision required before change.
