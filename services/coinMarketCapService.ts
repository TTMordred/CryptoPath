import axios from 'axios';
import { apiCache } from './apiCache';

// Configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const API_PROXY_URL = '/api/coinmarketcap';

// Interface definitions
export interface GlobalMarketData {
  total_market_cap: { [key: string]: number };
  total_volume: { [key: string]: number };
  market_cap_percentage: { [key: string]: number };
  market_cap_change_percentage_24h_usd: number;
  active_cryptocurrencies: number;
  markets: number;
  last_updated: string;
}

export interface TokenData {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  cmc_rank: number;
  quote: {
    USD: {
      price: number;
      volume_24h: number;
      market_cap: number;
      percent_change_1h: number;
      percent_change_24h: number;
      percent_change_7d: number;
      percent_change_30d: number;
      last_updated: string;
    }
  }
}

// Helper functions
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = INITIAL_RETRY_DELAY
): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    if (retries === 0 || (error.response && error.response.status !== 429)) {
      throw error;
    }
    
    console.warn(`Request failed, retrying in ${delay}ms...`);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return retryWithBackoff(operation, retries - 1, delay * 2);
  }
}

// Data conversion functions
const convertToGlobalMarketData = (response: any): GlobalMarketData => {
  try {
    console.log('API Response:', JSON.stringify(response, null, 2));

    if (response.status && response.status.error_code) {
      throw new Error(`API Error: ${response.status.error_message}`);
    }

    const data = response.data || response;
    
    return {
      total_market_cap: {
        usd: data.total_market_cap?.usd || 
             data.quote?.USD?.total_market_cap || 
             data.total_market_cap || 0
      },
      total_volume: {
        usd: data.total_volume?.usd || 
             data.quote?.USD?.total_volume_24h || 
             data.total_volume || 0
      },
      market_cap_percentage: {
        btc: data.market_cap_percentage?.btc || 
             data.btc_dominance || 
             data.dominance?.btc || 0,
        eth: data.market_cap_percentage?.eth || 
             data.eth_dominance || 
             data.dominance?.eth || 0,
      },
      market_cap_change_percentage_24h_usd: 
        data.market_cap_change_percentage_24h_usd ||
        data.quote?.USD?.total_market_cap_yesterday_percentage_change || 0,
      active_cryptocurrencies: 
        data.active_cryptocurrencies || 
        data.total_cryptocurrencies || 0,
      markets: 
        data.markets || 
        data.active_market_pairs || 0,
      last_updated: 
        data.last_updated || 
        new Date().toISOString()
    };
  } catch (error) {
    console.error('Error converting global market data:', error);
    return getSimulatedGlobalData();
  }
};

const convertToStandardTokenData = (tokens: TokenData[]): any[] => {
  try {
    return tokens.map(token => {
      if (!token.quote || !token.quote.USD) {
        throw new Error(`Invalid token data structure for token: ${token.id}`);
      }

      return {
        id: token.id?.toString() || '0',
        name: token.name || 'Unknown',
        symbol: token.symbol || 'N/A',
        current_price: token.quote.USD.price || 0,
        market_cap: token.quote.USD.market_cap || 0,
        total_volume: token.quote.USD.volume_24h || 0,
        price_change_percentage_24h: token.quote.USD.percent_change_24h || 0,
        price_change_percentage_7d: token.quote.USD.percent_change_7d || 0,
        price_change_percentage_30d: token.quote.USD.percent_change_30d || 0,
        market_cap_rank: token.cmc_rank || 0
      };
    }).filter(token => token.name !== 'Unknown');
  } catch (error) {
    console.error('Error converting token data:', error);
    return [];
  }
};

// API functions
export const fetchGlobalMarketData = async (): Promise<GlobalMarketData> => {
  const cachedData = apiCache.get<GlobalMarketData>('globalMarketData', 'globalMarketData');
  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await retryWithBackoff(async () => {
      return await axios.get(`${API_PROXY_URL}/global-metrics`);
    });
    
    const data = convertToGlobalMarketData(response.data);
    apiCache.set('globalMarketData', data);
    return data;
  } catch (error) {
    console.error('Error fetching global market data:', error);
    const fallbackData = getSimulatedGlobalData();
    apiCache.set('globalMarketData', fallbackData);
    return fallbackData;
  }
};

