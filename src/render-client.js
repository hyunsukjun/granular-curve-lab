// Each render owns a worker. Termination also cancels synchronous WAV encoding.
export function renderGranular({ audioBuffer, curves, settings, signal, onProgress }) {
  return new Promise((resolve, reject) => {
    let worker;
    let settled = false;
    const finish = (error, result) => {
      if (settled) return;
      settled = true;
      signal?.removeEventListener('abort', abort);
      worker?.terminate();
      if (error) reject(error);
      else resolve(result);
    };
    const abort = () => finish(new DOMException('Render cancelled', 'AbortError'));
    if (signal?.aborted) { abort(); return; }
    try {
      worker = new Worker(new URL('./render-worker.js?v=20261006-worker-01', import.meta.url), { type: 'module' });
      signal?.addEventListener('abort', abort, { once: true });
      worker.onmessage = ({ data }) => {
        if (settled) return;
        if (data.type === 'progress') {
          try { onProgress?.(data.progress); } catch (error) { finish(error); }
        } else if (data.type === 'result') finish(null, data.result);
        else if (data.type === 'error') finish(new Error(data.message));
      };
      worker.onerror = (event) => {
        event.preventDefault();
        finish(new Error(event.message || 'Render worker failed'));
      };
      worker.onmessageerror = () => finish(new Error('Render worker response could not be read'));
      // Clone, never transfer: Preview must retain the original source samples.
      worker.postMessage({ source: audioBuffer.getChannelData(0), sampleRate: audioBuffer.sampleRate,
        duration: audioBuffer.duration, curves, settings });
    } catch (error) { finish(error); }
  });
}
