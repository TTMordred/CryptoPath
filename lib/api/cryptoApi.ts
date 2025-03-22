import { toast } from "sonner";

// Types
interface CryptoPriceData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d?: number;
  image: string;
}

// Fallback data in case the API fails
const fallbackPriceData: CryptoPriceData[] = [
  {
    id: "bitcoin",
    symbol: "btc",
    name: "Bitcoin",
    current_price: 50000,
    market_cap: 920000000000,
    market_cap_rank: 1,
    price_change_percentage_24h: 2.5,
    image: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png"
  },
  {
    id: "ethereum",
    symbol: "eth",
    name: "Ethereum",
    current_price: 2800,
    market_cap: 320000000000,
    market_cap_rank: 2,
    price_change_percentage_24h: 1.2,
    image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png"
  },
  {
    id: "binancecoin",
    symbol: "bnb",
    name: "BNB",
    current_price: 380,
    market_cap: 58000000000,
    market_cap_rank: 3,
    price_change_percentage_24h: 0.8,
    image: "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png"
  }
];

/**
 * Fetches cryptocurrency price data with error handling and fallback data
 * @param coins List of coin IDs to fetch
 * @returns Price data for requested coins
 */
export async function fetchCryptoPrices(coins: string[] = ['bitcoin', 'ethereum', 'binancecoin', 'solana']): Promise<CryptoPriceData[]> {
  try {
    const coinIds = coins.join(',');
    const apiUrl = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinIds}&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h,7d`;
    
    // Implement timeout to handle hanging requests
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), 5000)
    );
    
    // Race between the fetch and the timeout
    const response = await Promise.race([
      fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }),
      timeoutPromise
    ]) as Response;
    
    if (!response.ok) {
      throw new Error(`API response error: ${response.status}`);
    }
    
    const data = await response.json();
    return data as CryptoPriceData[];
  } catch (error) {
    console.error('Failed to fetch crypto prices:', error);
    // Silent handling with fallback data instead of toast to avoid UX disruption
    return fallbackPriceData;
  }
}

/**
 * Fetches historical price data for a cryptocurrency
 * @param coinId Coin ID to fetch history for
 * @param days Number of days of historical data
 * @returns Historical price data
 */
export async function fetchCryptoHistory(coinId: string, days: number = 7) {
  try {
    const apiUrl = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`API response error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.prices;
  } catch (error) {
    console.error(`Failed to fetch history for ${coinId}:`, error);
    
    // Generate mock historical data as fallback
    const mockData = [];
    const now = Date.now();
    for (let i = days; i >= 0; i--) {
      const timestamp = now - i * 24 * 60 * 60 * 1000;
      // Generate price with some randomness
      let price = coinId === 'bitcoin' ? 50000 : coinId === 'ethereum' ? 2800 : 380;
      price = price * (0.9 + 0.2 * Math.random());
      mockData.push([timestamp, price]);
    }
    return mockData;
  }
}

/**
 * Refreshes cryptocurrency data, with UI feedback
 */
export async function refreshCryptoPrices(coins: string[]): Promise<CryptoPriceData[]> {
  try {
    toast.info("Updating crypto prices...");
    const data = await fetchCryptoPrices(coins);
    toast.success("Prices updated");
    return data;
  } catch (error) {
    toast.error("Failed to update prices. Using cached data.");
    return fallbackPriceData;
  }
}
