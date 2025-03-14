'use client';

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchChainAnalytics, ChainAnalytics, CoinOption } from "@/services/cryptoService";
import { Loader2, AlertCircle, RefreshCcw, Users, ArrowDownToLine, Coins, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CoinAnalyticsProps {
  selectedCoin: CoinOption;
}

export default function CoinAnalytics({ selectedCoin }: CoinAnalyticsProps) {
  const [analytics, setAnalytics] = useState<ChainAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchChainAnalytics(selectedCoin.id);
        setAnalytics(data);
      } catch (err) {
        setError('Failed to fetch analytics data');
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCoin.id, retryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(2);
  };

  const formatPercentage = (value: number): string => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-gray-900 border border-gray-800 rounded-2xl">
            <CardContent className="flex items-center justify-center h-[90px]">
              <Loader2 className="h-4 w-4 animate-spin text-[#F5B056]" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="flex flex-col items-center justify-center h-[90px] space-y-2">
        <AlertCircle className="h-6 w-6 text-red-500" />
        <p className="text-red-500 text-sm">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRetry}
          className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
        >
          <RefreshCcw className="mr-2 h-3 w-3" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* UAW */}
      <Card className="bg-gray-900 border border-gray-800 rounded-2xl">
        <CardHeader>
          <div className="flex items-center justify-center gap-2">
            <Users className="w-4 h-4 text-[#F5B056]" />
            <CardTitle className="text-sm text-gray-400">UAW</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <p className="text-3xl font-bold text-white">
            {formatNumber(analytics.uniqueActiveWallets)}
          </p>
          <p className={`text-sm mt-1 ${analytics.dailyChange.uaw >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {formatPercentage(analytics.dailyChange.uaw)}
          </p>
        </CardContent>
      </Card>

      {/* Incoming Transactions */}
      <Card className="bg-gray-900 border border-gray-800 rounded-2xl">
        <CardHeader>
          <div className="flex items-center justify-center gap-2">
            <ArrowDownToLine className="w-4 h-4 text-[#3b82f6]" />
            <CardTitle className="text-sm text-gray-400">Incoming Txs</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <p className="text-3xl font-bold text-white">
            {formatNumber(analytics.incomingTransactions)}
          </p>
          <p className={`text-sm mt-1 ${analytics.dailyChange.transactions >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {formatPercentage(analytics.dailyChange.transactions)}
          </p>
        </CardContent>
      </Card>

      {/* Incoming Volume */}
      <Card className="bg-gray-900 border border-gray-800 rounded-2xl">
        <CardHeader>
          <div className="flex items-center justify-center gap-2">
            <Coins className="w-4 h-4 text-[#22c55e]" />
            <CardTitle className="text-sm text-gray-400">Incoming Volume</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <p className="text-3xl font-bold text-white">
            ${formatNumber(analytics.incomingVolume)}
          </p>
          <p className={`text-sm mt-1 ${analytics.dailyChange.volume >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {formatPercentage(analytics.dailyChange.volume)}
          </p>
        </CardContent>
      </Card>

      {/* Contract Balance */}
      <Card className="bg-gray-900 border border-gray-800 rounded-2xl">
        <CardHeader>
          <div className="flex items-center justify-center gap-2">
            <Building2 className="w-4 h-4 text-[#a855f7]" />
            <CardTitle className="text-sm text-gray-400">Contract Balance</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <p className="text-3xl font-bold text-white">
            ${formatNumber(analytics.contractBalance)}
          </p>
          <p className={`text-sm mt-1 ${analytics.dailyChange.balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {formatPercentage(analytics.dailyChange.balance)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}