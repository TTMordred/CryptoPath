import { toast } from "@/components/ui/use-toast";

// Type definitions
type DataSource = 'binance' | 'coingecko' | 'cache';

interface CachedData<T> {
  data: T;
  timestamp: number;
  source: DataSource;
  expiry: number;
}

interface CryptoPrice {
  price: string;
  change: string;
}

interface CryptoPrices {
  [key: string]: CryptoPrice;
}

interface FetchOptions {
  cacheTTL?: number;  // In milliseconds
  maxRetries?: number;
  forceRefresh?: boolean;
  cacheKey?: string;
}

// Default cache expiration times
const DEFAULT_CACHE_TTL = 30000; // 30 seconds
const EXTENDED_CACHE_TTL = 300000; // 5 minutes for fallback

// Configuration for the API endpoints
const API_CONFIG = {
  binance: {
    baseUrl: 'https://api.binance.com/api/v3',
    endpoints: {
      ticker: '/ticker/24hr',
    },
    rateLimit: 1200, // Requests per minute
  },
  coingecko: {
    baseUrl: 'https://api.coingecko.com/api/v3',
    endpoints: {
      price: '/simple/price',
    },
    rateLimit: 10, // Requests per minute
  }
};

// Mapping of coins between different APIs
const COIN_MAPPING: {
  [key: string]: { 
    binance: string;
    coingecko: string;
  }
} = {
  ethereum: { 
    binance: 'ETHUSDT',
    coingecko: 'ethereum'
  },
  bitcoin: {
    binance: 'BTCUSDT',
    coingecko: 'bitcoin'
  },
  bnb: {
    binance: 'BNBUSDT',
    coingecko: 'binancecoin'
  },
  // Add more mappings as needed
};

/**
 * Cache management functions
 */
function getCachedData<T>(key: string): CachedData<T> | null {
  try {
    const cachedItem = localStorage.getItem(`crypto_cache_${key}`);
    if (!cachedItem) return null;

    const cachedData = JSON.parse(cachedItem) as CachedData<T>;
    const now = Date.now();

    // Check if cache is still valid
    if (now < cachedData.expiry) {
      return cachedData;
    } else {
      // Clean up expired cache
      localStorage.removeItem(`crypto_cache_${key}`);
      return null;
    }
  } catch (error) {
    console.error("Error retrieving from cache:", error);
    return null;
  }
}

function setCachedData<T>(key: string, data: T, ttl: number, source: DataSource): void {
  try {
    const now = Date.now();
    const cacheData: CachedData<T> = {
      data,
      timestamp: now,
      source,
      expiry: now + ttl
    };
    localStorage.setItem(`crypto_cache_${key}`, JSON.stringify(cacheData));
  } catch (error) {
    console.error("Error storing in cache:", error);
  }
}

/**
 * Exponential backoff implementation
 */
