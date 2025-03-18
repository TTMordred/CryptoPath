'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { getKlineData, get24hrTicker, formatNumber, createWebSocket, KlineData, MarketTicker } from '@/services/binanceService';
import { 
  Loader2, TrendingUp, TrendingDown, Clock, BarChart4, LineChart, 
  CandlestickChart, LayoutGrid, HelpCircle, Maximize2, RefreshCcw, 
  ChevronDown, Settings, GaugeCircle, Eye
} from 'lucide-react';
import { 
  Area, AreaChart, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  BarChart, Bar, CartesianGrid, LineChart as ReChartsLine, Line, Brush 
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

interface TradingChartProps {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
}

// Available time intervals for chart with labels for display
const intervals = [
  { value: '1m', label: '1m' },
  { value: '5m', label: '5m' },
  { value: '15m', label: '15m' },
  { value: '30m', label: '30m' },
  { value: '1h', label: '1h' },
  { value: '4h', label: '4h' },
  { value: '1d', label: '1d' },
  { value: '1w', label: '1w' },
];

// Chart types
type ChartType = 'candlestick' | 'line' | 'area';

export default function TradingChart({ symbol, baseAsset, quoteAsset }: TradingChartProps) {
  const [chartData, setChartData] = useState<KlineData[]>([]);
  const [tickerData, setTickerData] = useState<MarketTicker | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interval, setInterval] = useState('1h');
  const [chartType, setChartType] = useState<ChartType>('area');
  const [lastPrice, setLastPrice] = useState<string | null>(null);
  const [priceDirection, setPriceDirection] = useState<'up' | 'down' | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [showVolume, setShowVolume] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [legendVisible, setLegendVisible] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [chartHeight, setChartHeight] = useState(350);
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const lastPriceRef = useRef<string | null>(null);
  const lastUpdateTimeRef = useRef<string>(new Date().toLocaleTimeString());
  const chartRef = useRef<HTMLDivElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const ws = useRef<any>(null);
  
  // Theme colors based on selected theme - more professional and closer to Binance's style
  const chartTheme = useMemo(() => ({
    background: theme === 'dark' ? 'transparent' : '#ffffff',
    textColor: theme === 'dark' ? '#D1D5DB' : '#374151',
    gridColor: theme === 'dark' ? 'rgba(31, 41, 55, 0.6)' : '#E5E7EB',
    areaStroke: theme === 'dark' ? '#F5B056' : '#F59E0B',
    areaFill: theme === 'dark' ? 'url(#colorPrice)' : 'url(#colorPriceLight)',
    lineStroke: theme === 'dark' ? '#F5B056' : '#F59E0B',
    greenCandle: theme === 'dark' ? '#22c55e' : '#16a34a',
    redCandle: theme === 'dark' ? '#ef4444' : '#dc2626',
    tooltip: {
      bg: theme === 'dark' ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      border: theme === 'dark' ? '#374151' : '#E5E7EB',
      text: theme === 'dark' ? '#f5f5f5' : '#1F2937',
    },
    volume: {
      up: theme === 'dark' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.2)',
      down: theme === 'dark' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)',
    },
    brush: {
      fill: theme === 'dark' ? "rgba(41, 50, 65, 0.8)" : "rgba(241, 245, 249, 0.8)",
      stroke: theme === 'dark' ? "#374151" : "#9CA3AF"
    },
    indicators: {
      ma: theme === 'dark' ? "#38BDF8" : "#0EA5E9", // Moving average
      bb: theme === 'dark' ? "#8B5CF6" : "#7C3AED", // Bollinger bands
      rsi: theme === 'dark' ? "#F472B6" : "#EC4899", // RSI
    }
  }), [theme]);
  
  // Fetch initial kline data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch both kline and ticker data
        const [klineData, ticker] = await Promise.all([
          getKlineData(symbol, interval),
          get24hrTicker(symbol)
        ]);
        
        setChartData(klineData);
        setTickerData(ticker);
        
        // Initialize last price
        setLastPrice(ticker.lastPrice);
        lastPriceRef.current = ticker.lastPrice;
        lastUpdateTimeRef.current = new Date().toLocaleTimeString();
        
      } catch (err) {
        console.error('Error fetching chart data:', err);
        setError('Failed to load chart data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Set up WebSocket for real-time price updates
    ws.current = createWebSocket(symbol, {
      onTrade: (trade) => {
        if (!trade || !trade.p) return;
        const newPrice = trade.p;
        
        // Update last price and direction
        setLastPrice(newPrice);
        lastUpdateTimeRef.current = new Date().toLocaleTimeString();
        
        if (lastPriceRef.current !== null) {
          const prevPrice = parseFloat(lastPriceRef.current);
          const currentPrice = parseFloat(newPrice);
          
          setPriceDirection(currentPrice > prevPrice ? 'up' : 
                           (currentPrice < prevPrice ? 'down' : null));
        }
        
        lastPriceRef.current = newPrice;
      },
      onKline: (klineData) => {
        const k = klineData.k;
        
        // Update the latest candle in the chart data
        setChartData(prev => {
          // Find if we already have this candle (by time)
          const index = prev.findIndex(candle => candle.time === k.t);
          
          if (index >= 0) {
            // Update existing candle
            const updated = [...prev];
            updated[index] = {
              time: k.t,
              open: parseFloat(k.o),
              high: parseFloat(k.h),
              low: parseFloat(k.l),
              close: parseFloat(k.c),
              volume: parseFloat(k.v),
              closeTime: k.T,
              quoteVolume: parseFloat(k.q),
              trades: k.n
            };
            return updated;
          } else {
            // Add new candle at the end and remove oldest if needed
            const newData = [...prev];
            
            // Only add if it's a newer candle
            if (prev.length === 0 || k.t > prev[prev.length - 1].time) {
              newData.push({
                time: k.t,
                open: parseFloat(k.o),
                high: parseFloat(k.h),
                low: parseFloat(k.l),
                close: parseFloat(k.c),
                volume: parseFloat(k.v),
                closeTime: k.T,
                quoteVolume: parseFloat(k.q),
                trades: k.n
              });
              
              // Keep array at 500 items max
              if (newData.length > 500) {
                newData.shift();
              }
            }
            
            return newData;
          }
        });
      },
      onError: (error) => {
        console.error('WebSocket error:', error);
      }
    });
    
    return () => {
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
    };
  }, [symbol, interval]);

  // Handle interval change
  const handleIntervalChange = async (newInterval: string) => {
    setLoading(true);
    try {
      // Get initial data for new interval
      const data = await getKlineData(symbol, newInterval);
      setChartData(data);
      setInterval(newInterval);
      
      // Update WebSocket subscription
      if (ws.current?.updateInterval) {
        ws.current.updateInterval(newInterval);
      }
    } catch (error) {
      console.error('Failed to change interval:', error);
      setError('Failed to update chart interval');
    } finally {
      setLoading(false);
    }
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setFullscreen(!fullscreen);
    
    if (!fullscreen && chartRef.current) {
      if (chartRef.current.requestFullscreen) {
        chartRef.current.requestFullscreen();
      }
    }
  };

  // Handle exit fullscreen
  useEffect(() => {
    const handleExitFullscreen = () => {
      if (!document.fullscreenElement) {
        setFullscreen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleExitFullscreen);
    return () => {
      document.removeEventListener('fullscreenchange', handleExitFullscreen);
    };
  }, []);

  // Format timestamp for display
  const formatTimestamp = (timestamp: number): string => {
    return format(new Date(timestamp), 'MMM dd HH:mm');
  };

  // Format price for display with proper precision
  const formatPrice = (price: number | string): string => {
    const value = typeof price === 'string' ? parseFloat(price) : price;
    
    if (value < 0.1) return value.toFixed(6);
    if (value < 1) return value.toFixed(5);
    if (value < 10) return value.toFixed(4);
    if (value < 1000) return value.toFixed(2);
    return value.toFixed(2);
  };

  // Get precision based on price
  const getPrecision = (price: number): number => {
    if (price < 0.1) return 6;
    if (price < 1) return 5;
    if (price < 10) return 4;
    if (price < 1000) return 2;
    return 2;
  };

  // Add or remove indicator
  const toggleIndicator = (indicator: string) => {
    setSelectedIndicators(current => 
      current.includes(indicator) 
        ? current.filter(i => i !== indicator) 
        : [...current, indicator]
    );
  };

  // Refresh chart data
  const refreshChartData = async () => {
    try {
      setLoading(true);
      const data = await getKlineData(symbol, interval);
      setChartData(data);
      setLoading(false);
      lastUpdateTimeRef.current = new Date().toLocaleTimeString();
    } catch (error) {
      console.error('Failed to refresh chart data:', error);
      setLoading(false);
    }
  };

  // Define interface for chart data including potential indicator properties
  interface FormattedChartDataItem {
    time: number;
    timestamp: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    color: string;
    change: string;
    ma20?: number;
    rsi?: number;
  }

  // Memoize the chart data to optimize rendering and add technical indicators
  const formattedChartData = useMemo(() => {
    // Start with basic chart data
    const baseData = chartData.map((item) => ({
      time: item.time,
      timestamp: formatTimestamp(item.time),
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume,
      color: item.close >= item.open ? 'green' : 'red',
      change: item.open > 0 ? ((item.close - item.open) / item.open * 100).toFixed(2) : '0.00'
    })) as FormattedChartDataItem[];
    
    // Add technical indicators if selected
    if (selectedIndicators.length > 0) {
      // Simple Moving Average (20 period)
      if (selectedIndicators.includes('ma')) {
        const period = 20;
        for (let i = period - 1; i < baseData.length; i++) {
          let sum = 0;
          for (let j = 0; j < period; j++) {
            sum += baseData[i - j].close;
          }
          baseData[i].ma20 = sum / period;
        }
      }
      
      // RSI (14 period) - simplified calculation
      if (selectedIndicators.includes('rsi')) {
        const period = 14;
        for (let i = period; i < baseData.length; i++) {
          let gains = 0;
          let losses = 0;
          
          for (let j = i - period + 1; j <= i; j++) {
            const change = baseData[j].close - baseData[j-1].close;
            if (change > 0) {
              gains += change;
            } else {
              losses -= change;
            }
          }
          
          const avgGain = gains / period;
          const avgLoss = losses / period;
          
          if (avgLoss === 0) {
            baseData[i].rsi = 100;
          } else {
            const rs = avgGain / avgLoss;
            baseData[i].rsi = 100 - (100 / (1 + rs));
          }
        }
      }
    }
    
    return baseData;
  }, [chartData, selectedIndicators]);

  // Determine price color based on price change
  const priceColor = useMemo(() => {
    if (!tickerData) return '';
    return parseFloat(tickerData.priceChangePercent) >= 0 ? 'text-green-500' : 'text-red-500';
  }, [tickerData]);

  // Calculate min and max values for chart
  const chartBounds = useMemo(() => {
    if (chartData.length === 0) return { min: 0, max: 0 };
    
    let min = Number.MAX_VALUE;
    let max = Number.MIN_VALUE;
    
    chartData.forEach((item) => {
      min = Math.min(min, item.low);
      max = Math.max(max, item.high);
    });
    
    // Add 1% padding
    const padding = (max - min) * 0.01;
    return { 
      min: Math.max(0, min - padding), 
      max: max + padding 
    };
  }, [chartData]);

  // Calculate volume bounds
  const volumeBounds = useMemo(() => {
    if (chartData.length === 0) return { min: 0, max: 1 };
    
    let max = 0;
    
    chartData.forEach((item) => {
      max = Math.max(max, item.volume);
    });
    
    return { min: 0, max: max * 1.1 }; // 10% padding on top
  }, [chartData]);

  // Custom tooltip formatter
  const tooltipFormatter = (value: number, name: string) => {
    switch(name) {
      case 'close':
        return [`${formatPrice(value)}`, 'Price'];
      case 'volume':
        return [`${formatNumber(value)}`, 'Volume'];
      case 'open':
        return [`${formatPrice(value)}`, 'Open'];
      case 'high':
        return [`${formatPrice(value)}`, 'High'];
      case 'low':
        return [`${formatPrice(value)}`, 'Low'];
      case 'ma20':
        return [`${formatPrice(value)}`, 'MA(20)'];
      case 'rsi':
        return [`${value.toFixed(2)}`, 'RSI(14)'];
      default:
        return [`${formatPrice(value)}`, name];
    }
  };

  // Fix the labelFormatter to avoid div inside p hydration error
  const labelFormatter = (label: string) => {
    const item = formattedChartData.find(item => item.timestamp === label);
    if (item) {
      return `${label} • Change: ${item.change.startsWith('-') ? '▼' : '▲'} ${item.change}%`;
    }
    return label;
  };

  // Render appropriate chart based on type
  const renderChart = () => {
    if (loading) {
      return (
        <div className="h-full flex items-center justify-center bg-gray-900/50 rounded-xl">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#F5B056] mb-2" />
            <span className="text-gray-400 text-sm">Loading chart data</span>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="h-full flex items-center justify-center bg-gray-900/50 rounded-xl">
          <div className="text-center">
            <div className="text-red-500 mb-2">{error}</div>
            <Button 
              variant="outline"
              size="sm" 
              onClick={refreshChartData}
              className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
            >
              <RefreshCcw className="mr-2 h-3 w-3" />
              Retry
            </Button>
          </div>
        </div>
      );
    }

    switch (chartType) {
      case 'area':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedChartData} margin={{ top: 10, right: 35, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F5B056" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#F5B056" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorPriceLight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="timestamp" 
                tick={{ fill: chartTheme.textColor }} 
                axisLine={{ stroke: chartTheme.gridColor }}
                tickLine={{ stroke: chartTheme.gridColor }}
                height={30}
              />
              <YAxis 
                domain={[chartBounds.min, chartBounds.max]}
                tick={{ fill: chartTheme.textColor }}
                axisLine={{ stroke: chartTheme.gridColor }}
                tickLine={{ stroke: chartTheme.gridColor }}
                tickFormatter={(value) => formatPrice(value)}
                width={60}
                orientation="right"
                yAxisId="price"
              />
              {showVolume && (
                <YAxis 
                  domain={[volumeBounds.min, volumeBounds.max]}
                  tick={{ fill: chartTheme.textColor }}
                  axisLine={{ stroke: 'transparent' }}
                  tickLine={{ stroke: 'transparent' }}
                  tickFormatter={(value) => value === 0 ? '0' : formatNumber(value)}
                  width={60}
                  orientation="left"
                  yAxisId="volume"
                />
              )}
              {showGrid && <CartesianGrid stroke={chartTheme.gridColor} strokeDasharray="3 3" />}
              <Tooltip 
                contentStyle={{
                  backgroundColor: chartTheme.tooltip.bg, 
                  borderColor: chartTheme.tooltip.border,
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  color: chartTheme.tooltip.text
                }}
                labelStyle={{ color: chartTheme.textColor }}
                itemStyle={{ color: chartTheme.tooltip.text }}
                formatter={tooltipFormatter}
                labelFormatter={labelFormatter}
              />
              <Area 
                type="monotone" 
                dataKey="close" 
                stroke={chartTheme.areaStroke} 
                fillOpacity={1}
                fill={chartTheme.areaFill}
                strokeWidth={2}
                yAxisId="price"
                name="Price"
                isAnimationActive={false}
              />
              
              {/* Technical indicators */}
              {selectedIndicators.includes('ma') && (
                <Line 
                  type="monotone" 
                  dataKey="ma20" 
                  stroke={chartTheme.indicators.ma} 
                  dot={false} 
                  strokeWidth={1.5} 
                  yAxisId="price" 
                  name="MA(20)"
                  isAnimationActive={false}
                />
              )}
              
              {showVolume && (
                <Bar
                  dataKey="volume"
                  name="Volume"
                  yAxisId="volume"
                  isAnimationActive={false}
                  shape={(props: any) => {
                    const { x, y, width, height, payload } = props;
                    const color = payload.color === 'green' 
                      ? chartTheme.volume.up 
                      : chartTheme.volume.down;
                    
                    return (
                      <rect 
                        x={x - width/2 + 1} 
                        y={y} 
                        width={width - 2} 
                        height={height} 
                        fill={color}
                      />
                    );
                  }}
                />
              )}
              <Brush
                dataKey="timestamp"
                height={30}
                stroke={chartTheme.brush.stroke}
                fill={chartTheme.brush.fill}
                tickFormatter={() => ''}
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      
      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ReChartsLine data={formattedChartData} margin={{ top: 10, right: 35, left: 0, bottom: 5 }}>
              <XAxis 
                dataKey="timestamp" 
                tick={{ fill: chartTheme.textColor }} 
                axisLine={{ stroke: chartTheme.gridColor }}
                tickLine={{ stroke: chartTheme.gridColor }}
                height={30}
              />
              <YAxis 
                domain={[chartBounds.min, chartBounds.max]}
                tick={{ fill: chartTheme.textColor }}
                axisLine={{ stroke: chartTheme.gridColor }}
                tickLine={{ stroke: chartTheme.gridColor }}
                tickFormatter={(value) => formatPrice(value)}
                width={60}
                orientation="right"
                yAxisId="price"
              />
              {showVolume && (
                <YAxis 
                  domain={[volumeBounds.min, volumeBounds.max]}
                  tick={{ fill: chartTheme.textColor }}
                  axisLine={{ stroke: 'transparent' }}
                  tickLine={{ stroke: 'transparent' }}
                  tickFormatter={(value) => value === 0 ? '0' : formatNumber(value)}
                  width={60}
                  orientation="left"
                  yAxisId="volume"
                />
              )}
              {showGrid && <CartesianGrid stroke={chartTheme.gridColor} />}
              <Tooltip 
                contentStyle={{
                  backgroundColor: chartTheme.tooltip.bg, 
                  borderColor: chartTheme.tooltip.border,
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  color: chartTheme.tooltip.text
                }}
                labelStyle={{ color: chartTheme.textColor }}
                itemStyle={{ color: chartTheme.tooltip.text }}
                formatter={tooltipFormatter}
                labelFormatter={labelFormatter}
              />
              <Line 
                type="monotone" 
                dataKey="close" 
                stroke={chartTheme.lineStroke} 
                strokeWidth={2}
                dot={false} 
                activeDot={{ r: 6, strokeWidth: 2 }}
                yAxisId="price"
                name="Price"
                isAnimationActive={false}
              />
              
              {/* Technical indicators */}
              {selectedIndicators.includes('ma') && (
                <Line 
                  type="monotone" 
                  dataKey="ma20" 
                  stroke={chartTheme.indicators.ma} 
                  dot={false} 
                  strokeWidth={1.5} 
                  yAxisId="price" 
                  name="MA(20)"
                  isAnimationActive={false}
                />
              )}
              
              {showVolume && (
                <Bar
                  dataKey="volume"
                  name="Volume"
                  yAxisId="volume"
                  isAnimationActive={false}
                  shape={(props: any) => {
                    const { x, y, width, height, payload } = props;
                    const color = payload.color === 'green' 
                      ? chartTheme.volume.up 
                      : chartTheme.volume.down;
                    
                    return (
                      <rect 
                        x={x - width/2 + 1} 
                        y={y} 
                        width={width - 2} 
                        height={height} 
                        fill={color}
                      />
                    );
                  }}
                />
              )}
              {legendVisible && (
                <Brush 
                  dataKey="timestamp" 
                  height={30} 
                  stroke={chartTheme.brush.stroke}
                  fill={chartTheme.brush.fill}
                  tickFormatter={() => ''}
                  startIndex={Math.max(0, formattedChartData.length - 100)}
                  endIndex={formattedChartData.length - 1}
                />
              )}
            </ReChartsLine>
          </ResponsiveContainer>
        );

      case 'candlestick':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formattedChartData} margin={{ top: 10, right: 35, left: 0, bottom: 5 }}>
              <XAxis 
                dataKey="timestamp" 
                tick={{ fill: chartTheme.textColor }} 
                axisLine={{ stroke: chartTheme.gridColor }}
                tickLine={{ stroke: chartTheme.gridColor }}
                height={30}
              />
              <YAxis 
                domain={[chartBounds.min, chartBounds.max]}
                tick={{ fill: chartTheme.textColor }}
                axisLine={{ stroke: chartTheme.gridColor }}
                tickLine={{ stroke: chartTheme.gridColor }}
                tickFormatter={(value) => formatPrice(value)}
                width={60}
                orientation="right"
                yAxisId="price"
              />
              {showVolume && (
                <YAxis 
                  domain={[volumeBounds.min, volumeBounds.max]}
                  tick={{ fill: chartTheme.textColor }}
                  axisLine={{ stroke: 'transparent' }}
                  tickLine={{ stroke: 'transparent' }}
                  tickFormatter={(value) => value === 0 ? '0' : formatNumber(value)}
                  width={60}
                  orientation="left"
                  yAxisId="volume"
                />
              )}
              {showGrid && <CartesianGrid stroke={chartTheme.gridColor} />}
              <Tooltip 
                contentStyle={{
                  backgroundColor: chartTheme.tooltip.bg, 
                  borderColor: chartTheme.tooltip.border,
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  color: chartTheme.tooltip.text
                }}
                labelStyle={{ color: chartTheme.textColor }}
                itemStyle={{ color: chartTheme.tooltip.text }}
                formatter={tooltipFormatter}
                labelFormatter={labelFormatter}
              />
              {/* Single Bar for candlesticks */}
              <Bar
                dataKey="high"
                yAxisId="price"
                isAnimationActive={false}
                shape={(props: any) => {
                  const { x, y, width, height, payload } = props;
                  const { open, close, high, low } = payload;
                  
                  // Calculate positions
                  const domain = chartBounds.max - chartBounds.min;
                  const getY = (price: number) => y + height * (1 - (price - chartBounds.min) / domain);
                  
                  const candleX = x;
                  const candleWidth = width * 0.8;
                  const wickX = x + width / 2;
                  
                  const highY = getY(high);
                  const lowY = getY(low);
                  const openY = getY(open);
                  const closeY = getY(close);
                  
                  const candleHeight = Math.abs(closeY - openY) || 2;
                  const candleY = Math.min(closeY, openY);
                  const color = close >= open ? chartTheme.greenCandle : chartTheme.redCandle;
                  
                  return (
                    <g>
                      {/* Wick */}
                      <line
                        x1={wickX}
                        y1={highY}
                        x2={wickX}
                        y2={lowY}
                        stroke={color}
                        strokeWidth={1}
                      />
                      {/* Candle body */}
                      <rect
                        x={candleX}
                        y={candleY}
                        width={candleWidth}
                        height={candleHeight}
                        fill={color}
                        stroke={color}
                      />
                    </g>
                  );
                }}
              />
              
              {/* Technical indicators */}
              {selectedIndicators.includes('ma') && (
                <Line 
                  type="monotone" 
                  dataKey="ma20" 
                  stroke={chartTheme.indicators.ma} 
                  dot={false} 
                  strokeWidth={1.5} 
                  yAxisId="price" 
                  name="MA(20)"
                  isAnimationActive={false}
                />
              )}
              
              {showVolume && (
                <Bar
                  dataKey="volume"
                  name="Volume"
                  yAxisId="volume"
                  isAnimationActive={false}
                  shape={(props: any) => {
                    const { x, y, width, height, payload } = props;
                    const color = payload.color === 'green' 
                      ? chartTheme.volume.up 
                      : chartTheme.volume.down;
                    
                    return (
                      <rect 
                        x={x - width/2 + 1} 
                        y={y} 
                        width={width - 2} 
                        height={height} 
                        fill={color}
                      />
                    );
                  }}
                />
              )}
              {legendVisible && (
                <Brush 
                  dataKey="timestamp" 
                  height={30} 
                  stroke={chartTheme.brush.stroke}
                  fill={chartTheme.brush.fill}
                  tickFormatter={() => ''}
                  startIndex={Math.max(0, formattedChartData.length - 100)}
                  endIndex={formattedChartData.length - 1}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        );
        
      default:
        return null;
    }
  };

  return (
    <Card className="bg-white/5 rounded-[10px] p-4 border border-gray-800 backdrop-blur-[4px] relative overflow-hidden hover:border-amber-500/50 transition-all duration-300">
      <CardHeader className="p-4 pb-2">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex flex-col">
              {/* Crypto name with animated price */}
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <span className="text-xl">{baseAsset}/{quoteAsset}</span>
                <div className="relative inline-block min-w-[120px] h-[30px]">
                  {lastPrice && (
                    <motion.div
                      key={lastPrice}
                      initial={{ opacity: 0, x: priceDirection === 'up' ? -20 : 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: priceDirection === 'up' ? 20 : -20 }}
                      transition={{ duration: 0.2 }}
                      className={`absolute left-0 text-xl font-mono font-bold ${
                        priceDirection === 'up'
                          ? 'text-green-400 price-up'
                          : priceDirection === 'down'
                            ? 'text-red-400 price-down'
                            : priceColor
                      }`}
                    >
                      {formatPrice(lastPrice)}
                    </motion.div>
                  )}
                </div>
              </CardTitle>
              
              {/* Market data with improved design */}
              {tickerData && (
                <div className="flex gap-4 mt-1 text-sm overflow-x-auto pb-1 scrollbar-thin">
                  <span className={`${priceColor} flex items-center whitespace-nowrap`}>
                    {parseFloat(tickerData.priceChangePercent) >= 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {parseFloat(tickerData.priceChangePercent) > 0 ? '+' : ''}
                    {tickerData.priceChangePercent}%
                  </span>
                  <span className="text-gray-400 whitespace-nowrap">
                    24h High: <span className="text-white">{formatPrice(tickerData.highPrice)}</span>
                  </span>
                  <span className="text-gray-400 whitespace-nowrap">
                    24h Low: <span className="text-white">{formatPrice(tickerData.lowPrice)}</span>
                  </span>
                  <span className="text-gray-400 whitespace-nowrap">
                    24h Vol: <span className="text-white">{formatNumber(tickerData.volume)} {baseAsset}</span>
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Chart controls with improved styling */}
          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap md:flex-nowrap">
            {/* Chart type selector */}
            <div className="flex border border-gray-700 rounded-md overflow-hidden backdrop-blur-sm bg-black/30">
              <Button 
                variant="ghost" 
                size="sm"
                className={`px-3 ${chartType === 'candlestick' ? 'bg-amber-500/20 text-amber-400' : 'bg-transparent text-gray-400'}`}
                onClick={() => setChartType('candlestick')}
                title="Candlestick Chart"
              >
                <CandlestickChart className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className={`px-3 ${chartType === 'line' ? 'bg-amber-500/20 text-amber-400' : 'bg-transparent text-gray-400'}`}
                onClick={() => setChartType('line')}
                title="Line Chart"
              >
                <LineChart className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost"
                size="sm"
                className={`px-3 ${chartType === 'area' ? 'bg-amber-500/20 text-amber-400' : 'bg-transparent text-gray-400'}`}
                onClick={() => setChartType('area')}
                title="Area Chart"
              >
                <BarChart4 className="h-4 w-4" />
              </Button>
            </div>

            {/* Time interval selector */}
            <Select
              value={interval}
              onValueChange={handleIntervalChange}
            >
              <SelectTrigger className="w-[80px] bg-gray-800/50 border-gray-700 text-white h-9 hover:border-amber-500/50">
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {intervals.map((int) => (
                  <SelectItem 
                    key={int.value} 
                    value={int.value}
                    className="text-gray-300 hover:bg-amber-500/20 focus:bg-amber-500/20 focus:text-white"
                  >
                    {int.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Settings button - improved style */}
            <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="h-9 w-9 bg-gray-800/50 border-gray-700 text-white hover:border-amber-500/50 hover:bg-amber-500/10"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 bg-gray-800 border-gray-700 text-white p-0">
                <div className="p-2 text-amber-400 text-sm font-medium border-b border-gray-700 flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Chart Settings
                </div>
                <div className="p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-volume" className="text-sm text-gray-300">
                      Show Volume
                    </Label>
                    <Switch
                      id="show-volume"
                      checked={showVolume}
                      onCheckedChange={setShowVolume}
                      className="data-[state=checked]:bg-[#F5B056]"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-grid" className="text-sm text-gray-300">
                      Show Grid
                    </Label>
                    <Switch
                      id="show-grid"
                      checked={showGrid}
                      onCheckedChange={setShowGrid}
                      className="data-[state=checked]:bg-[#F5B056]"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-legend" className="text-sm text-gray-300">
                      Show Time Scale
                    </Label>
                    <Switch
                      id="show-legend"
                      checked={legendVisible}
                      onCheckedChange={setLegendVisible}
                      className="data-[state=checked]:bg-[#F5B056]"
                    />
                  </div>
                  <div className="pt-2 border-t border-gray-700">
                    <Label className="text-sm text-gray-300 mb-2 block">
                      Indicators
                    </Label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm flex items-center gap-2">
                          <Badge className="h-2 w-2 p-0 rounded-full bg-[#38BDF8]" />
                          Moving Average (20)
                        </span>
                        <Switch
                          checked={selectedIndicators.includes('ma')}
                          onCheckedChange={() => toggleIndicator('ma')}
                          className="data-[state=checked]:bg-[#F5B056]"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm flex items-center gap-2">
                          <Badge className="h-2 w-2 p-0 rounded-full bg-[#F472B6]" />
                          RSI (14)
                        </span>
                        <Switch
                          checked={selectedIndicators.includes('rsi')}
                          onCheckedChange={() => toggleIndicator('rsi')}
                          className="data-[state=checked]:bg-[#F5B056]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Indicators button - improved style */}
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="h-9 w-9 bg-gray-800/50 border-gray-700 text-white hover:border-amber-500/50 hover:bg-amber-500/10"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 bg-gray-800 border-gray-700 text-white p-0">
                <div className="p-2 text-gray-300 text-sm font-medium">Indicators</div>
                <div className="border-t border-gray-700 p-2">
                  <div className="flex flex-col space-y-1">
                    <div 
                      className="flex items-center p-1 px-2 hover:bg-gray-700/50 rounded cursor-pointer"
                      onClick={() => toggleIndicator('ma')}
                    >
                      <span className="text-sm flex items-center gap-2">
                        <Badge 
                          className={`h-2 w-2 p-0 rounded-full ${selectedIndicators.includes('ma') ? 'bg-[#38BDF8]' : 'bg-gray-500'}`} 
                        />
                        Moving Average
                      </span>
                    </div>
                    <div 
                      className="flex items-center p-1 px-2 hover:bg-gray-700/50 rounded cursor-pointer"
                      onClick={() => toggleIndicator('bb')}
                    >
                      <span className="text-sm flex items-center gap-2">
                        <Badge 
                          className={`h-2 w-2 p-0 rounded-full ${selectedIndicators.includes('bb') ? 'bg-[#8B5CF6]' : 'bg-gray-500'}`} 
                        />
                        Bollinger Bands
                      </span>
                    </div>
                    <div 
                      className="flex items-center p-1 px-2 hover:bg-gray-700/50 rounded cursor-pointer"
                      onClick={() => toggleIndicator('rsi')}
                    >
                      <span className="text-sm flex items-center gap-2">
                        <Badge 
                          className={`h-2 w-2 p-0 rounded-full ${selectedIndicators.includes('rsi') ? 'bg-[#F472B6]' : 'bg-gray-500'}`} 
                        />
                        RSI
                      </span>
                    </div>
                    <div className="flex items-center p-1 px-2 hover:bg-gray-700/50 rounded cursor-pointer">
                      <span className="text-sm flex items-center gap-2">
                        <Badge className="h-2 w-2 p-0 rounded-full bg-gray-500" />
                        MACD
                      </span>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Help button */}
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="h-9 w-9 bg-gray-800/50 border-gray-700 text-white hover:border-amber-500/50 hover:bg-amber-500/10"
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 bg-gray-800 border-gray-700 text-white p-3">
                <div className="text-sm">
                  <p className="mb-2">Chart Controls:</p>
                  <ul className="space-y-1 text-gray-300">
                    <li>• Choose between candlestick, line, or area chart</li>
                    <li>• Select different time intervals</li>
                    <li>• Use the brush at the bottom to zoom</li>
                    <li>• Mouse over the chart for detailed values</li>
                    <li>• Add technical indicators from the settings</li>
                  </ul>
                </div>
              </PopoverContent>
            </Popover>

            {/* Fullscreen toggle */}
            <Button
              variant="outline" 
              size="icon"
              className="h-9 w-9 bg-gray-800/50 border-gray-700 text-white hover:border-amber-500/50 hover:bg-amber-500/10"
              onClick={toggleFullscreen}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            
            {/* Refresh button */}
            <Button
              variant="outline" 
              size="icon"
              className="h-9 w-9 bg-gray-800/50 border-gray-700 text-white hover:border-amber-500/50 hover:bg-amber-500/10"
              onClick={refreshChartData}
              disabled={loading}
            >
              <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4" ref={chartRef}>
        <div className={`h-[350px] ${fullscreen ? 'fullscreen-chart' : ''}`}>
          {renderChart()}
        </div>
        
        {chartData.length > 0 && (
          <div className="mt-2 text-xs text-gray-400 flex flex-wrap justify-between items-center">
            <div className="flex flex-wrap items-center gap-2 mb-1 md:mb-0">
              <div className="px-2 py-1 rounded bg-gray-800/50 border border-gray-700">
                O: <span className="text-white">{formatPrice(chartData[chartData.length - 1]?.open)}</span>
              </div>
              <div className="px-2 py-1 rounded bg-gray-800/50 border border-gray-700">
                H: <span className="text-white">{formatPrice(chartData[chartData.length - 1]?.high)}</span>
              </div>
              <div className="px-2 py-1 rounded bg-gray-800/50 border border-gray-700">
                L: <span className="text-white">{formatPrice(chartData[chartData.length - 1]?.low)}</span>
              </div>
              <div className="px-2 py-1 rounded bg-gray-800/50 border border-gray-700">
                C: <span className="text-white">{formatPrice(chartData[chartData.length - 1]?.close)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span>Updated: {lastUpdateTimeRef.current}</span>
              <Badge variant="outline" className="text-[#F5B056] border-[#F5B056]">LIVE</Badge>
            </div>
          </div>
        )}
      </CardContent>
      
      <style jsx global>{`
        .fullscreen-chart {
          height: 80vh !important;
        }
        
        @keyframes price-up {
          0% {
            opacity: 0.7;
            transform: scale(1.05);
            text-shadow: 0 0 8px rgba(34, 197, 94, 0.5);
          }
          100% {
            opacity: 1;
            transform: scale(1);
            text-shadow: none;
          }
        }
        
        @keyframes price-down {
          0% {
            opacity: 0.7;
            transform: scale(1.05);
            text-shadow: 0 0 8px rgba(239, 68, 68, 0.5);
          }
          100% {
            opacity: 1;
            transform: scale(1);
            text-shadow: none;
          }
        }
        
        .price-up {
          animation: price-up 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          padding: 2px 6px;
          border-radius: 4px;
          will-change: transform, opacity;
        }
        
        .price-down {
          animation: price-down 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          padding: 2px 6px;
          border-radius: 4px;
          will-change: transform, opacity;
        }
      `}</style>
    </Card>
  );
}

