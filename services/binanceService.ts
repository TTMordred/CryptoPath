import { toast } from "@/components/ui/use-toast";

// Types
export interface KlineData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
  quoteVolume: number;
  trades: number;
}

export interface OrderbookEntry {
  price: string;
  quantity: string;
  total?: string;
}

export interface Orderbook {
  lastUpdateId: number;
  bids: OrderbookEntry[];
  asks: OrderbookEntry[];
}

export interface MarketTicker {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  askPrice: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  count: number;
}

// Constants
const BINANCE_API_URL = 'https://api.binance.com/api/v3';
const WEBSOCKET_URL = 'wss://stream.binance.com:9443/ws';
const CACHE_DURATION = 60000; // 1 minute cache

// Cache storage
const cache: Record<string, { data: any, timestamp: number }> = {};

// Stablecoin filter - these will be excluded from results
export const STABLECOINS = ['USDT', 'USDC', 'BUSD', 'DAI', 'TUSD', 'UST', 'USDP', 'GUSD'];

/**
 * Fetch data with caching
 */
const fetchWithCache = async <T>(endpoint: string, params: Record<string, string> = {}): Promise<T> => {
  const queryString = new URLSearchParams(params).toString();
  const url = `${BINANCE_API_URL}${endpoint}${queryString ? '?' + queryString : ''}`;
  const cacheKey = url;

  // Check cache
  const cachedData = cache[cacheKey];
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
    return cachedData.data as T;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    
    // Store in cache
    cache[cacheKey] = {
      data,
      timestamp: Date.now()
    };
    
    return data as T;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    throw error;
  }
};

/**
 * Get available trading pairs (excluding stablecoin pairs)
 */
export const getTradingPairs = async () => {
  try {
    const exchangeInfo = await fetchWithCache<any>('/exchangeInfo');
    
    // Filter out stablecoin pairs
    const tradingPairs = exchangeInfo.symbols
      .filter((symbol: any) => 
        symbol.status === 'TRADING' && 
        symbol.quoteAsset === 'USDT' && // Only USDT quote pairs for simplicity
        !STABLECOINS.includes(symbol.baseAsset)
      )
      .map((symbol: any) => ({
        symbol: symbol.symbol,
        baseAsset: symbol.baseAsset,
        quoteAsset: symbol.quoteAsset,
      }));
      
    return tradingPairs;
  } catch (error) {
    console.error('Error fetching trading pairs:', error);
    toast({
      title: "API Error",
      description: "Could not fetch trading pairs. Please try again later.",
      variant: "destructive"
    });
    return [];
  }
};

/**
 * Get kline (candlestick) data
 */
export const getKlineData = async (
  symbol: string,
  interval: string = '1h',
  limit: number = 100
): Promise<KlineData[]> => {
  try {
    const data = await fetchWithCache<any[]>('/klines', {
      symbol,
      interval,
      limit: limit.toString()
    });
    
    return data.map(item => ({
      time: item[0],
      open: parseFloat(item[1]),
      high: parseFloat(item[2]),
      low: parseFloat(item[3]),
      close: parseFloat(item[4]),
      volume: parseFloat(item[5]),
      closeTime: item[6],
      quoteVolume: parseFloat(item[7]),
      trades: item[8]
    }));
  } catch (error) {
    console.error(`Error fetching kline data for ${symbol}:`, error);
    toast({
      title: "Chart Data Error",
      description: "Failed to load chart data. Please try again later.",
      variant: "destructive"
    });
    return [];
  }
};

/**
 * Get orderbook data
 */
export const getOrderbook = async (
  symbol: string,
  limit: number = 20
): Promise<Orderbook> => {
  try {
    const data = await fetchWithCache<any>('/depth', {
      symbol,
      limit: limit.toString()
    });
    
    // Process and calculate totals for bids and asks
    const processOrders = (orders: string[][]): OrderbookEntry[] => {
      let runningTotal = 0;
      return orders.map(([price, qty]) => {
        runningTotal += parseFloat(qty);
        return {
          price,
          quantity: qty,
          total: runningTotal.toFixed(6)
        };
      });
    };
    
    return {
      lastUpdateId: data.lastUpdateId,
      bids: processOrders(data.bids),
      asks: processOrders(data.asks.reverse()) // Reverse asks to show highest price first
    };
  } catch (error) {
    console.error(`Error fetching orderbook for ${symbol}:`, error);
    toast({
      title: "Orderbook Error",
      description: "Failed to load orderbook data. Please try again later.",
      variant: "destructive"
    });
    return { lastUpdateId: 0, bids: [], asks: [] };
  }
};

/**
 * Get 24hr ticker price change statistics
 */
export const get24hrTicker = async (symbol: string): Promise<MarketTicker> => {
  try {
    return await fetchWithCache<MarketTicker>('/ticker/24hr', { symbol });
  } catch (error) {
    console.error(`Error fetching 24hr ticker for ${symbol}:`, error);
    toast({
      title: "Price Data Error",
      description: "Could not fetch current price data.",
      variant: "destructive"
    });
    throw error;
  }
};

/**
 * Get multiple symbols price ticker
 */
export const getMultipleSymbolsPriceTicker = async (symbols: string[]): Promise<Record<string, string>> => {
  try {
    const data = await fetchWithCache<any[]>('/ticker/price');
    
    // Filter and convert to a map of symbol -> price
    const priceMap: Record<string, string> = {};
    data.forEach(item => {
      if (symbols.includes(item.symbol)) {
        priceMap[item.symbol] = item.price;
      }
    });
    
    return priceMap;
  } catch (error) {
    console.error('Error fetching multiple symbols price ticker:', error);
    return {};
  }
};

