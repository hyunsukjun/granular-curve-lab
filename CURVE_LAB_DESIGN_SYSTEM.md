# Curve Lab Design System: Granular Application

Version: 1.0  
Baseline: 2026-09-29  
Reference family: Audio Curve Lab  
Product brand: Granular Curve Lab, Pink `#EF4FA4`

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

- Brand Pink `#EF4FA4`: directional grain-cluster brand mark, `Curve Lab` title text, restrained action/focus accents.
- Read Position `#6DE0C0`: source-reading trajectory and Source Window.
- Spread `#F2B705`: random source-position distribution width.
- Grain Size `#6FA8DC`: grain duration.
- Density `#4FB06F`: grain event rate.
- Pitch Low `#EB6F75`: lower transposition bound.
- Pitch High `#B887F4`: upper transposition bound.

Do not recolor all parameters Pink. Parameter color is semantic information.

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
| Brand | `--cl-accent` | `#EF4FA4` |
| Brand hover | `--cl-accent-hover` | `#F37BB9` |
| Focus | `--cl-focus` | `#F8A7D1` |

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
- Download WAV is the primary output action and may use restrained Pink emphasis.

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
- Active parameter buttons use their own parameter color, not Pink.
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

## Hub v0.10 Identity Pilot — 2026-10-04

PROJECT-SPECIFIC local pilot. Previous Coral #F0785A becomes canonical Pink #EF4FA4.
Header and favicon use exact Hub v0.10 symbol/micro assets (13 / 8 particles).
App tile retains 19 particles for future standalone use.
`--cl-accent` aliases `--curve-lab-granular`; focus/hover are web derivatives.
Parameter colors, canvas, normalized curves and DSP remain unchanged.
See `docs/IDENTITY_PILOT.md` for source, hashes and verification scope.


## Common bottom transport — 2026-10-13
COMMON CANDIDATE, implemented locally. Audio reference adopted: Return to start,
Play, Pause, output-position slider, time, continuous green/yellow/red stereo meter,
CLIP. Neutral 16px icons are centered inside 38x32px buttons; 34px slider hit area.
Return to start seeks to zero while preserving playing/paused state. Pause retains
position; Play resumes; Space toggles Play/Pause outside editable controls.
Internal reset stops for import/export/settings remain distinct and unchanged.
No DSP algorithm or output format changes. Resume uses this Lab's existing engine
initialization; continuous-sample-identical resumption is not promised.
The existing waveform guides remain in their existing locations.
OUT and numeric meter values are visually removed (values remain accessible).
Meter color fields are clipped at the level, not stretched; retain analysis,
ballistics, peak hold and CLIP semantics. Shared CSS/module are vendored locally,
with per-Lab adapters and no external runtime dependency.
Oscillator retains its existing source-duration seek cap for convolution tails.
Verification covers syntax, keyboard contracts and browser layout; file-based
Labs also exercised silent-WAV pause/resume. Audible listening, Safari/Windows,
long-file performance and Oscillator mode-specific listening remain separate QA.


## 2026-10-14 — Common Clear Current / Reset All appearance
Both actions follow Audio's neutral navy reference: background #122438, text #aabccc, 6px radius, 13px/620 type, 92px minimum width, 38px height (30px at >=900px viewport width). Clear border #3b5063; Reset border #203a52. Shared hover/pressed/focus/disabled styles live in src/curve-actions.css. Red action emphasis is removed; brand/parameter colors elsewhere stay independent. Existing IDs, handlers, reset scope, confirmation mechanism and keyboard behavior remain unchanged. This is a local visual update, separate from DSP verification.


## 2026-10-14 — Family file information

Approved circular dotted-i disclosure immediately left of Open Audio. Default format guidance moves into this optional panel; privacy and actual error/status notices remain. Space operates disclosure without audio transport; Escape/outside click dismiss. Output guidance: 1–600 sec synthesis · 1 / 2 / 4 / 8 channels · 48 kHz / 24-bit WAV. Input limits reflect current implementation, not a device-memory guarantee. No DSP, admission, export, IDs or defaults changed.


## 2026-10-14 — Family parameter help

