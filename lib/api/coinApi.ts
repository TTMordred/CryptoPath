
import { toast } from "sonner";
import { supabase } from "@/src/integrations/supabase/client";
import { Coin, CoinDetail, CoinHistory } from "@/lib/types";

const CACHE_EXPIRY = 60 * 1000; // 1 minute cache expiry

export const getCoins = async (page = 1, perPage = 20): Promise<Coin[]> => {
  const cacheKey = `coins_${page}_${perPage}`;
  
  try {
    // Try to get cached data
    const { data: cachedData } = await supabase
      .from('cached_coins')
      .select('data, last_updated')
      .eq('id', cacheKey)
      .single();

    // If cache is valid and not expired, return it
    if (cachedData && Date.now() - new Date(cachedData.last_updated).getTime() < CACHE_EXPIRY) {
      console.log('Returning cached coin data');
      return cachedData.data as Coin[];
    }

    // Fetch fresh data from API
    console.log(`Fetching fresh coin data for page ${page}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=true&price_change_percentage=1h,24h,7d&locale=en`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal
      }
    );
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();

    // Update cache with new data
    await supabase
      .from('cached_coins')
      .upsert({ 
        id: cacheKey,
        data: data,
        last_updated: new Date().toISOString()
      });

    return data;
  } catch (error) {
    console.error("Error fetching coins:", error);
    toast.error("Failed to load cryptocurrency data");
    return [];
  }
};

export const getCoinDetail = async (id: string): Promise<CoinDetail> => {
  if (!id) {
    console.error("No coin ID provided");
    throw new Error("Coin ID is required");
  }

  try {
    // Try to get cached data
    const { data: cachedData } = await supabase
      .from('cached_coin_details')
      .select('data, last_updated')
      .eq('id', id)
      .single();

    // If cache is valid and not expired, return it
    if (cachedData && Date.now() - new Date(cachedData.last_updated).getTime() < CACHE_EXPIRY) {
      console.log('Returning cached coin detail');
      return cachedData.data as CoinDetail;
    }

    // Fetch fresh data
    console.log(`Fetching fresh data for coin: ${id}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const url = `https://api.coingecko.com/api/v3/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=true`;
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();

    // Update cache with new data
    await supabase
      .from('cached_coin_details')
      .upsert({ 
        id: id,
        data: data,
        last_updated: new Date().toISOString()
      });

    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error fetching coin detail for ${id}:`, error);
      throw error;
    }
    throw new Error("An unknown error occurred while fetching coin data");
  }
};

export const getCoinHistory = async (
  id: string,
  days = 7
): Promise<CoinHistory> => {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${days}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    return await response.json();
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
