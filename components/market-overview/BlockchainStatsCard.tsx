import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, AlertTriangle, Database, Layers } from 'lucide-react';
import axios from 'axios';

interface BlockchainStats {
  hashRate: number;
  difficulty: number;
  latestHeight: number;
  unconfirmedTx: number;
  mempool: number;
  btcMined: number;
  marketPrice: number;
  transactionRate: number;
  minutesBetweenBlocks: number;
  totalFees: number;
}

interface ChainStatsData {
  data: BlockchainStats;
  timestamp: number;
  simulated?: boolean;
}

export default function BlockchainStatsCard() {
  const [chainData, setChainData] = useState<ChainStatsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSimulated, setIsSimulated] = useState<boolean>(false);
  
  useEffect(() => {
    const fetchChainData = async () => {
      try {
        const response = await axios.get<ChainStatsData>('/api/analytics/chain-stats');
        setChainData(response.data);
        setIsSimulated(response.data.simulated || false);
      } catch (error) {
        console.error("Failed to fetch blockchain stats:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchChainData();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchChainData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  
  const formatHashRate = (hashRate: number): string => {
    if (hashRate >= 1000000000000000) return `${(hashRate / 1000000000000000).toFixed(2)} EH/s`;
    if (hashRate >= 1000000000000) return `${(hashRate / 1000000000000).toFixed(2)} TH/s`;
    if (hashRate >= 1000000000) return `${(hashRate / 1000000000).toFixed(2)} GH/s`;
    if (hashRate >= 1000000) return `${(hashRate / 1000000).toFixed(2)} MH/s`;
    return `${hashRate.toFixed(2)} H/s`;
  };
  
  const formatDifficulty = (difficulty: number): string => {
    if (difficulty >= 1000000000000) return `${(difficulty / 1000000000000).toFixed(2)} T`;
    if (difficulty >= 1000000000) return `${(difficulty / 1000000000).toFixed(2)} G`;
    if (difficulty >= 1000000) return `${(difficulty / 1000000).toFixed(2)} M`;
    return `${difficulty.toFixed(2)}`;
  };
  
  // Function to safely access data
  const safeValue = (value: any, defaultVal: string = '0') => {
    return value !== undefined && value !== null ? value : defaultVal;
  };
  
  return (
    <Card className="border border-gray-800 bg-black/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-medium flex items-center justify-between">
          <span className="flex items-center">
            <Layers className="h-5 w-5 mr-2 text-orange-500" />
            Bitcoin Network Stats
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
        ) : chainData && chainData.data ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-800/30 p-3 rounded-lg">
              <div className="text-sm text-gray-400">Hash Rate</div>
              <div className="text-lg font-bold mt-1">
                {formatHashRate(chainData.data.hashRate || 0)}
              </div>
            </div>
            <div className="bg-gray-800/30 p-3 rounded-lg">
              <div className="text-sm text-gray-400">Difficulty</div>
              <div className="text-lg font-bold mt-1">
                {formatDifficulty(chainData.data.difficulty || 0)}
              </div>
            </div>
            <div className="bg-gray-800/30 p-3 rounded-lg">
              <div className="text-sm text-gray-400">Block Height</div>
              <div className="text-lg font-bold mt-1">
                {(chainData.data.latestHeight || 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-gray-800/30 p-3 rounded-lg">
              <div className="text-sm text-gray-400">Mempool Size</div>
              <div className="text-lg font-bold mt-1">
                {(chainData.data.mempool || 0).toLocaleString()} tx
              </div>
            </div>
            <div className="bg-gray-800/30 p-3 rounded-lg">
              <div className="text-sm text-gray-400">Avg Block Time</div>
              <div className="text-lg font-bold mt-1">
                {typeof chainData.data.minutesBetweenBlocks === 'number' ? 
                  chainData.data.minutesBetweenBlocks.toFixed(2) : '0.00'} min
              </div>
            </div>
            <div className="bg-gray-800/30 p-3 rounded-lg">
              <div className="text-sm text-gray-400">Tx Rate</div>
              <div className="text-lg font-bold mt-1">
                {typeof chainData.data.transactionRate === 'number' ? 
                  chainData.data.transactionRate.toFixed(2) : '0.00'}/sec
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-400">
            Unable to fetch blockchain data
          </div>
        )}
      </CardContent>
    </Card>
  );
}
