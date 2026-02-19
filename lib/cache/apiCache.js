// Server-side in-memory cache for API responses
// On-demand invalidation only — no TTL-based expiry
// LRU eviction when cache exceeds MAX_SIZE

const MAX_CACHE_SIZE = 200;

class ApiCache {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Get cached data if available (no TTL — invalidated on-demand only)
   * Moves accessed key to end of Map for LRU tracking
   * @param {string} key - Cache key
   * @returns {any|null} Cached data or null
   */
  get(key) {
    const value = this.cache.get(key);
    if (value === undefined) return null;
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  /**
   * Set cache data with LRU eviction
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   */
  set(key, data) {
    // If key already exists, delete first to refresh position
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    this.cache.set(key, data);
    // Evict oldest entries if over limit
    if (this.cache.size > MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  /**
   * Invalidate cache for a specific key
   * @param {string} key - Cache key
   */
  invalidate(key) {
    this.cache.delete(key);
  }

  /**
   * Invalidate cache by pattern (e.g., all product-related caches)
   * @param {string} pattern - Pattern to match keys
   */
  invalidateByPattern(pattern) {
    const keys = Array.from(this.cache.keys());
    keys.forEach(key => {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    });
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Create a global instance
let apiCache;

if (process.env.NODE_ENV === 'development') {
  // In development, use a global variable to preserve cache across hot reloads
  if (!global._apiCache) {
    global._apiCache = new ApiCache();
  }
  apiCache = global._apiCache;
} else {
  // In production, create a new instance
  apiCache = new ApiCache();
}

export default apiCache;

/**
 * Generate on-demand cache headers for API responses.
 * Data is served from cache and revalidated only when mutations happen.
 * @returns {object} Headers object
 */
export function getCacheHeaders() {
  return {
    'Cache-Control': 'private, no-cache, must-revalidate',
    'CDN-Cache-Control': 'private, no-cache',
    'Vercel-CDN-Cache-Control': 'private, no-cache',
  };
}
