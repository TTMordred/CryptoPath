'use client';

import { useEffect, useState, useCallback, useMemo, memo, Suspense, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Area, ComposedChart } from "recharts";
import { fetchAvailableCoins, CoinOption, TOKEN_CONTRACTS } from "@/services/cryptoService";
import { Loader2, AlertCircle, RefreshCcw, TrendingUp, ChevronDown, Clock, DollarSign, RefreshCw, Globe } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import CoinAnalytics from './CoinAnalytics';
import { motion, AnimatePresence } from "framer-motion";
import dynamic from 'next/dynamic';

// Cache for API responses with 30-second cooldown
const dataCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_DURATION = 30 * 1000; // 30 seconds cooldown
const FORCED_COOLDOWN = 30 * 1000; // 30 seconds between refresh attempts

// Define supported chains
const SUPPORTED_CHAINS = [
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', color: '#3b82f6' },
  { id: 'bnb', name: 'BNB Chain', symbol: 'BNB', color: '#F0B90B' },
];

// Use lightweight skeleton loader
const ChartSkeleton = () => (
  <div className="h-[400px] flex flex-col items-center justify-center bg-gradient-to-b from-gray-900/30 to-gray-800/30 rounded-xl">
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div className="animate-pulse w-8 h-8 bg-gray-700/50 rounded-full mb-2"></div>
      <div className="animate-pulse w-32 h-4 bg-gray-700/50 rounded-md"></div>
    </div>
  </div>
);

// Optimize chart loading with progressive loading strategy
const Chart = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), {
  ssr: false,
  loading: () => <ChartSkeleton />
});

interface ChartData {
  date: string;
  price: number;
  volume: number;
  timestamp?: number;
}

// Simplified loading state
const LoadingState = memo(({ coinName }: { coinName?: string }) => (
  <div className="h-[400px] flex items-center justify-center">
    <div className="flex flex-col items-center">
      <Loader2 className="h-8 w-8 animate-spin text-[#F5B056]" />
      <p className="mt-2 text-gray-400 text-sm">Loading {coinName || ''}</p>
    </div>
  </div>
));
LoadingState.displayName = "LoadingState";

