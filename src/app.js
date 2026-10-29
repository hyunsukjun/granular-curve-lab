import {createSourceLoadGate, fetchDefaultSource} from "./default-source.js?v=20261029-bach1";
import {beginVerticalGroup, moveVerticalGroup, restoreVerticalGroup, verticalGroupSuffix, drawVerticalGroupRing} from "./curve-group-edit.js?v=20261027-shift1";
import {canvasAxisWidth, drawEditorGrid, frequencyTicks, frequencyLabel, spacedMarks, canvasLabelFont} from "./canvas-grid.js?v=20261026-graphite1";
import {analyzeSourceColors} from "./source-colors.js";
import {summarizeChannels,paintEnvelope,peakOf,paintToneLegend} from "./source-envelope.js";
import {mountTransport} from "./common-transport.js?v=20261013-1";
import { readAudioFile, validateAudioBuffer } from "./audio-import.js?v=20261029-input-validation1";
import {
  curveDefaults,
  densityFromNorm,
  grainMsFromNorm,
  normFromDensity,
  normFromGrainMs,
  semitoneFromNorm,
  valueAt
} from "./granular-core.js";
import { OutputMeterAnalyzer } from "./output-meter.js?v=20260930-01";

const sourceLoadGate = createSourceLoadGate();

const fileInput = document.getElementById("fileInput");
const fileStatus = document.getElementById("fileStatus");
const timeStatus = document.getElementById("timeStatus");
const playbackScrubber = document.getElementById("playbackScrubber");
const playButton = document.getElementById("playButton");
const stopButton = document.getElementById("stopButton");
const downloadButton = document.getElementById("downloadButton");
const clearCurveButton = document.getElementById("clearCurveButton");
const resetButton = document.getElementById("resetButton");
const durationInput = document.getElementById("durationInput");
const durationPanel = document.getElementById("durationPanel");
const formatSelect = document.getElementById("formatSelect");
const sourceCanvas = document.getElementById("sourceCanvas");
const sourceWindowReadout = document.getElementById("sourceWindowReadout");
const sourceCtx = sourceCanvas.getContext("2d");
const canvas = document.getElementById("curveCanvas");
const ctx = canvas.getContext("2d");
const penTool = document.getElementById("penTool");
const eraserTool = document.getElementById("eraserTool");
const meterRows = Array.from(document.querySelectorAll("[data-meter-channel]"));
const meterClipButton = document.getElementById("meterClipButton");
const eraseModifier = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgentData?.platform || "")
  ? "altKey"
  : "ctrlKey";

const modeButtons = {
  position: document.getElementById("positionMode"),
  spread: document.getElementById("spreadMode"),
  size: document.getElementById("sizeMode"),
  density: document.getElementById("densityMode"),
  pitchLow: document.getElementById("pitchLowMode"),
  pitchHigh: document.getElementById("pitchHighMode")
};

const readouts = {
  mode: document.getElementById("modeReadout"),
  points: document.getElementById("pointsReadout"),
  engine: document.getElementById("engineReadout"),
  position: document.getElementById("positionReadout"),
  spread: document.getElementById("spreadReadout"),
  size: document.getElementById("sizeReadout"),
  density: document.getElementById("densityReadout"),
  pitch: document.getElementById("pitchReadout"),
  download: document.getElementById("downloadReadout")
};

const curveColors = {
  position: "#6de0c0",
  spread: "#f2b705",
  size: "#6fa8dc",
  density: "#f4a261",
  pitchLow: "#eb6f75",
  pitchHigh: "#b887f4"
};

const curveLabels = {
  position: "Read Position",
  spread: "Spread",
  size: "Grain Size",
  density: "Density",
  pitchLow: "Pitch Low",
  pitchHigh: "Pitch High"
};

let audioContext;
let audioSetupPromise = null;
let node;
let outputMeter;
let workletBufferLoaded = false;
let buffer;
let sourceFileLabel = "";
let waveform = [];
let sourceColors=null,sourceRaster=null;
let activeCurve = "position";
let selectedTool = "pen";
let selectedPoint = null;
let curvePointerId = null;
let verticalDrag = null;
let shiftHeld = false;
let hoverPoint = null;
let dragging = false;
let sourceDragging = false;
let sourceDragAnchor = 0;
let sourceDragMoved = false;
let playheadSeconds = 0;
let isPlaying = false;
let isScrubbing = false;
let playbackToken = 0;
let meterAnimationFrame = 0;
let meterLastFrameTime = performance.now();
let meterClipLatched = false;
const meterDisplay = meterRows.map(() => ({ peak: 0, rms: 0, hold: 0, holdUntil: 0 }));
let downloadUrl = null;
let renderAbortController = null;
let renderGranular = null;
let canvasCssWidth = 1;
let canvasCssHeight = 1;
let sourceCanvasCssWidth = 1;
let sourceCanvasCssHeight = 1;
const parameterScaleWidth = canvasAxisWidth;
const plotRightPadding = 8;
const grainMinimumSeconds = 0.005;
const sourceWindowMinimumPixels = 10;
const sourceWindow = { start: 0, end: 0.005 };

const curves = Object.fromEntries(Object.entries(curveDefaults).map(([name, y]) => [name, defaultCurve(y)]));
const editedCurves = Object.fromEntries(Object.keys(curves).map((name) => [name, false]));

let current = {
  activeGrains: 0,
  position: curveDefaults.position,
  spread: curveDefaults.spread,
  sizeMs: grainMsFromNorm(curveDefaults.size),
  density: densityFromNorm(curveDefaults.density),
  pitchLow: 0,
  pitchHigh: 0
};

function defaultCurve(y) {
  return [{ x: 0, y }, { x: 1, y }];
}

function settings() {
  const durationSeconds = Math.max(0, Math.min(600, Number(durationInput.value)));
  return {
    durationSeconds,
    rangeStart: sourceWindow.start,
    rangeEnd: sourceWindow.end,
    envelope: "hann",
    format: formatSelect.value,
    maxPreviewGrains: previewGrainLimit(),
    outputGain: 0.92
  };
}

