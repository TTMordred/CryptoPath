"use client";
import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { CircleDollarSign, PieChart as PieChartIcon } from "lucide-react";
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
  const calculateAllocation = () => {
    const ethValue = parseFloat(ethBalance || "0");

    if (tokens.length === 0 && ethValue <= 0) {
      return [];
    }

    // Danh sách màu cố định
    const colors = [
      "#f6b355", // ETH
      "#FF6B6B", // Token 1
      "#48dbfb", // Token 2
      "#1dd1a1", // Token 3
      "#feca57", // Token 4
      "#ff9ff3", // Token 5
      "#54a0ff", // Token 6
    ];

    const assets = ethValue > 0 ? [{ name: "ETH", value: ethValue, color: colors[0] }] : [];
    const uniqueTokens = new Map();

    tokens.forEach((token, index) => {
      if (uniqueTokens.has(token.symbol) || token.value <= 0) return;

      uniqueTokens.set(token.symbol, true);
      const colorIndex = assets.length;
      assets.push({
        name: token.symbol,
        value: token.value,
        color: colors[colorIndex % colors.length],
      });
    });

    const topAssets = assets.sort((a, b) => b.value - a.value).slice(0, 7);
    const totalValue = topAssets.reduce((sum, asset) => sum + asset.value, 0);
    return totalValue > 0 ? topAssets : [];
  };

  const data = calculateAllocation();

  const formatTooltipValue = (value: number) => `${value.toFixed(4)} ETH`;

  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <ul className="text-sm text-gray-300">
        {payload.map((entry: any, index: number) => (
          <li key={`item-${index}`} className="flex items-center mb-1">
            <span
              className="inline-block w-3 h-3 mr-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span>{entry.value}</span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="backdrop-blur-md bg-shark-700/30 border border-shark-600 border-[#f6b355] rounded-2xl shadow-lg transition-all duration-300 hover:border-amber/30 p-6 h-full opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]">
      <div className="flex items-center mb-5">
        <div className="bg-amber/20 rounded-full p-2 mr-3">
          <PieChartIcon className="h-5 w-5 text-amber" />
        </div>
        <h3 className="text-white font-medium">Asset Allocation</h3>
      </div>

      <div className="h-[300px] w-full flex">
        {isLoading ? (
          <div className="flex items-center justify-center h-full w-full">
            <Skeleton className="h-[200px] w-[200px] rounded-full bg-shark-600/30" />
          </div>
        ) : data.length > 0 ? (
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
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke={entry.color} // Đặt stroke khớp với fill
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={formatTooltipValue}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #333",
                  borderRadius: "8px",
                  color: "#f6b355",
                  borderColor: "#f6b355",
                }}
              />
              <Legend
                layout="vertical"
                verticalAlign="middle"
                align="right"
                content={renderLegend}
                wrapperStyle={{ paddingLeft: "10px", maxWidth: "150px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col h-full justify-center items-center w-full">
            <CircleDollarSign className="h-12 w-12 text-shark-400 mb-4" />
            <p className="text-shark-300 text-center">No assets found to display allocation</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllocationChart;