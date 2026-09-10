function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function valueAt(curve, x) {
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

function grainMsFromNorm(y) {
  return 5 * Math.pow(200, clamp(y));
}

function densityFromNorm(y) {
  return Math.pow(80, clamp(y));
}

function semitoneFromNorm(y) {
  return -24 + (clamp(y) * 48);
}

function envelopeValue(type, phase) {
  const p = clamp(phase);
  if (type === "triangle") return 1 - Math.abs((p * 2) - 1);
  if (type === "gaussian") {
    const x = (p - 0.5) / 0.18;
    return Math.exp(-0.5 * x * x);
  }
  return 0.5 - (0.5 * Math.cos(Math.PI * 2 * p));
}

function readCubic(channel, pos) {
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

function makeSeededRandom(seed = 1) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function pitchBounds(curves, t) {
  const low = semitoneFromNorm(valueAt(curves.pitchLow, t));
  const high = semitoneFromNorm(valueAt(curves.pitchHigh, t));
  return low <= high ? [low, high] : [high, low];
}

function balancedChannelFor(grainIndex, channelCount) {
  if (channelCount <= 1) return 0;
  return grainIndex % channelCount;
}

class GranularProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.source = null;
    this.sourceRate = sampleRate;
    this.outputTime = 0;
    this.playing = false;
    this.token = 0;
    this.grains = [];
    this.nextGrain = 0;
    this.grainIndex = 0;
    this.random = makeSeededRandom(42);
    this.positionFramesUntilUpdate = 0;
    this.curves = {};
    this.settings = {
      durationSeconds: 20,
      rangeStart: 0,
      rangeEnd: 1,
      envelope: "hann",
      maxPreviewGrains: 64,
      outputGain: 0.92
    };

    this.port.onmessage = (event) => {
      const data = event.data;
      if (data.type === "buffer") {
        this.source = data.mono;
        this.sourceRate = data.sampleRate;
        this.resetPlayback(false);
      } else if (data.type === "curves") {
        this.curves = data.curves || {};
      } else if (data.type === "settings") {
        Object.assign(this.settings, data.settings);
      } else if (data.type === "play") {
        this.token = data.token ?? this.token;
        this.playing = true;
        this.grains = [];
        this.nextGrain = 0;
      } else if (data.type === "stop") {
        this.token = data.token ?? this.token;
        this.playing = false;
        this.resetPlayback(data.reset);
        this.port.postMessage({ type: "stopped", seconds: this.outputTime, token: this.token });
      } else if (data.type === "seek") {
        this.token = data.token ?? this.token;
        this.outputTime = clamp(data.seconds || 0, 0, this.settings.durationSeconds);
        this.grains = [];
        this.nextGrain = 0;
        this.positionFramesUntilUpdate = 0;
      }
    };
  }

  resetPlayback(resetTime) {
    if (resetTime) this.outputTime = 0;
    this.grains = [];
    this.nextGrain = 0;
    this.grainIndex = 0;
    this.positionFramesUntilUpdate = 0;
  }

  spawnGrain(t) {
    if (!this.source || !this.curves.position) return;
    const rangeStart = clamp(Math.min(this.settings.rangeStart, this.settings.rangeEnd));
    const rangeEnd = clamp(Math.max(this.settings.rangeStart, this.settings.rangeEnd));
    const available = Math.max(1 / this.sourceRate, (rangeEnd - rangeStart) * (this.source.length / this.sourceRate));
    const requestedMs = grainMsFromNorm(valueAt(this.curves.size, t));
    const lengthSamples = Math.max(16, Math.round((Math.min(requestedMs / 1000, available) * sampleRate)));
    const position = rangeStart + ((rangeEnd - rangeStart) * clamp(valueAt(this.curves.position, t)));
    const spread = clamp(valueAt(this.curves.spread, t)) * (rangeEnd - rangeStart);
    const jitterNorm = (this.random() - 0.5) * spread;
    const sourceCenter = clamp(position + jitterNorm, rangeStart, rangeEnd) * this.source.length;
    const [low, high] = pitchBounds(this.curves, t);
    const semitone = low + ((high - low) * this.random());
    const rate = Math.pow(2, semitone / 12) * (this.sourceRate / sampleRate);
    const readSpan = (lengthSamples - 1) * rate;
    const minRead = rangeStart * this.source.length;
    const maxRead = Math.max(minRead, (rangeEnd * this.source.length) - readSpan - 3);
    const start = clamp(sourceCenter - (readSpan * 0.5), minRead, maxRead);

    this.grains.push({
      pos: start,
      age: 0,
      length: lengthSamples,
      rate,
      channel: balancedChannelFor(this.grainIndex, 2)
    });
    this.grainIndex += 1;
    if (this.grains.length > this.settings.maxPreviewGrains) {
      this.grains.splice(0, this.grains.length - this.settings.maxPreviewGrains);
    }
  }

  process(_, outputs) {
    const out = outputs[0];
    const outL = out[0];
    const outR = out[1] || out[0];
    for (let i = 0; i < outL.length; i += 1) {
      let l = 0;
      let r = 0;
      if (this.source && this.playing) {
        const duration = Math.max(0.1, this.settings.durationSeconds);
        const t = clamp(this.outputTime / duration);
        const density = densityFromNorm(valueAt(this.curves.density, t));
        const interval = Math.max(1, Math.round(sampleRate / density));
        while (this.nextGrain <= 0) {
          this.spawnGrain(t);
          this.nextGrain += interval;
        }
        this.nextGrain -= 1;

        for (let g = this.grains.length - 1; g >= 0; g -= 1) {
          const grain = this.grains[g];
          const phase = grain.age / grain.length;
          if (phase >= 1) {
            this.grains.splice(g, 1);
            continue;
          }
          const sample = readCubic(this.source, grain.pos) * envelopeValue(this.settings.envelope, phase);
          if (grain.channel === 0) l += sample;
          else r += sample;
          grain.pos += grain.rate;
          grain.age += 1;
        }

        const active = Math.max(1, this.grains.length);
        const riskGain = 1 / Math.sqrt(Math.max(1, active * 0.55));
        l = Math.tanh(l * riskGain * this.settings.outputGain) * 0.89125;
        r = Math.tanh(r * riskGain * this.settings.outputGain) * 0.89125;
        this.outputTime += 1 / sampleRate;
        if (this.outputTime >= duration) {
          this.playing = false;
          this.outputTime = duration;
          this.port.postMessage({ type: "ended", token: this.token });
        }
        if (this.positionFramesUntilUpdate <= 0) {
          const [low, high] = pitchBounds(this.curves, t);
          this.port.postMessage({
            type: "position",
            seconds: this.outputTime,
            activeGrains: this.grains.length,
            position: valueAt(this.curves.position, t),
            spread: valueAt(this.curves.spread, t),
            sizeMs: grainMsFromNorm(valueAt(this.curves.size, t)),
            density,
            pitchLow: low,
            pitchHigh: high,
            token: this.token
          });
          this.positionFramesUntilUpdate = Math.round(sampleRate / 30);
        }
        this.positionFramesUntilUpdate -= 1;
      }
      outL[i] = l;
      outR[i] = r;
    }
    return true;
  }
}

registerProcessor("granular-curve-processor", GranularProcessor);
