import {
  curveDefaults,
  densityFromNorm,
  grainMsFromNorm,
  semitoneFromNorm,
  valueAt
} from "./granular-core.js";

const fileInput = document.getElementById("fileInput");
const fileStatus = document.getElementById("fileStatus");
const timeStatus = document.getElementById("timeStatus");
const playButton = document.getElementById("playButton");
const stopButton = document.getElementById("stopButton");
const downloadButton = document.getElementById("downloadButton");
const clearCurveButton = document.getElementById("clearCurveButton");
const resetButton = document.getElementById("resetButton");
const durationInput = document.getElementById("durationInput");
const formatSelect = document.getElementById("formatSelect");
const sourceWindowReadout = document.getElementById("sourceWindowReadout");
const sourceCanvas = document.getElementById("sourceCanvas");
const sourceCtx = sourceCanvas.getContext("2d");
const canvas = document.getElementById("curveCanvas");
const ctx = canvas.getContext("2d");

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
  playhead: document.getElementById("playheadReadout"),
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
let workletBufferLoaded = false;
let buffer;
let waveform = [];
let activeCurve = "position";
let selectedPoint = null;
let hoverPoint = null;
let dragging = false;
let sourceDragging = false;
let sourceDragAnchor = 0;
let sourceDragMoved = false;
let playheadSeconds = 0;
let isPlaying = false;
let playbackToken = 0;
let downloadUrl = null;
let renderAbortController = null;
let renderGranular = null;
let canvasCssWidth = 1;
let canvasCssHeight = 1;
let sourceCanvasCssWidth = 1;
let sourceCanvasCssHeight = 1;
let canvasBaseWidth = 0;
const canvasMinimumWidth = 1800;
const canvasBaseHeight = 560;
const sourceCanvasBaseHeight = 150;
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
  const durationSeconds = Math.max(1, Math.min(180, Number(durationInput.value) || 20));
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
  const frameRect = canvas.parentElement.getBoundingClientRect();
  const targetWidth = Math.max(frameRect.width, canvasBaseWidth, canvasMinimumWidth);
  canvasBaseWidth = targetWidth;
  sourceCanvas.style.width = `${Math.round(canvasBaseWidth)}px`;
  sourceCanvas.style.height = `${sourceCanvasBaseHeight}px`;
  canvas.style.width = `${Math.round(canvasBaseWidth)}px`;
  canvas.style.height = `${canvasBaseHeight}px`;
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
  await audioContext.audioWorklet.addModule("src/granular-worklet.js?v=20260908-02");
  node = new AudioWorkletNode(audioContext, "granular-curve-processor", {
    numberOfInputs: 0,
    numberOfOutputs: 1,
    outputChannelCount: [2]
  });
  node.connect(audioContext.destination);
  node.port.onmessage = (event) => {
    if (event.data.token != null && event.data.token !== playbackToken) return;
    if (event.data.type === "position") {
      playheadSeconds = event.data.seconds;
      current = { ...current, ...event.data };
      draw();
    } else if (event.data.type === "ended" || event.data.type === "stopped") {
      isPlaying = false;
      if (event.data.type === "ended") playheadSeconds = settings().durationSeconds;
      playButton.textContent = "Play";
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

function drawCurve(curve, color, width, fillPoints, alpha = 1) {
  const w = canvasCssWidth;
  const h = canvasCssHeight;
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
    const px = x * w;
    const py = (1 - y) * h;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  if (fillPoints) {
    for (const point of curve) {
      ctx.beginPath();
      ctx.arc(point.x * w, (1 - point.y) * h, 6, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = "#111316";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawPitchRangeFill(w, h) {
  const isPitchActive = activeCurve === "pitchLow" || activeCurve === "pitchHigh";
  ctx.save();
  ctx.fillStyle = isPitchActive ? "rgba(199, 105, 174, 0.22)" : "rgba(199, 105, 174, 0.12)";
  ctx.beginPath();
  for (let i = 0; i <= w; i += 4) {
    const x = i / w;
    const lowY = valueAt(curves.pitchLow, x);
    const highY = valueAt(curves.pitchHigh, x);
    const topY = (1 - Math.max(lowY, highY)) * h;
    const px = x * w;
    if (i === 0) ctx.moveTo(px, topY);
    else ctx.lineTo(px, topY);
  }
  for (let i = w; i >= 0; i -= 4) {
    const x = i / w;
    const lowY = valueAt(curves.pitchLow, x);
    const highY = valueAt(curves.pitchHigh, x);
    const bottomY = (1 - Math.min(lowY, highY)) * h;
    ctx.lineTo(x * w, bottomY);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function draw() {
  const scale = window.devicePixelRatio || 1;
  const w = canvasCssWidth;
  const h = canvasCssHeight;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#bdc8aa";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(55, 65, 55, 0.36)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 10; i += 1) {
    const x = (i / 10) * w;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let i = 1; i < 4; i += 1) {
    const y = (i / 4) * h;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  drawCurveAxisHints(w, h);
  drawPitchRangeFill(w, h);
  for (const name of Object.keys(curves)) {
    if (name !== activeCurve && editedCurves[name]) drawCurve(curves[name], curveColors[name], 2.1, false, 1);
  }
  drawCurve(curves[activeCurve], curveColors[activeCurve], 4.8, true, 1);
  if (buffer) {
    const x = (playheadSeconds / settings().durationSeconds) * w;
    ctx.strokeStyle = "#1f2426";
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
  sourceCtx.setTransform(scale, 0, 0, scale, 0, 0);
  sourceCtx.clearRect(0, 0, w, h);
  sourceCtx.fillStyle = "#b7c2b6";
  sourceCtx.fillRect(0, 0, w, h);
  sourceCtx.strokeStyle = "rgba(55, 65, 55, 0.36)";
  sourceCtx.lineWidth = 1;
  for (let i = 0; i <= 10; i += 1) {
    const x = (i / 10) * w;
    sourceCtx.beginPath();
    sourceCtx.moveTo(x, 0);
    sourceCtx.lineTo(x, h);
    sourceCtx.stroke();
  }
  sourceCtx.fillStyle = "rgba(108, 101, 72, 0.52)";
  const mid = h * 0.52;
  const amp = h * 0.34;
  const step = Math.max(1, Math.floor(waveform.length / w));
  for (let x = 0; x < w; x += 1) {
    const sample = waveform[Math.min(waveform.length - 1, x * step)] || 0;
    sourceCtx.fillRect(x, mid - (sample * amp), 1, Math.max(1, sample * amp * 2));
  }
  const { startX, endX } = sourceWindowDisplayBounds(w);
  sourceCtx.fillStyle = "rgba(16, 21, 25, 0.42)";
  sourceCtx.fillRect(0, 0, startX, h);
  sourceCtx.fillRect(endX, 0, Math.max(0, w - endX), h);
  sourceCtx.fillStyle = "rgba(109, 224, 192, 0.16)";
  sourceCtx.fillRect(startX, 0, Math.max(1, endX - startX), h);
  sourceCtx.strokeStyle = "#6de0c0";
  sourceCtx.lineWidth = 2;
  sourceCtx.strokeRect(startX, 1, Math.max(1, endX - startX), h - 2);
  drawReadPositionMarker(w, h);
  sourceCtx.fillStyle = "#101519";
  sourceCtx.font = "650 12px Inter, ui-sans-serif, system-ui, sans-serif";
  sourceCtx.textBaseline = "top";
  sourceCtx.fillText("Source Window", Math.min(w - 118, startX + 8), 8);
}

function sourceWindowDisplayBounds(w) {
  const actualStartX = sourceWindow.start * w;
  const actualEndX = sourceWindow.end * w;
  const actualWidth = Math.max(1, actualEndX - actualStartX);
  const displayWidth = Math.max(sourceWindowMinimumPixels, actualWidth);
  let startX = actualStartX;
  let endX = startX + displayWidth;
  if (endX > w) {
    endX = w;
    startX = Math.max(0, endX - displayWidth);
  }
  return { startX, endX };
}

function drawReadPositionMarker(w, h) {
  if (!buffer) return;
  const duration = settings().durationSeconds;
  const t = Math.max(0, Math.min(1, playheadSeconds / Math.max(0.001, duration)));
  const readPosition = valueAt(curves.position, t);
  const readNorm = sourceWindow.start + ((sourceWindow.end - sourceWindow.start) * readPosition);
  const x = readNorm * w;
  sourceCtx.save();
  sourceCtx.strokeStyle = "rgba(215, 111, 100, 0.9)";
  sourceCtx.lineWidth = 1.6;
  sourceCtx.beginPath();
  sourceCtx.moveTo(x, 0);
  sourceCtx.lineTo(x, h);
  sourceCtx.stroke();
  sourceCtx.restore();
}

function drawCurveAxisHints(w, h) {
  if (activeCurve !== "position") return;
  ctx.save();
  ctx.font = "650 12px Inter, ui-sans-serif, system-ui, sans-serif";
  ctx.fillStyle = "rgba(16, 21, 25, 0.72)";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("Window End", 10, 10);
  ctx.textBaseline = "bottom";
  ctx.fillText("Window Start", 10, h - 10);
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillText("Output Time", w - 10, 10);
  ctx.restore();
}

function drawTooltip(pointRef) {
  const point = curves[pointRef.curveName][pointRef.pointIndex];
  if (!point) return;
  const text = formatPointValue(pointRef.curveName, point);
  const px = point.x * canvasCssWidth;
  const py = (1 - point.y) * canvasCssHeight;
  ctx.save();
  ctx.font = "650 13px Inter, ui-sans-serif, system-ui, sans-serif";
  const boxWidth = Math.ceil(ctx.measureText(text).width + 18);
  const boxX = Math.max(8, Math.min(canvasCssWidth - boxWidth - 8, px - (boxWidth / 2)));
  const boxY = py < 40 ? py + 14 : py - 36;
  ctx.fillStyle = "rgba(31, 36, 38, 0.93)";
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
  readouts.playhead.textContent = `${playheadSeconds.toFixed(2)} s`;
  readouts.position.textContent = `${Math.round(current.position * 100)}% in window`;
  readouts.spread.textContent = `${Math.round(current.spread * 100)}%`;
  readouts.size.textContent = `${Math.round(current.sizeMs)} ms`;
  readouts.density.textContent = `${current.density.toFixed(1)}/s`;
  readouts.pitch.textContent = `${current.pitchLow.toFixed(1)}..${current.pitchHigh.toFixed(1)} st`;
  sourceWindowReadout.textContent = `${formatSourcePercent(sourceWindow.start)}% - ${formatSourcePercent(sourceWindow.end)}%`;
  timeStatus.textContent = `${formatClock(playheadSeconds)} / ${formatClock(s.durationSeconds)}`;
}

function pointerToPoint(event) {
  const rect = canvas.getBoundingClientRect();
  const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
  const y = Math.max(0, Math.min(1, 1 - ((event.clientY - rect.top) / rect.height)));
  return { x, y };
}

function findPointNearPointer(point) {
  const curve = curves[activeCurve];
  const xRadius = 10 / canvasCssWidth;
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
    const module = await import("./offline-render.js?v=20260908-02");
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

for (const control of [durationInput, formatSelect]) {
  control.addEventListener("input", sendSettings);
  control.addEventListener("change", sendSettings);
}

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
  const p = pointerToPoint(event);
  const curve = curves[activeCurve];
  selectedPoint = findPointNearPointer(p);
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
  const p = pointerToPoint(event);
  if (!dragging || selectedPoint == null) {
    const pointIndex = findPointNearPointer(p);
    hoverPoint = pointIndex >= 0 ? { curveName: activeCurve, pointIndex } : null;
    canvas.style.cursor = hoverPoint ? "pointer" : "crosshair";
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
  canvas.style.cursor = "crosshair";
  draw();
});

canvas.addEventListener("dblclick", (event) => {
  const p = pointerToPoint(event);
  playheadSeconds = p.x * settings().durationSeconds;
  node?.port.postMessage({ type: "seek", seconds: playheadSeconds, token: playbackToken });
  draw();
});

function pointerToSourceNorm(event) {
  const rect = sourceCanvas.getBoundingClientRect();
  return Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
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
