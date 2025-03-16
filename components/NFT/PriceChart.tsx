'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface PricePoint {
  date: string;
  price: number;
}

interface PriceChartProps {
  data: PricePoint[];
  tokenId?: string;
}

export default function PriceChart({ data, tokenId }: PriceChartProps) {
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [chartData, setChartData] = useState<PricePoint[]>([]);

  // Filter data based on selected time range
  useEffect(() => {
    if (!data || data.length === 0) {
      setChartData([
        { date: '00:00', price: 100 },
        { date: '04:00', price: 120 },
        { date: '08:00', price: 90 },
        { date: '12:00', price: 150 },
        { date: '16:00', price: 180 },
        { date: '20:00', price: 200 },
        { date: '24:00', price: 160 },
      ]); // Placeholder data
      return;
    }

    const now = new Date();
    let filterDate = new Date();

    switch (timeRange) {
      case '1h':
        filterDate.setHours(now.getHours() - 1);
        break;
      case '24h':
        filterDate.setDate(now.getDate() - 1);
        break;
      case '7d':
        filterDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        filterDate.setDate(now.getDate() - 30);
        break;
    }

    const filtered = data.filter((point) => {
      const pointDate = new Date(point.date);
      return pointDate >= filterDate;
    });

    setChartData(filtered);
  }, [data, timeRange]);

  const formatYAxis = (value: number) => {
    return `${value} PATH`;
  };

  // Calculate price change
  const priceChange = chartData.length >= 2
    ? ((chartData[chartData.length - 1].price - chartData[0].price) / chartData[0].price) * 100
    : 0;

  const isPriceUp = priceChange >= 0;

  return (
    <Card className="border border-gray-800 bg-black/40">
      <CardHeader className="pb-0">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold text-white">
            {tokenId ? `NFT #${tokenId} Price History` : 'Market Price Trends'}
          </CardTitle>
          <Tabs defaultValue={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
            <TabsList className="bg-gray-800">
              <TabsTrigger value="1h">1H</TabsTrigger>
              <TabsTrigger value="24h">24H</TabsTrigger>
              <TabsTrigger value="7d">7D</TabsTrigger>
              <TabsTrigger value="30d">30D</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-sm text-gray-400">Current Price</p>
            <p className="text-xl font-bold text-white">
              {chartData.length > 0 ? chartData[chartData.length - 1].price : 0} PATH
            </p>
          </div>
          <div className={`text-sm ${isPriceUp ? 'text-green-500' : 'text-red-500'}`}>
            {priceChange.toFixed(2)}%
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis 
                dataKey="date"
                tick={{ fill: '#999' }}
                stroke="#444"
              />
              <YAxis
                tickFormatter={formatYAxis}
                tick={{ fill: '#999' }}
                stroke="#444" 
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#222', border: '1px solid #444' }}
                labelStyle={{ color: '#aaa' }}
                formatter={(value: number) => [`${value} PATH`, 'Price']}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke={isPriceUp ? "#10b981" : "#ef4444"}
                dot={false}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
