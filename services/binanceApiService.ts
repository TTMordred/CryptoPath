import axios from 'axios';

const BINANCE_API_URL = 'https://api.binance.com/api/v3';

interface BinanceKline {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteAssetVolume: string;
  trades: number;
  takerBuyBaseAssetVolume: string;
  takerBuyQuoteAssetVolume: string;
  ignored: string;
}

/**
 * Convert symbol to Binance trading pair format
 */
const getBinancePair = (symbol: string): string => {
  // Convert common symbols to Binance format (BTCUSDT, ETHUSDT, etc.)
  return `${symbol.toUpperCase()}USDT`;
};

/**
 * Get historical price data from Binance
 */
export const fetchHistoricalPriceData = async (symbol: string, days: number = 30): Promise<any> => {
  try {
    const interval = days <= 7 ? '1h' : '1d';
    const limit = days <= 7 ? days * 24 : days;
    
    const pair = getBinancePair(symbol);
    
    const response = await axios.get(`${BINANCE_API_URL}/klines`, {
      params: {
        symbol: pair,
        interval,
        limit: Math.min(limit, 1000) // Binance has a limit of 1000 candles
      }
    });
    
    if (!response.data || !Array.isArray(response.data)) {
      throw new Error('Invalid response from Binance API');
    }
    
    // Transform to the format our charts expect - using closing price (index 4)
    const prices = response.data.map((kline: any) => [kline[0], parseFloat(kline[4])]);
    
    // Use actual traded volume for better accuracy
    const volumes = response.data.map((kline: any) => [kline[0], parseFloat(kline[5]) * parseFloat(kline[4])]);
    
    // For market caps, we estimate based on circulating supply
    const market_cap_multiplier = getMarketCapMultiplier(symbol);
    const market_caps = prices.map(([time, price]) => [time, price * market_cap_multiplier]);
    
    return {
      prices,
      market_caps,
      total_volumes: volumes
    };
  } catch (error) {
    console.error('Error fetching data from Binance:', error);
    throw error;
  }
};

/**
 * Helper to estimate market cap based on approximate circulating supply
 */
function getMarketCapMultiplier(symbol: string): number {
  // Rough estimates of circulating supply for major coins
  switch (symbol.toLowerCase()) {
    case 'btc': return 19500000; // ~19.5M BTC in circulation
    case 'eth': return 120000000; // ~120M ETH in circulation
    case 'bnb': return 153000000; // ~153M BNB in circulation
    case 'sol': return 430000000; // ~430M SOL in circulation
    default: return 100000000; // Default fallback
  }
}