function previewGrainLimit() {
  const density = densityFromNorm(valueAt(curves.density, playheadSeconds / Math.max(1, Number(durationInput.value) || 20)));
  const size = grainMsFromNorm(valueAt(curves.size, playheadSeconds / Math.max(1, Number(durationInput.value) || 20)));
  return density * size > 2600 ? 32 : 64;
}

function resizeCanvas() {
  const sourceRect = sourceCanvas.getBoundingClientRect();
  const rect = canvas.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;
  sourceCanvasCssWidth = Math.max(1, sourceRect.width);
  sourceCanvasCssHeight = Math.max(1, sourceRect.height);
  canvasCssWidth = Math.max(1, rect.width);
  canvasCssHeight = Math.max(1, rect.height);
  sourceCanvas.width = Math.max(1, Math.floor(sourceCanvasCssWidth * scale));
  sourceCanvas.height = Math.max(1, Math.floor(sourceCanvasCssHeight * scale));
  canvas.width = Math.max(1, Math.floor(canvasCssWidth * scale));
  canvas.height = Math.max(1, Math.floor(canvasCssHeight * scale));
  draw();
}

function formatClock(seconds) {
  const hundredths = Math.round(Math.max(0, Number.isFinite(seconds) ? seconds : 0) * 100);
  const minutes = Math.floor(hundredths / 6000);
  const rest = (hundredths % 6000) / 100;
  return `${String(minutes).padStart(2, "0")}:${rest.toFixed(2).padStart(5, "0")}`;
}

function linearToDb(value) {
  return value > 0.000001 ? 20 * Math.log10(value) : -Infinity;
}

function meterPosition(value) {
  const db = linearToDb(value);
  return Math.max(0, Math.min(1, (db + 60) / 60));
}

function smoothMeterValue(currentValue, target, elapsedMs, attackMs, releaseMs) {
  const time = target > currentValue ? attackMs : releaseMs;
  const amount = 1 - Math.exp(-elapsedMs / Math.max(1, time));
  return currentValue + ((target - currentValue) * amount);
}

function updateMeterDisplay(now) {
  const elapsedMs = Math.min(100, Math.max(0, now - meterLastFrameTime));
  meterLastFrameTime = now;
  const measuredChannels = outputMeter?.read() || [];

  meterRows.forEach((row, index) => {
    const measured = measuredChannels[index] || { peak: 0, rms: 0, clipped: false };
    const display = meterDisplay[index];
    display.peak = smoothMeterValue(display.peak, measured.peak, elapsedMs, 18, 320);
    display.rms = smoothMeterValue(display.rms, measured.rms, elapsedMs, 45, 420);
    if (measured.peak >= display.hold) {
      display.hold = measured.peak;
      display.holdUntil = now + 1000;
    } else if (now > display.holdUntil) {
      display.hold = smoothMeterValue(display.hold, measured.peak, elapsedMs, 0, 700);
    }
    if (measured.clipped) meterClipLatched = true;
    row.querySelector(".meterRms").style.clipPath = `inset(0 ${(1-meterPosition(display.rms))*100}% 0 0)`;
    row.querySelector(".meterPeak").style.clipPath = `inset(0 ${(1-meterPosition(display.peak))*100}% 0 0)`;
    row.querySelector(".meterHold").style.left = `${meterPosition(display.hold) * 100}%`;
    row.querySelector(".meterHold").style.opacity = display.hold > 0.001 ? "1" : "0";
    const peakDb = linearToDb(display.peak);
    row.querySelector(".meterValue").textContent = Number.isFinite(peakDb) ? peakDb.toFixed(1) : "-∞";
  });

  meterClipButton.classList.toggle("clipped", meterClipLatched);
  meterClipButton.setAttribute("aria-pressed", String(meterClipLatched));
  meterAnimationFrame = requestAnimationFrame(updateMeterDisplay);
}

function startMeterAnimation() {
  if (meterAnimationFrame) return;
  meterLastFrameTime = performance.now();
  meterAnimationFrame = requestAnimationFrame(updateMeterDisplay);
}

function minimumSourceWindowWidth() {
  if (!buffer?.duration) return 0.005;
  return Math.max(0.0001, Math.min(1, grainMinimumSeconds / buffer.duration));
}

function resetSourceWindowToMinimum() {
  sourceWindow.start = 0;
  sourceWindow.end = minimumSourceWindowWidth();
}

function formatSourcePercent(value) {
  const percent = value * 100;
  const widthPercent = Math.abs(sourceWindow.end - sourceWindow.start) * 100;
  if (widthPercent < 1) return percent.toFixed(2);
  if (widthPercent < 10) return percent.toFixed(1);
  return String(Math.round(percent));
}

function formatPointValue(curveName, point) {
  if (curveName === "position" || curveName === "spread") return `${Math.round(point.y * 100)}%`;
  if (curveName === "size") return `${Math.round(grainMsFromNorm(point.y))} ms`;
  if (curveName === "density") return `${densityFromNorm(point.y).toFixed(1)} grains/s`;
  const st = semitoneFromNorm(point.y);
  return `${st > 0 ? "+" : ""}${st.toFixed(1)} st`;
}

function sortCurve(curve) {
  curve.sort((a, b) => a.x - b.x);
}

function sendCurves() {
  markDownloadStale();
  node?.port.postMessage({ type: "curves", curves });
}

function sendSettings() {
  markDownloadStale();
  node?.port.postMessage({ type: "settings", settings: settings() });
  draw();
}

function markDownloadStale() {
  if (!buffer) return;
  if (downloadUrl) URL.revokeObjectURL(downloadUrl);
  downloadUrl = null;
  setExportStatus("needs export");
}

function clearDownload() {
  if (downloadUrl) URL.revokeObjectURL(downloadUrl);
  downloadUrl = null;
}

function setBusy(isBusy) {
  playButton.disabled = isBusy || !buffer || settings().durationSeconds <= 0;
  stopButton.disabled = isBusy || !buffer;
  downloadButton.disabled = isBusy || !buffer || settings().durationSeconds <= 0;
  fileInput.disabled = isBusy;
  playbackScrubber.disabled = isBusy || !buffer;
  durationInput.disabled = isBusy;
  formatSelect.disabled = isBusy;
}