Static parameter descriptions are available on the relevant buttons using the Audio help design; current values, axes and activation feedback remain visible. See `docs/PARAMETER_HELP.md` (or `PARAMETER_HELP.md` in this directory). No DSP or curve mapping changes.


## 2026-10-15 — Studio family visual pilot (local)
Reference: approved Audio design, commit 3e9723b. Apply deep cool-grey surfaces,
high-contrast typography, continuous panel boundaries and framed meters through
src/studio-theme.css. Preserve this Lab's brand accent, effect identities,
parameter mapping, feature layout and audio engine. No JS/DSP change.
This is a local first-pass candidate, not deployed; Canvas-rendered colors remain
the current implementation pending individual visual review. Narrow transport
uses document flow to avoid covering the editor. Listening is not implied.

Pilot smoke evidence: 1422px viewport, no horizontal overflow; default initialization and one parameter/effect selection verified; no browser errors captured. No full audio lifecycle, narrow/zoom certification or listening repeated. Only HTML/CSS/documentation changed.

### 2026-10-15 — Canvas alignment and zoom verification

- Canvas paper `#191C20`; neutral minor/major grid `rgba(139,149,162,.08/.18)`, matching the approved Audio direction. Parameter colors and audio processing are unchanged.
- Local browser: 800 CSS px viewport; actual Brave 125% (952 CSS px, DPR 2.5) and 150% (793 CSS px, DPR 3). No document horizontal overflow in any of the five Labs. Narrow layouts use vertical scrolling.
- Parameter selection and Clear Current smoke passed in all five; no captured console errors. Timbre play/pause/rewind smoke passed.
- Oscillator only: narrow-screen curve minimum height 220 px prevents crowded frequency labels; expanded Synthesis detail remains accessible.
- Syntax, keyboard tests and whitespace checks passed. Evidence: family workspace `evidence/family-studio-zoom-checks-20261015.json` and `*-studio-150-20261015.png`.
- Not a listening approval or a complete Safari/Windows regression. Local changes only; release decision remains pending.
- Additional targeted lifecycle/render regression suites passed; full results in family `UI_DESIGN_FAMILY_CANVAS_2026-10-15.md`.

## Common button states — 2026-10-15

`src/button-states.css` is the identical six-Lab contract, loaded after studio-theme.
Available off/bypassed: Audio reference gradient #363F4B → #2D3540, text #F0F3F7, edge #626C79. Unavailable: #353B44 / #949EAC / #495360 at full opacity. Selected: preserve existing parameter-specific fill, text and border colors, replace text underline with a full-width dark lower inset bevel (3 px). Focus remains independent. No hit-target, state, DSP or timing changes.

### Common role dimensions — 2026-10-15

- Main text buttons: 13px, weight 500, line-height 18px; 4px corner radius.
- Open/Download/Save: 38px high. Parameter/effect/waveform/synthesis mode/chain/action/dialog buttons: 34px.
- Pen/Eraser: 32px with shared 4px outer group; joined inner edges remain square. Transport: 32px, existing 3px corners and CSS glyphs retained.
- Audio edit helpers: 26px, 11px text; zoom symbols 14px. Fade handles are excluded.
- Secondary status text 12px; readout labels 11px, strong values 14px. Parameter colors and state semantics unchanged.
- Verified all six at 1422px and 640px CSS widths: no document horizontal overflow or measured button text clipping. Representative mode switching passed; Timbre Flanger expanded controls inspected, Audio Pen/Eraser and zoom/Fit exercised. Keyboard regression and diff whitespace checks passed.
- This is CSS-only verification, not fresh audio/export or listening certification. Local changes remain unpublished.

## Current precedence
See `docs/SHARED_VISUAL_CONTRACT.md` for the accepted shared baseline and resolution of older pilot conflicts. Newer role/state rules supersede old underline and 30px compact-button guidance.

## Information-density pilot — local review, 2026-10-15

Selected parameter name/value visible; statistics and full overview in disclosure. Existing preview state; last reported or initialized values while stopped. Source Window and output duration retained. All original readout IDs and update sources preserved. Details summary Space does not start transport. COMMON CANDIDATE for standalone; not committed/deployed.

## Functional surfaces
See docs/FUNCTIONAL_SURFACE_PILOT.md. Upper controls share the title background; waveform/analysis area has its own uniform surface. This refines continuous-shell styling without changing button identity or states.

