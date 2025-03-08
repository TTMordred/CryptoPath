// lib/api/coinApi.ts
import { toast } from "sonner";
import { Coin, CoinDetail, CoinHistory } from "@/lib/types";

export const getCoins = async (page = 1, perPage = 20): Promise<Coin[]> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    console.log(`Fetching coins for page ${page} with ${perPage} per page`);
    
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
      console.error(`API request failed with status ${response.status}: ${response.statusText}`);
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log(`Successfully fetched ${data.length} coins`);
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const url = `https://api.coingecko.com/api/v3/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=true`;
    console.log(`Fetching data for coin with id: ${id}, URL: ${url}`);
    
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
      const errorText = await response.text(); // Lấy chi tiết lỗi từ server
      console.error(`API request failed with status ${response.status}: ${response.statusText} - ${errorText}`);
      throw new Error(`API request failed with status ${response.status}: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`Successfully fetched data for coin: ${data.name}`);
    return data;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        console.error(`Fetch aborted for coin ${id} due to timeout`);
        throw new Error("Request timed out after 30 seconds");
      }
      console.error(`Error fetching coin detail for ${id}: ${error.message}`);
      throw error;
    }
    console.error(`Unknown error fetching coin detail for ${id}:`, error);
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