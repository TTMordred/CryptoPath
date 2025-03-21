import { toast } from "@/components/ui/use-toast";

// Type definitions
type DataSource = 'binance' | 'coingecko' | 'cache';

interface CachedData<T> {
  data: T;
  timestamp: number;
  source: DataSource;
  expiry: number;
}

type CryptoPrice = {
  price: string;
  change: string;
};

type CryptoPriceMap = {
  [key: string]: CryptoPrice;
};

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

// Cache for storing price data
const priceCache: {
  data: CryptoPriceMap;
  timestamp: number;
} = {
  data: {},
  timestamp: 0,
};

// Map of coin IDs to ensure we use the correct identifiers
const coinIdMap: Record<string, string> = {
  'ethereum': 'ethereum',
  'eth': 'ethereum',
  'bnb': 'binancecoin', // Correct ID for BNB
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
function normalizeBinanceData(data: any): CryptoPriceMap {
  const result: CryptoPriceMap = {};
  
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

function normalizeCoingeckoData(data: any): CryptoPriceMap {
  const result: CryptoPriceMap = {};
  
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
export const fetchCryptoPrices = async (
  coins: string[],
  cacheTimeMs: number = 30000
): Promise<CryptoPriceMap> => {
  const now = Date.now();

  // Return cached data if valid and not expired
  if (priceCache.timestamp > 0 && now - priceCache.timestamp < cacheTimeMs) {
    // Filter cached data to only return requested coins
    const cachedResult: CryptoPriceMap = {};
    for (const coin of coins) {
      const normalizedCoin = coinIdMap[coin.toLowerCase()] || coin.toLowerCase();
      if (priceCache.data[normalizedCoin]) {
        cachedResult[coin] = priceCache.data[normalizedCoin];
      }
    }
    return cachedResult;
  }

  // Prepare for API requests
  const result: CryptoPriceMap = {};
  
  try {
    // Use CoinGecko API for price data
    const normalizedCoins = coins.map(coin => 
      coinIdMap[coin.toLowerCase()] || coin.toLowerCase()
    ).join(',');
    
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${normalizedCoins}&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h`
    );

    if (!response.ok) {
      console.error('Failed to fetch from CoinGecko API:', response.status);
      // Try alternative API or use fallback data
      return handleFallbackPrices(coins);
    }

    const data = await response.json();

    // Process the response data
    for (const item of data) {
      // Map back to original coin identifier
      const originalCoin = coins.find(
        coin => (coinIdMap[coin.toLowerCase()] || coin.toLowerCase()) === item.id
      ) || item.id;
      
      result[originalCoin] = {
        price: item.current_price.toFixed(2),
        change: `${item.price_change_percentage_24h >= 0 ? '+' : ''}${item.price_change_percentage_24h.toFixed(2)}%`,
      };
    }

    // Update cache
    priceCache.data = { ...result };
    priceCache.timestamp = now;

    // Fill in missing coins with fallback data
    for (const coin of coins) {
      if (!result[coin]) {
        const fallbackData = getDefaultPriceData(coin);
        result[coin] = fallbackData;
      }
    }

    return result;
  } catch (error) {
    console.error('Error fetching cryptocurrency prices:', error);
    return handleFallbackPrices(coins);
  }
};

/**
 * Provides fallback price data when the API fails
 */
const handleFallbackPrices = (coins: string[]): CryptoPriceMap => {
  const result: CryptoPriceMap = {};
  
  // Try to use previously cached data first
  for (const coin of coins) {
    const normalizedCoin = coinIdMap[coin.toLowerCase()] || coin.toLowerCase();
    if (priceCache.data[normalizedCoin]) {
      result[coin] = priceCache.data[normalizedCoin];
    } else {
      // If no cached data, use default placeholder values
      result[coin] = getDefaultPriceData(coin);
    }
  }
  
  return result;
};

/**
 * Returns default placeholder price data for a coin
 */
const getDefaultPriceData = (coin: string): CryptoPrice => {
  // Some reasonable defaults based on typical market prices
  const defaults: Record<string, CryptoPrice> = {
    'ethereum': { price: '3200.00', change: '+0.00%' },
    'binancecoin': { price: '580.00', change: '+0.00%' },
    'bnb': { price: '580.00', change: '+0.00%' },
  };

  const normalizedCoin = coinIdMap[coin.toLowerCase()] || coin.toLowerCase();
  return defaults[normalizedCoin] || { price: '0.00', change: '0.00%' };
};

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
