import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface MarketCapChartProps {
  data: any;
  timeframe: string;
}

export default function MarketCapChart({ data, timeframe }: MarketCapChartProps) {
  // Return empty chart if no data
  if (!data || !data.prices || data.prices.length === 0) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center bg-gray-800/20">
        <p className="text-gray-400">No chart data available</p>
      </div>
    );
  }

  // Process chart data based on timeframe
  const processChartData = () => {
    const dataPoints: { date: string; price: number; volume: number }[] = [];
    let interval = 1; // Default interval

    // Adjust interval based on timeframe and data length to avoid overcrowding
    if (timeframe === '1y' && data.prices.length > 30) {
      interval = Math.floor(data.prices.length / 30);
    } else if (timeframe === '30d' && data.prices.length > 30) {
      interval = Math.floor(data.prices.length / 30);
    }

    // Format date based on timeframe
    const formatDate = (timestamp: number) => {
      const date = new Date(timestamp);
      if (timeframe === '24h') {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (timeframe === '7d') {
        return date.toLocaleDateString([], { weekday: 'short' });
      } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
    };

    // Select points based on interval
    for (let i = 0; i < data.prices.length; i += interval) {
      const [timestamp, price] = data.prices[i];
      const volume = data.total_volumes[i] ? data.total_volumes[i][1] : 0;
      
      dataPoints.push({
        date: formatDate(timestamp),
        price,
        volume,
      });
    }

    return dataPoints;
  };

  const chartData = processChartData();
  const isPositive = chartData[0].price <= chartData[chartData.length - 1].price;
  const chartColor = isPositive ? '#10B981' : '#EF4444';
  
  // Format Y-axis values for Bitcoin prices
  const formatYAxis = (value: number) => {
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
        >
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColor} stopOpacity={0.8} />
              <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="date" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9CA3AF', fontSize: 10 }}
            minTickGap={10}
          />
          <YAxis 
            tickFormatter={formatYAxis}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9CA3AF', fontSize: 10 }}
            domain={['auto', 'auto']}
          />
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-gray-800 p-2 border border-gray-700 rounded shadow-lg">
                    <p className="text-white font-medium">{payload[0].payload.date}</p>
                    <p className="text-gray-300">Price: <span className="text-white">${payload[0].value?.toLocaleString()}</span></p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area 
            type="monotone" 
            dataKey="price" 
            stroke={chartColor} 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorPrice)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
