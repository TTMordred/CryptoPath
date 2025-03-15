"use client";
import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AreaChart, Clock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

interface Transaction {
  hash: string;
  timeStamp: string;
  value: string;
}

interface HistoryChartProps {
  transactions: Transaction[];
  isLoading: boolean;
}

const HistoryChart: React.FC<HistoryChartProps> = ({ transactions, isLoading }) => {
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  
  // Process transaction data for chart
  const processChartData = (txs: Transaction[], period: string) => {
    if (txs.length === 0) return [];
    
    // Sort by timestamp
    const sortedTxs = [...txs].sort((a, b) => 
      parseInt(a.timeStamp) - parseInt(b.timeStamp)
    );
    
    // Filter based on period
    let filteredTxs = sortedTxs;
    const now = Math.floor(Date.now() / 1000);
    
    if (period === "1d") {
      filteredTxs = sortedTxs.filter(tx => 
        now - parseInt(tx.timeStamp) < 86400
      );
    } else if (period === "7d") {
      filteredTxs = sortedTxs.filter(tx => 
        now - parseInt(tx.timeStamp) < 604800
      );
    } else if (period === "30d") {
      filteredTxs = sortedTxs.filter(tx => 
        now - parseInt(tx.timeStamp) < 2592000
      );
    }
    
    // Group by days for less cluttered chart
    const groupedData: Record<string, { date: string, value: number }> = {};
    
    filteredTxs.forEach(tx => {
      const date = new Date(parseInt(tx.timeStamp) * 1000).toLocaleDateString();
      const value = parseFloat(tx.value) / 1e18; // Convert wei to ETH
      
      if (groupedData[date]) {
        groupedData[date].value += value;
      } else {
        groupedData[date] = { date, value };
      }
    });
    
    return Object.values(groupedData);
  };
  
  const chartData = processChartData(transactions, selectedPeriod);

  return (
    <div className="backdrop-blur-md bg-shark-700/30 border border-shark-600 rounded-2xl shadow-lg transition-all duration-300 hover:border-amber/30 p-6 h-full opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]">
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center">
          <div className="bg-amber/20 rounded-full p-2 mr-3">
            <AreaChart className="h-5 w-5 text-amber" />
          </div>
          <h3 className="text-gray-300 font-medium">Transaction History</h3>
        </div>
        
        <Tabs defaultValue="all" className="w-auto" onValueChange={setSelectedPeriod}>
          <TabsList className="bg-shark-700/30 border border-shark-600">
            <TabsTrigger value="1d" className="text-xs data-[state=active]:text-amber data-[state=active]:bg-shark-800">1D</TabsTrigger>
            <TabsTrigger value="7d" className="text-xs data-[state=active]:text-amber data-[state=active]:bg-shark-800">7D</TabsTrigger>
            <TabsTrigger value="30d" className="text-xs data-[state=active]:text-amber data-[state=active]:bg-shark-800">30D</TabsTrigger>
            <TabsTrigger value="all" className="text-xs data-[state=active]:text-amber data-[state=active]:bg-shark-800">All</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="h-[300px] w-full">
        {isLoading ? (
          <div className="flex flex-col h-full justify-center items-center">
            <Skeleton className="h-[200px] w-full bg-shark-600/30" />
          </div>
        ) : transactions.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f6b355" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#f6b355" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#666" 
                tick={{ fill: '#999', fontSize: 12 }}
                tickMargin={10}
              />
              <YAxis 
                stroke="#666"
                tick={{ fill: '#999', fontSize: 12 }}
                tickMargin={10}
                tickFormatter={(value) => value.toFixed(3)}
              />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: '#1f1f1f', 
                  border: '1px solid #333',
                  borderRadius: '8px',
                  color: '#f6b355'
                }}
                itemStyle={{ color: '#f6b355' }}
                formatter={(value: number) => [value.toFixed(4) + ' ETH', 'Value']}
                labelStyle={{ color: '#999' }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#f6b355" 
                strokeWidth={2}
                dot={{ fill: '#f6b355', strokeWidth: 2, r: 4, strokeDasharray: '' }}
                activeDot={{ r: 6, fill: '#f6b355', stroke: '#fff', strokeWidth: 2 }}
                fillOpacity={1}
                fill="url(#colorValue)"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col h-full justify-center items-center">
            <Clock className="h-12 w-12 text-shark-400 mb-4" />
            <p className="text-shark-300 text-center">No transaction history found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryChart;