function nextPlaybackToken() {
  playbackToken += 1;
  return playbackToken;
}

async function ensureAudioContext({ resume = true } = {}) {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) throw new Error("Web Audio is not available in this browser.");
    audioContext = new AudioContextClass();
  }
  if (resume && audioContext.state !== "running") await audioContext.resume();
}

async function ensureAudio() {
  await ensureAudioContext();
  if (!node) {
    if (!audioSetupPromise) audioSetupPromise = setupAudio().finally(() => { audioSetupPromise = null; });
    await audioSetupPromise;
  }
  if (!workletBufferLoaded) sendBufferToWorklet();
}

async function setupAudio() {
  if (!audioContext.audioWorklet) throw new Error("AudioWorklet is not available. Use a current browser over localhost or HTTPS.");
  await audioContext.audioWorklet.addModule("src/granular-worklet.js?v=20261025-fade10");
  node = new AudioWorkletNode(audioContext, "granular-curve-processor", {
    numberOfInputs: 0,
    numberOfOutputs: 1,
    outputChannelCount: [2]
  });
  outputMeter = new OutputMeterAnalyzer(audioContext, { channelCount: 2 });
  node.connect(outputMeter.input);
  outputMeter.connect(audioContext.destination);
  startMeterAnimation();
  node.port.onmessage = (event) => {
    if (event.data.token != null && event.data.token !== playbackToken) return;
    if (event.data.type === "position") {
      playheadSeconds = event.data.seconds;
      current = { ...current, ...event.data };
      draw();
    } else if (event.data.type === "ended" || event.data.type === "stopped") {
      isPlaying = false;
      playheadSeconds = event.data.type === "stopped" ? event.data.seconds || 0 : 0;
      playButton.textContent = "Play";
      if (event.data.type === "ended") node?.port.postMessage({ type: "seek", seconds: 0, token: playbackToken });
      draw();
    }
  };
  sendBufferToWorklet();
  sendSettings();
  sendCurves();
}

function sendBufferToWorklet() {
  if (!node || !buffer) return;
  const mono = new Float32Array(buffer.getChannelData(0));
  node.port.postMessage({ type: "buffer", mono, sampleRate: buffer.sampleRate }, [mono.buffer]);
  workletBufferLoaded = true;
}

async function decodeAudioFile(arrayBuffer) {
  const data = arrayBuffer.slice(0);
  return new Promise((resolve, reject) => {
    const promise = audioContext.decodeAudioData(data, resolve, reject);
    if (promise?.then) promise.then(resolve).catch(reject);
  });
}

function buildWaveform(audioBuffer) {
  waveform=summarizeChannels([audioBuffer.getChannelData(0)])[0];sourceColors=null;sourceRaster=null;
  analyzeSourceColors({length:audioBuffer.length,sampleRate:audioBuffer.sampleRate,numberOfChannels:1,getChannelData:()=>audioBuffer.getChannelData(0)},colors=>{if(buffer===audioBuffer){sourceColors=colors;drawSourceWindow();}});
}

async function loadAudioFile(file, { request = null } = {}) {
  if (!file) return;
  const sourceRequest = request || sourceLoadGate.begin();
  if (!sourceRequest.current()) return;
  // Stop the attempt safely; commit source/window/export changes only after validation.
  const previousDownloadStatus = readouts.download.textContent;
  stopAudio();
  setBusy(true);
  fileStatus.textContent = `Loading ${file.name}...`;
  try {
    // Decoding must not wait for Safari playback permission after the file chooser.
    await ensureAudioContext({ resume: false });
    const candidate = await decodeAudioFile(await readAudioFile(file, audioContext.sampleRate));
    await validateAudioBuffer(candidate, { signal: sourceRequest.signal, isCurrent: sourceRequest.current });
    if (!sourceRequest.current()) return;
    buffer = candidate;
    buildWaveform(buffer);
    resetSourceWindowToMinimum();
    // This authored example has35ms lead-in. Keep the established5ms width,
    // but place the built-in example on its first note, not encoder pre-ringing.
    // Explicit user files keep the existing start-at-zero import behavior.
    if (request) {
      const width = sourceWindow.end;
      sourceWindow.start = Math.max(0, Math.min(0.05 / buffer.duration, 1 - width));
      sourceWindow.end = sourceWindow.start + width;
    }
    workletBufferLoaded = false;
    playheadSeconds = 0;
    sendBufferToWorklet();
    sendSettings();
    fileStatus.textContent = `${file.name} - ${buffer.duration.toFixed(2)} s · mono source`;
    sourceFileLabel = fileStatus.textContent;
    clearDownload();
    setExportStatus("ready");
    draw();
  } catch (error) {
    if (!sourceRequest.current()) return;
    console.error(error);
    const message = /^(AIFF:|Audio input:)/.test(error.message || "") ? error.message : "Could not load audio. Try WAV, MP3, or M4A.";
    fileStatus.textContent = `${message}${buffer ? ` Previous audio remains available: ${sourceFileLabel}` : ""}`;
    setExportStatus(buffer ? previousDownloadStatus : "not ready");
  } finally {
    if (sourceRequest.current()) setBusy(false);
  }
}

function playAudio() {
  if (!buffer || isPlaying || settings().durationSeconds <= 0) return;
  const duration = settings().durationSeconds;
  if (playheadSeconds >= duration - 0.02) {
    playheadSeconds = 0;
  }
  const requestToken = playbackToken;
  ensureAudio().then(() => {
    if (isPlaying || requestToken !== playbackToken || !buffer || playButton.disabled) return;
    node.port.postMessage({ type: "seek", seconds: playheadSeconds, token: playbackToken });
    node.port.postMessage({ type: "play", token: nextPlaybackToken() });
    isPlaying = true;
    playButton.textContent = "Playing";
  }).catch((error) => {
    console.error(error);
    fileStatus.textContent = error.message;
  });
}

