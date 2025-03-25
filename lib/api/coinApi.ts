import { toast } from "sonner";
import pLimit from "p-limit";
import { supabase } from "@/src/integrations/supabase/client";
import { Coin, CoinDetail, CoinHistory } from "@/lib/types";

// Cấu hình
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 phút
const FETCH_TIMEOUT = 15000; // 15 giây timeout
const MAX_RETRIES = 3;
const MEMORY_CACHE = new Map<string, { data: any; timestamp: number }>();
const limit = pLimit(2); // Giới hạn 2 request đồng thời

// Proxy URL
const PROXY_URL = "/api/coingecko-proxy";

// Helper functions
const getFromMemoryCache = <T>(key: string): T | null => {
  const cached = MEMORY_CACHE.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
    console.log(`Retrieved from memory cache with key: ${key}`);
    return cached.data;
  }
  MEMORY_CACHE.delete(key);
  return null;
};

const setToMemoryCache = (key: string, data: any) => {
  MEMORY_CACHE.set(key, { data, timestamp: Date.now() });
  console.log(`Saved to memory cache with key: ${key}`);
};

const getLocalFallback = <T>(key: string): T | null => {
  const item = localStorage.getItem(key);
  if (item) {
    const { data, timestamp } = JSON.parse(item);
    if (Date.now() - timestamp < CACHE_EXPIRY * 2) {
      console.log(`Retrieved from local fallback with key: ${key}`);
      return data;
    }
  }
  return null;
};

const setLocalFallback = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  console.log(`Saved to local fallback with key: ${key}`);
};

// Fetch với timeout, retry và rate limiting
const fetchWithRetry = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  const url = `${PROXY_URL}?endpoint=${encodeURIComponent(endpoint)}`;

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const response = await limit(() =>
        fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            ...options.headers,
          },
        })
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429) {
          const result = await response.json();
          const retryAfter = result.retryAfter || 60;
          console.log(`Rate limit hit. Waiting ${retryAfter}s before retry. Attempt ${i + 1}/${MAX_RETRIES}`);
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          continue;
        }
        throw new Error(`API request failed with status ${response.status}`);
      }

      const result = await response.json();
      if (result.error) throw new Error(result.error);
      console.log(`Successfully fetched data for endpoint: ${endpoint}`);
      return result.data || result;
    } catch (error: unknown) { // Xử lý error là unknown
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Request timed out");
      }
      if (i === MAX_RETRIES - 1) {
        console.error(`Max retries reached for ${endpoint}:`, error);
        throw error instanceof Error ? error : new Error("Unknown error occurred");
      }
      const delay = 1000 * Math.pow(2, i) + Math.random() * 1000;
      console.log(`Retrying after ${delay}ms due to error: ${error instanceof Error ? error.message : String(error)}`);
      await new Promise(resolve => setTimeout(resolve, delay));
    } finally {
      clearTimeout(timeoutId);
    }
  }
};

export const getCoins = async (page = 1, perPage = 20): Promise<Coin[]> => {
  const cacheKey = `coins_${page}_${perPage}`;
  
  const memoryCached = getFromMemoryCache<Coin[]>(cacheKey);
  if (memoryCached) return memoryCached;

  try {
    const { data: cachedData, error } = await supabase
      .from('cached_coins')
      .select('data, last_updated')
      .eq('id', cacheKey)
      .single();

    if (!error && cachedData?.last_updated) {
      const timeSinceUpdate = Date.now() - new Date(cachedData.last_updated).getTime();
      if (timeSinceUpdate < CACHE_EXPIRY) {
        console.log(`Returning Supabase cached coin data for key: ${cacheKey}`);
        setToMemoryCache(cacheKey, cachedData.data);
        setLocalFallback(cacheKey, cachedData.data);
        return cachedData.data as Coin[];
      }
    }

    console.log(`Fetching fresh coin data for page ${page}, perPage ${perPage}`);
    const endpoint = `coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=true&price_change_percentage=1h,24h,7d&locale=en`;
    const data = await fetchWithRetry(endpoint);

    setToMemoryCache(cacheKey, data);
    setLocalFallback(cacheKey, data);
    await supabase.from('cached_coins').upsert({
      id: cacheKey,
      data,
      last_updated: new Date().toISOString(),
    });
    console.log(`Saved to Supabase with key: ${cacheKey}`);

    return data;
  } catch (error: unknown) { // Xử lý error là unknown
    console.error("Error fetching coins:", error);
    if (error instanceof Error && error.message.includes('429')) {
      toast.error("Too many requests to CoinGecko. Please wait and try again later.");
    } else {
      toast.error("Failed to load cryptocurrency data. Using cached data if available.");
    }

    const fallback = getLocalFallback<Coin[]>(cacheKey);
    if (fallback) return fallback;
    return [];
  }
};

