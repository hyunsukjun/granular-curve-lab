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
const durationRange = document.getElementById("durationRange");
const formatSelect = document.getElementById("formatSelect");
const sourceWindowReadout = document.getElementById("sourceWindowReadout");
const sourceCanvas = document.getElementById("sourceCanvas");
const sourceCtx = sourceCanvas.getContext("2d");
const canvas = document.getElementById("curveCanvas");
const ctx = canvas.getContext("2d");
const penTool = document.getElementById("penTool");
const eraserTool = document.getElementById("eraserTool");
const meterRows = Array.from(document.querySelectorAll("[data-meter-channel]"));
const meterClipButton = document.getElementById("meterClipButton");
const eraseModifier = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgentData?.platform || "")
  ? "metaKey"
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
  density: "#4fb06f",
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
let waveform = [];
let activeCurve = "position";
let selectedTool = "pen";
let selectedPoint = null;
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
const parameterScaleWidth = 54;
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
  const durationSeconds = Math.max(1, Math.min(600, Number(durationInput.value) || 20));
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
  const safeSeconds = Math.max(0, seconds || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const remaining = safeSeconds - (minutes * 60);
  return `${String(minutes).padStart(2, "0")}:${remaining.toFixed(2).padStart(5, "0")}`;
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
    row.querySelector(".meterRms").style.transform = `scaleX(${meterPosition(display.rms)})`;
    row.querySelector(".meterPeak").style.transform = `scaleX(${meterPosition(display.peak)})`;
    row.querySelector(".meterHold").style.left = `${meterPosition(display.hold) * 100}%`;
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
  if (curveName === "density") return `${densityFromNorm(point.y).toFixed(1)}/s`;
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
  readouts.download.textContent = "needs export";
}

function clearDownload() {
  if (downloadUrl) URL.revokeObjectURL(downloadUrl);
  downloadUrl = null;
}

function setBusy(isBusy) {
  playButton.disabled = isBusy || !buffer;
  stopButton.disabled = isBusy || !buffer;
  downloadButton.disabled = isBusy || !buffer;
  fileInput.disabled = isBusy;
  playbackScrubber.disabled = isBusy || !buffer;
  durationInput.disabled = isBusy;
  durationRange.disabled = isBusy;
  formatSelect.disabled = isBusy;
}

function nextPlaybackToken() {
  playbackToken += 1;
  return playbackToken;
}

async function ensureAudioContext() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) throw new Error("Web Audio is not available in this browser.");
    audioContext = new AudioContextClass();
  }
  if (audioContext.state !== "running") await audioContext.resume();
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
  await audioContext.audioWorklet.addModule("src/granular-worklet.js?v=20261006-restart-01");
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
      playheadSeconds = 0;
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
  const channel = audioBuffer.getChannelData(0);
  const buckets = 4000;
  const samplesPerBucket = Math.max(1, Math.floor(channel.length / buckets));
  waveform = [];
  for (let i = 0; i < buckets; i += 1) {
    let peak = 0;
    const start = i * samplesPerBucket;
    for (let j = 0; j < samplesPerBucket; j += 1) peak = Math.max(peak, Math.abs(channel[start + j] || 0));
    waveform.push(peak);
  }
}

async function loadAudioFile(file) {
  if (!file) return;
  setBusy(true);
  fileStatus.textContent = `Loading ${file.name}...`;
  try {
    await ensureAudioContext();
    buffer = await decodeAudioFile(await file.arrayBuffer());
    buildWaveform(buffer);
    resetSourceWindowToMinimum();
    workletBufferLoaded = false;
    playheadSeconds = 0;
    sendBufferToWorklet();
    sendSettings();
    fileStatus.textContent = `${file.name} - mono source, ${buffer.duration.toFixed(2)} s`;
    clearDownload();
    readouts.download.textContent = "ready";
    draw();
  } catch (error) {
    console.error(error);
    fileStatus.textContent = "Could not load audio. Try WAV, MP3, or M4A.";
    readouts.download.textContent = "not ready";
    buffer = null;
  } finally {
    setBusy(false);
  }
}

