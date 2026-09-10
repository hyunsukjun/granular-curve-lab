import {
  balancedChannelFor,
  clamp,
  densityFromNorm,
  encodeWav,
  envelopeValue,
  grainMsFromNorm,
  makeSeededRandom,
  outputChannelCount,
  pitchBounds,
  readCubic,
  valueAt
} from "./granular-core.js";

export async function renderGranular({ audioBuffer, curves, settings, signal, onProgress }) {
  const sampleRate = audioBuffer.sampleRate;
  const source = audioBuffer.getChannelData(0);
  const duration = clamp(settings.durationSeconds || 20, 1, 180);
  const frameCount = Math.ceil(duration * sampleRate);
  const channelCount = outputChannelCount(settings.format);
  const output = Array.from({ length: channelCount }, () => new Float32Array(frameCount));
  const random = makeSeededRandom(7321);
  const rangeStart = clamp(Math.min(settings.rangeStart, settings.rangeEnd));
  const rangeEnd = clamp(Math.max(settings.rangeStart, settings.rangeEnd));
  const rangeSeconds = Math.max(1 / sampleRate, (rangeEnd - rangeStart) * audioBuffer.duration);
  let nextGrain = 0;
  let grainIndex = 0;
  let lastProgress = 0;
  let lastYield = performance.now();

  for (let frame = 0; frame < frameCount; frame += 1) {
    if (signal?.aborted) throw new DOMException("Render cancelled", "AbortError");
    const t = frameCount <= 1 ? 0 : frame / (frameCount - 1);
    const density = densityFromNorm(valueAt(curves.density, t));
    const interval = Math.max(1, Math.round(sampleRate / density));
    while (nextGrain <= 0) {
      const requestedMs = grainMsFromNorm(valueAt(curves.size, t));
      const lengthSamples = Math.max(16, Math.round(Math.min(requestedMs / 1000, rangeSeconds) * sampleRate));
      const position = rangeStart + ((rangeEnd - rangeStart) * clamp(valueAt(curves.position, t)));
      const spread = clamp(valueAt(curves.spread, t)) * (rangeEnd - rangeStart);
      const sourceCenter = clamp(position + ((random() - 0.5) * spread), rangeStart, rangeEnd) * source.length;
      const [low, high] = pitchBounds(curves, t);
      const semitone = low + ((high - low) * random());
      const rate = Math.pow(2, semitone / 12);
      const readSpan = (lengthSamples - 1) * rate;
      const minRead = rangeStart * source.length;
      const maxRead = Math.max(minRead, (rangeEnd * source.length) - readSpan - 3);
      const start = clamp(sourceCenter - (readSpan * 0.5), minRead, maxRead);
      writeGrain(output, source, frame, start, lengthSamples, rate, settings.envelope, grainIndex, channelCount);
      grainIndex += 1;
      nextGrain += interval;
    }
    nextGrain -= 1;

    const progress = frame / frameCount;
    const now = performance.now();
    if (progress - lastProgress > 0.01 || now - lastYield > 60) {
      lastProgress = progress;
      lastYield = now;
      onProgress?.(progress);
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  applyPeakRiskCompensation(output, settings.outputGain ?? 0.92);
  onProgress?.(1);
  return {
    blob: encodeWav(output, sampleRate),
    duration,
    channelCount,
    grains: grainIndex
  };
}

function writeGrain(output, source, startFrame, readStart, lengthSamples, rate, envelope, grainIndex, channelCount) {
  const channel = balancedChannelFor(grainIndex, channelCount);
  const target = output[channel];
  for (let i = 0; i < lengthSamples; i += 1) {
    const frame = startFrame + i;
    if (frame >= target.length) break;
    const phase = i / Math.max(1, lengthSamples - 1);
    target[frame] += readCubic(source, readStart + (i * rate)) * envelopeValue(envelope, phase);
  }
}

function applyPeakRiskCompensation(output, outputGain) {
  let peak = 0;
  for (const channel of output) {
    for (let i = 0; i < channel.length; i += 1) peak = Math.max(peak, Math.abs(channel[i]));
  }
  const limiterCeiling = 0.89125;
  const riskScale = peak > limiterCeiling ? limiterCeiling / peak : 1;
  const scale = riskScale * outputGain;
  for (const channel of output) {
    for (let i = 0; i < channel.length; i += 1) {
      channel[i] = Math.tanh(channel[i] * scale) * limiterCeiling;
    }
  }
}
