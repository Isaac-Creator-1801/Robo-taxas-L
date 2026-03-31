const CACHE_PREFIX = 'cache_';

const memoryCache = new Map();
const inFlightRequests = new Map();

const getStorageKey = (key) => `${CACHE_PREFIX}${key}`;

const readLocalStorage = (key) => {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(getStorageKey(key));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
};

const writeLocalStorage = (key, payload) => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(getStorageKey(key), JSON.stringify(payload));
  } catch (error) {
    // Ignore quota errors
  }
};

export const getCacheEntry = ({ key, ttl, allowStale = false }) => {
  const now = Date.now();
  const memoryEntry = memoryCache.get(key);
  if (memoryEntry) {
    const isStale = now - memoryEntry.timestamp > ttl;
    if (allowStale || !isStale) {
      return { value: memoryEntry.value, timestamp: memoryEntry.timestamp, isStale };
    }
  }

  const storedEntry = readLocalStorage(key);
  if (storedEntry && storedEntry.timestamp) {
    const isStale = now - storedEntry.timestamp > ttl;
    if (allowStale || !isStale) {
      memoryCache.set(key, { value: storedEntry.value, timestamp: storedEntry.timestamp });
      return { value: storedEntry.value, timestamp: storedEntry.timestamp, isStale };
    }
  }

  return null;
};

export const setCacheEntry = ({ key, value }) => {
  const payload = { value, timestamp: Date.now() };
  memoryCache.set(key, payload);
  writeLocalStorage(key, payload);
};

export const withInFlight = (key, handler) => {
  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key);
  }

  const requestPromise = (async () => {
    try {
      return await handler();
    } finally {
      inFlightRequests.delete(key);
    }
  })();

  inFlightRequests.set(key, requestPromise);
  return requestPromise;
};

export const clearCache = () => {
  memoryCache.clear();
  inFlightRequests.clear();
};
