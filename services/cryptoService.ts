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

export interface CoinAnalytics {
  id: string;
  symbol: string;
  name: string;
  market_data: {
    current_price: { usd: number };
    price_change_percentage_24h: number;
    market_cap: { usd: number };
    total_volume: { usd: number };
    circulating_supply: number;
    total_supply: number;
    max_supply: number | null;
  };
  community_data: {
    twitter_followers: number;
    reddit_subscribers: number;
    telegram_channel_user_count: number | null;
  };
  developer_data: {
    forks: number;
    stars: number;
    subscribers: number;
    total_issues: number;
    closed_issues: number;
    pull_requests_merged: number;
    pull_request_contributors: number;
    commit_count_4_weeks: number;
  };
  public_interest_stats: {
    alexa_rank: number;
  };
}

export interface ChainAnalytics {
  uniqueActiveWallets: number;
  incomingTransactions: number;
  incomingVolume: number;
  contractBalance: number;
  dailyChange: {
    uaw: number;
    transactions: number;
    volume: number;
    balance: number;
  };
}

// Add cache for historical data
const historicalDataCache = new Map<string, {
  data: CryptoMarketData;
  timestamp: number;
}>();

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const fetchHistoricalData = async (coinId: string, days: number = 30, currency: string = 'usd'): Promise<CryptoMarketData> => {
  // Check cache first
  const cached = historicalDataCache.get(coinId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const response = await fetchWithRetry(
      `${COINGECKO_API_BASE}/coins/${coinId}/market_chart?vs_currency=${currency}&days=${days}&interval=daily`,
      3,
      2000
    );
    const data = await response.json();
    
    if (!data.prices || !data.market_caps || !data.total_volumes || 
        !Array.isArray(data.prices) || !Array.isArray(data.market_caps) || !Array.isArray(data.total_volumes) ||
        data.prices.length === 0) {
      throw new Error('Invalid or empty data received from API');
    }
    
    const validData = data.prices.every((price: any, index: number) => {
      return Array.isArray(price) && price.length === 2 &&
             typeof price[0] === 'number' && typeof price[1] === 'number' &&
             Array.isArray(data.market_caps[index]) && data.market_caps[index].length === 2 &&
             Array.isArray(data.total_volumes[index]) && data.total_volumes[index].length === 2;
    });

    if (!validData) {
      throw new Error('Inconsistent or invalid data format');
    }

    const result = {
      prices: data.prices,
      market_caps: data.market_caps,
      total_volumes: data.total_volumes
    };

    // Cache the result
    historicalDataCache.set(coinId, {
      data: result,
      timestamp: Date.now()
    });

    return result;
  } catch (error) {
    console.error('Error fetching historical data:', error);
    
    // Check if we have cached data even if expired
    if (cached) {
      return cached.data;
    }
    
    // Generate and cache mock data if no data available
    const mockData = generateMockHistoricalData(coinId, days);
    historicalDataCache.set(coinId, {
      data: mockData,
      timestamp: Date.now()
    });
    return mockData;
  }
};

// Helper function to generate deterministic random number
function seededRandom(seed: string, index: number): number {
  const seedNum = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return ((seedNum * (index + 1)) % 100) / 100;
}

// Helper function to generate realistic mock data
function generateMockHistoricalData(coinId: string, days: number): CryptoMarketData {
  const mockData: CryptoMarketData = {
    prices: [],
    market_caps: [],
    total_volumes: []
  };
  
  const config = {
    bitcoin: { price: 45000, volume: 30000000000, volatility: 0.03 },
    ethereum: { price: 2500, volume: 15000000000, volatility: 0.04 },
    binancecoin: { price: 300, volume: 5000000000, volatility: 0.035 },
    ripple: { price: 0.5, volume: 2000000000, volatility: 0.045 },
    cardano: { price: 0.4, volume: 1000000000, volatility: 0.05 },
    default: { price: 100, volume: 1000000000, volatility: 0.04 }
  };
  
  const { price: basePrice, volume: baseVolume, volatility } = 
    (config as any)[coinId] || config.default;
  
  const now = Math.floor(Date.now() / (24 * 60 * 60 * 1000)) * (24 * 60 * 60 * 1000); // Normalize to start of day
  let currentPrice = basePrice;
  let currentVolume = baseVolume;
  
  for (let i = 0; i < days; i++) {
    const timestamp = now - (days - 1 - i) * 24 * 60 * 60 * 1000;
    
    // Use seeded random for consistent results
    const priceChange = (seededRandom(coinId + 'price', i) - 0.5) * 2 * volatility;
    currentPrice = currentPrice * (1 + priceChange);
    currentPrice = Math.max(currentPrice, basePrice * 0.5);
    
    const volumeChange = (seededRandom(coinId + 'volume', i) - 0.5) * 0.4;
    currentVolume = baseVolume * (1 + volumeChange);
    
    mockData.prices.push([timestamp, currentPrice]);
    mockData.market_caps.push([timestamp, currentPrice * (baseVolume / 1000)]);
    mockData.total_volumes.push([timestamp, currentVolume]);
  }
  
  return mockData;
}

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

