'use client';

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Line, LineChart, BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart, PieChart, Pie, Cell, RadialBarChart, RadialBar } from "recharts";
import { Activity, Wallet, TrendingUp, Database, Cpu, RefreshCcw, ShieldAlert } from "lucide-react";
import { BlockchainMetrics, GlobalMetrics, fetchBlockchainMetrics, fetchGlobalMetrics } from "@/services/cryptoService";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import React from "react";

const COLORS = {
  primary: '#F5B056',
  secondary: '#3b82f6',
  tertiary: '#22c55e',
  quaternary: '#a855f7',
  error: '#ef4444',
  gray: '#666',
};

export default function WalletCharts() {
  const [blockchainMetrics, setBlockchainMetrics] = useState<BlockchainMetrics | null>(null);
  const [globalMetrics, setGlobalMetrics] = useState<GlobalMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      setIsRefreshing(true);
      
      // Simulate loading progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setLoadingProgress(progress > 90 ? 90 : progress);
        if (progress >= 90) clearInterval(interval);
      }, 200);
      
      const [blockData, globalData] = await Promise.all([
        fetchBlockchainMetrics(),
        fetchGlobalMetrics()
      ]);
      setBlockchainMetrics(blockData);
      setGlobalMetrics(globalData);
      setLoadingProgress(100);
      clearInterval(interval);
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError('Failed to fetch metrics');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      setTimeout(() => setLoadingProgress(0), 500); // Reset progress after a delay
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    if (!isRefreshing) fetchData();
  };

  if (loading && !globalMetrics) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#F5B056]" />
            Market Overview
          </h2>
        </div>
        
        <Progress value={loadingProgress} className="h-2 mb-6 bg-gray-800 bg-[#F5B056]" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Card key={i} className="bg-white/5 border border-gray-800 rounded-2xl backdrop-blur-[4px] animate-pulse">
              <CardContent className="flex items-center justify-center h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-[#F5B056]" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !blockchainMetrics || !globalMetrics) {
    return (
      <div className="bg-red-900/20 border border-red-500 rounded-xl p-6 text-center">
        <ShieldAlert className="h-12 w-12 mx-auto text-red-500 mb-2" />
        <h3 className="text-lg font-bold text-red-500 mb-2">Error Loading Data</h3>
        <p className="text-red-300 mb-4">
          {error || "Failed to load market metrics. Please try again."}
        </p>
        <Button 
          variant="outline"
          className="bg-transparent border border-red-500 text-red-500 hover:bg-red-950 hover:text-white"
          onClick={handleRefresh}
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  const formatNumber = (num: number): string => {
    if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(2);
  };

  // Prepare data for visualizations
  const networkHealthData = [
    { name: 'Block Time', value: (blockchainMetrics.avgBlockTime / 15) * 100, fill: COLORS.primary },
    { name: 'Gas Price', value: (blockchainMetrics.gasPrice / 50) * 100, fill: COLORS.secondary },
    { name: 'Validators', value: (blockchainMetrics.activeValidators / 600000) * 100, fill: COLORS.tertiary },
    { name: 'Staking', value: (blockchainMetrics.stakingAPR / 10) * 100, fill: COLORS.quaternary }
  ];

  const marketShareData = Object.entries(globalMetrics.market_cap_percentage || {})
    .slice(0, 5)
    .map(([name, value], index) => ({
      name: name.toUpperCase(),
      value,
      fill: Object.values(COLORS)[index % Object.values(COLORS).length]
    }));

  return (
    <div className="text-white font-exo2">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-[#F5B056]" />
          Market Overview
        </h2>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="bg-gray-800/50 hover:bg-gray-700 text-gray-300 border border-gray-700 rounded-lg"
        >
          <RefreshCcw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>
      
      {isRefreshing && (
        <Progress value={loadingProgress} className="h-1 mb-6 bg-gray-800" style={{ '--progress-background': '#F5B056' } as React.CSSProperties} />
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Market Share Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="md:col-span-2"
        >
          <Card className="bg-white/5 rounded-[10px] border border-gray-800 backdrop-blur-[4px] overflow-hidden hover:border-[#F5B056]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[#F5B056]/10 h-[350px]">
            <CardHeader className="p-4 bg-gradient-to-r from-gray-900 to-gray-800/50">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#F5B056]" />
                <CardTitle className="text-lg text-white">Market Share</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="h-[200px] mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={marketShareData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      startAngle={90}
                      endAngle={450}
                      animationBegin={0}
                      animationDuration={1000}
                    >
                      {marketShareData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.fill} 
                          stroke="rgba(0,0,0,0.3)"
                          strokeWidth={1}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(17, 24, 39, 0.9)',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        padding: '8px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        backdropFilter: 'blur(8px)'
                      }}
                      formatter={(value: number) => [`${value.toFixed(2)}%`, 'Market Share']}
                      labelStyle={{ color: '#F5B056', fontWeight: 'bold' }}
                      itemStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-x-4 gap-y-2">
                {marketShareData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2 bg-gray-800/40 rounded-md px-2 py-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.fill }} />
                    <span className="text-xs text-white">{entry.name}</span>
                    <span className="text-xs text-gray-400 ml-auto">{entry.value.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              title: "Market Cap",
              value: `$${formatNumber(globalMetrics.total_market_cap.usd)}`,
              icon: <Wallet className="w-5 h-5" />,
              color: COLORS.primary,
              animation: { delay: 0.1 }
            },
            {
              title: "24h Volume",
              value: `$${formatNumber(globalMetrics.total_volume.usd)}`,
              icon: <Activity className="w-5 h-5" />,
              color: COLORS.secondary,
              animation: { delay: 0.2 }
            },
            {
              title: "Active Coins",
              value: globalMetrics.active_cryptocurrencies.toLocaleString(),
              icon: <Database className="w-5 h-5" />,
              color: COLORS.tertiary,
              animation: { delay: 0.3 }
            },
            {
              title: "Markets",
              value: globalMetrics.markets.toLocaleString(),
              icon: <Cpu className="w-5 h-5" />,
              color: COLORS.quaternary,
              animation: { delay: 0.4 }
            }
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: stat.animation.delay }}
            >
              <Card className="bg-white/5 rounded-[10px] border border-gray-800 backdrop-blur-[4px] font-quantico overflow-hidden hover:border-gray-600 transition-all duration-300 hover:shadow-lg h-[165px]">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-transparent opacity-80 z-0"></div>
                <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: stat.color }}></div>
                <CardHeader className="relative z-10 pb-0">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl text-gray-200 flex items-center gap-2">
                      <div className="p-1.5 rounded-full" style={{ backgroundColor: `${stat.color}30` }}>
                        {React.cloneElement(stat.icon, { className: `w-4 h-4`, style: { color: stat.color } })}
                      </div>
                      {stat.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="relative z-10 pt-3">
                  <div className="flex items-center justify-center">
                    <p className="text-3xl font-bold" style={{ color: stat.color }}>
                      {stat.value}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}