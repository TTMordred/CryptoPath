
import { toast } from "sonner";
import { supabase } from "@/src/integrations/supabase/client";
import { GlobalData } from "@/lib/types";

const CACHE_EXPIRY = 60 * 1000; // 1 minute cache expiry

export const getGlobalData = async (): Promise<GlobalData> => {
  try {
    // Try to get cached data
    const { data: cachedData } = await supabase
      .from('cached_global_data')
      .select('data, last_updated')
      .eq('id', 'global')
      .single();

    // If cache is valid and not expired, return it
    if (cachedData && Date.now() - new Date(cachedData.last_updated).getTime() < CACHE_EXPIRY) {
      console.log('Returning cached global data');
      return cachedData.data as GlobalData;
    }

    // Fetch fresh data
    console.log('Fetching fresh global data');
    const response = await fetch("https://api.coingecko.com/api/v3/global", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const responseData = await response.json();
    const data = responseData.data;

    // Update cache with new data
    await supabase
      .from('cached_global_data')
      .upsert({ 
        id: 'global',
        data: data,
        last_updated: new Date().toISOString()
      });

    return data;
  } catch (error) {
    console.error("Error fetching global data:", error);
    toast.error("Failed to load global market data");

    // Return fallback data if fetch fails
    return {
      active_cryptocurrencies: 10000,
      upcoming_icos: 0,
      ongoing_icos: 50,
      ended_icos: 3376,
      markets: 800,
      total_market_cap: {
        usd: 2500000000000,
        eth: 840000000,
        ltc: 37000000000,
        btc: 57000000,
        eur: 2200000000000,
        jpy: 340000000000000,
      },
      total_volume: {
        usd: 120000000000,
        eth: 40000000,
        ltc: 1800000000,
        btc: 2800000,
        eur: 110000000000,
        jpy: 16000000000000,
      },
      market_cap_percentage: {
        btc: 46.5,
        eth: 18.2,
        usdt: 7.3,
        bnb: 2.5,
        xrp: 2.2,
        sol: 1.8,
        ada: 1.1,
      },
      market_cap_change_percentage_24h_usd: 0.65,
      updated_at: Math.floor(Date.now() / 1000),
    };
  }
};