function playAudio() {
  if (!buffer || isPlaying) return;
  const duration = settings().durationSeconds;
  if (playheadSeconds >= duration - 0.02) {
    playheadSeconds = 0;
  }
  ensureAudio().then(() => {
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
  node?.port.postMessage({ type: "stop", reset: true, token: nextPlaybackToken() });
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
      ? "750 11px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
      : "600 11px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.fillStyle = tick.emphasis ? "rgba(232, 240, 246, 0.96)" : "rgba(170, 188, 204, 0.82)";
    ctx.strokeStyle = tick.emphasis ? "rgba(95, 141, 177, 0.6)" : "rgba(72, 111, 143, 0.28)";
    ctx.lineWidth = tick.emphasis ? 1.6 : 1;
    ctx.fillText(tick.label, left - 9, textY);
    ctx.beginPath();
    ctx.moveTo(left - 5, y);
    ctx.lineTo(left + width, y);
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
    for (const point of curve) {
      ctx.beginPath();
      ctx.arc(left + (point.x * w), (1 - point.y) * h, 6, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = "#06111c";
      ctx.lineWidth = 2;
      ctx.stroke();
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
  context.save();
  context.lineWidth = 1;
  context.strokeStyle = "rgba(63, 101, 132, 0.12)";
  for (let i = 1; i < 40; i += 1) {
    if (i % 4 === 0) continue;
    const x = left + ((i / 40) * w);
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, h);
    context.stroke();
  }
  for (let i = 1; i < 8; i += 1) {
    if (i % 2 === 0) continue;
    const y = (i / 8) * h;
    context.beginPath();
    context.moveTo(left, y);
    context.lineTo(left + w, y);
    context.stroke();
  }
  context.strokeStyle = "rgba(79, 121, 155, 0.28)";
  for (let i = 0; i <= 10; i += 1) {
    const x = left + ((i / 10) * w);
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, h);
    context.stroke();
  }
  for (let i = 1; i < 4; i += 1) {
    const y = (i / 4) * h;
    context.beginPath();
    context.moveTo(left, y);
    context.lineTo(left + w, y);
    context.stroke();
  }
  context.restore();
}

function draw() {
  const scale = window.devicePixelRatio || 1;
  const w = canvasCssWidth;
  const h = canvasCssHeight;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#0c1f31";
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
    const x = plot.left + ((playheadSeconds / settings().durationSeconds) * plot.width);
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
  sourceCtx.setTransform(scale, 0, 0, scale, 0, 0);
  sourceCtx.clearRect(0, 0, w, h);
  sourceCtx.fillStyle = "#0c1f31";
  sourceCtx.fillRect(0, 0, w, h);
  drawCanvasGrid(sourceCtx, plot.left, plot.width, h);
  sourceCtx.fillStyle = "rgba(128, 158, 186, 0.48)";
  const mid = h * 0.52;
  const amp = h * 0.34;
  const step = Math.max(1, Math.floor(waveform.length / plot.width));
  for (let x = 0; x < plot.width; x += 1) {
    const sample = waveform[Math.min(waveform.length - 1, x * step)] || 0;
    sourceCtx.fillRect(plot.left + x, mid - (sample * amp), 1, Math.max(1, sample * amp * 2));
  }
  const { startX, endX } = sourceWindowDisplayBounds(plot.left, plot.width);
  sourceCtx.fillStyle = "rgba(3, 10, 17, 0.55)";
  sourceCtx.fillRect(plot.left, 0, Math.max(0, startX - plot.left), h);
  sourceCtx.fillRect(endX, 0, Math.max(0, (plot.left + plot.width) - endX), h);
  sourceCtx.fillStyle = "rgba(109, 224, 192, 0.12)";
  sourceCtx.fillRect(startX, 0, Math.max(1, endX - startX), h);
  sourceCtx.strokeStyle = "#6de0c0";
  sourceCtx.lineWidth = 2;
  sourceCtx.strokeRect(startX, 1, Math.max(1, endX - startX), h - 2);
  drawReadPositionMarker(plot.left, plot.width, h);
  sourceCtx.fillStyle = "rgba(232, 240, 246, 0.9)";
  sourceCtx.font = "650 12px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  sourceCtx.textAlign = "left";
  sourceCtx.textBaseline = "top";
  sourceCtx.fillText("Source Window", plot.left + 8, 8);
  sourceCtx.font = "600 11px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  sourceCtx.fillStyle = "rgba(170, 188, 204, 0.82)";
  sourceCtx.textAlign = "right";
  sourceCtx.fillText("SOURCE", plot.left - 9, 10);
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
  ctx.font = "600 11px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.fillStyle = "rgba(170, 188, 204, 0.82)";
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillText("Output Time", w - 10, 10);
  ctx.restore();
}

function drawTooltip(pointRef) {
  const point = curves[pointRef.curveName][pointRef.pointIndex];
  if (!point) return;
  const text = formatPointValue(pointRef.curveName, point);
  const { left, width } = getPlotBounds();
  const px = left + (point.x * width);
  const py = (1 - point.y) * canvasCssHeight;
  ctx.save();
  ctx.font = "650 13px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
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

function updateReadouts() {
  const s = settings();
  const engineLimit = s.maxPreviewGrains;
  readouts.mode.textContent = curveLabels[activeCurve];
  readouts.points.textContent = String(curves[activeCurve].length);
  readouts.engine.textContent = engineLimit === 32 ? "Preview 32 / Render 64" : "Preview 64 / Render 64";
  readouts.position.textContent = `${Math.round(current.position * 100)}% in window`;
  readouts.spread.textContent = `${Math.round(current.spread * 100)}%`;
  readouts.size.textContent = `${Math.round(current.sizeMs)} ms`;
  readouts.density.textContent = `${current.density.toFixed(1)}/s`;
  readouts.pitch.textContent = `${current.pitchLow.toFixed(1)}..${current.pitchHigh.toFixed(1)} st`;
  sourceWindowReadout.textContent = `${formatSourcePercent(sourceWindow.start)}% - ${formatSourcePercent(sourceWindow.end)}%`;
  timeStatus.textContent = `${formatClock(playheadSeconds)} / ${formatClock(s.durationSeconds)}`;
  if (!isScrubbing) playbackScrubber.value = String(Math.max(0, Math.min(1, playheadSeconds / s.durationSeconds)));
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
  activeCurve = name;
  selectedPoint = null;
  hoverPoint = null;
  for (const [curveName, button] of Object.entries(modeButtons)) {
    button.classList.toggle("active", curveName === name);
  }
  draw();
}

function resetAll() {
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
    const module = await import("./offline-render.js?v=20261005-duration-01");
    renderGranular = module.renderGranular;
  }
  return renderGranular;
}

fileInput.addEventListener("change", async () => {
  await loadAudioFile(fileInput.files?.[0]);
  fileInput.value = "";
});

playButton.addEventListener("click", () => {
  if (isPlaying) stopAudio();
  else playAudio();
});
stopButton.addEventListener("click", stopAudio);

function seekFromScrubber() {
  if (!buffer) return;
  const progress = Math.max(0, Math.min(1, Number(playbackScrubber.value) || 0));
  playheadSeconds = progress * settings().durationSeconds;
  node?.port.postMessage({ type: "seek", seconds: playheadSeconds, token: playbackToken });
  draw();
}

playbackScrubber.addEventListener("pointerdown", () => { isScrubbing = true; });
playbackScrubber.addEventListener("input", seekFromScrubber);
playbackScrubber.addEventListener("change", () => {
  seekFromScrubber();
  isScrubbing = false;
});
playbackScrubber.addEventListener("pointerup", () => { isScrubbing = false; });
playbackScrubber.addEventListener("pointercancel", () => { isScrubbing = false; });

meterClipButton.addEventListener("click", () => {
  meterClipLatched = false;
  meterClipButton.classList.remove("clipped");
  meterClipButton.setAttribute("aria-pressed", "false");
});

resetButton.addEventListener("click", resetAll);
clearCurveButton.addEventListener("click", () => {
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
  canvas.classList.toggle("eraseMode", isErasing(event));
}

function setTool(tool) {
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
  const label = seconds < 60 ? `${seconds} sec` : `${Math.floor(seconds / 60)} min${seconds % 60 ? ` ${seconds % 60} sec` : ""}`;
  document.getElementById("durationValue").textContent = label;
  durationInput.setAttribute("aria-valuetext", label);
  const channels = { mono: 1, stereo: 2, quad: 4, octo: 8 }[formatSelect.value];
  const megabytes = (44 + seconds * 48000 * channels * 3) / 1000000;
  document.getElementById("durationEstimate").textContent = `WAV ~${megabytes.toFixed(1)} MB`;
}

function applyDuration() {
  stopAudio();
  updateDurationDisplay();
  sendSettings();
}

durationRange.addEventListener("change", () => {
  const previous = Number(durationInput.value);
  const long = durationRange.value === "long";
  durationInput.min = long ? "60" : "1";
  durationInput.max = long ? "600" : "60";
  durationInput.value = String(Math.max(long ? 60 : 1, Math.min(long ? 600 : 60, previous)));
  document.getElementById("durationMin").textContent = long ? "1 min" : "1 sec";
  document.getElementById("durationMax").textContent = long ? "10 min" : "60 sec";
  applyDuration();
});
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
  if (isPlaying) stopAudio();
  renderAbortController = new AbortController();
  setBusy(true);
  downloadButton.disabled = false;
  downloadButton.textContent = "Cancel";
  readouts.download.textContent = "creating 0%";
  try {
    const render = await getRenderer();
    const rendered = await render({
      audioBuffer: buffer,
      curves,
      settings: { ...settings(), maxPreviewGrains: 64 },
      signal: renderAbortController.signal,
      onProgress: (progress) => { readouts.download.textContent = `creating ${Math.round(progress * 100)}%`; }
    });
    downloadUrl = URL.createObjectURL(rendered.blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `GranularCurveLab-${formatSelect.value}.wav`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    readouts.download.textContent = `${rendered.duration.toFixed(1)} s, ${rendered.channelCount} ch`;
  } catch (error) {
    readouts.download.textContent = error.name === "AbortError" ? "cancelled" : "export failed";
    if (error.name !== "AbortError") console.error(error);
  } finally {
    renderAbortController = null;
    downloadButton.textContent = "Download WAV";
    setBusy(false);
  }
});

canvas.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
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
  if (selectedPoint < 0) {
    curve.push(p);
    sortCurve(curve);
    selectedPoint = curve.indexOf(p);
  }
  hoverPoint = { curveName: activeCurve, pointIndex: selectedPoint };
  editedCurves[activeCurve] = true;
  dragging = true;
  canvas.setPointerCapture(event.pointerId);
  sendCurves();
  draw();
});