## Readout disclosure rollback — 2026-10-15
User requested removal of the newly introduced Details disclosures across the family. Original always-visible readout panels restored; Oscillator retains its pre-existing Synthesis detail panel and original contents. Value computation and audio behavior unchanged. Do not add disclosure or restructure information during color/minor-UI work. Audio also removes the border above EDIT AUDIO.

## Shared content rails — 2026-10-15 (local review)
Title/icon, primary controls, values, editor outer edges and transport contents share 20px side insets; <=600px uses 10px. Dark canvas surfaces stop at this rail with neutral #373B43 outer gutters. Internal axis labels/plot margins remain part of the canvas, not the shell rail. Space retains its two-column spatial view; Oscillator retains Synthesis detail without double insets. Colors of controls/transport and all DSP behavior are preserved. Implementation: src/content-alignment.css. No release authorized for this alignment pass.

### Granular surface correction — 2026-10-15 (local review)
- Transport surround matches Timbre/header #373B43, without outer border or shadow.
- Source and curve canvas, including label gutters, use Audio editor #191C20. Remove the outside-selection background wash so left/right gutters remain continuous; retain the source selection tint, outline and range behavior.
- Remove the separator before Clear Current. Give channel selection an explicit 1px #626F7F border and 4px radius.
- Remove the persistent 24-bit / 48 kHz header label; retain export specs in file help and Download tooltip. Export behavior unchanged.
- This supersedes the previous #252C32 waveform / #30343C transport pilot for Granular. Approved for commit and deployment on 2026-10-15.

Transport surrounding page space also uses #373B43. Source gutter label starts 7px inside the canvas (10px font); Source Window title starts 24px after the plot origin, clear of the initial minimum-width selection. Canvas bounds and source selection mapping are unchanged.

### Shared transport alignment — 2026-10-15 (uncommitted review)
Return / Play / Pause retain their order and behavior. Each occupies a 38 × 32px cell with 4px spacing and a centered 16px icon. Remove the first button's extra 7px offset/divider so visual spacing is uniform. Audio reference palette: surround #292F37, thin border #596472, hover #343A42, playing #5C6978; no per-button accent colors. Override generic button backgrounds only inside transport. Preserve keyboard focus and disabled states.

Release approval (2026-10-15): user approved the reviewed transport/layout changes. All six transport-keyboard suites passed (27 tests total); Oscillator syntax and diff checks passed. Prior browser measurements confirmed equal transport cells, and Oscillator point add/erase, Clear Current, Play/Pause/rewind and narrow layout were checked.

### Transport surface continuity — 2026-10-15 (uncommitted review)
Transport and surrounding page #373B43, no outer border. Fixed transport docks at bottom:0 (no 12px floating gap); bar padding 8px vertically, minimum 56px. At <=1180px all transport containers return to document flow so wrapped controls/meters do not cover editors. Remaining track uses #8290A1; completed portion retains each Lab accent. Audio's canvas track already uses the same remaining color. Transport button capsule remains #292F37 / #596472. This supersedes older #30343C transport surface and mixed footer breakpoints.

### COMMON CANDIDATE — title and identity geometry (2026-10-15)
Audio is the geometry reference: at 900 CSS px and above, mark 38×38 px, title 23 px/1.1, weight 600, tracking −.025em, mark-to-copy gap 10 px. Below 900 px retain Audio’s compact 40×40 px mark and 22 px title with 12 px gap. Center the mark vertically against the brand copy; retain each Lab’s symbol, palette, subtitle, and status content. This does not prescribe identical header heights when content wraps. Shared implementation: `src/brand-layout.css`.
- Browser layout validation: 1280, 768, 600, and 390 CSS px widths; consistent title/mark/gap measurements, no title clipping or document horizontal overflow. Existing SVG assets and audio/interaction JavaScript unchanged.

### COMMON CANDIDATE — channel selector and current-value rhythm
Header output-channel selectors match adjacent file/export controls at 38px height, 13px type, 4px radius. Other synthesis selects retain their own role dimensions. Current-value strips use 8px vertical padding, 14px label line, 4px label-to-value gap and 18px value line (11px/14px font sizes). Preserve existing column counts, wrapping, labels, units, value sources and horizontal rails. Implementation: `src/readout-layout.css`.

