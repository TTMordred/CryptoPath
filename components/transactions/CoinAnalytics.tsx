'use client';

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchChainAnalytics, ChainAnalytics, CoinOption } from "@/services/cryptoService";
import { Loader2, AlertCircle, RefreshCcw, Users, ArrowDownToLine, Coins, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface CoinAnalyticsProps {
  selectedCoin: CoinOption;
  cooldownTime?: number;
}

// Cache for analytics data
const analyticsCache = new Map<string, { data: ChainAnalytics, timestamp: number }>();
const DEFAULT_COOLDOWN = 30 * 1000; // Default 30 seconds

export default function CoinAnalytics({ selectedCoin, cooldownTime = DEFAULT_COOLDOWN }: CoinAnalyticsProps) {
  const [analytics, setAnalytics] = useState<ChainAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const lastFetchTimeRef = useRef<number>(0);
  const [nextRefreshTime, setNextRefreshTime] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      const cacheKey = selectedCoin.id;
      const cachedData = analyticsCache.get(cacheKey);
      const now = Date.now();
      
      // Use cached data if available and not expired
      if (cachedData && (now - cachedData.timestamp < cooldownTime)) {
        setAnalytics(cachedData.data);
        setLoading(false);
        return;
      }
      
      // Check cooldown period
      if (now - lastFetchTimeRef.current < cooldownTime) {
        // If we have cached data, use it
        if (cachedData) {
          setAnalytics(cachedData.data);
          setLoading(false);
          return;
        }
      }
      
      // Update fetch time
      lastFetchTimeRef.current = now;
      setNextRefreshTime(now + cooldownTime);
      
      try {
        setLoading(true);
        setError(null);
        const data = await fetchChainAnalytics(selectedCoin.id);
        
        // Cache the result
        analyticsCache.set(cacheKey, { 
          data, 
          timestamp: now 
        });
        
        setAnalytics(data);
      } catch (err) {
        setError('Failed to fetch analytics data');
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Set up periodic refresh within cooldown
    const refreshInterval = setInterval(() => {
      if (Date.now() >= nextRefreshTime) {
        fetchData();
      }
    }, cooldownTime);
    
    return () => clearInterval(refreshInterval);
  }, [selectedCoin.id, retryCount, cooldownTime]);

  const handleRetry = () => {
    if (Date.now() < nextRefreshTime) return; // Still cooling down
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

  // Animation variants for staggered animations
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  // Use simplified loading state for better performance
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-white/5 rounded-2xl border border-gray-800/50 shadow-lg">
            <div className="h-[100px] flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-gray-700/30 animate-pulse"/>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <Card className="bg-white/5 rounded-2xl border border-red-900/30 shadow-lg">
        <CardContent className="flex items-center justify-center h-[100px] gap-3 p-4">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="text-red-400">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            className="bg-gray-800 border-gray-700 text-gray-300"
          >
            <RefreshCcw className="mr-2 h-3 w-3" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const analyticsCards = [
    {
      title: "UAW",
      icon: <Users className="w-5 h-5 text-[#F5B056]" />,
      value: formatNumber(analytics.uniqueActiveWallets),
      change: analytics.dailyChange.uaw,
      color: "from-amber-500/20 to-amber-600/5",
      iconColor: "bg-amber-500/20",
      borderColor: "border-amber-500/30"
    },
    {
      title: "Incoming Txs",
      icon: <ArrowDownToLine className="w-5 h-5 text-[#3b82f6]" />,
      value: formatNumber(analytics.incomingTransactions),
      change: analytics.dailyChange.transactions,
      color: "from-blue-500/20 to-blue-600/5",
      iconColor: "bg-blue-500/20",
      borderColor: "border-blue-500/30"
    },
    {
      title: "Incoming Volume",
      icon: <Coins className="w-5 h-5 text-[#22c55e]" />,
      value: "$" + formatNumber(analytics.incomingVolume),
      change: analytics.dailyChange.volume,
      color: "from-green-500/20 to-green-600/5",
      iconColor: "bg-green-500/20",
      borderColor: "border-green-500/30"
    },
    {
      title: "Contract Balance",
      icon: <Building2 className="w-5 h-5 text-[#a855f7]" />,
      value: "$" + formatNumber(analytics.contractBalance),
      change: analytics.dailyChange.balance,
      color: "from-purple-500/20 to-purple-600/5",
      iconColor: "bg-purple-500/20",
      borderColor: "border-purple-500/30"
    }
  ];

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {analyticsCards.map((card, index) => (
        <motion.div key={index} variants={item}>
          <Card className={`bg-white/5 rounded-[14px] p-0 overflow-hidden border border-gray-800/50 hover:border-${card.borderColor} transition-all duration-300 shadow-lg hover:shadow-xl`}>
            <div className={`h-full bg-gradient-to-br ${card.color} p-6`}>
              <div className="flex flex-col space-y-3">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${card.iconColor}`}>
                    {card.icon}
                  </div>
                  <CardTitle className="text-sm font-medium text-white/90">{card.title}</CardTitle>
                </div>
                
                <p className="text-3xl font-bold text-white">
                  {card.value}
                </p>
                
                <div className="flex items-center">
                  <p className={`text-sm font-medium ${card.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatPercentage(card.change)}
                  </p>
                  <span className="text-xs text-gray-400 ml-1">24h</span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}