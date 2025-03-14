'use client';

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fetchHistoricalData, fetchAvailableCoins, CryptoMarketData, CoinOption } from "@/services/cryptoService";
import { Loader2, AlertCircle, RefreshCcw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface ChartData {
  date: string;
  price: number;
  volume: number;
}

export default function RevenueGraph() {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [selectedCoin, setSelectedCoin] = useState<CoinOption>({
    id: 'ethereum',
    symbol: 'ETH',
    name: 'Ethereum'
  });
  const [availableCoins, setAvailableCoins] = useState<CoinOption[]>([]);
  const [loadingCoins, setLoadingCoins] = useState(true);

  // Fetch available coins
  useEffect(() => {
    const fetchCoins = async () => {
      try {
        setLoadingCoins(true);
        const coins = await fetchAvailableCoins();
        setAvailableCoins(coins);
      } catch (err) {
        console.error('Error fetching available coins:', err);
      } finally {
        setLoadingCoins(false);
      }
    };

    fetchCoins();
  }, []);

  // Fetch data for selected coin
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const coinData = await fetchHistoricalData(selectedCoin.id, 30);
        
        // Process the data
        const chartData: ChartData[] = coinData.prices.map((price, index) => {
          const date = new Date(price[0]);
          return {
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            price: price[1],
            volume: coinData.total_volumes[index][1] / 1000000 // Convert to millions
          };
        });

        setData(chartData);
      } catch (err) {
        setError('Failed to fetch data. Please try again.');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCoin, retryCount]);

  const handleCoinChange = (coinId: string) => {
    const coin = availableCoins.find(c => c.id === coinId);
    if (coin) {
      setSelectedCoin(coin);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  const LoadingState = () => (
    <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-[#F5B056]" />
      <p className="text-gray-400">Loading {selectedCoin.name} data...</p>
    </div>
  );

  const ErrorState = () => (
    <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
      <AlertCircle className="h-8 w-8 text-red-500" />
      <p className="text-red-500">{error}</p>
      <Button
        variant="outline"
        onClick={handleRetry}
        className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
      >
        <RefreshCcw className="mr-2 h-4 w-4" />
        Retry
      </Button>
    </div>
  );

  return (
    <Card className="bg-gray-900 border border-gray-800 rounded-2xl">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl text-gray-300">
            {selectedCoin.name} Price & Volume
          </CardTitle>
          <Select
            value={selectedCoin.id}
            onValueChange={handleCoinChange}
            disabled={loadingCoins}
          >
            <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700 text-gray-300">
              {loadingCoins ? (
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading...
                </div>
              ) : (
                <SelectValue placeholder="Select a coin" />
              )}
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              {availableCoins.map((coin) => (
                <SelectItem
                  key={coin.id}
                  value={coin.id}
                  className="text-gray-300 hover:bg-gray-700 focus:bg-gray-700 focus:text-gray-300"
                >
                  {coin.symbol} - {coin.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState />
        ) : (
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <XAxis
                  dataKey="date"
                  stroke="#666"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#666"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#666"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value.toFixed(0)}M`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value: number, name: string) => [
                    name === 'price' ? `$${value.toLocaleString()}` : `${value.toFixed(0)}M`,
                    name === 'price' ? 'Price' : 'Volume'
                  ]}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="price"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                  name="price"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="volume"
                  stroke="#22d3ee"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                  name="volume"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 