export const fetchTopCryptocurrencies = async (limit: number = 10): Promise<any[]> => {
  const cacheKey = `topCryptos_${limit}`;
  const cachedData = apiCache.get<any[]>(cacheKey, 'topCryptos');
  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await retryWithBackoff(async () => {
      return await axios.get(`${API_PROXY_URL}/listings`, {
        params: {
          limit,
          sort: 'market_cap',
          sort_dir: 'desc',
        }
      });
    });
    
    const data = convertToStandardTokenData(response.data.data);
    apiCache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Error fetching top cryptocurrencies:', error);
    const fallbackData = getSimulatedTopTokens(limit);
    apiCache.set(cacheKey, fallbackData);
    return fallbackData;
  }
};

export const fetchHistoricalData = async (
  symbol: string,
  days: number = 30,
  interval: string = 'daily'
): Promise<any> => {
  const cacheKey = `historicalData_${symbol}_${days}`;
  const cachedData = apiCache.get<any>(cacheKey, 'historicalData');
  if (cachedData) {
    return cachedData;
  }

  try {
    // Try to get data from Binance API if possible
    const binanceData = await retryWithBackoff(async () => {
      const binanceApi = await import('@/services/binanceApiService');
      return await binanceApi.fetchHistoricalPriceData(symbol, days);
    }).catch(() => null);
      
    if (binanceData) {
      apiCache.set(cacheKey, binanceData);
      return binanceData;
    }
    
    // Fallback to simulated data
    console.warn(`Using simulated data for ${symbol} historical prices`);
    const fallbackData = getSimulatedHistoricalData(symbol, days);
    apiCache.set(cacheKey, fallbackData);
    return fallbackData;
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    const fallbackData = getSimulatedHistoricalData(symbol, days);
    apiCache.set(cacheKey, fallbackData);
    return fallbackData;
  }
};

// Simulated data generators
function getSimulatedGlobalData(): GlobalMarketData {
  return {
    total_market_cap: {
      usd: 2300000000000 // $2.3T
    },
    total_volume: {
      usd: 115000000000 // $115B
    },
    market_cap_percentage: {
      btc: 48.5,
      eth: 17.3,
    },
    market_cap_change_percentage_24h_usd: 2.34,
    active_cryptocurrencies: 10423,
    markets: 814,
    last_updated: new Date().toISOString()
  };
}

function getSimulatedTopTokens(limit: number): any[] {
  const mockTokens = [
    { id: '1', name: 'Bitcoin', symbol: 'btc', current_price: 64253.12, price_change_percentage_24h: 2.41, market_cap: 1260000000000, market_cap_rank: 1 },
    { id: '2', name: 'Ethereum', symbol: 'eth', current_price: 3427.81, price_change_percentage_24h: 1.58, market_cap: 412000000000, market_cap_rank: 2 },
    { id: '3', name: 'Tether', symbol: 'usdt', current_price: 0.9998, price_change_percentage_24h: 0.01, market_cap: 110000000000, market_cap_rank: 3 },
    { id: '4', name: 'BNB', symbol: 'bnb', current_price: 587.33, price_change_percentage_24h: 0.92, market_cap: 85000000000, market_cap_rank: 4 },
    { id: '5', name: 'Solana', symbol: 'sol', current_price: 143.38, price_change_percentage_24h: 3.76, market_cap: 65000000000, market_cap_rank: 5 },
  ];
  
  return mockTokens.slice(0, limit);
}

function getSimulatedHistoricalData(symbol: string, days: number): any {
  const basePrice = symbol.toLowerCase() === 'btc' ? 68000 :
                   symbol.toLowerCase() === 'eth' ? 3500 :
                   symbol.toLowerCase() === 'sol' ? 140 :
                   symbol.toLowerCase() === 'bnb' ? 600 : 100;
  
  const prices = [];
  const market_caps = [];
  const total_volumes = [];
  
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  
  let currentPrice = basePrice;
  
  for (let i = days; i >= 0; i--) {
    const timestamp = now - (i * oneDayMs);
    const randomChange = currentPrice * (Math.random() * 0.06 - 0.03); // -3% to +3%
    currentPrice += randomChange;
    
    prices.push([timestamp, currentPrice]);
    market_caps.push([timestamp, currentPrice * 19500000]); // Simulated market cap
    total_volumes.push([timestamp, currentPrice * 500000 * (0.7 + Math.random() * 0.6)]); // Simulated volume
  }
  
  return {
    prices,
    market_caps,
    total_volumes
  };
}