export const fetchCoinAnalytics = async (coinId: string): Promise<CoinAnalytics> => {
  try {
    const response = await fetchWithRetry(
      `${COINGECKO_API_BASE}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=true&developer_data=true&sparkline=false`
    );
    return await response.json();
  } catch (error) {
    console.error('Error fetching coin analytics:', error);
    // Return mock data if API fails
    return {
      id: coinId,
      symbol: coinId.toUpperCase(),
      name: coinId.charAt(0).toUpperCase() + coinId.slice(1),
      market_data: {
        current_price: { usd: 0 },
        price_change_percentage_24h: 0,
        market_cap: { usd: 0 },
        total_volume: { usd: 0 },
        circulating_supply: 0,
        total_supply: 0,
        max_supply: null
      },
      community_data: {
        twitter_followers: 0,
        reddit_subscribers: 0,
        telegram_channel_user_count: null
      },
      developer_data: {
        forks: 0,
        stars: 0,
        subscribers: 0,
        total_issues: 0,
        closed_issues: 0,
        pull_requests_merged: 0,
        pull_request_contributors: 0,
        commit_count_4_weeks: 0
      },
      public_interest_stats: {
        alexa_rank: 0
      }
    };
  }
};

export const fetchChainAnalytics = async (coinId: string): Promise<ChainAnalytics> => {
  try {
    // Since we don't have direct access to blockchain data, we'll simulate realistic data
    // In a real implementation, this would fetch from blockchain APIs
    const baseNumber = Date.now() % 1000000;
    const randomFactor = () => 0.8 + Math.random() * 0.4; // Random number between 0.8 and 1.2
    
    return {
      uniqueActiveWallets: Math.floor(150000 * randomFactor()),
      incomingTransactions: Math.floor(500000 * randomFactor()),
      incomingVolume: Math.floor(1000000000 * randomFactor()), // $1B base
      contractBalance: Math.floor(2000000000 * randomFactor()), // $2B base
      dailyChange: {
        uaw: -2.5 + Math.random() * 5, // -2.5% to +2.5%
        transactions: -3 + Math.random() * 6, // -3% to +3%
        volume: -5 + Math.random() * 10, // -5% to +5%
        balance: -1 + Math.random() * 2, // -1% to +1%
      }
    };
  } catch (error) {
    console.error('Error fetching chain analytics:', error);
    throw error;
  }
};

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

// Add token contract addresses mapping
export const TOKEN_CONTRACTS: { [key: string]: string } = {
  'ethereum': 'ETH', // Native ETH
  'usd-coin': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
  'tether': '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
  'wrapped-bitcoin': '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // WBTC
  'chainlink': '0x514910771AF9Ca656af840dff83E8264EcF986CA', // LINK
  'dai': '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
  'shiba-inu': '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE', // SHIB
  'uniswap': '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', // UNI
  'aave': '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', // AAVE
  'maker': '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2', // MKR
  'compound': '0xc00e94Cb662C3520282E6f5717214004A7f26888', // COMP
  'yearn-finance': '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e', // YFI
  'sushi': '0x6B3595068778DD592e39A122f4f5a5cF09C90fE2', // SUSHI
  'curve-dao-token': '0xD533a949740bb3306d119CC777fa900bA034cd52', // CRV
  'synthetix': '0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F', // SNX
  '1inch': '0x111111111117dC0aa78b770fA6A738034120C302', // 1INCH
  'loopring': '0xBBbbCA6A901c926F240b89EacB641d8Aec7AEafD', // LRC
  'enjincoin': '0xF629cBd94d3791C9250152BD8dfBDF380E2a3B9c', // ENJ
  'decentraland': '0x0F5D2fB29fb7d3CFeE444a200298f468908cC942', // MANA
  'the-sandbox': '0x3845badAde8e6dFF049820680d1F14bD3903a5d0' // SAND
};