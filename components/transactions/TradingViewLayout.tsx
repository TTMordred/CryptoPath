'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getTradingPairs, STABLECOINS } from '@/services/binanceService';
import { Loader2, RefreshCw } from 'lucide-react';
import TradingChart from './TradingChart';
import Orderbook from './Orderbook';
import { Button } from "@/components/ui/button";

interface TradingPair {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
}

export default function TradingViewLayout() {
  const [tradingPairs, setTradingPairs] = useState<TradingPair[]>([]);
  const [selectedPair, setSelectedPair] = useState<TradingPair | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        
        // Set default to ETH/USDT, or first available pair
        const defaultPair = filteredPairs.find((pair: TradingPair) => pair.symbol === 'ETHUSDT') || filteredPairs[0];
        setSelectedPair(defaultPair);
        
      } catch (err) {
        console.error('Error fetching trading pairs:', err);
        setError('Failed to fetch trading pairs');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPairs();
  }, []);

  const handlePairChange = (symbol: string) => {
    const pair = tradingPairs.find(p => p.symbol === symbol);
    if (pair) {
      setSelectedPair(pair);
    }
  };

  const handleRefresh = () => {
    if (selectedPair) {
      // Force refresh by resetting and then setting the pair
      const currentPair = selectedPair;
      setSelectedPair(null);
      setTimeout(() => setSelectedPair(currentPair), 100);
    }
  };

  if (loading) {
    return (
      <Card className="bg-white/5 rounded-[10px] p-4 border border-gray-800 backdrop-blur-[4px]">
        <CardContent className="flex items-center justify-center h-[350px]">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#F5B056] mb-2" />
            <span className="text-gray-400 text-sm">Loading trading view...</span>
          </div>
        </CardContent>
      </Card>
    );
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
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-3">
                <TradingChart 
                  symbol={selectedPair.symbol}
                  baseAsset={selectedPair.baseAsset}
                  quoteAsset={selectedPair.quoteAsset}
                />
              </div>
              <div>
                <Orderbook 
                  symbol={selectedPair.symbol}
                  baseAsset={selectedPair.baseAsset}
                  quoteAsset={selectedPair.quoteAsset}
                />
              </div>
            </div>
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
