'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Loader2, Gauge, Calculator } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import NetworkTransactionTable from '@/components/transactions/NetworkTransactionTable';

interface Stats {
  transactions24h: number;
  pendingTransactions: number;
  networkFee: number;
  avgGasFee: number;
  totalTransactionAmount: number;
}

const initialStats: Stats = {
  transactions24h: 0,
  pendingTransactions: 0,
  networkFee: 0,
  avgGasFee: 0,
  totalTransactionAmount: 0,
};

export default function NetworkStats() {
  const [stats, setStats] = useState<Stats>(initialStats);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [updateKey, setUpdateKey] = useState(0); // Used to trigger table updates

  const fetchNetworkStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Batch API calls together
      const [gasResponse, blockResponse] = await Promise.all([
        fetch('/api/etherscan?module=gastracker&action=gasoracle'),
        fetch('/api/etherscan?module=proxy&action=eth_blockNumber')
      ]);

      // Handle gas price data
      if (!gasResponse.ok) throw new Error('Failed to fetch gas prices');
      const gasData = await gasResponse.json();

      // Handle block number data
      if (!blockResponse.ok) throw new Error('Failed to fetch latest block');
      const blockData = await blockResponse.json();

      // Process gas data
      if (gasData.status === "1") {
        setStats(prev => ({
          ...prev,
          networkFee: parseFloat(gasData.result.SafeGasPrice),
          avgGasFee: parseFloat(gasData.result.ProposeGasPrice)
        }));
      }

      // Process block data
      const latestBlock = parseInt(blockData.result, 16);
      const blocksIn24h = Math.floor(86400 / 15); // Approximate blocks in 24h

      // Fetch transaction count with delay to respect rate limit
      await new Promise(resolve => setTimeout(resolve, 200));
      const txCountResponse = await fetch(
        `/api/etherscan?module=proxy&action=eth_getBlockTransactionCountByNumber&tag=${latestBlock.toString(16)}`
      );

      if (!txCountResponse.ok) throw new Error('Failed to fetch transaction count');
      const txCountData = await txCountResponse.json();
      const txCount = parseInt(txCountData.result, 16);

      // Update stats
      setStats(prev => ({
        ...prev,
        transactions24h: txCount * blocksIn24h,
        pendingTransactions: Math.floor(Math.random() * 100) + 50 // Temporary mock data for pending transactions
      }));

      // Trigger table update
      setUpdateKey(prev => prev + 1);
    } catch (error) {
      console.error('Error fetching network stats:', error);
      setError('Failed to fetch network stats');
      toast({
        title: "Error",
        description: "Failed to fetch network stats. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNetworkStats();
    const interval = setInterval(fetchNetworkStats, 15000); // Update every 15 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-white font-exo2">
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gray-900 border border-gray-800 rounded-2xl font-quantico hover:border-[#F5B056] hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="flex items-center justify-center gap-2">
                <Clock className="w-5 h-5 text-[#F5B056]" />
                <CardTitle className="text-xl text-center text-gray-300">Transactions (24h)</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl text-center font-bold text-[#F5B056]">
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                ) : (
                  stats.transactions24h.toLocaleString()
                )}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border border-gray-800 rounded-2xl font-quantico hover:border-[#F5B056] hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 text-[#F5B056] animate-spin" />
                <CardTitle className="text-xl text-center text-gray-300">Pending Txns</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl text-center font-bold text-[#F5B056]">
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                ) : (
                  stats.pendingTransactions.toLocaleString()
                )}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border border-gray-800 rounded-2xl font-quantico hover:border-[#F5B056] hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="flex items-center justify-center gap-2">
                <Gauge className="w-5 h-5 text-[#F5B056]" />
                <CardTitle className="text-lg text-center text-gray-300">Network Fee</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl text-center font-bold text-[#F5B056]">
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                ) : (
                  `${stats.networkFee.toFixed(2)} Gwei`
                )}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border border-gray-800 rounded-2xl font-quantico hover:border-[#F5B056] hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <div className="flex items-center justify-center gap-2">
                <Calculator className="w-5 h-5 text-[#F5B056]" />
                <CardTitle className="text-xl text-center text-gray-300">AVG Gas Fee</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl text-center font-bold text-[#F5B056]">
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                ) : (
                  `${stats.avgGasFee.toFixed(2)} Gwei`
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Transaction Table */}
        <div className="mt-6">
          <NetworkTransactionTable key={updateKey} />
        </div>
      </div>
    </div>
  );
}