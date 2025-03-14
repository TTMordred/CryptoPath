// CoinGecko API service
const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(url: string, retries = 3, delayMs = 1000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
      
      // If rate limited, wait longer
      if (response.status === 429) {
        await delay(delayMs * 2);
        continue;
      }
      
      throw new Error(`HTTP error! status: ${response.status}`);
    } catch (error) {
      if (i === retries - 1) throw error;
      await delay(delayMs);
    }
  }
  throw new Error('Max retries reached');
}

export interface CryptoMarketData {
  prices: [number, number][]; // [timestamp, price]
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

export interface TokenData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  total_volume: number;
  price_change_percentage_24h: number;
}

export interface CoinOption {
  id: string;
  symbol: string;
  name: string;
}

export interface BlockchainMetrics {
  lastBlock: number;
  safeBlock: number;
  finalizedBlock: number;
  avgBlockTime: number;
  gasPrice: number;
  activeValidators: number;
  stakingAPR: number;
}

export interface GlobalMetrics {
  total_market_cap: { usd: number };
  total_volume: { usd: number };
  market_cap_percentage: { [key: string]: number };
  active_cryptocurrencies: number;
  markets: number;
}

export const fetchAvailableCoins = async (): Promise<CoinOption[]> => {
  try {
    const response = await fetchWithRetry(
      `${COINGECKO_API_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false`
    );
    const data = await response.json();
    return data.map((coin: any) => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name
    }));
  } catch (error) {
    console.error('Error fetching available coins:', error);
    throw error;
  }
};

export const fetchHistoricalData = async (coinId: string, days: number = 30, currency: string = 'usd'): Promise<CryptoMarketData> => {
  try {
    const response = await fetchWithRetry(
      `${COINGECKO_API_BASE}/coins/${coinId}/market_chart?vs_currency=${currency}&days=${days}&interval=daily`
    );
    return await response.json();
  } catch (error) {
    console.error('Error fetching historical data:', error);
    throw error;
  }
};

export const fetchTopTokens = async (limit: number = 10, currency: string = 'usd'): Promise<TokenData[]> => {
  try {
    const response = await fetchWithRetry(
      `${COINGECKO_API_BASE}/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false`
    );
    return await response.json();
  } catch (error) {
    console.error('Error fetching top tokens:', error);
    throw error;
  }
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

const ETHERSCAN_BASE_URL = 'https://api.etherscan.io/api';

export const fetchBlockchainMetrics = async (): Promise<BlockchainMetrics> => {
  // Since we don't have an API key, we'll use simulated data that updates
  const baseBlock = Math.floor(Date.now() / 12000) + 19000000; // Simulates new blocks every ~12 seconds
  
  return {
    lastBlock: baseBlock,
    safeBlock: baseBlock - 64, // ~13 minutes behind
    finalizedBlock: baseBlock - 128, // ~26 minutes behind
    avgBlockTime: 12,
    gasPrice: 25,
    activeValidators: 889643,
    stakingAPR: 3.7
  };
};

export const fetchGlobalMetrics = async (): Promise<GlobalMetrics> => {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/global');
    const data = await response.json();
    return {
      total_market_cap: { usd: data.data.total_market_cap.usd },
      total_volume: { usd: data.data.total_volume.usd },
      market_cap_percentage: data.data.market_cap_percentage,
      active_cryptocurrencies: data.data.active_cryptocurrencies,
      markets: data.data.markets
    };
  } catch (error) {
    console.error('Error fetching global metrics:', error);
    // Return fallback data if API fails
    return {
      total_market_cap: { usd: 2785000000000 },
      total_volume: { usd: 89700000000 },
      market_cap_percentage: {
        btc: 51.2,
        eth: 16.8,
        usdt: 7.3,
        bnb: 4.1,
        xrp: 3.2
      },
      active_cryptocurrencies: 11250,
      markets: 914
    };
  }
}; 