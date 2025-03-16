"use client";
import React, { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { AreaChart, Clock } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

interface Transaction {
  hash: string;
  timeStamp: string;
  value: string; // Chuỗi thập phân từ API
}

interface HistoryChartProps {
  transactions: Transaction[];
  isLoading: boolean;
}

const HistoryChart: React.FC<HistoryChartProps> = ({ transactions, isLoading }) => {
  const [selectedPeriod, setSelectedPeriod] = useState("all");

  const processChartData = (txs: Transaction[], period: string) => {
    if (!txs || txs.length === 0) return [];

    const sortedTxs = [...txs].sort((a, b) => parseInt(a.timeStamp) - parseInt(b.timeStamp));
    let filteredTxs = sortedTxs;
    const now = Math.floor(Date.now() / 1000);

    if (period === "1d") {
      filteredTxs = sortedTxs.filter((tx) => now - parseInt(tx.timeStamp) < 86400);
    } else if (period === "7d") {
      filteredTxs = sortedTxs.filter((tx) => now - parseInt(tx.timeStamp) < 604800);
    } else if (period === "30d") {
      filteredTxs = sortedTxs.filter((tx) => now - parseInt(tx.timeStamp) < 2592000);
    }

    const groupedData: Record<string, { date: string; value: number }> = {};

    filteredTxs.forEach((tx) => {
      const timestampMs = parseInt(tx.timeStamp) * 1000;
      if (isNaN(timestampMs)) return;

      const date = new Date(timestampMs).toLocaleDateString();
      const value = parseFloat(tx.value || "0"); // Sử dụng trực tiếp giá trị thập phân

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
    <div className="backdrop-blur-md bg-shark-700/30 border border-shark-600 border-[#f6b355] rounded-2xl shadow-lg transition-all duration-300 hover:border-amber/30 p-6 h-full opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]">
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center">
          <div className="bg-amber/20 rounded-full p-2 mr-3">
            <AreaChart className="h-5 w-5 text-amber" />
          </div>
          <h3 className="text-gray-300 font-medium">Transaction History</h3>
        </div>
        <Tabs defaultValue="all" className="w-auto" onValueChange={setSelectedPeriod}>
          <TabsList className="bg-shark-700/30 border border-shark-600">
            <TabsTrigger value="1d" className="text-xs">1D</TabsTrigger>
            <TabsTrigger value="7d" className="text-xs">7D</TabsTrigger>
            <TabsTrigger value="30d" className="text-xs">30D</TabsTrigger>
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="h-[300px] w-full">
        {isLoading ? (
          <Skeleton className="h-[200px] w-full bg-shark-600/30" />
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip formatter={(value: number) => `${value.toFixed(4)} ETH`} />
              <Line type="monotone" dataKey="value" stroke="#f6b355" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <Clock className="h-12 w-12 text-shark-400 mb-4" />
            <p className="text-shark-300 text-center">No transaction history available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryChart;