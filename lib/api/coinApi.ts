// lib/api/coinApi.ts
import { toast } from "sonner";
import { Coin, CoinDetail, CoinHistory } from "@/lib/types";

export const getCoins = async (page = 1, perPage = 20): Promise<Coin[]> => {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=true&price_change_percentage=1h,24h,7d&locale=en`,
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
    console.error("Error fetching coins:", error);
    toast.error("Failed to load cryptocurrency data");
    return [];
  }
};

export const getCoinDetail = async (id: string): Promise<CoinDetail> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=true`,
      {
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching coin detail for ${id}:`, error);
    toast.error("Failed to load cryptocurrency details");
    throw error;
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
      prices: Array.from({ length: 168 }, (_, i) => [
        Date.now() - (168 - i) * 3600000,
        50000 + Math.random() * 10000,
      ]),
      market_caps: Array.from({ length: 168 }, (_, i) => [
        Date.now() - (168 - i) * 3600000,
        1000000000000 + Math.random() * 1000000000,
      ]),
      total_volumes: Array.from({ length: 168 }, (_, i) => [
        Date.now() - (168 - i) * 3600000,
        50000000000 + Math.random() * 10000000000,
      ]),
    };
  }
};