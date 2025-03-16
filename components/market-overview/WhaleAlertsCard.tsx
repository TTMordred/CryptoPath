'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Wallet } from 'lucide-react';

interface WhaleTransaction {
  id: string;
  symbol: string;
  amount: number;
  value: number;
  from: string;
  to: string;
  type: 'withdrawal' | 'deposit' | 'transfer';
  timestamp: number;
}

interface WhaleData {
  transactions: WhaleTransaction[];
  totalValue: number;
  timestamp: number;
  simulated: boolean;
}

export default function WhaleAlertsCard() {
  const [data, setData] = useState<WhaleData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/analytics/whale-alerts?limit=5');
        if (!response.ok) throw new Error('Failed to fetch whale alerts');
        const whaleData = await response.json();
        setData(whaleData);
      } catch (error) {
        console.error('Error fetching whale alerts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Refresh every 2 minutes
    const interval = setInterval(fetchData, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatAddress = (address: string) => {
    if (address.includes('.') || address.includes(' ')) return address; // Exchange name
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatValue = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value);
  };

  const formatAmount = (amount: number, symbol: string) => {
    const precision = symbol === 'BTC' ? 2 : 1;
    return `${amount.toFixed(precision)} ${symbol}`;
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'withdrawal': return 'text-red-400';
      case 'deposit': return 'text-green-400';
      default: return 'text-blue-400';
    }
  };

  if (loading) {
    return (
      <Card className="border border-gray-800 bg-black/40">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-medium flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Whale Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-800 bg-black/40">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-medium flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Whale Alerts
          </CardTitle>
          {data?.simulated && (
            <Badge variant="outline" className="bg-amber-900/30">
              Simulated Data
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {data?.transactions.map((tx) => (
          <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/30">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">{formatAddress(tx.from)}</span>
                <ArrowRight className="h-3 w-3 text-gray-500" />
                <span className="text-sm text-gray-400">{formatAddress(tx.to)}</span>
              </div>
              <div className="text-sm">
                <span className={getTransactionColor(tx.type)}>
                  {formatAmount(tx.amount, tx.symbol)}
                </span>
                <span className="text-gray-400 ml-2">
                  ({formatValue(tx.value)})
                </span>
              </div>
            </div>
            <Badge 
              variant="outline" 
              className={`${
                tx.type === 'withdrawal' ? 'border-red-500/30 bg-red-500/10' :
                tx.type === 'deposit' ? 'border-green-500/30 bg-green-500/10' :
                'border-blue-500/30 bg-blue-500/10'
              }`}
            >
              {tx.type}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}