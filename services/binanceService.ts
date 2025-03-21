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
const BINANCE_API_URL = 'https://data-api.binance.vision/api/v3';
const WEBSOCKET_URL = 'wss://stream.binance.com:9443/ws';
const CACHE_DURATION = 60000; // 1 minute cache

// Cache storage
const cache: Record<string, { data: any, timestamp: number }> = {};

// Stablecoin filter - these will be excluded from results
export const STABLECOINS = ['USDT', 'USDC', 'BUSD', 'DAI', 'TUSD', 'UST', 'USDP', 'GUSD'];

/**
 * Fetch data with caching
 */
// Retry configuration
const RETRY_ATTEMPTS = 3;
const INITIAL_RETRY_DELAY = 1000;

const fetchWithCache = async <T>(endpoint: string, params: Record<string, string> = {}): Promise<T> => {
  const queryString = new URLSearchParams(params).toString();
  const binanceUrl = `${BINANCE_API_URL}${endpoint}${queryString ? '?' + queryString : ''}`;
  const proxyUrl = `/api/proxy?url=${encodeURIComponent(binanceUrl)}`;
  const cacheKey = binanceUrl;

  // Check cache
  const cachedData = cache[cacheKey];
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
    return cachedData.data as T;
  }

  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < RETRY_ATTEMPTS; attempt++) {
    try {
      // Add exponential backoff delay after first attempt
      if (attempt > 0) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      const response = await fetch(proxyUrl);
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
      console.error(`Error fetching ${binanceUrl} (attempt ${attempt + 1}/${RETRY_ATTEMPTS}):`, error);
      lastError = error as Error;
      
      // If it's the last attempt, throw the error
      if (attempt === RETRY_ATTEMPTS - 1) {
        throw new Error(`Failed after ${RETRY_ATTEMPTS} attempts: ${lastError.message}`);
      }
    }
  }

  // This should never be reached due to the throw above, but TypeScript needs it
  throw lastError;
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
interface WebSocketMessage {
  data: string;
  type: string;
  target: WebSocket;
}

interface WebSocketCallbacks {
  onTrade?: (trade: any) => void;
  onKline?: (kline: any) => void;
  onDepth?: (depth: any) => void;
  onError?: (error: Error) => void;
}

interface WSData {
  e?: string;
  k?: any;
  data?: any;
  stream?: string;
  result?: string;
}

export const createWebSocket = (symbol: string, callbacks: WebSocketCallbacks) => {
  // WebSocket configuration
  const RECONNECT_DELAY = 3000; // Reduced initial delay
  const MAX_RECONNECT_ATTEMPTS = 10; // Increased max attempts
  const HEARTBEAT_INTERVAL = 30000;
  const CONNECTION_TIMEOUT = 10000; // 10 second connection timeout
  
  let ws: WebSocket | null = null;
  let reconnectAttempts = 0;
  let heartbeatInterval: NodeJS.Timeout;
  let reconnectTimeout: NodeJS.Timeout;
  let connectionTimeout: NodeJS.Timeout;
  let isReconnecting = false;
  let isClosed = false;

  // Check if WebSocket is available
  if (typeof window === 'undefined' || !window.WebSocket) {
    console.warn("WebSocket not available in this environment");
    if (callbacks.onError) {
      callbacks.onError(new Error("WebSocket not available"));
    }
    return { close: () => {} };
  }

  const symbolLower = symbol.toLowerCase();
  let currentInterval = '1m';
  
  const getStreams = (interval: string = '1m') => [
    `${symbolLower}@trade`,
    `${symbolLower}@kline_${interval}`,
    `${symbolLower}@depth20@100ms`
  ].join('/');

  const updateSubscription = (socket: WebSocket, newInterval: string) => {
    if (socket.readyState === WebSocket.OPEN) {
      // Unsubscribe from current interval
      socket.send(JSON.stringify({
        method: 'UNSUBSCRIBE',
        params: [`${symbolLower}@kline_${currentInterval}`],
        id: 2
      }));

      // Subscribe to new interval
      socket.send(JSON.stringify({
        method: 'SUBSCRIBE',
        params: [`${symbolLower}@kline_${newInterval}`],
        id: 3
      }));

      currentInterval = newInterval;
    }
  };

  const clearTimers = () => {
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
  };

  const setupHeartbeat = (socket: WebSocket) => {
    clearInterval(heartbeatInterval);
    heartbeatInterval = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ method: "ping" }));
      }
    }, HEARTBEAT_INTERVAL);
  };

  const handleMessage = (event: MessageEvent) => {
    try {
      const data: WSData = JSON.parse(event.data);
      
      // Handle pong response
      if (data.result === 'pong') return;

      if (data.e === 'trade' && callbacks.onTrade) {
        callbacks.onTrade(data);
      } else if (data.e === 'kline' && callbacks.onKline) {
        callbacks.onKline(data);
      } else if (data.stream?.includes('depth') && callbacks.onDepth) {
        callbacks.onDepth(data.data);
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  };

  const connect = () => {
    try {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.close();
      }

      ws = new WebSocket(`${WEBSOCKET_URL}/${getStreams(currentInterval)}`);

      // Set connection timeout
      connectionTimeout = setTimeout(() => {
        if (ws && ws.readyState !== WebSocket.OPEN) {
          ws.close();
          if (callbacks.onError) {
            callbacks.onError(new Error('Connection timeout'));
          }
        }
      }, CONNECTION_TIMEOUT);

      ws.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log(`WebSocket connected for ${symbol}`);
        reconnectAttempts = 0;
        isReconnecting = false;
        if (ws) {
          setupHeartbeat(ws);
          // Send initial subscription message
          ws.send(JSON.stringify({
            method: 'SUBSCRIBE',
            params: [`${symbol.toLowerCase()}@trade`, `${symbol.toLowerCase()}@kline_1m`],
            id: 1
          }));
        }
      };

      ws.onmessage = handleMessage;

      ws.onerror = (error: Event) => {
        console.error('WebSocket error:', error);
        if (callbacks.onError) {
          callbacks.onError(new Error('WebSocket connection error'));
        }
        // Attempt to reconnect on error if not already reconnecting
        if (!isReconnecting && !isClosed) {
          ws?.close(); // This will trigger onclose and reconnection
        }
      };

      ws.onclose = () => {
        clearTimers();
        clearTimeout(connectionTimeout);
        
        if (!isClosed && !isReconnecting && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          isReconnecting = true;
          reconnectAttempts++;
          
          const delay = RECONNECT_DELAY * Math.pow(1.5, reconnectAttempts - 1); // Gentler exponential backoff
          console.log(`WebSocket reconnecting... Attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} (delay: ${delay}ms)`);
          
          reconnectTimeout = setTimeout(() => {
            connect();
          }, delay);
          
          if (callbacks.onError) {
            callbacks.onError(new Error(`Connection lost, attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`));
          }
        } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
          console.error('Max reconnection attempts reached');
          if (callbacks.onError) {
            callbacks.onError(new Error('Failed to establish stable connection'));
          }
          // Reset reconnection state to allow manual reconnection attempts
          reconnectAttempts = 0;
          isReconnecting = false;
        }
      };
    } catch (error) {
      console.error("Failed to create WebSocket:", error);
      if (callbacks.onError) {
        callbacks.onError(new Error('Failed to create WebSocket connection'));
      }
    }
  };

  // Initial connection
  connect();

  return {
    close: () => {
      isClosed = true;
      clearTimers();
      
      if (ws && ws.readyState !== WebSocket.CLOSED) {
        try {
          ws.close();
        } catch (error) {
          console.error("Error closing WebSocket:", error);
        }
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
