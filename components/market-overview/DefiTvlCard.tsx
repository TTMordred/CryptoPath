import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, AlertTriangle, LineChart, ExternalLink } from 'lucide-react';
import axios from 'axios';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import Link from 'next/link';

interface TvlDataPoint {
  date: string;
  tvl: number;
}

interface TvlData {
  data: TvlDataPoint[];
  totalTvl: number;
  timestamp: number;
  simulated?: boolean;
}

export default function DefiTvlCard() {
  const [tvlData, setTvlData] = useState<TvlData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSimulated, setIsSimulated] = useState<boolean>(false);
  
  useEffect(() => {
    const fetchTvlData = async () => {
      try {
        const response = await axios.get<TvlData>('/api/analytics/defi-tvl');
        setTvlData(response.data);
        setIsSimulated(response.data.simulated || false);
      } catch (error) {
        console.error("Failed to fetch TVL data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTvlData();
    
    // Refresh every 12 hours
    const interval = setInterval(fetchTvlData, 12 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  
  const formatTvl = (value: number): string => {
    if (value >= 1000000000000) return `$${(value / 1000000000000).toFixed(2)}T`;
    if (value >= 1000000000) return `$${(value / 1000000000).toFixed(2)}B`;
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };
  
  return (
    <Card className="border border-gray-800 bg-black/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-medium flex items-center justify-between">
          <span className="flex items-center">
            <LineChart className="h-5 w-5 mr-2 text-blue-500" />
            DeFi Total Value Locked
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
        ) : tvlData && tvlData.data ? (
          <>
            <div className="h-40 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={tvlData.data}>
                  <XAxis 
                    dataKey="date" 
                    tick={{fontSize: 10, fill: '#9CA3AF'}}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tickFormatter={formatTvl} 
                    tick={{fontSize: 10, fill: '#9CA3AF'}}
                    width={50}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value: any) => [formatTvl(value), "TVL"]}
                    labelFormatter={(label) => `Date: ${label}`}
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      borderColor: '#374151',
                      borderRadius: '4px',
                      color: 'white'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="tvl" 
                    stroke="#3B82F6" 
                    dot={false}
                    strokeWidth={2}
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {formatTvl(tvlData.totalTvl)}
              </div>
              <p className="text-sm text-gray-400">
                Total Value Locked across all DeFi protocols
              </p>
              <Link 
                href="https://defillama.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-2 text-sm text-blue-400 hover:text-blue-300 flex items-center justify-center"
              >
                View on DefiLlama
                <ExternalLink className="h-3 w-3 ml-1" />
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-4 text-gray-400">
            No DeFi TVL data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