### COMMON CANDIDATE — header information rhythm
Use Audio header vertical padding 9px and section gap 12px. At 900px and above hide the descriptive tagline, as Audio already does; below 900px retain it with 12px/1.35 typography. Always retain file/engine status and the local-processing notice, wrapping as needed. Keep existing horizontal rails and control wrapping. Granular engine readout wraps in its own value row instead of clipping; preserve the full Preview/Render counts and dynamic text.
- Checked at 1280/900/768/390 CSS px: header status retained, no horizontal document overflow; Granular engine text remains complete. Separate pre-existing 900px readout truncations remain for Space Preview (Headphones) and Oscillator Safety; not changed in this header pass.

### COMMON CANDIDATE — time and unit notation
Transport clocks use mm:ss.hh, rounded before splitting minutes/seconds (59.999 s → 01:00.00). File-duration metadata uses seconds to two decimals; integer output-duration controls use s / min, preserving one-second steps. Keep millisecond editing precision and existing DSP-parameter precision. Separate numbers from s, ms, Hz, kHz, cents, st, dB/oct and x; keep percent formatting. Granular density uses grains/s and pitch ranges use an en dash. Spectral stretch retains three decimals with x. Compact axis labels may retain abbreviations where space is limited. Display changes do not alter duration, parameter mapping, interpolation, or audio processing.
- Verified clock rollover at 59.999 and 3599.999 s, zero/negative/non-finite fallback, and 10-minute display. Layout checked at 1280/900/390 CSS px. Audio transform-parity test passed; Granular duration control min/max and Audio transport smoke checked. Listening and cross-browser export are not revalidated by this display-only pass.

### COMMON CANDIDATE — expanded editor
At >=900 CSS px, grow the main curve canvas into remaining viewport height measured from actual document layout, including controls, footer and any signal chain. Minimum curve height is 220px; below 900px use 300px with natural vertical scrolling. Footer stays in document flow to avoid overlap. Recompute on resize and control-layout changes. Preserve normalized curves, pointer mapping, and DSP timing.

### COMMON CANDIDATE — viewport height at every width (2026-10-15, approved)
Supersedes the 300px fixed curve below 900px: at every width calculate space left after actual controls, waveform, auxiliary panels and transport. Keep a 220px editable minimum; overflow remains natural vertical scrolling, never canvas/transport overlap. Do not hide controls or rescale normalized curve values. Audio/Timbre retain their existing height-aware layout in this incremental pass and are regression references.

- Release verification: 30 browser layout cases across six Labs passed for no horizontal overflow or editor/transport overlap. Modified four Labs retained point addition; Space/Spectral/Oscillator transport smoke passed. Granular real-file playback was not repeated for this presentation-only change. Evidence: shared verification workspace evidence/height-aware-family-20261015.json.

### COMMON CANDIDATE — compact current-value spacing (2026-10-15, approved)
Below 900 CSS px, current-value strip vertical padding 8→6px, row gap 12→8px, label/value gap 4→2px. Retain label 11px/14px and value 14px/18px typography, existing column counts, wrapping exceptions and all semantic values. No fields hidden, no Details controls introduced. Desktop spacing unchanged.

## 2026-10-15 — output controls simplification (local review)
Remove Mono1ch from web export selector; Stereo2ch is default, Quad4ch/Octo8ch retained. Internal mono renderer/source processing unchanged. Remove repeated Source Window percentage row; retain visual selection and exact percentages in source canvas title. Duration remains0–600s with1s steps, now displays mm:ss with tabular digits. Remove endpoint labels and WAV-size estimate; zero still disables rendering/playback and limits remain in slider semantics/help. No DSP changes.
Browser verified08:03,00:00/disabled,10:00, narrow390px no horizontal overflow, and real1s WAV saves in2/4/8ch at48kHz24-bit. Not committed/deployed.

Duration clock approved at14px/600 (reduced from16px) to match current-value typography; retain tabular digits. Approved for release2026-10-15.


