'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getOrderbook, Orderbook as OrderbookType, OrderbookEntry, createWebSocket } from '@/services/binanceService';
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, ArrowUpDown } from 'lucide-react';

interface OrderbookProps {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
}

export default function Orderbook({ symbol, baseAsset, quoteAsset }: OrderbookProps) {
  const [orderbook, setOrderbook] = useState<OrderbookType>({ lastUpdateId: 0, bids: [], asks: [] });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<'both' | 'bids' | 'asks'>('both');
  const [precision, setPrecision] = useState<number>(2);

  // Set precision based on price (more decimals for lower-priced assets)
  useEffect(() => {
    if (orderbook.bids.length > 0) {
      const price = parseFloat(orderbook.bids[0].price);
      if (price < 0.1) setPrecision(6);
      else if (price < 1) setPrecision(5);
      else if (price < 10) setPrecision(4);
      else if (price < 100) setPrecision(3);
      else setPrecision(2);
    }
  }, [orderbook]);

  // Format number with proper precision
  const formatPrice = (price: string | number) => {
    return typeof price === 'string' 
      ? parseFloat(price).toFixed(precision)
      : price.toFixed(precision);
  };

  // Calculate spread
  const spread = useMemo(() => {
    if (orderbook.asks.length > 0 && orderbook.bids.length > 0) {
      const askPrice = parseFloat(orderbook.asks[orderbook.asks.length - 1].price);
      const bidPrice = parseFloat(orderbook.bids[0].price);
      const spreadValue = askPrice - bidPrice;
      const spreadPercent = (spreadValue / bidPrice) * 100;
      return {
        value: formatPrice(spreadValue),
        percent: spreadPercent.toFixed(2)
      };
    }
    return { value: '0', percent: '0' };
  }, [orderbook, precision]);

  // Fetch initial orderbook data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getOrderbook(symbol);
        setOrderbook(data);
      } catch (err) {
        console.error('Error fetching orderbook:', err);
        setError('Failed to load orderbook data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up WebSocket for real-time updates
    const ws = createWebSocket(symbol, {
      onDepth: (depthData) => {
        setOrderbook(prevOrderbook => {
          // Process and calculate totals for bids and asks
          const processOrders = (orders: [string, string][]): OrderbookEntry[] => {
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
            lastUpdateId: depthData.lastUpdateId,
            bids: processOrders(depthData.bids),
            asks: processOrders(depthData.asks.reverse())
          };
        });
      },
      onError: (err) => {
        console.error('WebSocket error:', err);
        setError('Connection error. Please refresh.');
      }
    });

    return () => {
      ws.close();
    };
  }, [symbol]);

  // Calculate max total for visualization
  const maxTotal = useMemo(() => {
    let maxBid = 0;
    let maxAsk = 0;

    if (orderbook.bids.length) {
      maxBid = parseFloat(orderbook.bids[orderbook.bids.length - 1].total || '0');
    }

    if (orderbook.asks.length) {
      maxAsk = parseFloat(orderbook.asks[orderbook.asks.length - 1].total || '0');
    }

    return Math.max(maxBid, maxAsk);
  }, [orderbook]);

  // Determine the display items based on selected mode
  const displayItems = useMemo(() => {
    const MAX_ROWS = displayMode === 'both' ? 10 : 20;
    
    let bids: OrderbookEntry[] = [];
    let asks: OrderbookEntry[] = [];

    if (displayMode === 'both' || displayMode === 'bids') {
      bids = orderbook.bids.slice(0, MAX_ROWS);
    }

    if (displayMode === 'both' || displayMode === 'asks') {
      asks = orderbook.asks.slice(-MAX_ROWS).reverse();
    }

    return { bids, asks };
  }, [orderbook, displayMode]);

  if (loading) {
    return (
      <Card className="bg-white/5 rounded-[10px] p-4 border border-gray-800 backdrop-blur-[4px]">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-lg text-white flex items-center justify-between">
            <span>Order Book</span>
            <span className="text-sm text-gray-400">{baseAsset}/{quoteAsset}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-2">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>Price ({quoteAsset})</span>
            <span>Amount ({baseAsset})</span>
            <span>Total</span>
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={`ask-${i}`} className="flex justify-between mb-1">
              <Skeleton className="h-4 w-20 bg-red-900/30" />
              <Skeleton className="h-4 w-20 bg-gray-800" />
              <Skeleton className="h-4 w-20 bg-gray-800" />
            </div>
          ))}
          <div className="my-2 p-2 bg-gray-800/50 rounded-md flex justify-between items-center text-xs">
            <span className="text-gray-400">Spread</span>
            <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={`bid-${i}`} className="flex justify-between mb-1">
              <Skeleton className="h-4 w-20 bg-green-900/30" />
              <Skeleton className="h-4 w-20 bg-gray-800" />
              <Skeleton className="h-4 w-20 bg-gray-800" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white/5 rounded-[10px] p-4 border border-gray-800 backdrop-blur-[4px]">
        <CardHeader className="p-4">
          <CardTitle className="text-lg text-white">Order Book</CardTitle>
        </CardHeader>
        <CardContent className="p-4 text-center text-red-400">
          {error}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/5 rounded-[10px] p-4 border border-gray-800 backdrop-blur-[4px]">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-gray-400" />
            <span>Order Book</span>
          </CardTitle>
          <Tabs defaultValue="both" className="w-[200px]">
            <TabsList className="bg-gray-900">
              <TabsTrigger 
                value="bids" 
                className="text-xs"
                onClick={() => setDisplayMode('bids')}
              >
                Bids
              </TabsTrigger>
              <TabsTrigger 
                value="both" 
                className="text-xs"
                onClick={() => setDisplayMode('both')}
              >
                Both
              </TabsTrigger>
              <TabsTrigger 
                value="asks" 
                className="text-xs"
                onClick={() => setDisplayMode('asks')}
              >
                Asks
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-2">
        {/* Column Headers */}
        <div className="flex justify-between text-xs text-gray-400 mb-2 px-1">
          <span>Price ({quoteAsset})</span>
          <span>Amount ({baseAsset})</span>
          <span>Total</span>
        </div>

        {/* Asks (Sell Orders) - reversed to show highest first */}
        <div className="space-y-1 mb-2">
          {displayItems.asks.map((ask, idx) => {
            const percentage = ask.total ? (parseFloat(ask.total) / maxTotal) * 100 : 0;
            return (
              <div 
                key={`ask-${idx}`} 
                className="flex justify-between text-sm relative overflow-hidden"
              >
                <div 
                  className="absolute top-0 right-0 bottom-0 bg-gradient-to-l from-red-900/20 to-transparent z-0" 
                  style={{ width: `${percentage}%` }}
                />
                <span className="z-10 text-red-500">{formatPrice(ask.price)}</span>
                <span className="z-10 text-white">{parseFloat(ask.quantity).toFixed(6)}</span>
                <span className="z-10 text-gray-400">{ask.total}</span>
              </div>
            );
          })}
        </div>

        {/* Spread */}
        <div className="my-3 py-2 px-3 bg-gray-800/50 rounded-md flex justify-between items-center text-xs">
          <span className="text-gray-400">Spread</span>
          <div>
            <span className="text-white">{spread.value}</span>
            <span className="text-gray-400 ml-2">({spread.percent}%)</span>
          </div>
        </div>

        {/* Bids (Buy Orders) */}
        <div className="space-y-1">
          {displayItems.bids.map((bid, idx) => {
            const percentage = bid.total ? (parseFloat(bid.total) / maxTotal) * 100 : 0;
            return (
              <div 
                key={`bid-${idx}`} 
                className="flex justify-between text-sm relative overflow-hidden"
              >
                <div 
                  className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-green-900/20 to-transparent z-0" 
                  style={{ width: `${percentage}%` }}
                />
                <span className="z-10 text-green-500">{formatPrice(bid.price)}</span>
                <span className="z-10 text-white">{parseFloat(bid.quantity).toFixed(6)}</span>
                <span className="z-10 text-gray-400">{bid.total}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
