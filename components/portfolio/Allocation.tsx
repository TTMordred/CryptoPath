"use client";
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { CircleDollarSign, PieChart as PieChartIcon } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";

interface Token {
  name: string;
  symbol: string;
  balance: string;
  tokenAddress: string;
  decimals: number;
  value: number;
}

interface AllocationChartProps {
  tokens: Token[];
  ethBalance: string;
  isLoading: boolean;
}

const AllocationChart: React.FC<AllocationChartProps> = ({ tokens, ethBalance, isLoading }) => {
  // Calculate total value in ETH and percentages
  const calculateAllocation = () => {
    const ethValue = parseFloat(ethBalance) / 1e18;
    
    // If there are no tokens, create a chart with just ETH
    if (tokens.length === 0) {
      return [{ name: 'ETH', value: ethValue, color: '#f6b355' }];
    }
    
    // Start with ETH
    const assets = [{ name: 'ETH', value: ethValue, color: '#f6b355' }];
    
    // Add tokens with mock values (in real app, you'd fetch token prices)
    const uniqueTokens = new Map();
    
    tokens.forEach((token, index) => {
      // Skip if we already have this token
      if (uniqueTokens.has(token.symbol)) return;
      
      uniqueTokens.set(token.symbol, true);
      
      // Color list for pie segments
      const colors = ['#FF6B6B', '#48dbfb', '#1dd1a1', '#feca57', '#ff9ff3', '#54a0ff', '#00d2d3'];
      
      assets.push({ 
        name: token.symbol, 
        value: token.value,
        color: colors[index % colors.length]
      });
    });
    
    return assets;
  };
  
  const data = calculateAllocation();
  
  // Format tooltip values
  const formatTooltipValue = (value: number) => {
    return `${value.toFixed(4)} ETH`;
  };

  return (
    <div className="backdrop-blur-md bg-shark-700/30 border border-shark-600 rounded-2xl shadow-lg transition-all duration-300 hover:border-amber/30 p-6 h-full opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]">
      <div className="flex items-center mb-5">
        <div className="bg-amber/20 rounded-full p-2 mr-3">
          <PieChartIcon className="h-5 w-5 text-amber" />
        </div>
        <h3 className="text-gray-300 font-medium">Asset Allocation</h3>
      </div>
      
      <div className="h-[300px] w-full">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Skeleton className="h-[200px] w-[200px] rounded-full bg-shark-600/30" />
          </div>
        ) : parseFloat(ethBalance) > 0 || tokens.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip 
                formatter={formatTooltipValue}
                contentStyle={{ 
                  backgroundColor: '#1f1f1f', 
                  border: '1px solid #333',
                  borderRadius: '8px',
                  color: '#f6b355'
                }}
              />
              <Legend 
                layout="vertical" 
                verticalAlign="middle" 
                align="right"
                formatter={(value) => <span className="text-gray-300">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col h-full justify-center items-center">
            <CircleDollarSign className="h-12 w-12 text-shark-400 mb-4" />
            <p className="text-shark-300 text-center">No assets found to display allocation</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllocationChart;