/**
 * Create a WebSocket connection for real-time updates with error handling and fallback
 */
export const createWebSocket = (symbol: string, callbacks: {
  onTrade?: (trade: any) => void;
  onKline?: (kline: any) => void;
  onDepth?: (depth: any) => void;
  onError?: (error: any) => void;
}) => {
  // Check if WebSocket is available in the current environment
  if (typeof window === 'undefined' || !window.WebSocket) {
    console.warn("WebSocket not available in this environment");
    // Call onError with informative message
    if (callbacks.onError) {
      callbacks.onError(new Error("WebSocket not available"));
    }
    // Return a dummy object with the expected interface
    return {
      close: () => {}
    };
  }

  // Lowercase for the stream name as per Binance docs
  const symbolLower = symbol.toLowerCase();
  
  // Combine multiple streams
  const streams = [
    `${symbolLower}@trade`,
    `${symbolLower}@kline_1m`,
    `${symbolLower}@depth20@100ms`
  ].join('/');
  
  // Create WebSocket connection with proper error handling
  let ws: WebSocket;
  let connectionFailed = false;
  
  try {
    ws = new WebSocket(`${WEBSOCKET_URL}/${streams}`);
  } catch (error) {
    console.error("Failed to create WebSocket:", error);
    // Call onError with the actual error
    if (callbacks.onError) {
      callbacks.onError(error);
    }
    // Return a dummy object with the expected interface
    return {
      close: () => {}
    };
  }
  
  // Generate mock data for fallback
  const generateMockData = () => {
    if (connectionFailed) {
      // Mock trade data
      if (callbacks.onTrade) {
        const mockPrice = Math.random() * 1000 + 2000; // Random price between 2000-3000
        callbacks.onTrade({
          e: "trade",
          p: mockPrice.toFixed(2),
          q: (Math.random() * 2).toFixed(4),
          T: Date.now()
        });
      }
      
      // Mock kline data
      if (callbacks.onKline) {
        const basePrice = Math.random() * 1000 + 2000;
        callbacks.onKline({
          e: "kline",
          k: {
            t: Date.now() - 60000, // Start time
            T: Date.now(), // End time
            s: symbol,
            i: "1m", // Interval
            o: basePrice.toFixed(2), // Open price
            c: (basePrice + Math.random() * 10 - 5).toFixed(2), // Close price
            h: (basePrice + Math.random() * 15).toFixed(2), // High price
            l: (basePrice - Math.random() * 15).toFixed(2), // Low price
            v: (Math.random() * 100).toFixed(2), // Volume
            n: Math.floor(Math.random() * 100), // Number of trades
            q: (Math.random() * 200000).toFixed(2) // Quote volume
          }
        });
      }
      
      // Mock depth data
      if (callbacks.onDepth) {
        const basePrice = Math.random() * 1000 + 2000;
        const mockDepth = {
          lastUpdateId: Date.now(),
          bids: Array.from({length: 10}, (_, i) => {
            const price = (basePrice - i * 0.5).toFixed(2);
            const quantity = (Math.random() * 5).toFixed(4);
            return [price, quantity];
          }),
          asks: Array.from({length: 10}, (_, i) => {
            const price = (basePrice + (i + 1) * 0.5).toFixed(2);
            const quantity = (Math.random() * 5).toFixed(4);
            return [price, quantity];
          })
        };
        callbacks.onDepth(mockDepth);
      }
    }
  };
  
  // Use mock data if WebSocket fails
  let mockDataInterval: NodeJS.Timeout;

  ws.onopen = () => {
    console.log(`WebSocket connection opened for ${symbol}`);
    connectionFailed = false;
    
    // Clear any existing mock data interval
    if (mockDataInterval) {
      clearInterval(mockDataInterval);
    }
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      
      switch (data.e) {
        case 'trade':
          if (callbacks.onTrade) callbacks.onTrade(data);
          break;
        case 'kline':
          if (callbacks.onKline) callbacks.onKline(data);
          break;
        default:
          // Handle depth (orderbook) updates
          if (data.stream?.includes('depth') && callbacks.onDepth) {
            callbacks.onDepth(data.data);
          }
          break;
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    connectionFailed = true;
    
    // Start generating mock data
    if (!mockDataInterval) {
      mockDataInterval = setInterval(generateMockData, 2000);
    }
    
    if (callbacks.onError) {
      callbacks.onError(new Error("WebSocket connection failed"));
    }
  };

  ws.onclose = () => {
    console.log(`WebSocket connection closed for ${symbol}`);
    connectionFailed = true;
    
    // Start generating mock data if not already
    if (!mockDataInterval) {
      mockDataInterval = setInterval(generateMockData, 2000);
    }
  };

  return {
    close: () => {
      if (ws && ws.readyState !== WebSocket.CLOSED) {
        try {
          ws.close();
        } catch (e) {
          console.error("Error closing WebSocket:", e);
        }
      }
      
      // Clear the mock data interval
      if (mockDataInterval) {
        clearInterval(mockDataInterval);
      }
    }
  };
};

/**
 * Format large numbers for display
 */
export const formatNumber = (num: number | string, precision: number = 2): string => {
  const value = typeof num === 'string' ? parseFloat(num) : num;
  
  if (isNaN(value)) return '0';
  
  if (value >= 1e9) return `${(value / 1e9).toFixed(precision)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(precision)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(precision)}K`;
  
  return value.toFixed(precision);
};
