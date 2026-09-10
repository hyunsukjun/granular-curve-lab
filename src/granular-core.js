export const curveDefaults = {
  position: 0.5,
  spread: 0.08,
  size: normFromGrainMs(80),
  density: normFromDensity(18),
  pitchLow: 0.5,
  pitchHigh: 0.5
};

export function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

export function valueAt(curve, x) {
  if (!curve || curve.length === 0) return 0;
  if (x <= curve[0].x) return curve[0].y;
  for (let i = 1; i < curve.length; i += 1) {
    const a = curve[i - 1];
    const b = curve[i];
    if (x <= b.x) {
      const t = (x - a.x) / Math.max(1e-6, b.x - a.x);
      const eased = t * t * (3 - (2 * t));
      return a.y + ((b.y - a.y) * eased);
    }
  }
  return curve[curve.length - 1].y;
}

export function grainMsFromNorm(y) {
  const minMs = 5;
  const maxMs = 1000;
  return minMs * Math.pow(maxMs / minMs, clamp(y));
}

export function normFromGrainMs(ms) {
  const minMs = 5;
  const maxMs = 1000;
  return clamp(Math.log(Math.max(minMs, ms) / minMs) / Math.log(maxMs / minMs));
}

export function densityFromNorm(y) {
  const min = 1;
  const max = 80;
  return min * Math.pow(max / min, clamp(y));
}

export function normFromDensity(value) {
  const min = 1;
  const max = 80;
  return clamp(Math.log(Math.max(min, value) / min) / Math.log(max / min));
}

export function semitoneFromNorm(y) {
  return -24 + (clamp(y) * 48);
}

export function envelopeValue(type, phase) {
  const p = clamp(phase);
  if (type === "triangle") return 1 - Math.abs((p * 2) - 1);
  if (type === "gaussian") {
    const x = (p - 0.5) / 0.18;
    return Math.exp(-0.5 * x * x);
  }
  return 0.5 - (0.5 * Math.cos(Math.PI * 2 * p));
}

export function readCubic(channel, pos) {
  if (!channel || pos < 0 || pos >= channel.length - 3) return 0;
  const i0 = Math.floor(pos);
  const frac = pos - i0;
  const xm1 = channel[Math.max(0, i0 - 1)];
  const x0 = channel[i0];
  const x1 = channel[i0 + 1];
  const x2 = channel[Math.min(channel.length - 1, i0 + 2)];
  const a = (-0.5 * xm1) + (1.5 * x0) - (1.5 * x1) + (0.5 * x2);
  const b = xm1 - (2.5 * x0) + (2 * x1) - (0.5 * x2);
  const c = (-0.5 * xm1) + (0.5 * x1);
  return (((a * frac) + b) * frac + c) * frac + x0;
}

export function makeSeededRandom(seed = 1) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function pitchBounds(curves, t) {
  const low = semitoneFromNorm(valueAt(curves.pitchLow, t));
  const high = semitoneFromNorm(valueAt(curves.pitchHigh, t));
  return low <= high ? [low, high] : [high, low];
}

export function balancedChannelFor(grainIndex, channelCount) {
  if (channelCount <= 1) return 0;
  const step = channelCount % 2 === 0 ? (channelCount / 2) - 1 : 2;
  return (grainIndex * Math.max(1, step)) % channelCount;
}

export function outputChannelCount(format) {
  if (format === "stereo") return 2;
  if (format === "quad") return 4;
  if (format === "octo") return 8;
  return 1;
}

export function encodeWav(channels, sampleRate) {
  const channelCount = channels.length;
  const frameCount = channels[0].length;
  const bytesPerSample = 2;
  const blockAlign = channelCount * bytesPerSample;
  const dataSize = frameCount * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channelCount, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);
  let offset = 44;
  for (let frame = 0; frame < frameCount; frame += 1) {
    for (let channel = 0; channel < channelCount; channel += 1) {
      const sample = clamp(channels[channel][frame], -1, 1);
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += bytesPerSample;
    }
  }
  return new Blob([buffer], { type: "audio/wav" });
}

function writeString(view, offset, value) {
  for (let i = 0; i < value.length; i += 1) {
    view.setUint8(offset + i, value.charCodeAt(i));
  }
}