function stopAudio() {
  const stopToken = nextPlaybackToken();
  node?.port.postMessage({ type: "stop", reset: true, token: stopToken });
  isPlaying = false;
  playheadSeconds = 0;
  playButton.textContent = "Play";
  draw();
}

function getPlotBounds() {
  return {
    left: parameterScaleWidth,
    width: Math.max(1, canvasCssWidth - parameterScaleWidth - plotRightPadding),
    height: canvasCssHeight
  };
}

function getSourcePlotBounds() {
  return {
    left: parameterScaleWidth,
    width: Math.max(1, sourceCanvasCssWidth - parameterScaleWidth - plotRightPadding),
    height: sourceCanvasCssHeight
  };
}

function getParameterTicks() {
  if (activeCurve === "size") {
    return [1000, 200, 50, 10, 5].map((value) => ({
      y: normFromGrainMs(value),
      label: `${value} ms`
    }));
  }
  if (activeCurve === "density") {
    return [80, 30, 10, 3, 1].map((value) => ({
      y: normFromDensity(value),
      label: `${value}/s`
    }));
  }
  if (activeCurve === "pitchLow" || activeCurve === "pitchHigh") {
    return [
      { y: 1, label: "+24 st" },
      { y: 0.75, label: "+12 st" },
      { y: 0.5, label: "0 st", emphasis: true },
      { y: 0.25, label: "-12 st" },
      { y: 0, label: "-24 st" }
    ];
  }
  return [
    { y: 1, label: "100%" },
    { y: 0.75, label: "75%" },
    { y: 0.5, label: "50%" },
    { y: 0.25, label: "25%" },
    { y: 0, label: "0%" }
  ];
}

