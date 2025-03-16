import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, AlertTriangle, Fuel } from 'lucide-react';
import axios from 'axios';

interface GasPriceData {
  slow: number;
  average: number;
  fast: number;
  baseFee: number;
  timestamp: number;
  simulated?: boolean;
}

export default function GasPriceCard() {
  const [gasData, setGasData] = useState<GasPriceData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSimulated, setIsSimulated] = useState<boolean>(false);
  
  useEffect(() => {
    const fetchGasData = async () => {
      try {
        const response = await axios.get<GasPriceData>('/api/analytics/gas-prices');
        setGasData(response.data);
        setIsSimulated(response.data.simulated || false);
      } catch (error) {
        console.error("Failed to fetch gas prices:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchGasData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchGasData, 30000);
    return () => clearInterval(interval);
  }, []);
  
  const getGasColor = (price: number): string => {
    if (price < 20) return 'text-green-500';
    if (price < 50) return 'text-yellow-500';
    if (price < 100) return 'text-orange-500';
    return 'text-red-500';
  };
  
  return (
    <Card className="border border-gray-800 bg-black/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-medium flex items-center justify-between">
          <span className="flex items-center">
            <Fuel className="h-5 w-5 mr-2 text-yellow-500" />
            Ethereum Gas Prices
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
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : gasData ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-800/30 p-3 rounded-lg text-center">
                <div className="text-sm text-gray-400">Slow</div>
                <div className={`text-xl font-bold mt-1 ${getGasColor(gasData.slow)}`}>
                  {gasData.slow} <span className="text-xs">Gwei</span>
                </div>
              </div>
              <div className="bg-gray-800/30 p-3 rounded-lg text-center">
                <div className="text-sm text-gray-400">Average</div>
                <div className={`text-xl font-bold mt-1 ${getGasColor(gasData.average)}`}>
                  {gasData.average} <span className="text-xs">Gwei</span>
                </div>
              </div>
              <div className="bg-gray-800/30 p-3 rounded-lg text-center">
                <div className="text-sm text-gray-400">Fast</div>
                <div className={`text-xl font-bold mt-1 ${getGasColor(gasData.fast)}`}>
                  {gasData.fast} <span className="text-xs">Gwei</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800/30 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Base Fee:</span>
                <span className="font-medium">{gasData.baseFee} Gwei</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-400">
            Unable to fetch gas prices
          </div>
        )}
      </CardContent>
    </Card>
  );
}
