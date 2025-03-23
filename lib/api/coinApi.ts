import { toast } from "sonner";
import pLimit from "p-limit";
import { supabase } from "@/src/integrations/supabase/client";
import { Coin, CoinDetail, CoinHistory } from "@/lib/types";

// Cấu hình
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 phút
const FETCH_TIMEOUT = 15000; // 15 giây timeout
const MAX_RETRIES = 3;
const MEMORY_CACHE = new Map<string, { data: any; timestamp: number }>();
const limit = pLimit(5); // Giới hạn 5 request đồng thời

// Helper functions
const getFromMemoryCache = <T>(key: string): T | null => {
  const cached = MEMORY_CACHE.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
    return cached.data;
  }
  MEMORY_CACHE.delete(key);
  return null;
};

const setToMemoryCache = (key: string, data: any) => {
  MEMORY_CACHE.set(key, { data, timestamp: Date.now() });
};

const getLocalFallback = <T>(key: string): T | null => {
  const item = localStorage.getItem(key);
  if (item) {
    const { data, timestamp } = JSON.parse(item);
    if (Date.now() - timestamp < CACHE_EXPIRY * 2) return data; // Cache lâu hơn offline
  }
  return null;
};

const setLocalFallback = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
};

// Fetch với timeout, retry và rate limiting
const fetchWithRetry = async (url: string, options: RequestInit = {}): Promise<any> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

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
      if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
      return await response.json();
    } catch (error) {
      if (i === MAX_RETRIES - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i))); // Exponential backoff
    } finally {
      clearTimeout(timeoutId);
    }
  }
};

export const getCoins = async (page = 1, perPage = 20): Promise<Coin[]> => {
  const cacheKey = `coins_${page}_${perPage}`;
  
  // Check memory cache
  const memoryCached = getFromMemoryCache<Coin[]>(cacheKey);
  if (memoryCached) {
    console.log('Returning memory cached coin data');
    return memoryCached;
  }

  try {
    // Check Supabase cache
    const { data: cachedData, error } = await supabase
      .from('cached_coins')
      .select('data, last_updated')
      .eq('id', cacheKey)
      .single();

    if (!error && cachedData?.last_updated) {
      const timeSinceUpdate = Date.now() - new Date(cachedData.last_updated).getTime();
      if (timeSinceUpdate < CACHE_EXPIRY) {
        console.log('Returning Supabase cached coin data');
        setToMemoryCache(cacheKey, cachedData.data);
        setLocalFallback(cacheKey, cachedData.data); // Lưu fallback
        return cachedData.data as Coin[];
      }
    }

    // Fetch fresh data
    console.log(`Fetching fresh coin data for page ${page}`);
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=true&price_change_percentage=1h,24h,7d&locale=en`;
    const data = await fetchWithRetry(url);

    // Update caches
    setToMemoryCache(cacheKey, data);
    setLocalFallback(cacheKey, data);
    await supabase.from('cached_coins').upsert({
      id: cacheKey,
      data,
      last_updated: new Date().toISOString(),
    });

    return data;
  } catch (error) {
    console.error("Error fetching coins:", error);
    toast.error("Failed to load cryptocurrency data");
    
    // Return local fallback nếu có
    const fallback = getLocalFallback<Coin[]>(cacheKey);
    if (fallback) {
      console.log('Returning local fallback coin data');
      return fallback;
    }
    return [];
  }
};

export const getCoinDetail = async (id: string): Promise<CoinDetail> => {
  if (!id) throw new Error("Coin ID is required");
  
  const cacheKey = `coin_detail_${id}`;
  
  // Check memory cache
  const memoryCached = getFromMemoryCache<CoinDetail>(cacheKey);
  if (memoryCached) {
    console.log('Returning memory cached coin detail');
    return memoryCached;
  }

  try {
    // Check Supabase cache
    const { data: cachedData, error } = await supabase
      .from('cached_coin_details')
      .select('data, last_updated')
      .eq('id', id)
      .single();

    if (!error && cachedData?.last_updated) {
      const timeSinceUpdate = Date.now() - new Date(cachedData.last_updated).getTime();
      if (timeSinceUpdate < CACHE_EXPIRY) {
        console.log('Returning Supabase cached coin detail');
        setToMemoryCache(cacheKey, cachedData.data);
        setLocalFallback(cacheKey, cachedData.data);
        return cachedData.data as CoinDetail;
      }
    }

    // Fetch fresh data
    console.log(`Fetching fresh data for coin: ${id}`);
    const url = `https://api.coingecko.com/api/v3/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=true`;
    const data = await fetchWithRetry(url, { cache: "no-store" });

    // Update caches
    setToMemoryCache(cacheKey, data);
    setLocalFallback(cacheKey, data);
    await supabase.from('cached_coin_details').upsert({
      id,
      data,
      last_updated: new Date().toISOString(),
    });

    return data;
  } catch (error) {
    console.error(`Error fetching coin detail for ${id}:`, error);
    
    // Return local fallback nếu có
    const fallback = getLocalFallback<CoinDetail>(cacheKey);
    if (fallback) {
      console.log('Returning local fallback coin detail');
      return fallback;
    }
    throw error instanceof Error ? error : new Error("An unknown error occurred");
  }
};

export const getCoinHistory = async (id: string, days = 7): Promise<CoinHistory> => {
  const cacheKey = `coin_history_${id}_${days}`;
  
  // Check memory cache
  const memoryCached = getFromMemoryCache<CoinHistory>(cacheKey);
  if (memoryCached) {
    console.log('Returning memory cached coin history');
    return memoryCached;
  }

  try {
    // Fetch fresh data
    const url = `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${days}`;
    const data = await fetchWithRetry(url);

    setToMemoryCache(cacheKey, data);
    setLocalFallback(cacheKey, data);
    return data;
  } catch (error) {
    console.error(`Error fetching history for ${id}:`, error);
    toast.error("Failed to load price history");
    
    // Return local fallback hoặc dummy data
    const fallback = getLocalFallback<CoinHistory>(cacheKey);
    if (fallback) {
      console.log('Returning local fallback coin history');
      return fallback;
    }
    return {
      prices: Array.from({ length: 168 }, (_, i) => [Date.now() - (168 - i) * 3600000, 50000 + Math.random() * 10000]),
      market_caps: Array.from({ length: 168 }, (_, i) => [Date.now() - (168 - i) * 3600000, 1000000000000 + Math.random() * 1000000000]),
      total_volumes: Array.from({ length: 168 }, (_, i) => [Date.now() - (168 - i) * 3600000, 50000000000 + Math.random() * 10000000000]),
    };
  }
};

// Hàm xóa cache nếu cần
export const clearCache = (key?: string) => {
  if (key) {
    MEMORY_CACHE.delete(key);
    localStorage.removeItem(key);
  } else {
    MEMORY_CACHE.clear();
    localStorage.clear();
  }
};