async function fetchWithBackoff(url: string, options: RequestInit = {}, maxRetries = 3): Promise<Response> {
  let retries = 0;
  
  while (true) {
    try {
      const response = await fetch(url, options);
      
      // Check for rate limiting responses
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '1');
        console.warn(`Rate limited by API. Retrying after ${retryAfter} seconds`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        continue;
      }
      
      // For other errors, try backoff if we haven't exceeded retries
      if (!response.ok) {
        if (retries >= maxRetries) {
          throw new Error(`Failed after ${maxRetries} retries: ${response.status} ${response.statusText}`);
        }
        
        // Exponential backoff
        const waitTime = Math.pow(2, retries) * 1000;
        console.warn(`Request failed with ${response.status}. Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        retries++;
        continue;
      }
      
      return response;
    } catch (error) {
      if (retries >= maxRetries) {
        throw error;
      }
      
      // Exponential backoff for network errors
      const waitTime = Math.pow(2, retries) * 1000;
      console.warn(`Network error. Retrying in ${waitTime}ms...`, error);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      retries++;
    }
  }
}

/**
 * Data format normalization functions
 */
function normalizeBinanceData(data: any): CryptoPrices {
  const result: CryptoPrices = {};
  
  // Convert array to dictionary if it's an array
  if (Array.isArray(data)) {
    data.forEach(item => {
      if (item.symbol) {
        // Extract base coin name
        const coin = item.symbol.replace('USDT', '').toLowerCase();
        result[coin] = {
          price: parseFloat(item.lastPrice).toLocaleString(undefined, { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
          }),
          change: `${parseFloat(item.priceChangePercent) >= 0 ? '+' : ''}${parseFloat(item.priceChangePercent).toFixed(2)}%`
        };
      }
    });
  } 
  // Or handle single item
  else if (data.symbol) {
    const coin = data.symbol.replace('USDT', '').toLowerCase();
    result[coin] = {
      price: parseFloat(data.lastPrice).toLocaleString(undefined, { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      }),
      change: `${parseFloat(data.priceChangePercent) >= 0 ? '+' : ''}${parseFloat(data.priceChangePercent).toFixed(2)}%`
    };
  }
  
  return result;
}

function normalizeCoingeckoData(data: any): CryptoPrices {
  const result: CryptoPrices = {};
  
  Object.keys(data).forEach(coin => {
    result[coin] = {
      price: data[coin].usd.toLocaleString(undefined, { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      }),
      change: `${data[coin].usd_24h_change >= 0 ? '+' : ''}${data[coin].usd_24h_change.toFixed(2)}%`
    };
  });
  
  return result;
}

/**
 * Main function to fetch crypto prices with caching, fallbacks, and retries
 */
export async function fetchCryptoPrices(
  coins: string[] = ['ethereum', 'bnb'], 
  options: FetchOptions = {}
): Promise<CryptoPrices> {
  const { 
    cacheTTL = DEFAULT_CACHE_TTL, 
    maxRetries = 3, 
    forceRefresh = false,
    cacheKey = 'crypto_prices' 
  } = options;
  
  // Check cache first unless force refresh is enabled
  if (!forceRefresh) {
    const cachedData = getCachedData<CryptoPrices>(cacheKey);
    if (cachedData) {
      console.info(`Using cached crypto prices from ${cachedData.source}, expires in ${(cachedData.expiry - Date.now())/1000}s`);
      return cachedData.data;
    }
  }
  
  // Try Binance API first
  try {
    const binancePromises = coins.map(coin => {
      const symbol = COIN_MAPPING[coin]?.binance || `${coin.toUpperCase()}USDT`;
      return fetchWithBackoff(
        `${API_CONFIG.binance.baseUrl}${API_CONFIG.binance.endpoints.ticker}?symbol=${symbol}`,
        { method: 'GET' },
        maxRetries
      );
    });
    
    const responses = await Promise.allSettled(binancePromises);
    const validResponses = responses.filter(
      (r): r is PromiseFulfilledResult<Response> => r.status === 'fulfilled'
    );
    
    if (validResponses.length > 0) {
      const jsonResults = await Promise.all(validResponses.map(r => r.value.json()));
      const normalizedData = normalizeBinanceData(jsonResults);
      
      // Cache the successful results
      setCachedData(cacheKey, normalizedData, cacheTTL, 'binance');
      return normalizedData;
    }
  } catch (error) {
    console.warn("Binance API error, falling back to CoinGecko", error);
  }
  
  // Fallback to CoinGecko API
  try {
    const coinIds = coins.map(coin => COIN_MAPPING[coin]?.coingecko || coin).join(',');
    const response = await fetchWithBackoff(
      `${API_CONFIG.coingecko.baseUrl}${API_CONFIG.coingecko.endpoints.price}?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true`,
      { method: 'GET' },
      maxRetries
    );
    
    if (response.ok) {
      const data = await response.json();
      const normalizedData = normalizeCoingeckoData(data);
      
      // Cache with longer TTL since this is fallback data
      setCachedData(cacheKey, normalizedData, EXTENDED_CACHE_TTL, 'coingecko');
      return normalizedData;
    }
    
    throw new Error(`CoinGecko API failed with status ${response.status}`);
  } catch (error) {
    console.error("All API attempts failed", error);
    
    // Last resort - check for any cached data even if expired
    const expiredCache = localStorage.getItem(`crypto_cache_${cacheKey}`);
    if (expiredCache) {
      try {
        const cachedData = JSON.parse(expiredCache) as CachedData<CryptoPrices>;
        console.warn("Using expired cache as last resort");
        toast({
          title: "Using outdated data",
          description: "Unable to connect to price services. Showing cached data.",
          variant: "destructive",
        });
        return cachedData.data;
      } catch (e) {
        // Ignore parsing errors
      }
    }
    
    // If everything fails, return empty object with default values
    toast({
      title: "Connection Error",
      description: "Could not fetch current prices. Please try again later.",
      variant: "destructive",
    });
    
    return coins.reduce((acc, coin) => {
      acc[coin] = { price: '0.00', change: '0.00%' };
      return acc;
    }, {} as CryptoPrices);
  }
}

/**
 * Utility function to clear all cache
 */
export function clearCryptoCache(): void {
  const keysToRemove: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('crypto_cache_')) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  console.info(`Cleared ${keysToRemove.length} crypto cache items`);
}

/**
 * Get cache stats for debugging
 */
export function getCacheStats(): { count: number, keys: string[], totalSize: number } {
  const keys: string[] = [];
  let totalSize = 0;
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('crypto_cache_')) {
      keys.push(key);
      totalSize += localStorage.getItem(key)?.length || 0;
    }
  }
  
  return {
    count: keys.length,
    keys,
    totalSize: Math.round(totalSize / 1024) // Size in KB
  };
}
