import { renderGranular } from './offline-render.js?v=20261005-duration-01';

self.onmessage = async ({ data }) => {
  try {
    const { source, sampleRate, duration, curves, settings } = data;
    const audioBuffer = { sampleRate, duration, getChannelData: () => source };
    const result = await renderGranular({ audioBuffer, curves, settings,
      onProgress: progress => self.postMessage({ type: 'progress', progress }) });
    // Blob structured cloning avoids exposing or detaching the Preview buffer.
    self.postMessage({ type: 'result', result });
  } catch (error) {
    self.postMessage({ type: 'error', message: error.message || String(error) });
  }
};
