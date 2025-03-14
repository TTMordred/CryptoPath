'use client';

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Line, LineChart, BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart, PieChart, Pie, Cell, RadialBarChart, RadialBar } from "recharts";
import { Blocks, Activity, Gauge, Wallet, TrendingUp, Clock, Database, Cpu, Shield, CheckCircle } from "lucide-react";
import { fetchBlockchainMetrics, fetchGlobalMetrics, BlockchainMetrics } from "@/services/cryptoService";
import { Loader2 } from "lucide-react";

interface GlobalMetrics {
  total_market_cap: { usd: number };
  total_volume: { usd: number };
  market_cap_percentage: { [key: string]: number };
  active_cryptocurrencies: number;
  markets: number;
}

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [blockchain, global] = await Promise.all([
          fetchBlockchainMetrics(),
          fetchGlobalMetrics()
        ]);
        setBlockchainMetrics(blockchain);
        setGlobalMetrics(global);
      } catch (err) {
        setError('Failed to fetch metrics');
        console.error('Error fetching metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Card key={i} className="bg-gray-900 border border-gray-800 rounded-2xl">
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
      <div className="text-red-500 text-center">
        Error loading metrics. Please try again later.
      </div>
    );
  }

  const formatBlockNumber = (num: number): string => {
    if (isNaN(num)) return '0';
    return num.toLocaleString();
  };

  const formatBlocksBehind = (latest: number, current: number): string => {
    const behind = latest - current;
    if (isNaN(behind)) return '0';
    return behind.toLocaleString();
  };

  const formatNumber = (num: number): string => {
    if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(2);
  };

  // Prepare data for visualizations
  const blockData = [
    { name: 'Block Height', lastBlock: blockchainMetrics.lastBlock, safeBlock: blockchainMetrics.safeBlock, finalizedBlock: blockchainMetrics.finalizedBlock }
  ];

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
      fill: Object.values(COLORS)[index]
    }));

  return (
    <div className="space-y-4">
      {/* Block Heights Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="bg-gray-900 border border-gray-800 rounded-2xl">
          <CardContent className="p-3 h-[90px] relative">
            <div className="absolute top-2 left-0 right-0 flex items-center justify-center gap-2">
              <Blocks className="w-4 h-4 text-[#F5B056]" />
              <span className="text-sm text-gray-400">Last Block</span>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold text-white">
                #{formatBlockNumber(blockchainMetrics.lastBlock)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border border-gray-800 rounded-2xl">
          <CardContent className="p-3 h-[90px] relative">
            <div className="absolute top-2 left-0 right-0 flex items-center justify-center gap-2">
              <Shield className="w-4 h-4 text-[#3b82f6]" />
              <span className="text-sm text-gray-400">Safe Block</span>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold text-white">
                  #{formatBlockNumber(blockchainMetrics.safeBlock)}
                </span>
                <span className="text-[10px] text-gray-500 mt-1">
                  {formatBlocksBehind(blockchainMetrics.lastBlock, blockchainMetrics.safeBlock)} blocks behind
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border border-gray-800 rounded-2xl">
          <CardContent className="p-3 h-[90px] relative">
            <div className="absolute top-2 left-0 right-0 flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#22c55e]" />
              <span className="text-sm text-gray-400">Finalized Block</span>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold text-white">
                  #{formatBlockNumber(blockchainMetrics.finalizedBlock)}
                </span>
                <span className="text-[10px] text-gray-500 mt-1">
                  {formatBlocksBehind(blockchainMetrics.lastBlock, blockchainMetrics.finalizedBlock)} blocks behind
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Network Health and Market Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Market Share - Pie Chart */}
        <Card className="bg-gray-900 border border-gray-800 rounded-2xl">
          <CardHeader className="p-3 pb-0">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#F5B056]" />
              <CardTitle className="text-lg text-gray-300">Market Share</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-3">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={marketShareData}
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {marketShareData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    formatter={(value: number) => [`${value.toFixed(2)}%`]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {marketShareData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.fill }} />
                  <span className="text-xs text-gray-400">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Market Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-gray-900 border border-gray-800 rounded-2xl">
            <CardHeader>
              <div className="flex items-center justify-center gap-2">
                <Wallet className="w-4 h-4 text-[#F5B056]" />
                <CardTitle className="text-sm text-gray-400">Market Cap</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl text-center font-bold text-white">
                ${formatNumber(globalMetrics.total_market_cap.usd)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border border-gray-800 rounded-2xl">
            <CardHeader>
              <div className="flex items-center justify-center gap-2">
                <Activity className="w-4 h-4 text-[#3b82f6]" />
                <CardTitle className="text-sm text-gray-400">24h Volume</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl text-center font-bold text-white">
                ${formatNumber(globalMetrics.total_volume.usd)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border border-gray-800 rounded-2xl">
            <CardHeader>
              <div className="flex items-center justify-center gap-2">
                <Database className="w-4 h-4 text-[#22c55e]" />
                <CardTitle className="text-sm text-gray-400">Active Coins</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl text-center font-bold text-white">
                {globalMetrics.active_cryptocurrencies.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border border-gray-800 rounded-2xl">
            <CardHeader>
              <div className="flex items-center justify-center gap-2">
                <Cpu className="w-4 h-4 text-[#a855f7]" />
                <CardTitle className="text-sm text-gray-400">Markets</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl text-center font-bold text-white">
                {globalMetrics.markets.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 