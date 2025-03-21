import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface ExchangeVolume {
  name: string;
  volume: number;
  color: string;
}

interface ExchangeVolumeData {
  data: ExchangeVolume[];
  totalVolume: number;
  timestamp: number;
  simulated?: boolean;
}

export default function ExchangeVolumeCard() {
  const [volumeData, setVolumeData] = useState<ExchangeVolumeData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSimulated, setIsSimulated] = useState<boolean>(false);
  
  useEffect(() => {
    const fetchExchangeVolumes = async () => {
      try {
        const response = await axios.get<ExchangeVolumeData>('/api/analytics/exchange-volumes');
        setVolumeData(response.data);
        setIsSimulated(response.data.simulated || false);
      } catch (error) {
        console.error("Failed to fetch exchange volume data:", error);
        
        // Fallback data
        const fallbackData: ExchangeVolumeData = {
          data: [
            { name: 'Binance', volume: 25000000000, color: '#F0B90B' },
            { name: 'Coinbase', volume: 12000000000, color: '#1652F0' },
            { name: 'OKX', volume: 8000000000, color: '#1A1B1F' },
            { name: 'Huobi', volume: 5000000000, color: '#1F94E0' },
            { name: 'KuCoin', volume: 3000000000, color: '#26A17B' },
          ],
          totalVolume: 53000000000,
          timestamp: Date.now(),
          simulated: true
        };
        
        setVolumeData(fallbackData);
        setIsSimulated(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchExchangeVolumes();
    
    // Refresh every 1 hour
    const interval = setInterval(fetchExchangeVolumes, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  
  const formatVolume = (volume: number): string => {
    if (volume >= 1000000000) {
      return `$${(volume / 1000000000).toFixed(2)}B`;
    } else if (volume >= 1000000) {
      return `$${(volume / 1000000).toFixed(2)}M`;
    } else {
      return `$${volume.toLocaleString()}`;
    }
  };
  
  return (
    <Card className="border border-gray-800 bg-black/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-medium flex items-center justify-between">
          <span className="flex items-center">
            Exchange Volume (24h)
            <Info className="h-4 w-4 ml-2 text-gray-400 cursor-help" />
          </span>
          {isSimulated && (
            <span className="text-xs text-amber-500 flex items-center">
              <AlertTriangle className="h-3 w-3 mr-1" /> 
              Estimated
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : volumeData ? (
          <>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={volumeData.data}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
                >
                  <XAxis 
                    type="number" 
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={formatVolume}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <RechartsTooltip
                    formatter={(value: any) => [formatVolume(value), "Volume"]}
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      borderColor: '#374151',
                      borderRadius: '4px',
                      color: 'white'
                    }}
                  />
                  <Bar dataKey="volume" radius={[0, 4, 4, 0]}>
                    {volumeData.data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#3B82F6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center mt-4">
              <div className="text-2xl font-bold">
                {formatVolume(volumeData.totalVolume)}
              </div>
              <p className="text-sm text-gray-400">Total 24h Trading Volume</p>
            </div>
          </>
        ) : (
          <div className="text-center py-4 text-gray-400">
            Unable to fetch exchange volume data
          </div>
        )}
      </CardContent>
    </Card>
  );
}
