'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getTradingPairs, STABLECOINS } from '@/services/binanceService';
import { Loader2, RefreshCw } from 'lucide-react';
import TradingChart from './TradingChart';
import Orderbook from './Orderbook';
import { Button } from "@/components/ui/button";
import { motion } from 'framer-motion';

interface TradingPair {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
}

// Add skeleton loader component
const TradingViewSkeleton = () => (
  <Card className="bg-white/5 animate-pulse">
    <CardHeader>
      <div className="flex justify-between">
        <div className="h-6 bg-gray-700/50 rounded w-32" />
        <div className="h-6 bg-gray-700/50 rounded w-40" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 h-[400px] bg-gray-700/50 rounded" />
        <div className="h-[400px] bg-gray-700/50 rounded" />
      </div>
    </CardContent>
  </Card>
);

export default function TradingViewLayout() {
  const [tradingPairs, setTradingPairs] = useState<TradingPair[]>([]);
  const [selectedPair, setSelectedPair] = useState<TradingPair | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Add loading states for different operations
  const [refreshing, setRefreshing] = useState(false);
  const [changingPair, setChangingPair] = useState(false);

  useEffect(() => {
    const fetchPairs = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const pairs = await getTradingPairs();
        
        // Filter out stablecoins and sort by popularity/volume
        const filteredPairs = pairs
          .filter((pair: TradingPair) => !STABLECOINS.includes(pair.baseAsset))
          .sort((a: TradingPair, b: TradingPair) => {
            // Prioritize major coins
            const majorCoins = ['BTC', 'ETH', 'BNB', 'SOL'];
            const aIndex = majorCoins.indexOf(a.baseAsset);
            const bIndex = majorCoins.indexOf(b.baseAsset);
            
            if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
            if (aIndex !== -1) return -1;
            if (bIndex !== -1) return 1;
            
            return a.baseAsset.localeCompare(b.baseAsset);
          });
        
        setTradingPairs(filteredPairs);
        
        // Set default to BTC/USDT, or first available pair
        const defaultPair = filteredPairs.find((pair: TradingPair) => pair.symbol === 'BTCUSDT') || filteredPairs[0];
        // Small delay to ensure stable initialization
        setTimeout(() => setSelectedPair(defaultPair), 100);
        
      } catch (err) {
        console.error('Error fetching trading pairs:', err);
        setError('Failed to fetch trading pairs');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPairs();
  }, []);

  // Optimize pair selection with useMemo
  const groupedPairs = useMemo(() => {
    if (!tradingPairs.length) return {};
    
    return tradingPairs.reduce((acc: Record<string, TradingPair[]>, pair) => {
      if (!acc[pair.quoteAsset]) {
        acc[pair.quoteAsset] = [];
      }
      acc[pair.quoteAsset].push(pair);
      return acc;
    }, {});
  }, [tradingPairs]);

  // Add retry with exponential backoff
  const retryFetch = async (attempt = 1) => {
    try {
      setLoading(true);
      setError(null);
      const pairs = await getTradingPairs();
      // ...existing pair processing...
    } catch (err) {
      if (attempt < 3) {
        setTimeout(() => retryFetch(attempt + 1), Math.pow(2, attempt) * 1000);
      } else {
        setError('Failed to fetch trading pairs after multiple attempts');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePairChange = (symbol: string) => {
    setChangingPair(true);
    const pair = tradingPairs.find(p => p.symbol === symbol);
    if (pair) {
      setSelectedPair(pair);
      // Add slight delay to ensure smooth transition
      setTimeout(() => setChangingPair(false), 300);
    }
  };

  // Enhanced refresh handling
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await retryFetch();
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return <TradingViewSkeleton />;
  }

  if (error) {
    return (
      <Card className="bg-white/5 rounded-[10px] p-4 border border-gray-800 backdrop-blur-[4px]">
        <CardContent className="p-4 text-center text-red-400">
          {error}
          <Button 
            variant="outline" 
            size="sm"
            className="mt-4 bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white/5 rounded-[10px] p-4 border border-gray-800 backdrop-blur-[4px]">
        <CardHeader className="p-4 pb-0">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg text-white">Trading View</CardTitle>
            <div className="flex items-center space-x-2">
              <Select
                value={selectedPair?.symbol}
                onValueChange={handlePairChange}
              >
                <SelectTrigger className="w-[150px] bg-gray-800/50 border-gray-700 text-white">
                  <SelectValue placeholder="Select pair" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 max-h-60">
                  {tradingPairs.map((pair) => (
                    <SelectItem 
                      key={pair.symbol} 
                      value={pair.symbol}
                      className="text-gray-300 hover:bg-gray-700/50 focus:bg-gray-700/50 focus:text-white"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{pair.baseAsset}</span>
                        <span className="text-gray-500">/</span>
                        <span className="text-gray-400">{pair.quoteAsset}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white hover:bg-gray-700/50"
                onClick={handleRefresh}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {selectedPair ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-4 gap-4"
            >
              <div className={`lg:col-span-3 ${changingPair ? 'opacity-50' : ''}`}>
                <TradingChart 
                  key={selectedPair.symbol}
                  symbol={selectedPair.symbol}
                  baseAsset={selectedPair.baseAsset}
                  quoteAsset={selectedPair.quoteAsset}
                />
              </div>
              <div className={changingPair ? 'opacity-50' : ''}>
                <Orderbook 
                  key={selectedPair.symbol}
                  symbol={selectedPair.symbol}
                  baseAsset={selectedPair.baseAsset}
                  quoteAsset={selectedPair.quoteAsset}
                />
              </div>
            </motion.div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              Select a trading pair to view chart
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
