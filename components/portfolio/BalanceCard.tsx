"use client";
import React from "react";
import { ArrowUpRight, Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface BalanceCardProps {
  balance: string;
  isLoading: boolean;
}

const BalanceCard: React.FC<BalanceCardProps> = ({ balance, isLoading }) => {
  const formattedBalance = !isLoading && balance
    ? parseFloat(balance).toFixed(4) // balance đã là ETH, chỉ cần định dạng
    : "0.0000";

  return (
    <div className="backdrop-blur-md bg-shark-700/30 border border-shark-600 rounded-2xl shadow-lg transition-all duration-300 hover:border-amber/30 p-6 h-full opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center">
          <div className="bg-amber/20 rounded-full p-2 mr-3">
            <Wallet className="h-5 w-5 text-amber" />
          </div>
          <h3 className="text-gray-300 font-medium">ETH Balance</h3>
        </div>
        <a
          href="https://etherscan.io"
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber/70 hover:text-amber transition-colors duration-300 flex items-center text-xs"
        >
          Etherscan
          <ArrowUpRight className="h-3 w-3 ml-1" />
        </a>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <Skeleton className="h-12 w-3/4 bg-shark-600/50" />
        ) : (
          <div className="flex items-baseline">
            <span className="bg-gradient-to-r from-amber to-amber-light bg-clip-text text-transparent text-4xl font-bold mr-2">
              {formattedBalance}
            </span>
            <span className="text-gray-400 text-sm">ETH</span>
          </div>
        )}
        <div className="mt-2 text-gray-500 text-sm">
          {isLoading ? (
            <Skeleton className="h-4 w-1/3 bg-shark-600/50" />
          ) : (
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default BalanceCard;