## Restrained typography — 2026-10-15 local review
COMMON CANDIDATE, Audio-approved visual direction. Shared typography.css gives ordinary text controls/readout values400 weight, section labels500,13px/500 transport time,10px/600 CLIP. Readout labels use natural case and zero tracking. Button dimensions and Lab-specific active/enabled colors remain; decorative highlights removed, active lower bevel1px. Duration14/600 remains intentional. Canvas excessive600/650/750 weights reduced; point tooltip13→12px where applicable; waveform headings natural case. No normalized coordinates, DSP, parameter meanings or transport logic changed.
Commit/deployment withheld for user preview. Native confirmation keyboard and comparative listening remain deferred.

Validation follow-up: default wide layout and narrow354px(Timbre)/390px(other Labs) no horizontal overflow or button clipping; representative active effect/mode colors and400 weight verified, chain enabled colors retained. Basic Play/Pause/rewind confirmed for Timbre/Space/Spectral/Oscillator; Granular no-file disabled state and mode selection checked, no real-file playback repeated. Console errors none; app syntax/diff checks passed. Native zoom not repeated for these five changes. Evidence: shared QA type-family-audit.json and type-family-*-390.png.

## 2026-10-15 — Source-tone waveform (local review, not released)

- Follow the Audio/Timbre source-tone palette: blue → teal → gold → peach indicates low-to-high spectral centroid of the original source. It does not represent processed output, level, clipping, or sound quality.
- Signed min/max summary up to 16,000 buckets preserves transients; display gain is normalized without changing samples. HiDPI polygon rendering replaces the coarse waveform. Static waveform raster is cached while cursor/selection overlays update independently.
- Worker analysis samples at most 1,024 Hann/FFT windows per channel (1,024 samples/window, max two channels). File replacement cancels stale work; analysis failure falls back to blue. Long files are sampled and brief events may be missed; this is a visual guide, not a spectrogram.
- Existing DSP, playback/export, normalized curves, timing and channel routing remain unchanged.
- Local source-color tests and syntax/diff checks passed. Browser import and play/pause checked. Brave at 900×700 with actual 125% and 150% zoom checked; vertical scrolling is retained on short screens. No subjective listening, Windows, or native confirmation-keyboard claim.
- Await user visual review before commit/deployment.

Granular: first-channel mono source policy retained. Selected region retains original colors, outside is dimmed, and teal selection border has a dark under-stroke. Real drag selection and playback marker checked. Existing boundary regression passed 144 rate/pitch/window cases, zero duration rejection, 8ch WAV and source preservation.

## Canvas grid contract — 2026-10-18 (local review)
- General decorative grid: 32 CSS px minor, 128 CSS px major, 1 px strokes; density independent of canvas aspect ratio. No snap or change to normalized musical coordinates.
- Semantic value ticks remain parameter-specific; frequency axes preserve existing logarithmic mapping, use shared 1/2/5-per-decade candidates plus endpoints, Hz/kHz units and 24 px minimum label separation.
- Source envelope waits for asynchronous source-color data; no initial legacy blue waveform. On worker failure, neutral gray source shape remains available. No audio samples or processing modified.
- Oscillator partial monitor is retained in source but hidden in the web UI; curve editor reuses freed height.
- Browser verification pending; no commit/deployment or listening approval implied.
- Tick text: 11 px regular, emphasized ticks 11 px medium; point/hover text: 12 px medium. Absolute frequency axes share labels; frequency offsets (e.g. Spectral Shift) retain their signed linear meaning.
- Verified locally: grid/log-label/worker-error tests, source-color tests, keyboard tests, JS syntax; browser initial load and Play/Pause (Granular with 8-second WAV). Independent app tabs reported no console errors. 600 px iframe inspection: all six document widths match their viewport (583 px after scrollbar), minimum curve height about 220 px and transport retained through vertical scrolling. This is not a new native browser zoom or listening certification.

- Release check 2026-10-18: native Brave 125% and 150% reviewed across the family; curve point add/move/Command-delete verified in every Lab. Small viewport checks retained separately. Canvas-grid, source-colors, transport-keyboard and syntax checks passed. Listening/DSP and native confirmation-dialog checks remain separate.

## Shared axis gutter — 2026-10-18
- Curve and source waveform plot starts use canvasAxisWidth = 64 CSS px. Audio fade handle/navigator and source pointer conversion share the same gutter. Normalized curve points, timing and DSP remain unchanged. Absolute frequency axes retain their logarithmic scale.

