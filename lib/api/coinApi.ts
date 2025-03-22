import { toast } from "sonner";
import { supabase } from "@/src/integrations/supabase/client";
import { Coin, CoinDetail, CoinHistory } from "@/lib/types";

// Tăng thời gian cache lên 5 phút
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes
const MEMORY_CACHE = new Map<string, { data: any; timestamp: number }>();

// Helper để kiểm tra và lấy cache từ memory
const getFromMemoryCache = (key: string) => {
  const cached = MEMORY_CACHE.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
    return cached.data;
  }
  return null;
};

// Helper để lưu vào memory cache
const setToMemoryCache = (key: string, data: any) => {
  MEMORY_CACHE.set(key, { data, timestamp: Date.now() });
};

export const getCoins = async (page = 1, perPage = 20): Promise<Coin[]> => {
  const cacheKey = `coins_${page}_${perPage}`;
  const memoryCached = getFromMemoryCache(cacheKey);
  if (memoryCached) {
    console.log('Returning memory cached coin data');
    return memoryCached;
  }

  try {
    const { data: cachedData } = await supabase
      .from('cached_coins')
      .select('data, last_updated')
      .eq('id', cacheKey)
      .single();

    if (cachedData && Date.now() - new Date(cachedData.last_updated).getTime() < CACHE_EXPIRY) {
      console.log('Returning Supabase cached coin data');
      setToMemoryCache(cacheKey, cachedData.data); // Lưu vào memory cache
      return cachedData.data as Coin[];
    }

    console.log(`Fetching fresh coin data for page ${page}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // Giảm timeout xuống 15 giây

    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=true&price_change_percentage=1h,24h,7d&locale=en`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`API request failed with status ${response.status}`);

    const data = await response.json();
    setToMemoryCache(cacheKey, data); // Lưu vào memory cache

    await supabase.from('cached_coins').upsert({
      id: cacheKey,
      data,
      last_updated: new Date().toISOString(),
    });

    return data;
  } catch (error) {
    console.error("Error fetching coins:", error);
    toast.error("Failed to load cryptocurrency data");
    return [];
  }
};

export const getCoinDetail = async (id: string): Promise<CoinDetail> => {
  if (!id) throw new Error("Coin ID is required");

  const cacheKey = `coin_detail_${id}`;
  const memoryCached = getFromMemoryCache(cacheKey);
  if (memoryCached) {
    console.log('Returning memory cached coin detail');
    return memoryCached;
  }

  try {
    const { data: cachedData } = await supabase
      .from('cached_coin_details')
      .select('data, last_updated')
      .eq('id', id)
      .single();

    if (cachedData && Date.now() - new Date(cachedData.last_updated).getTime() < CACHE_EXPIRY) {
      console.log('Returning Supabase cached coin detail');
      setToMemoryCache(cacheKey, cachedData.data);
      return cachedData.data as CoinDetail;
    }

    console.log(`Fetching fresh data for coin: ${id}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const url = `https://api.coingecko.com/api/v3/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=true`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "Accept": "application/json", "Content-Type": "application/json" },
      cache: "no-store",
    });

    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`API request failed with status ${response.status}`);

    const data = await response.json();
    setToMemoryCache(cacheKey, data);

    await supabase.from('cached_coin_details').upsert({
      id,
      data,
      last_updated: new Date().toISOString(),
    });

    return data;
  } catch (error) {
    console.error(`Error fetching coin detail for ${id}:`, error);
    throw error instanceof Error ? error : new Error("An unknown error occurred");
  }
};

export const getCoinHistory = async (id: string, days = 7): Promise<CoinHistory> => {
  const cacheKey = `coin_history_${id}_${days}`;
  const memoryCached = getFromMemoryCache(cacheKey);
  if (memoryCached) {
    console.log('Returning memory cached coin history');
    return memoryCached;
  }

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${days}`,
      { method: "GET", headers: { "Content-Type": "application/json" } }
    );

    if (!response.ok) throw new Error(`API request failed with status ${response.status}`);

    const data = await response.json();
    setToMemoryCache(cacheKey, data);
    return data;
  } catch (error) {
    console.error(`Error fetching history for ${id}:`, error);
    toast.error("Failed to load price history");
    return {
      prices: Array.from({ length: 168 }, (_, i) => [Date.now() - (168 - i) * 3600000, 50000 + Math.random() * 10000]),
      market_caps: Array.from({ length: 168 }, (_, i) => [Date.now() - (168 - i) * 3600000, 1000000000000 + Math.random() * 1000000000]),
      total_volumes: Array.from({ length: 168 }, (_, i) => [Date.now() - (168 - i) * 3600000, 50000000000 + Math.random() * 10000000000]),
    };
  }
};