function drawParameterScale() {
  const { left, width, height } = getPlotBounds();
  ctx.save();
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
  for (const tick of getParameterTicks()) {
    const y = (1 - tick.y) * height;
    const textY = Math.max(11, Math.min(height - 5, y + 4));
    ctx.font = tick.emphasis
      ? "500 11px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
      : "400 11px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.fillStyle = tick.emphasis ? "rgba(232, 240, 246, 0.96)" : "rgba(170, 188, 204, 0.82)";
    ctx.strokeStyle = tick.emphasis ? "rgba(95, 141, 177, 0.6)" : "rgba(72, 111, 143, 0.28)";
    ctx.lineWidth = tick.emphasis ? 1.6 : 1;
    ctx.fillText(tick.label, left - 9, textY);
    ctx.beginPath();
    ctx.moveTo(left - 5, y);
    ctx.lineTo(tick.emphasis ? left + width : left, y);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(104, 145, 178, 0.62)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(left, 0);
  ctx.lineTo(left, height);
  ctx.stroke();
  ctx.restore();
}

function drawCurve(curve, color, width, fillPoints, alpha = 1) {
  const { left, width: w, height: h } = getPlotBounds();
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  for (let i = 0; i <= w; i += 3) {
    const x = i / w;
    const y = valueAt(curve, x);
    const px = left + (x * w);
    const py = (1 - y) * h;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  if (fillPoints) {
    const groupPoints = new Set(getVerticalPoints());
    for (const point of curve) {
      ctx.beginPath();
      ctx.arc(left + (point.x * w), (1 - point.y) * h, 6, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = "#06111c";
      ctx.lineWidth = 2;
      ctx.stroke();
      if (groupPoints.has(point)) drawVerticalGroupRing(ctx, left + point.x * w, (1 - point.y) * h, color, canvasCssWidth - (left + point.x * w));
    }
  }
  ctx.restore();
}

function drawPitchRangeFill() {
  const { left, width: w, height: h } = getPlotBounds();
  const isPitchActive = activeCurve === "pitchLow" || activeCurve === "pitchHigh";
  ctx.save();
  ctx.fillStyle = isPitchActive ? "rgba(199, 105, 174, 0.22)" : "rgba(199, 105, 174, 0.12)";
  ctx.beginPath();
  for (let i = 0; i <= w; i += 4) {
    const x = i / w;
    const lowY = valueAt(curves.pitchLow, x);
    const highY = valueAt(curves.pitchHigh, x);
    const topY = (1 - Math.max(lowY, highY)) * h;
    const px = left + (x * w);
    if (i === 0) ctx.moveTo(px, topY);
    else ctx.lineTo(px, topY);
  }
  for (let i = w; i >= 0; i -= 4) {
    const x = i / w;
    const lowY = valueAt(curves.pitchLow, x);
    const highY = valueAt(curves.pitchHigh, x);
    const bottomY = (1 - Math.min(lowY, highY)) * h;
    ctx.lineTo(left + (x * w), bottomY);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawCanvasGrid(context, left, w, h) {
  // Quiet background grid; retain scales, points and curve contrast.
  context.save();
  context.globalAlpha *= 0.65;
  drawEditorGrid(context, left, 0, w, h);
  context.restore();
}

function draw() {
  const scale = window.devicePixelRatio || 1;
  const w = canvasCssWidth;
  const h = canvasCssHeight;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#191c20";
  ctx.fillRect(0, 0, w, h);
  const plot = getPlotBounds();
  drawCanvasGrid(ctx, plot.left, plot.width, h);
  drawPitchRangeFill();
  drawParameterScale();
  drawCurveAxisHints(w);
  for (const name of Object.keys(curves)) {
    if (name !== activeCurve && editedCurves[name]) drawCurve(curves[name], curveColors[name], 2.1, false, 1);
  }
  drawCurve(curves[activeCurve], curveColors[activeCurve], 4.8, true, 1);
  if (buffer) {
    const x = plot.left + ((playheadSeconds / Math.max(1, settings().durationSeconds)) * plot.width);
    ctx.strokeStyle = "rgba(226, 236, 244, 0.86)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  if (hoverPoint) drawTooltip(hoverPoint);
  drawSourceWindow();
  updateReadouts();
}

function drawSourceWindow() {
  const scale = window.devicePixelRatio || 1;
  const w = sourceCanvasCssWidth;
  const h = sourceCanvasCssHeight;
  const plot = getSourcePlotBounds();
  const key=`${w}:${h}:${scale}:${plot.left}:${plot.width}`;
  if(!sourceRaster||sourceRaster.key!==key||sourceRaster.waveform!==waveform||sourceRaster.colors!==sourceColors){
    const image=document.createElement('canvas');image.width=Math.ceil(w*scale);image.height=Math.ceil(h*scale);const c=image.getContext('2d');c.setTransform(scale,0,0,scale,0,0);c.fillStyle='#191c20';c.fillRect(0,0,w,h);drawCanvasGrid(c,plot.left,plot.width,h);
    paintEnvelope(c,waveform,sourceColors?.[0],plot.left,plot.width,h*.52,h*.34,scale,peakOf([waveform]));
    sourceRaster={key,waveform,colors:sourceColors,image};
  }
  sourceCtx.setTransform(1,0,0,1,0,0);sourceCtx.clearRect(0,0,sourceCtx.canvas.width,sourceCtx.canvas.height);sourceCtx.drawImage(sourceRaster.image,0,0);sourceCtx.setTransform(scale,0,0,scale,0,0);
  const { startX, endX } = sourceWindowDisplayBounds(plot.left, plot.width);
  sourceCtx.fillStyle = "rgba(10, 13, 17, 0.42)";
  sourceCtx.fillRect(plot.left,0,Math.max(0,startX-plot.left),h);
  sourceCtx.fillRect(endX,0,Math.max(0,plot.left+plot.width-endX),h);
  sourceCtx.strokeStyle="#101419";sourceCtx.lineWidth=4;sourceCtx.strokeRect(startX,1,Math.max(1,endX-startX),h-2);
  sourceCtx.strokeStyle = "#6de0c0";
  sourceCtx.lineWidth = 2;
  sourceCtx.strokeRect(startX, 1, Math.max(1, endX - startX), h - 2);
  drawReadPositionMarker(plot.left, plot.width, h);
  sourceCtx.fillStyle = "rgba(232, 240, 246, 0.9)";
  sourceCtx.font = "500 12px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  sourceCtx.textAlign = "left";
  sourceCtx.textBaseline = "top";
  sourceCtx.fillText("Source Window", plot.left + 24, 8);
  sourceCtx.font = "600 10px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  sourceCtx.fillStyle = "rgba(170, 188, 204, 0.82)";
  sourceCtx.textAlign = "left";
  sourceCtx.fillText("Source", 7, 10);
  paintToneLegend(sourceCtx,w,14);
}

function sourceWindowDisplayBounds(left, width) {
  const actualStartX = left + (sourceWindow.start * width);
  const actualEndX = left + (sourceWindow.end * width);
  const actualWidth = Math.max(1, actualEndX - actualStartX);
  const displayWidth = Math.max(sourceWindowMinimumPixels, actualWidth);
  let startX = actualStartX;
  let endX = startX + displayWidth;
  const plotEnd = left + width;
  if (endX > plotEnd) {
    endX = plotEnd;
    startX = Math.max(left, endX - displayWidth);
  }
  return { startX, endX };
}

function drawReadPositionMarker(left, width, h) {
  if (!buffer || !isPlaying) return;
  const duration = settings().durationSeconds;
  const t = Math.max(0, Math.min(1, playheadSeconds / Math.max(0.001, duration)));
  const readPosition = valueAt(curves.position, t);
  const readNorm = sourceWindow.start + ((sourceWindow.end - sourceWindow.start) * readPosition);
  const x = left + (readNorm * width);
  sourceCtx.save();
  sourceCtx.strokeStyle = "rgba(109, 224, 192, 0.92)";
  sourceCtx.lineWidth = 1.6;
  sourceCtx.beginPath();
  sourceCtx.moveTo(x, 0);
  sourceCtx.lineTo(x, h);
  sourceCtx.stroke();
  sourceCtx.restore();
}

function drawCurveAxisHints(w) {
  ctx.save();
  ctx.font = "400 11px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillStyle = "rgba(170, 188, 204, 0.82)";
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillText("Output Time", w - 10, 10);
  ctx.restore();
}

function drawTooltip(pointRef) {
  const point = curves[pointRef.curveName][pointRef.pointIndex];
  if (!point) return;
  const text = formatPointValue(pointRef.curveName, point) + verticalGroupSuffix(getVerticalPoints().length);
  const { left, width } = getPlotBounds();
  const px = left + (point.x * width);
  const py = (1 - point.y) * canvasCssHeight;
  ctx.save();
  ctx.font = "500 12px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  const boxWidth = Math.ceil(ctx.measureText(text).width + 18);
  const boxX = Math.max(left + 8, Math.min(left + width - boxWidth - 8, px - (boxWidth / 2)));
  const boxY = py < 40 ? py + 14 : py - 36;
  ctx.fillStyle = "rgba(7, 17, 28, 0.96)";
  ctx.fillRect(boxX, boxY, boxWidth, 26);
  ctx.strokeStyle = curveColors[pointRef.curveName];
  ctx.strokeRect(boxX, boxY, boxWidth, 26);
  ctx.fillStyle = "#edf3f2";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, boxX + (boxWidth / 2), boxY + 13);
  ctx.restore();
}

// Read-only source metadata; normalization, selection and seeking stay unchanged.
function sourceWindowRangeText() {
  if (!buffer) return "";
  const start = sourceWindow.start * buffer.duration;
  const end = sourceWindow.end * buffer.duration;
  return `Source window · ${start.toFixed(3)}–${end.toFixed(3)} s · Length ${(end - start).toFixed(3)} s`;
}

function updateReadouts() {
  const s = settings();
  const engineLimit = s.maxPreviewGrains;
  readouts.mode.textContent = curveLabels[activeCurve];
  readouts.points.textContent = String(curves[activeCurve].length);
  readouts.engine.textContent = engineLimit === 32 ? "Preview 32 / Render 64" : "Preview 64 / Render 64";
  readouts.position.textContent = `${Math.round(current.position * 100)}% in window`;
  readouts.spread.textContent = `${Math.round(current.spread * 100)}%`;
  readouts.size.textContent = `${Math.round(current.sizeMs)} ms`;
  readouts.density.textContent = `${current.density.toFixed(1)} grains/s`;
  readouts.pitch.textContent = `${current.pitchLow.toFixed(1)}–${current.pitchHigh.toFixed(1)} st`;
  sourceCanvas.title = `Source Window ${formatSourcePercent(sourceWindow.start)}% – ${formatSourcePercent(sourceWindow.end)}%`;
  sourceWindowReadout.hidden = !buffer;
  sourceWindowReadout.textContent = sourceWindowRangeText();
  timeStatus.textContent = `${formatClock(playheadSeconds)} / ${formatClock(s.durationSeconds)}`;
  if (!isScrubbing) playbackScrubber.value = String(Math.max(0, Math.min(1, playheadSeconds / Math.max(1, s.durationSeconds))));
}

function pointerToPoint(event) {
  const rect = canvas.getBoundingClientRect();
  const { left, width } = getPlotBounds();
  const canvasX = event.clientX - rect.left;
  const x = Math.max(0, Math.min(1, (canvasX - left) / width));
  const y = Math.max(0, Math.min(1, 1 - ((event.clientY - rect.top) / rect.height)));
  return { x, y };
}

function findPointNearPointer(point) {
  const curve = curves[activeCurve];
  const xRadius = 10 / getPlotBounds().width;
  const yRadius = 10 / canvasCssHeight;
  let bestIndex = -1;
  let bestDistance = Infinity;
  for (let i = 0; i < curve.length; i += 1) {
    const dx = (curve[i].x - point.x) / xRadius;
    const dy = (curve[i].y - point.y) / yRadius;
    const distance = Math.sqrt((dx * dx) + (dy * dy));
    if (distance <= 1 && distance < bestDistance) {
      bestDistance = distance;
      bestIndex = i;
    }
  }
  return bestIndex;
}

function setActiveCurve(name) {
  if (verticalDrag) finishCurveDrag(true);
  activeCurve = name;
  selectedPoint = null;
  hoverPoint = null;
  for (const [curveName, button] of Object.entries(modeButtons)) {
    button.classList.toggle("active", curveName === name);
  }
  draw();
}

function resetAll() {
  if (verticalDrag) finishCurveDrag(true);
  const confirmed = window.confirm("Reset all curves and the Source Window?");
  if (!confirmed) return;
  stopAudio();
  for (const [name, y] of Object.entries(curveDefaults)) {
    curves[name] = defaultCurve(y);
    editedCurves[name] = false;
  }
  sourceWindow.start = 0;
  sourceWindow.end = minimumSourceWindowWidth();
  selectedPoint = null;
  hoverPoint = null;
  sendSettings();
  sendCurves();
  draw();
}

async function getRenderer() {
  if (!renderGranular) {
    const module = await import("./render-client.js?v=20261025-fade10");
    renderGranular = module.renderGranular;
  }
  return renderGranular;
}

fileInput.addEventListener("change", async () => {
  await loadAudioFile(fileInput.files?.[0]);
  fileInput.value = "";
});

playButton.addEventListener("click", playAudio);
stopButton.addEventListener("click", pauseAudio);

function seekFromScrubber() {
  if (!buffer) return;
  const progress = Math.max(0, Math.min(1, Number(playbackScrubber.value) || 0));
  playheadSeconds = progress * settings().durationSeconds;
  node?.port.postMessage({ type: "seek", seconds: playheadSeconds, token: nextPlaybackToken() });
  draw();
}


meterClipButton.addEventListener("click", () => {
  meterClipLatched = false;
  meterClipButton.classList.remove("clipped");
  meterClipButton.setAttribute("aria-pressed", "false");
});

resetButton.addEventListener("click", resetAll);
clearCurveButton.addEventListener("click", () => {
  if (verticalDrag) finishCurveDrag(true);
  curves[activeCurve] = defaultCurve(curveDefaults[activeCurve]);
  editedCurves[activeCurve] = false;
  sendCurves();
  draw();
});

for (const [name, button] of Object.entries(modeButtons)) {
  button.addEventListener("click", () => setActiveCurve(name));
}

function isErasing(event) {
  return selectedTool === "eraser" || Boolean(event?.[eraseModifier]);
}

function updateEraseCursor(event) {
  if (event) shiftHeld = Boolean(event.shiftKey);
  const editable = Boolean(activeCurve);
  const erasing = editable && curvePointerId == null && isErasing(event);
  canvas.classList.toggle("eraseMode", erasing);
  canvas.style.cursor = !editable ? "default" : verticalDrag || (curvePointerId == null && shiftHeld && !erasing)
    ? "ns-resize" : erasing ? "" : hoverPoint != null ? "pointer" : "crosshair";
}

function getVerticalPoints() {
  if (verticalDrag) return verticalDrag.points.map(entry => entry.point);
  if (curvePointerId != null || !shiftHeld || canvas.classList.contains("eraseMode") || !(Boolean(activeCurve))) return [];
  const index = hoverPoint?.curveName === activeCurve ? hoverPoint.pointIndex : null;
  return index != null && index >= 0 ? curves[activeCurve].slice(index) : [];
}

function groupPointerY(event, anchorX) {
  return pointerToPoint(event).y;
}

function beginCurveGroup(event, index) {
  event.preventDefault();
  if (index == null || index < 0) return false;
  const anchorX = curves[activeCurve][index].x;
  const group = beginVerticalGroup(curves[activeCurve], index, groupPointerY(event, anchorX));
  group.curveName = activeCurve;
  group.anchorX = anchorX;
  group.wasEdited = editedCurves[activeCurve];
  verticalDrag = group;
  curvePointerId = event.pointerId;
  dragging = true;
  canvas.setPointerCapture(event.pointerId);
  updateEraseCursor(event);
  draw();
  return true;
}

function moveCurveGroup(event) {
  if (moveVerticalGroup(verticalDrag, groupPointerY(event, verticalDrag.anchorX))) {
    editedCurves[verticalDrag.curveName] = true;
    sendCurves();
    draw();
  }
}

function finishCurveDrag(cancel = false) {
  if (cancel && restoreVerticalGroup(verticalDrag)) {
    editedCurves[verticalDrag.curveName] = verticalDrag.wasEdited;
    sendCurves();
    draw();
  }
  verticalDrag = null;
  dragging = false;
  const pointerId = curvePointerId;
  curvePointerId = null;
  if (pointerId != null && canvas.hasPointerCapture(pointerId)) canvas.releasePointerCapture(pointerId);
}

function cancelCurvePointer(event) {
  if (curvePointerId == null || event.pointerId !== curvePointerId) return;
  finishCurveDrag(true);
  updateEraseCursor(event);
  draw();
}

function setTool(tool) {
  if (verticalDrag) finishCurveDrag(true);
  selectedTool = tool;
  penTool.classList.toggle("active", tool === "pen");
  eraserTool.classList.toggle("active", tool === "eraser");
  penTool.setAttribute("aria-pressed", String(tool === "pen"));
  eraserTool.setAttribute("aria-pressed", String(tool === "eraser"));
  selectedPoint = null;
  updateEraseCursor();
  draw();
}

penTool.addEventListener("click", () => setTool("pen"));
eraserTool.addEventListener("click", () => setTool("eraser"));

function updateDurationDisplay() {
  const seconds = settings().durationSeconds;
  const label = seconds < 60 ? `${seconds} s` : `${Math.floor(seconds / 60)} min${seconds % 60 ? ` ${seconds % 60} s` : ""}`;
  document.getElementById("durationValue").textContent = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  durationInput.setAttribute("aria-valuetext", label);

}

function applyDuration() {
  if (verticalDrag) finishCurveDrag(true);
  stopAudio();
  playheadSeconds = 0;
  updateDurationDisplay();
  setBusy(false);
  sendSettings();
}

durationInput.addEventListener("input", applyDuration);
formatSelect.addEventListener("change", () => {
  updateDurationDisplay();
  sendSettings();
});
updateDurationDisplay();

downloadButton.addEventListener("click", async () => {
  if (!buffer) return;
  if (renderAbortController) {
    renderAbortController.abort();
    return;
  }
  if (settings().durationSeconds <= 0) return;
  if (isPlaying) stopAudio();
  const renderBuffer = buffer;
  const renderCurves = structuredClone(curves);
  const renderSettings = { ...settings(), maxPreviewGrains: 64 };
  renderAbortController = new AbortController();
  clearDownload();
  setBusy(true);
  downloadButton.disabled = false;
  downloadButton.textContent = "Cancel";
  setExportStatus("creating 0%");
  try {
    const render = await getRenderer();
    const rendered = await render({
      audioBuffer: renderBuffer,
      curves: renderCurves,
      settings: renderSettings,
      signal: renderAbortController.signal,
      onProgress: (progress) => { setExportStatus(`creating ${Math.round(progress * 100)}%`); }
    });
    downloadUrl = URL.createObjectURL(rendered.blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `GranularCurveLab-${renderSettings.format}.wav`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setExportStatus(`${rendered.duration.toFixed(1)} s, ${rendered.channelCount} ch`);
  } catch (error) {
    setExportStatus(error.name === "AbortError" ? "cancelled" : "export failed");
    if (error.name !== "AbortError") console.error(error);
  } finally {
    renderAbortController = null;
    downloadButton.textContent = "Download WAV";
    setBusy(false);
  }
});

canvas.addEventListener("pointerdown", (event) => {
  if (event.button !== 0 || curvePointerId != null) return;
  const p = pointerToPoint(event);
  const curve = curves[activeCurve];
  const found = findPointNearPointer(p);
  if (isErasing(event)) {
    event.preventDefault();
    if (found > 0 && found < curve.length - 1) {
      curve.splice(found, 1);
      editedCurves[activeCurve] = true;
      sendCurves();
    }
    selectedPoint = null;
    hoverPoint = null;
    draw();
    return;
  }
  selectedPoint = found;
  if (event.shiftKey) {
    hoverPoint = selectedPoint >= 0 ? { curveName: activeCurve, pointIndex: selectedPoint } : null;
    beginCurveGroup(event, selectedPoint);
    if (selectedPoint < 0) selectedPoint = null;
    updateEraseCursor(event);
    draw();
    return;
  }
  if (selectedPoint < 0) {
    curve.push(p);
    sortCurve(curve);
    selectedPoint = curve.indexOf(p);
  }
  hoverPoint = { curveName: activeCurve, pointIndex: selectedPoint };
  editedCurves[activeCurve] = true;
  dragging = true;
  curvePointerId = event.pointerId;
  canvas.setPointerCapture(event.pointerId);
  sendCurves();
  draw();
});

canvas.addEventListener("pointermove", (event) => {
  if (curvePointerId != null && event.pointerId !== curvePointerId) return;
  if (verticalDrag) { moveCurveGroup(event); return; }
  updateEraseCursor(event);
  const p = pointerToPoint(event);
  if (!dragging || selectedPoint == null) {
    const pointIndex = findPointNearPointer(p);
    hoverPoint = pointIndex >= 0 ? { curveName: activeCurve, pointIndex } : null;
    draw();
    return;
  }
  const curve = curves[activeCurve];
  const point = curve[selectedPoint];
  point.x = p.x;
  point.y = p.y;
  sortCurve(curve);
  selectedPoint = curve.indexOf(point);
  hoverPoint = { curveName: activeCurve, pointIndex: selectedPoint };
  editedCurves[activeCurve] = true;
  sendCurves();
  draw();
});

canvas.addEventListener("pointerup", (event) => {
  if (curvePointerId == null || event.pointerId !== curvePointerId) return;
  finishCurveDrag();

  updateEraseCursor(event);
  draw();
});

canvas.addEventListener("pointerleave", () => {
  if (dragging) return;
  hoverPoint = null;
  draw();
});

canvas.addEventListener("pointerenter", updateEraseCursor);
canvas.addEventListener("pointercancel", cancelCurvePointer);
canvas.addEventListener("lostpointercapture", cancelCurvePointer);
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && verticalDrag) {
    event.preventDefault();
    event.stopImmediatePropagation();
    finishCurveDrag(true);
    updateEraseCursor(event);
    draw();
    return;
  }
  const previousShift = shiftHeld;
  const previousErase = canvas.classList.contains("eraseMode");
  updateEraseCursor(event);
  if (previousShift !== shiftHeld || previousErase !== canvas.classList.contains("eraseMode")) draw();
});
window.addEventListener("keyup", (event) => {
  const previousShift = shiftHeld;
  const previousErase = canvas.classList.contains("eraseMode");
  updateEraseCursor(event);
  if (previousShift !== shiftHeld || previousErase !== canvas.classList.contains("eraseMode")) draw();
});
window.addEventListener("blur", () => {
  finishCurveDrag(true);
  shiftHeld = false;
  hoverPoint = null;
  updateEraseCursor();
  draw();
});






canvas.addEventListener("dblclick", (event) => {
  const p = pointerToPoint(event);
  playheadSeconds = p.x * settings().durationSeconds;
  node?.port.postMessage({ type: "seek", seconds: playheadSeconds, token: nextPlaybackToken() });
  draw();
});

function pointerToSourceNorm(event) {
  const rect = sourceCanvas.getBoundingClientRect();
  const { left, width } = getSourcePlotBounds();
  const canvasX = event.clientX - rect.left;
  return Math.max(0, Math.min(1, (canvasX - left) / width));
}

function setSourceWindow(start, end) {
  const width = Math.max(minimumSourceWindowWidth(), Math.abs(end - start));
  let nextStart = Math.min(start, end);
  let nextEnd = nextStart + width;
  if (nextEnd > 1) {
    nextEnd = 1;
    nextStart = Math.max(0, nextEnd - width);
  }
  sourceWindow.start = nextStart;
  sourceWindow.end = nextEnd;
  sendSettings();
}

function setSourceWindowFromDrag(a, b) {
  const start = Math.min(a, b);
  const end = Math.max(a, b);
  setSourceWindow(start, end);
}

sourceCanvas.addEventListener("pointerdown", (event) => {
  sourceDragging = true;
  sourceDragMoved = false;
  sourceDragAnchor = pointerToSourceNorm(event);
  setSourceWindow(sourceDragAnchor, sourceDragAnchor + minimumSourceWindowWidth());
  sourceCanvas.setPointerCapture(event.pointerId);
});

sourceCanvas.addEventListener("pointermove", (event) => {
  if (!sourceDragging) return;
  const pointer = pointerToSourceNorm(event);
  if (Math.abs(pointer - sourceDragAnchor) < 0.008 && !sourceDragMoved) return;
  sourceDragMoved = true;
  setSourceWindowFromDrag(sourceDragAnchor, pointer);
});

sourceCanvas.addEventListener("pointerup", (event) => {
  sourceDragging = false;
  sourceCanvas.releasePointerCapture(event.pointerId);
});

sourceCanvas.addEventListener("pointerleave", () => {
  if (!sourceDragging) sourceCanvas.style.cursor = "text";
});

window.addEventListener("resize", resizeCanvas);
function fitEditorControls() {
  const editor = document.querySelector(".editor");
  const toolbarGrowth = Math.max(0, document.querySelector(".legend").getBoundingClientRect().height - 54);
  const panelHeight = durationPanel.getBoundingClientRect().height + 8;
  editor.style.setProperty("--editor-extra-height", `${Math.ceil(toolbarGrowth + panelHeight)}px`);
}
window.addEventListener("resize", fitEditorControls);
if ("ResizeObserver" in window) {
  const canvasResizeObserver = new ResizeObserver(resizeCanvas);
  canvasResizeObserver.observe(sourceCanvas);
  canvasResizeObserver.observe(canvas);
  const controlsResizeObserver = new ResizeObserver(fitEditorControls);
  controlsResizeObserver.observe(document.querySelector(".legend"));
  controlsResizeObserver.observe(durationPanel);
}
fitEditorControls();
window.addEventListener("keydown", (event) => {
  const target = event.target;
  const isTyping = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target?.isContentEditable;
  if (event.code !== "Space" || isTyping) return;
  event.preventDefault();
  event.stopPropagation();
  if (event.repeat || !buffer || playButton.disabled) return;
  if (document.activeElement instanceof HTMLButtonElement) {
    document.activeElement.blur();
  }
  if (isPlaying) pauseAudio();
  else playAudio();
});

window.addEventListener("keyup", (event) => {
  const target = event.target;
  const isTyping = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target?.isContentEditable;
  if (event.code !== "Space" || isTyping) return;
  event.preventDefault();
  event.stopPropagation();
});

resizeCanvas();

function pauseAudio() {
  if (!buffer) return;
  node?.port.postMessage({type:"stop",reset:false,token:nextPlaybackToken()});
  if (!node) nextPlaybackToken();
  isPlaying=false;playButton.textContent="Play";draw();
}

mountTransport({onScrub:value=>{isScrubbing=value;},state:()=>({duration:settings().durationSeconds,seconds:playheadSeconds,playing:isPlaying,disabled:playButton.disabled}),seek:p=>{playbackScrubber.value=String(p);seekFromScrubber();}});

// Idle readiness is conveyed by the Download control; retain actionable feedback.
function setExportStatus(message) {
  const output = document.getElementById("downloadReadout");
  output.textContent = message;
  output.parentElement.hidden = ["", "ready", "not ready", "needs export"].includes(message);
}

async function loadDefaultSource() {
  const request = sourceLoadGate.begin();
  fileStatus.textContent = "Loading default sample…";
  setBusy(false);
  try {
    const file = await fetchDefaultSource(request.signal);
    if (request.current()) await loadAudioFile(file, { request });
  } catch (error) {
    if (!request.current()) return;
    fileStatus.textContent = "Default sample unavailable. Open an audio file to begin.";
    setExportStatus("not ready");
    setBusy(false);
  }
}

loadDefaultSource();