Verification: 600px layout and actual Brave 125%/150% checked. Pointer add/move/modifier-delete checked across all six labs; Audio source edit lifecycle passed. Oscillator imported 8-second WAV overview aligns with the curve axis. This is UI evidence, not DSP/listening certification.

## Quiet context trial — 2026-10-23
Audio-approved family tokens: resting controls #303740 / #48515c border; hover #404a56 / #7a899b; focus #a9cfff; secondary readout labels #adb6c2; separators #454b54. Background grid draws at 0.65 of its previous opacity. Selected/enabled effect colors, disabled states, font sizes, geometry, parameter scales, points and DSP remain unchanged. COMMON CANDIDATE; user approved family rollout on 2026-10-23.

Verification: Brave wide and 600×700 viewport reviewed (585px client/scroll width, no horizontal overflow); native 150% layout reviewed for all five, 125% additionally reviewed for Timbre. Selected colors retained; playback/stop UI and meters checked (Granular with source-tone-demo.wav). Syntax and diff whitespace checks pass. This is UI evidence, not listening or WAV export acceptance. Family rollout approved for commit/deployment on 2026-10-23.


## Graphite role system v1 — 2026-10-26

COMMON CANDIDATE / STANDALONE ASSET. The user approved the six-Lab visual refinement. [Graphite interface contract](docs/INTERFACE_GRAPHITE_CONTRACT.md) and [portable roles](assets/interface/graphite-v1.json) supersede earlier neutral shell/control/text and minor-grid emphasis values only. `src/refined-ui.css` is the common implementation. Keep all musical colors, state meanings, font metrics, layout and interaction geometry. The earlier no-underline and continuous functional-surface rules remain. Current runtime/UI verification is recorded in the shared Graphite review evidence; listening/native approval is separate.

## Readout context family release — 2026-10-27

Reuse existing Graphite colors/type and controls. Value captions identify initial/latest Preview snapshot. Source Window start/end/length is read-only source-time metadata; normalized bounds, read-position meaning and output clock unchanged. No hidden readouts or Details disclosure, and no hit-target change. Metadata can wrap without clipping on narrow screens. See `docs/READOUT_CONTEXT_CONTRACT.md` for basis, source-range rules, verification boundary and portability.

## Shift group / Option erase — 2026-10-27

APPROVED INTERACTION / UI-only addition. Preserve existing point and hit geometry. A thin ring and count communicate the temporary Shift group; vertical cursor communicates the constrained action. Keep axes/focus/data colors and surrounding layout. Option temporary erase supersedes Mac Command erase. Touch is not assigned a desktop modifier gesture. See [gesture contract](docs/CURVE_GESTURE_CONTRACT.md).


## Channel selector next to editing tools — 2026-10-28

APPROVED WEB UI / STANDALONE ASSET. Keep the existing output-format selector before Pen/Eraser in the parameter toolbar. Reuse 34px control height, 13px regular type and Graphite neutral/hover/focus roles. Web control width132px, leading inset12px and trailing reserve28px leave space for the native arrow; preserve native select appearance. Wrap selector and tool pair as one group; preserve parameter order. These are web metrics, not native point specifications.


## Readout groups and shortcut guide — 2026-10-28

APPROVED WEB UI / STANDALONE ASSET. Apply Audio-approved role order/proximity with this Lab's own field count, units and colors. Keep edit context first, related musical values together and reference state last. Two semantic dividers on wide views; whitespace on narrow views. Reuse existing typography, Graphite, focus and file-help panel; all fields stay visible. Shortcuts follows the editing tools; Space/Granular retain the channel selector immediately before Pen/Eraser. Native dimensions/layout need independent validation.

## Toolbar roles and processor information — 2026-10-28

APPROVED WEB UI / STANDALONE ASSET. Keep the existing dynamic engineReadout values, Preview/Render caps and their basis. Rename the caption from Engine to Grain limit; no grain limit or randomization setting changes. Reuse existing controls, disclosure, typography and focus roles. Fixed implementation names may move to on-demand information; actionable routing, limits and safety remain visible. This supersedes only the prior Engine placement and stated toolbar positions, not musical readout formatting.
