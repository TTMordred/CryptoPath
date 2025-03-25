'use client';

import { useEffect, useState, useCallback, useMemo, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { fetchAvailableCoins, CoinOption, TOKEN_CONTRACTS } from "@/services/cryptoService";
import { Loader2, AlertCircle, RefreshCcw, TrendingUp, ChevronDown } from "lucide-react";
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

// Optimize chart loading with proper SSR handling and caching
const Chart = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), {
  ssr: false,
  loading: () => (
    <div className="h-[350px] flex items-center justify-center bg-gradient-to-b from-gray-900/50 to-gray-800/50 rounded-xl backdrop-blur-sm">
      <Loader2 className="h-8 w-8 animate-spin text-[#F5B056]" />
    </div>
  )
});

interface ChartData {
  date: string;
  price: number;
  volume: number;
}

// Memoized components
const LoadingState = memo(({ coinName }: { coinName?: string }) => (
  <div className="flex flex-col items-center justify-center h-[400px] space-y-4 bg-gradient-to-b from-gray-900/50 to-gray-800/50 rounded-xl backdrop-blur-sm animate-fade-in">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
    >
      <Loader2 className="h-8 w-8 text-[#F5B056]" />
    </motion.div>
    <p className="text-gray-400 font-medium">Loading {coinName || ''} data...</p>
  </div>
));
LoadingState.displayName = "LoadingState";