export const getCoinDetail = async (id: string): Promise<CoinDetail> => {
  if (!id) throw new Error("Coin ID is required");
  
  const cacheKey = `coin_detail_${id}`;
  
  const memoryCached = getFromMemoryCache<CoinDetail>(cacheKey);
  if (memoryCached) return memoryCached;

  try {
    const { data: cachedData, error } = await supabase
      .from('cached_coin_details')
      .select('data, last_updated')
      .eq('id', cacheKey)
      .single();

    if (!error && cachedData?.last_updated) {
      const timeSinceUpdate = Date.now() - new Date(cachedData.last_updated).getTime();
      if (timeSinceUpdate < CACHE_EXPIRY) {
        console.log(`Returning Supabase cached coin detail for key: ${cacheKey}`);
        setToMemoryCache(cacheKey, cachedData.data);
        setLocalFallback(cacheKey, cachedData.data);
        return cachedData.data as CoinDetail;
      }
    }

    console.log(`Fetching fresh data for coin: ${id}`);
    const endpoint = `coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=true`;
    const data = await fetchWithRetry(endpoint);

    setToMemoryCache(cacheKey, data);
    setLocalFallback(cacheKey, data);
    await supabase.from('cached_coin_details').upsert({
      id: cacheKey,
      data,
      last_updated: new Date().toISOString(),
    });
    console.log(`Saved to Supabase with key: ${cacheKey}`);

    return data;
  } catch (error: unknown) { // Xử lý error là unknown
    console.error(`Error fetching coin detail for ${id}:`, error);
    if (error instanceof Error && error.message.includes('429')) {
      toast.error("Too many requests to CoinGecko. Please wait and try again later.");
    } else {
      toast.error(`Failed to load details for ${id}. Using cached data if available.`);
    }
    
    const fallback = getLocalFallback<CoinDetail>(cacheKey);
    if (fallback) return fallback;
    throw error instanceof Error ? error : new Error("An unknown error occurred");
  }
};

export const getCoinHistory = async (id: string, days = 7): Promise<CoinHistory> => {
  const cacheKey = `coin_history_${id}_${days}`;
  
  const memoryCached = getFromMemoryCache<CoinHistory>(cacheKey);
  if (memoryCached) return memoryCached;

  try {
    const endpoint = `coins/${id}/market_chart?vs_currency=usd&days=${days}`;
    const data = await fetchWithRetry(endpoint);

    setToMemoryCache(cacheKey, data);
    setLocalFallback(cacheKey, data);

    return data;
  } catch (error: unknown) { // Xử lý error là unknown
    console.error(`Error fetching history for ${id}:`, error);
    if (error instanceof Error && error.message.includes('429')) {
      toast.error("Too many requests to CoinGecko. Please wait and try again later.");
    } else {
      toast.error("Failed to load price history");
    }

    const fallback = getLocalFallback<CoinHistory>(cacheKey);
    if (fallback) return fallback;
    return {
      prices: Array.from({ length: 168 }, (_, i) => [Date.now() - (168 - i) * 3600000, 50000 + Math.random() * 10000]),
      market_caps: Array.from({ length: 168 }, (_, i) => [Date.now() - (168 - i) * 3600000, 1000000000000 + Math.random() * 1000000000]),
      total_volumes: Array.from({ length: 168 }, (_, i) => [Date.now() - (168 - i) * 3600000, 50000000000 + Math.random() * 10000000000]),
    };
  }
};

export const clearCache = (key?: string) => {
  if (key) {
    MEMORY_CACHE.delete(key);
    localStorage.removeItem(key);
    console.log(`Cleared cache for key: ${key}`);
  } else {
    MEMORY_CACHE.clear();
    localStorage.clear();
    console.log("Cleared all caches");
  }
};