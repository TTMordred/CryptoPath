'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Line, LineChart, BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart, PieChart, Pie, Cell } from "recharts";
import { BarChart3, Gauge, Wallet, History, CheckCircle2, Network } from "lucide-react";

const transactionTypeData = [
  { week: 'W1', defi: 450, nft: 320, swap: 230 },
  { week: 'W2', defi: 520, nft: 280, swap: 310 },
  { week: 'W3', defi: 710, nft: 420, swap: 380 },
  { week: 'W4', defi: 480, nft: 350, swap: 290 },
  { week: 'W5', defi: 520, nft: 390, swap: 420 },
  { week: 'W6', defi: 630, nft: 450, swap: 380 },
];

const gasUsageData = [
  { name: 'Smart Contracts', usage: 45, percentage: '45%' },
  { name: 'Token Transfers', usage: 30, percentage: '30%' },
  { name: 'NFT Trading', usage: 15, percentage: '15%' },
  { name: 'Other', usage: 10, percentage: '10%' },
];

const miniChartData = {
  tokenHoldings: [
    { name: 'ETH', value: 60 },
    { name: 'USDT', value: 25 },
    { name: 'Other', value: 15 },
  ],
  walletAge: [
    { date: '1', value: 10 },
    { date: '2', value: 15 },
    { date: '3', value: 12 },
    { date: '4', value: 18 },
    { date: '5', value: 22 },
    { date: '6', value: 20 },
  ],
  transactionSuccess: [
    { name: 'Success', value: 85 },
    { name: 'Failed', value: 15 },
  ],
  networkInteractions: [
    { name: 'DeFi Protocols', value: 40 },
    { name: 'DEX', value: 30 },
    { name: 'NFT Markets', value: 20 },
    { name: 'Others', value: 10 },
  ],
};

const COLORS = ['#F5B056', '#a855f7', '#22c55e', '#666'];

export default function WalletCharts() {
  const tooltipStyle = {
    backgroundColor: '#1f2937',
    border: 'none',
    borderRadius: '8px',
    color: '#fff'
  };

  const tooltipFormatter = (value: number, name: string) => {
    return [
      `${value}%`,
      `${name}`,
    ];
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Transaction Types Overview */}
        <Card className="bg-gray-900 border border-gray-800 rounded-2xl">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#F5B056]" />
                <CardTitle className="text-xl text-gray-300">Transaction Types</CardTitle>
              </div>
              <div className="flex gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#a855f7]"></div>
                  <span className="text-xs text-gray-400">DeFi</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#F5B056]"></div>
                  <span className="text-xs text-gray-400">NFT</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#22c55e]"></div>
                  <span className="text-xs text-gray-400">Swap</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={transactionTypeData}>
                  <XAxis dataKey="week" stroke="#666" tickLine={false} axisLine={false} />
                  <YAxis stroke="#666" tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Bar dataKey="defi" stackId="a" fill="#a855f7" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="nft" stackId="a" fill="#F5B056" />
                  <Bar dataKey="swap" stackId="a" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gas Usage Distribution */}
        <Card className="bg-gray-900 border border-gray-800 rounded-2xl">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Gauge className="w-5 h-5 text-[#F5B056]" />
                <CardTitle className="text-xl text-gray-300">Gas Usage Distribution</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {gasUsageData.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">{item.name}</span>
                    <span className="text-gray-400">{item.percentage}</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        index === 0 ? 'bg-[#a855f7]' : 
                        index === 1 ? 'bg-[#F5B056]' : 
                        index === 2 ? 'bg-[#22c55e]' : 'bg-gray-500'
                      }`}
                      style={{ width: item.percentage }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Token Distribution */}
        <Card className="bg-gray-900 border border-gray-800 rounded-2xl">
          <CardHeader className="p-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-[#F5B056]" />
              <CardTitle className="text-sm text-gray-300">Token Distribution</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-[100px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={miniChartData.tokenHoldings}
                    innerRadius={25}
                    outerRadius={40}
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                  >
                    {miniChartData.tokenHoldings.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={tooltipStyle}
                    formatter={tooltipFormatter}
                    labelStyle={{ color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Wallet Age Activity */}
        <Card className="bg-gray-900 border border-gray-800 rounded-2xl">
          <CardHeader className="p-4">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#F5B056]" />
              <CardTitle className="text-sm text-gray-300">Wallet Age Activity</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-[100px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={miniChartData.walletAge}>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#F5B056"
                    fill="#F5B056"
                    fillOpacity={0.2}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Success Rate */}
        <Card className="bg-gray-900 border border-gray-800 rounded-2xl">
          <CardHeader className="p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#22c55e]" />
                <CardTitle className="text-sm text-gray-300">Success Rate</CardTitle>
              </div>
              <div className="text-[#22c55e] text-lg font-semibold">85%</div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-[100px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={miniChartData.transactionSuccess}
                    innerRadius={25}
                    outerRadius={40}
                    dataKey="value"
                    nameKey="name"
                  >
                    <Cell fill="#22c55e" />
                    <Cell fill="#666" />
                  </Pie>
                  <Tooltip 
                    contentStyle={tooltipStyle}
                    formatter={tooltipFormatter}
                    labelStyle={{ color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Network Interactions */}
        <Card className="bg-gray-900 border border-gray-800 rounded-2xl">
          <CardHeader className="p-4">
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4 text-[#F5B056]" />
              <CardTitle className="text-sm text-gray-300">Network Interactions</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-[100px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={miniChartData.networkInteractions}
                    innerRadius={25}
                    outerRadius={40}
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                  >
                    {miniChartData.networkInteractions.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={tooltipStyle}
                    formatter={tooltipFormatter}
                    labelStyle={{ color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 