const ErrorState = memo(({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="flex flex-col items-center justify-center h-[400px] space-y-4 bg-gradient-to-b from-red-900/20 to-gray-800/50 rounded-xl backdrop-blur-sm animate-fade-in">
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <AlertCircle className="h-8 w-8 text-red-500" />
    </motion.div>
    <p className="text-red-500 font-medium">{error}</p>
    <Button
      variant="outline"
      onClick={onRetry}
      className="bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700/50 hover:text-white transition-all duration-200 backdrop-blur-sm"
    >
      <RefreshCcw className="mr-2 h-4 w-4" />
      Retry
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
  const [availableCoins, setAvailableCoins] = useState<CoinOption[]>([
    { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
    { id: 'usd-coin', symbol: 'USDC', name: 'USDC' },
    { id: 'wrapped-bitcoin', symbol: 'WBTC', name: 'Wrapped Bitcoin' },
    { id: 'chainlink', symbol: 'LINK', name: 'Chainlink' },
    { id: 'shiba-inu', symbol: 'SHIB', name: 'Shiba Inu' },
    { id: 'uniswap', symbol: 'UNI', name: 'Uniswap' },
    { id: 'dai', symbol: 'DAI', name: 'Dai' },
    { id: 'aave', symbol: 'AAVE', name: 'Aave' },
  ]);
  const [loadingCoins, setLoadingCoins] = useState(true);

  // Memoize handlers
  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
  }, []);

  const handleCoinChange = useCallback((coinId: string) => {
    const coin = availableCoins.find(c => c.id === coinId);
    if (coin) {
      setSelectedCoin(coin);
      onCoinChange(coin);
      setError(null);
    }
  }, [availableCoins, onCoinChange]);

  // Fetch available coins
  useEffect(() => {
    let mounted = true;
    const fetchCoins = async () => {
      try {
        setLoadingCoins(true);
        const coins = await fetchAvailableCoins();
        if (!mounted) return;
        
        // Filter coins to only those with contract addresses and remove Tether
        const supportedCoins = coins.filter(coin => TOKEN_CONTRACTS[coin.id] && coin.id !== 'tether');
        setAvailableCoins(supportedCoins);
        
        if (supportedCoins.length > 0) {
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
    return () => { mounted = false; };
  }, [onCoinChange]);

  // Optimize data fetching with proper cleanup and error handling
  const fetchData = useCallback(async () => {
    if (!selectedCoin) return;

    let mounted = true;
    let retryAttempt = 0;
    const maxRetries = 3;
    const retryDelay = 2000; // 2 seconds

    try {
      setLoading(true);
      setError(null);

      // Use Binance API for fetching historical data
      const response = await fetch(`https://data-api.binance.vision/api/v3/klines?symbol=${selectedCoin.symbol.toUpperCase()}USDT&interval=1d&limit=30`);
      const data = await response.json();

      if (!mounted) return;

      if (!data || data.length === 0) {
        throw new Error('No data available for this coin');
      }

      const chartData: ChartData[] = data.map((item: any) => {
        const date = new Date(item[0]);
        return {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          price: Number(item[4]), // Closing price
          volume: Number(item[5]) // Volume
        };
      });

      setData(chartData);
      setLoading(false);
      retryAttempt = 0; // Reset retry counter on success
    } catch (err) {
      console.error('Error fetching data:', err);
      if (mounted) {
        if (retryAttempt < maxRetries) {
          retryAttempt++;
          console.log(`Retrying (${retryAttempt}/${maxRetries})...`);
          setTimeout(fetchData, retryDelay);
        } else {
          setError(err instanceof Error ? err.message : 'Failed to fetch data');
          setLoading(false);
        }
      }
    }

    return () => {
      mounted = false;
    };
  }, [selectedCoin]);

  useEffect(() => {
    const timeoutId = setTimeout(fetchData, 100);
    return () => clearTimeout(timeoutId);
  }, [fetchData]);

  // Memoize chart data
  const chartConfig = useMemo(() => ({
    gradients: (
      <defs>
        <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
        </linearGradient>
        <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
          <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
        </linearGradient>
      </defs>
    ),
    tooltipStyle: {
      backgroundColor: 'rgba(17, 24, 39, 0.95)',
      border: '1px solid rgba(75, 85, 99, 0.3)',
      borderRadius: '12px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      backdropFilter: 'blur(8px)',
    },
    customTooltip: (props: any) => {
      if (!props.active || !props.payload || !props.payload.length) {
        return null;
      }

      const priceValue = props.payload.find((p: any) => p.dataKey === 'price');
      const volumeValue = props.payload.find((p: any) => p.dataKey === 'volume');

      return (
        <div className="bg-gray-900/95 border border-gray-700/30 rounded-xl p-2 shadow-lg backdrop-blur-lg">
          <p className="text-gray-400 mb-1">{props.label}</p>
          {priceValue && (
            <p className="text-[#3b82f6] font-medium">
              Price: ${priceValue.value.toLocaleString()}
            </p>
          )}
          {volumeValue && (
            <p className="text-[#22d3ee] font-medium">
              Volume: {volumeValue.value.toLocaleString()}
            </p>
          )}
        </div>
      );
    }
  }), []);

  return (
    <div className="space-y-6">
      <Card className="bg-white/5 rounded-[10px] p-4 border border-gray-800 backdrop-blur-[4px] animate-fade-in">
        <CardHeader className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-[#F5B056] to-[#E09346] p-2 rounded-xl">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <CardTitle className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                {selectedCoin?.name || 'Loading...'} Price & Volume
              </CardTitle>
            </div>
            <Select
              value={selectedCoin?.id}
              onValueChange={handleCoinChange}
              disabled={loadingCoins}
            >
              <SelectTrigger className="w-[200px] bg-gray-800/50 border-gray-700/50 text-gray-300 hover:bg-gray-700/50 transition-colors duration-200 backdrop-blur-sm [&>svg]:hidden">
                {loadingCoins ? (
                  <div className="flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading...
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <SelectValue placeholder="Select a coin" />
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </div>
                )}
              </SelectTrigger>
              <SelectContent className="bg-gray-800/95 border-gray-700/50 backdrop-blur-md">
                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                  {availableCoins.map((coin) => (
                    <SelectItem
                      key={coin.id}
                      value={coin.id}
                      className="text-gray-300 hover:bg-gray-700/50 focus:bg-gray-700/50 focus:text-white transition-colors duration-200"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[#F5B056]">{coin.symbol}</span>
                        <span className="text-gray-400">-</span>
                        <span>{coin.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </div>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <AnimatePresence mode="wait">
            {loading ? (
              <LoadingState coinName={selectedCoin?.name} />
            ) : error ? (
              <ErrorState error={error} onRetry={handleRetry} />
            ) : (
              <motion.div
                key="chart"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="h-[400px]"
              >
                <Chart width="100%" height="100%">
                  <LineChart data={data}>
                    {chartConfig.gradients}
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis 
                      dataKey="date"
                      stroke="#666"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#9ca3af' }}
                      dy={10}
                    />
                    <YAxis
                      yAxisId="left"
                      stroke="#666" 
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `$${value.toLocaleString()}`}
                      tick={{ fill: '#9ca3af' }}
                      width={80}
                      padding={{ top: 0 }}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      stroke="#666"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value.toLocaleString()}`}
                      tick={{ fill: '#9ca3af' }}
                      width={110} 
                      padding={{ top: 20 }}
                    />
                    <Tooltip 
                      content={chartConfig.customTooltip}
                      cursor={{ stroke: '#666', strokeWidth: 1 }}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="price"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 8, strokeWidth: 2 }}
                      name="price"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="volume"
                      stroke="#22d3ee"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 8, strokeWidth: 2 }}
                      name="volume"
                    />
                  </LineChart>
                </Chart>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      <AnimatePresence>
        {selectedCoin && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <CoinAnalytics selectedCoin={selectedCoin} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
RevenueGraph.displayName = "RevenueGraph";

export default RevenueGraph;
