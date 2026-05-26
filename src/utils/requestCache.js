const DEFAULT_TTL_MS = 5 * 60 * 1000;
const DEFAULT_TIMEOUT_MS = 30 * 1000;

const cache = new Map();

const stableStringify = (value) => {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
};

const composeSignals = (externalSignal, timeoutMs = DEFAULT_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const abort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener('abort', abort, { once: true });
    }
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timeout);
      externalSignal?.removeEventListener?.('abort', abort);
    },
  };
};

export const createCacheKey = (...parts) => parts.map(stableStringify).join('|');

export const cachedRequest = async (
  key,
  request,
  { ttlMs = DEFAULT_TTL_MS, signal } = {}
) => {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  const now = Date.now();
  const cached = cache.get(key);
  const withAbort = (promise) => {
    if (!signal) return promise;
    return Promise.race([
      promise,
      new Promise((_, reject) => {
        signal.addEventListener(
          'abort',
          () => reject(new DOMException('Aborted', 'AbortError')),
          { once: true }
        );
      }),
    ]);
  };

  if (cached && cached.expiresAt > now) {
    return withAbort(cached.promise);
  }

  const promise = Promise.resolve()
    .then(request)
    .catch((error) => {
      cache.delete(key);
      throw error;
    });

  cache.set(key, {
    expiresAt: now + ttlMs,
    promise,
  });

  return withAbort(promise);
};

export const fetchJson = async (url, { signal, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) => {
  const { signal: composedSignal, cleanup } = composeSignals(signal, timeoutMs);
  try {
    const response = await fetch(url, { signal: composedSignal });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`HTTP ${response.status}: ${response.statusText} ${text.slice(0, 200)}`);
    }
    return response.json();
  } finally {
    cleanup();
  }
};

export const clearRequestCache = () => cache.clear();