// Simplified error state
const ErrorState = memo(({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="flex flex-col items-center justify-center h-[400px] space-y-3">
    <AlertCircle className="h-6 w-6 text-red-500" />
    <p className="text-red-400">{error}</p>
    <Button variant="outline" onClick={onRetry} size="sm">
      <RefreshCcw className="mr-2 h-3 w-3" />Retry
    </Button>
  </div>
));
ErrorState.displayName = "ErrorState";

interface RevenueGraphProps {
  onCoinChange: (coin: CoinOption | null) => void;
}

const RevenueGraph: React.FC<RevenueGraphProps> = memo(({ onCoinChange }) => {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [selectedCoin, setSelectedCoin] = useState<CoinOption | null>(null);
  const [selectedChain, setSelectedChain] = useState(SUPPORTED_CHAINS[0]);
  const [availableCoins, setAvailableCoins] = useState<CoinOption[]>([
    { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
    { id: 'usd-coin', symbol: 'USDC', name: 'USDC' },
    { id: 'wrapped-bitcoin', symbol: 'WBTC', name: 'Wrapped Bitcoin' },
    { id: 'chainlink', symbol: 'LINK', name: 'Chainlink' },
  ]);
  const [loadingCoins, setLoadingCoins] = useState(false);
  const [timeRange, setTimeRange] = useState('1d'); // Default to 1d only
  const [initialLoad, setInitialLoad] = useState(true);
  
  // Cooldown state management
  const [nextRefreshTime, setNextRefreshTime] = useState<number>(0);
  const [refreshCountdown, setRefreshCountdown] = useState<number>(0);
  const [isRefreshCoolingDown, setIsRefreshCoolingDown] = useState<boolean>(false);
  const lastFetchTimeRef = useRef<Record<string, number>>({});

  // Manual refresh handler with cooldown
  const handleManualRefresh = useCallback(() => {
    const now = Date.now();
    if (now < nextRefreshTime) {
      // Still in cooldown
      return;
    }
    
    setRetryCount(prev => prev + 1);
    setNextRefreshTime(now + FORCED_COOLDOWN);
    setIsRefreshCoolingDown(true);
    setRefreshCountdown(FORCED_COOLDOWN / 1000);
  }, [nextRefreshTime]);
  
  // Countdown timer for refresh cooldown
  useEffect(() => {
    if (!isRefreshCoolingDown) return;
    
    const timer = setInterval(() => {
      const secondsLeft = Math.ceil((nextRefreshTime - Date.now()) / 1000);
      
      if (secondsLeft <= 0) {
        setIsRefreshCoolingDown(false);
        clearInterval(timer);
      } else {
        setRefreshCountdown(secondsLeft);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isRefreshCoolingDown, nextRefreshTime]);
  
  // Memoize handlers
  const handleRetry = useCallback(() => {
    handleManualRefresh();
  }, [handleManualRefresh]);

  const handleCoinChange = useCallback((coinId: string) => {
    const coin = availableCoins.find(c => c.id === coinId);
    if (coin) {
      setSelectedCoin(coin);
      onCoinChange(coin);
      setError(null);
    }
  }, [availableCoins, onCoinChange]);

  const handleChainChange = useCallback((chainId: string) => {
    const chain = SUPPORTED_CHAINS.find(c => c.id === chainId);
    if (chain) {
      setSelectedChain(chain);
      setError(null); // Clear error state
      setLoading(true); // Set loading state
      setRetryCount(prev => prev + 1); // Trigger a refresh
    }
  }, []);

  // Set initial coin immediately to improve perceived performance
  useEffect(() => {
    if (!selectedCoin && availableCoins.length > 0) {
      const ethereum = availableCoins.find(c => c.id === 'ethereum') || availableCoins[0];
      setSelectedCoin(ethereum);
      onCoinChange(ethereum);
    }
  }, [availableCoins, selectedCoin, onCoinChange]);

  // Fetch available coins in the background with cooldown
  useEffect(() => {
    let mounted = true;
    
    const fetchCoins = async () => {
      const cacheKey = 'available-coins';
      const now = Date.now();
      const lastFetchTime = lastFetchTimeRef.current[cacheKey] || 0;
      
      // Apply cooldown to coin fetching
      if (now - lastFetchTime < CACHE_DURATION) {
        return; // Still in cooldown period
      }
      
      try {
        lastFetchTimeRef.current[cacheKey] = now;
        const coins = await fetchAvailableCoins();
        if (!mounted) return;
        
        // Filter coins to only those with contract addresses and remove Tether
        const supportedCoins = coins.filter(coin => TOKEN_CONTRACTS[coin.id] && coin.id !== 'tether');
        setAvailableCoins(supportedCoins);
        
        if (supportedCoins.length > 0 && !selectedCoin) {
          const ethereum = supportedCoins.find(c => c.id === 'ethereum') || supportedCoins[0];
          setSelectedCoin(ethereum);
          onCoinChange(ethereum);
        }
      } catch (err) {
        console.error('Error fetching coins:', err);
      } finally {
        if (mounted) {
          setLoadingCoins(false);
        }
      }
    };

    fetchCoins();
    
    // Set up a refresh interval with cooldown
    const refreshInterval = setInterval(() => {
      fetchCoins();
    }, CACHE_DURATION * 2); // Refresh coins list every minute
    
    return () => { 
      mounted = false; 
      clearInterval(refreshInterval);
    };
  }, [onCoinChange, selectedCoin]);

  // Get time range in days - simplified to only have 1d
  const getTimeRangeDays = useMemo(() => {
    return 1; // Always return 1 day
  }, []);

  // Format date based on time range - simplified for 1d only
  const formatDate = useCallback((timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);
  
  // Add a new function to filter unique dates
  const getUniqueChartData = useCallback((data: ChartData[]) => {
    const uniqueDates = new Set<string>();
    return data.filter(item => {
      if (!uniqueDates.has(item.date)) {
        uniqueDates.add(item.date);
        return true;
      }
      return false;
    });
  }, []);

  // Optimized data fetching with caching and cooldown
  const fetchData = useCallback(async () => {
    if (!selectedCoin) return;

    const cacheKey = `${selectedChain.id}-${selectedCoin.symbol}-${timeRange}`;
    const cachedData = dataCache.get(cacheKey);
    const now = Date.now();
    const lastFetchTime = lastFetchTimeRef.current[cacheKey] || 0;
    
    // Use cached data if available and not expired
    if (cachedData && (now - cachedData.timestamp < CACHE_DURATION)) {
      setData(cachedData.data);
      setLoading(false);
      setInitialLoad(false);
      return;
    }
    
    // Apply cooldown to prevent excessive refreshes
    if (now - lastFetchTime < FORCED_COOLDOWN) {
      // If we have some data to show, use it and don't set loading state
      if (cachedData) {
        setData(cachedData.data);
        setLoading(false);
        setInitialLoad(false);
        return;
      }
    }
    
    // Update the last fetch time
    lastFetchTimeRef.current[cacheKey] = now;
    
    let mounted = true;

    // For first load, show loading skeleton only for a short time
    if (initialLoad) {
      setTimeout(() => {
        if (mounted && loading) {
          setInitialLoad(false);
        }
      }, 500);
    }

    try {
      // Calculate interval based on time range - simplified for 1d only
      const interval = '1h';
      
      // Request only what's needed
      const limit = 24; // 24 hours for 1d

      // Define possible trading pairs to try
      let tradingPairs = [];
      
      if (selectedChain.id === 'bnb') {
        // For BNB Chain, try multiple pair formats
        if (['USDT', 'USDC', 'DAI', 'BUSD'].includes(selectedCoin.symbol.toUpperCase())) {
          // Stablecoins usually paired with BNB
          tradingPairs = [`${selectedCoin.symbol.toUpperCase()}BNB`];
        } else {
          // Try both BNB and USDT pairs
          tradingPairs = [
            `${selectedCoin.symbol.toUpperCase()}BNB`,
            `${selectedCoin.symbol.toUpperCase()}USDT`,
            `BNB${selectedCoin.symbol.toUpperCase()}`
          ];
        }
      } else {
        // For Ethereum, try USDT and ETH pairs
        tradingPairs = [
          `${selectedCoin.symbol.toUpperCase()}USDT`,
          `${selectedCoin.symbol.toUpperCase()}ETH`
        ];
      }
      
      let successfulResponse = null;
      let responseError = null;
      
      // Try each trading pair until one works
      for (const pair of tradingPairs) {
        try {
          console.log(`Trying trading pair: ${pair}`);
          const response = await fetch(
            `https://data-api.binance.vision/api/v3/klines?symbol=${pair}&interval=${interval}&limit=${limit}`,
            { cache: 'no-store' }
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data && data.length > 0) {
              successfulResponse = data;
              break;
            }
          }
        } catch (pairError) {
          responseError = pairError;
          console.warn(`Failed with pair ${pair}:`, pairError);
        }
      }
      
      if (!successfulResponse) {
        throw new Error(responseError ? responseError.toString() : 'No valid trading pair found');
      }

      if (!mounted) return;

      // Optimize data processing
      const chartData = successfulResponse.map((item: any) => {
        return {
          date: formatDate(item[0]),
          price: Number(item[4]), // Closing price
          volume: Number(item[5]) // Volume
        };
      });

      // Cache the result
      dataCache.set(cacheKey, { 
        data: chartData, 
        timestamp: now
      });

      setData(chartData);
      setLoading(false);
      setInitialLoad(false);
      setError(null); // Clear any previous errors
      
      // Set the next refresh time
      setNextRefreshTime(now + FORCED_COOLDOWN);
      
    } catch (err) {
      console.error('Error fetching data:', err);
      if (mounted) {
        setError(`Failed to load chart data for ${selectedCoin.name} on ${selectedChain.name}`);
        setLoading(false);
        setInitialLoad(false);
      }
    }

    return () => {
      mounted = false;
    };
  }, [selectedCoin, selectedChain, timeRange, loading, initialLoad, formatDate]);

  // Fetch data when timeRange changes (added retryCount to dependencies)
  useEffect(() => {
    if (selectedCoin) {
      setLoading(true);
      const timeoutId = setTimeout(fetchData, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [fetchData, selectedCoin, retryCount, timeRange]);

  // Calculate price stats - simplified
  const priceStats = useMemo(() => {
    if (data.length === 0) return { currentPrice: 0, change: 0, changePercent: 0 };
    
    const latestPrice = data[data.length - 1].price;
    const firstPrice = data[0].price;
    const change = latestPrice - firstPrice;
    const changePercent = (change / firstPrice) * 100;
    
    return { currentPrice: latestPrice, change, changePercent };
  }, [data]);

  // Format price for display - memoized to avoid re-calculations
  const formattedPrice = useMemo(() => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: priceStats.currentPrice < 1 ? 4 : 2,
      maximumFractionDigits: priceStats.currentPrice < 1 ? 4 : 2,
    }).format(priceStats.currentPrice);
  }, [priceStats.currentPrice]);

  const formattedChange = useMemo(() => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: priceStats.change < 1 && priceStats.change > -1 ? 4 : 2,
      maximumFractionDigits: priceStats.change < 1 && priceStats.change > -1 ? 4 : 2,
    }).format(priceStats.change);
  }, [priceStats.change]);

  // Simplified chart config
  const renderChart = () => {
    if (loading && initialLoad) {
      return <LoadingState coinName={selectedCoin?.name} />;
    }
    
    if (error) {
      return <ErrorState error={error} onRetry={handleRetry} />;
    }

    const uniqueData = getUniqueChartData(data);

    return (
      <div className="h-[400px]">
        <Chart width="100%" height="100%">
          <ComposedChart data={uniqueData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={selectedChain.color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={selectedChain.color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#444444" vertical={false} />
            <XAxis 
              dataKey="date"
              stroke="#666666"
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              dy={10}
            />
            <YAxis
              yAxisId="left"
              stroke="#666666" 
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value.toLocaleString()}`}
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              width={80}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="#666666"
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${(value/1000000).toFixed(1)}M`}
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              width={70} 
            />
            <Tooltip 
              content={(props: any) => {
                if (!props.active || !props.payload || !props.payload.length) return null;
                
                const priceValue = props.payload.find((p: any) => p.dataKey === 'price');
                const volumeValue = props.payload.find((p: any) => p.dataKey === 'volume');
                
                return (
                  <div className="bg-gray-900/95 border border-gray-700/50 rounded-lg p-2 shadow-lg">
                    <p className="text-gray-400 text-sm">{props.label}</p>
                    {priceValue && (
                      <p className="text-sm font-medium" style={{ color: selectedChain.color }}>
                        Price: ${priceValue.value.toLocaleString()}
                      </p>
                    )}
                    {volumeValue && <p className="text-[#22d3ee] text-sm font-medium">Vol: {volumeValue.value.toLocaleString()}</p>}
                    <p className="text-xs text-gray-500 mt-1">Chain: {selectedChain.name}</p>
                  </div>
                );
              }}
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="volume"
              fill="url(#priceGradient)"
              stroke="#22d3ee"
              strokeWidth={1}
              fillOpacity={0.1}
              name="volume"
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="price"
              stroke={selectedChain.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6, strokeWidth: 2 }}
              name="price"
            />
          </ComposedChart>
        </Chart>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/5 rounded-[16px] p-0 border border-gray-800 backdrop-blur-[4px] overflow-hidden shadow-xl">
        <CardHeader className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-[#F5B056] to-[#E09346] p-3 rounded-xl">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                  {selectedCoin?.name || 'Loading...'} Price Chart
                </CardTitle>
                {data.length > 0 && (
                  <div className="flex items-center mt-1 gap-2">
                    <span className="text-xl font-bold">{formattedPrice}</span>
                    <span className={`text-sm font-medium ${priceStats.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {priceStats.changePercent >= 0 ? '+' : ''}{priceStats.changePercent.toFixed(2)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Select
                value={selectedChain.id}
                onValueChange={handleChainChange}
              >
                <SelectTrigger className="w-[140px] bg-gray-800/70 border-gray-700/50 text-gray-300">
                  <div className="flex items-center w-full">
                    <Globe className="h-3.5 w-3.5 mr-2 text-gray-400" />
                    <span className="truncate">{selectedChain.name}</span>
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-gray-800/95 border-gray-700/50 backdrop-blur-md">
                  {SUPPORTED_CHAINS.map((chain) => (
                    <SelectItem
                      key={chain.id}
                      value={chain.id}
                      className="text-gray-300"
                    >
                      <div className="flex items-center">
                        <div 
                          className="w-2 h-2 rounded-full mr-2"
                          style={{ backgroundColor: chain.color }}
                        ></div>
                        {chain.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={selectedCoin?.id}
                onValueChange={handleCoinChange}
                disabled={loadingCoins}
              >
                <SelectTrigger className="w-[180px] bg-gray-800/70 border-gray-700/50 text-gray-300">
                  {loadingCoins ? (
                    <div className="flex items-center">
                      <Loader2 className="h-3 w-3 animate-spin mr-2" />
                      Loading...
                    </div>
                  ) : (
                    <div className="flex items-center w-full">
                      <span className="truncate">{selectedCoin?.name || "Select coin"}</span>
                    </div>
                  )}
                </SelectTrigger>
                <SelectContent className="bg-gray-800/95 border-gray-700/50 backdrop-blur-md">
                  <div className="max-h-[300px] overflow-y-auto">
                    {availableCoins.map((coin) => (
                      <SelectItem
                        key={coin.id}
                        value={coin.id}
                        className="text-gray-300"
                      >
                        <span className="text-[#F5B056] mr-1">{coin.symbol}</span>
                        {coin.name}
                      </SelectItem>
                    ))}
                  </div>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        {/* Additional chart metadata */}
        {!loading && !error && data.length > 0 && (
          <div className="px-6 pb-3 flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-gray-400">Range:</span>
              <span className="text-white font-medium">24 hours</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-400" />
              <span className="text-gray-400">Change:</span>
              <span className={`font-medium ${priceStats.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formattedChange}
              </span>
            </div>
            {/* Add data freshness indicator */}
            {data.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">
                  Updates every 30s
                </span>
                {isRefreshCoolingDown && (
                  <span className="inline-flex h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
                )}
              </div>
            )}
          </div>
        )}
        
        <CardContent className="p-6 pt-0">
          {renderChart()}
        </CardContent>
      </Card>

      {/* Only render analytics when we have a selected coin */}
      {selectedCoin && !initialLoad && (
        <Suspense fallback={<div className="h-24 animate-pulse bg-gray-800/20 rounded-lg"/>}>
          <CoinAnalytics selectedCoin={selectedCoin} cooldownTime={CACHE_DURATION} />
        </Suspense>
      )}
    </div>
  );
});

RevenueGraph.displayName = "RevenueGraph";

export default RevenueGraph;
