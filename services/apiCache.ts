interface CacheItem<T> {
  data: T;
  timestamp: number;
}

interface CacheConfig {
  globalMarketData: number; // 5 minutes
  topCryptos: number;      // 5 minutes
  historicalData: number;   // 30 minutes
}

class APICache {
  private cache: Map<string, CacheItem<any>>;
  private config: CacheConfig;

  constructor() {
    this.cache = new Map();
    this.config = {
      globalMarketData: 5 * 60 * 1000, // 5 minutes
      topCryptos: 5 * 60 * 1000,       // 5 minutes
      historicalData: 30 * 60 * 1000    // 30 minutes
    };
  }

  get<T>(key: string, category: keyof CacheConfig): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const ttl = this.config[category];
    if (Date.now() - item.timestamp > ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}

export const apiCache = new APICache();