# Curve Lab Design System: Granular Application

Version: 1.0  
Baseline: 2026-09-29  
Reference family: Audio Curve Lab  
Product brand: Granular Curve Lab, Coral `#F0785A`

## 1. Design Intent

Granular Curve Lab belongs to the Curve Lab product family while retaining its own grain-specific parameter structure. The interface is a quiet, dense musical workbench. The Canvas is the primary workspace; decoration remains subordinate.

The common visual order is:

1. Brand/Header
2. Source and output controls
3. Parameter/tool toolbar
4. Thin status strip
5. Source and curve Canvas workspace
6. Bottom playback and output-meter bar

## 2. Brand and Semantic Color Roles

Brand color and parameter colors have different jobs.

- Brand Coral `#F0785A`: waveform-style brand mark, `Curve Lab` title text, restrained action/focus accents.
- Read Position `#6DE0C0`: source-reading trajectory and Source Window.
- Spread `#F2B705`: random source-position distribution width.
- Grain Size `#6FA8DC`: grain duration.
- Density `#4FB06F`: grain event rate.
- Pitch Low `#EB6F75`: lower transposition bound.
- Pitch High `#B887F4`: upper transposition bound.

Do not recolor all parameters Coral. Parameter color is semantic information.

## 3. Current Web Tokens

### Surfaces and text

| Meaning | Token | Value |
|---|---|---|
| Application background | `--cl-bg` | `#07111C` |
| Deep background | `--cl-bg-deep` | `#050B12` |
| Surface | `--cl-surface` | `#0D1B29` |
| Raised surface | `--cl-surface-raised` | `#122438` |
| Hover surface | `--cl-surface-hover` | `#182F46` |
| Active surface | `--cl-surface-active` | `#1B3751` |
| Border | `--cl-border` | `#203A52` |
| Strong border | `--cl-border-strong` | `#345672` |
| Primary text | `--cl-text` | `#E8F0F6` |
| Secondary text | `--cl-text-secondary` | `#AABCCC` |
| Muted text | `--cl-text-muted` | `#71889B` |
| Brand | `--cl-accent` | `#F0785A` |
| Brand hover | `--cl-accent-hover` | `#F48D72` |
| Focus | `--cl-focus` | `#FFAD98` |

### Geometry and spacing

| Meaning | Value |
|---|---|
| Small/medium/large radius | 4 / 6 / 8 px |
| Spacing scale | 4 / 8 / 12 / 16 / 24 / 32 px |
| Standard control height | 38 px |
| Toolbar minimum height | 54 px |
| Parameter button height | 34 px |
| Pen/Eraser segment | 38 x 32 px |
| Curve control-point radius | 6 px |
| Active curve width | 4.8 px |
| Edited inactive curve width | 2.1 px |
| Playhead width | 1.5 px |

These values are web tokens. Their hierarchy and visual meaning, not CSS syntax, are the portable product asset.

## 4. Typography

Use the operating-system UI font stack:

`system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`

Do not add a remote font dependency. Typography remains compact, legible, and neutral. Status labels use small uppercase text; live values use tabular numerals where useful.

## 5. Header and Transport

- Use the Curve Lab waveform mark at 48 x 48 px on wide layouts and 40 x 40 px on narrow layouts.
- Keep mark geometry and stroke treatment consistent with the family; only the brand color changes.
- Keep the product name visible in the first viewport.
- Header output controls contain Open Audio, Output Duration, channel format, and Download WAV.
- Play, Stop, the single time display, Position scrubber, and L/R meter live in the bottom playback bar.
- Output Duration and channel format are global-output controls, not grain-curve parameters.
- Download WAV is the primary output action and may use restrained Coral emphasis.

## 6. Toolbar and Tools

- Preserve all six parameter modes and their semantic colors.
- Pen is the default tool.
- Pen/Eraser icons, 2-segment toggle geometry, active state, spacing, and eraser cursor follow the established Curve Lab tool contract.
- Source Window appears as a compact current-range readout in the toolbar.
- Clear Current and Reset All remain secondary actions.

## 7. Status Strip

The status strip communicates active curve, point count, engine state, live parameter values, and WAV readiness. Playback time appears only in the bottom bar.

Engine text must disclose Preview fallback: `Preview 32 / Render 64` when active. Automation may be automatic; audible state differences must not be hidden.

## 8. Canvas Workspace

- Canvas background: `#0C1F31`.
- Minor grid: low-contrast blue-gray.
- Major grid: stronger blue-gray.
- Waveform: muted blue-gray, not a brand-color fill.
- Source Window: Read Position mint outline/fill.
- Pitch Low/High region: translucent parameter-color range fill.
- Tooltips use the active parameter color as their border.
- Curves remain fully opaque; selected state is primarily expressed by thickness and control points.

Curve visibility takes precedence over ambient effects.

## 9. Interaction States

- Hover increases surface and border contrast.
- `focus-visible` uses the focus token and must remain clearly visible.
- Disabled controls retain shape but lower opacity.
- Active parameter buttons use their own parameter color, not Coral.
- Active Pen/Eraser state uses the common blue workbench selection treatment.

## 10. Ambient Background and Motion

Ambient color fields are decorative, low opacity, pointer-transparent, and extremely slow. `prefers-reduced-motion` reduces animations and transitions to effectively static behavior. The application remains fully functional without ambient motion.

## 11. Responsive Behavior

- At narrower widths, transport moves below the header identity.
- Toolbar groups wrap without truncating button labels.
- Status changes from 10 to 5 to 2 columns.
- Canvas remains the largest work area; it retains its stable 1800 px musical drawing width and is clipped by the responsive frame.

## 12. Change Policy

When changing design:

- Do not rename JavaScript IDs/classes casually.
- Do not alter curve coordinates, parameter mappings, or DSP.
- Update this document when tokens, hierarchy, or states change.
- Validate narrow and wide layouts, keyboard focus, disabled controls, high-DPI Canvas, and reduced-motion behavior.