canvas.addEventListener("pointermove", (event) => {
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
  dragging = false;
  canvas.releasePointerCapture(event.pointerId);
  draw();
});

canvas.addEventListener("pointerleave", () => {
  if (dragging) return;
  hoverPoint = null;
  draw();
});

canvas.addEventListener("pointerenter", updateEraseCursor);

window.addEventListener("keydown", updateEraseCursor);
window.addEventListener("keyup", updateEraseCursor);
window.addEventListener("blur", () => updateEraseCursor());

canvas.addEventListener("dblclick", (event) => {
  const p = pointerToPoint(event);
  playheadSeconds = p.x * settings().durationSeconds;
  node?.port.postMessage({ type: "seek", seconds: playheadSeconds, token: playbackToken });
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
  const isTyping = target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target?.isContentEditable;
  if (event.code !== "Space" || isTyping || event.repeat || !buffer) return;
  event.preventDefault();
  event.stopPropagation();
  if (document.activeElement instanceof HTMLButtonElement) {
    document.activeElement.blur();
  }
  if (isPlaying) stopAudio();
  else playAudio();
});

window.addEventListener("keyup", (event) => {
  const target = event.target;
  const isTyping = target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target?.isContentEditable;
  if (event.code !== "Space" || isTyping) return;
  event.preventDefault();
  event.stopPropagation();
});

resizeCanvas();
