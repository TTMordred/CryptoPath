"use client";
import React, { useState, useEffect } from "react";
import { ArrowUpRight, Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface BalanceCardProps {
  balance: string;
  isLoading: boolean;
}

const BalanceCard: React.FC<BalanceCardProps> = ({ balance, isLoading }) => {
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString());
  }, [balance]);

  const formattedBalance = isLoading || !balance ? "0.0000" : parseFloat(balance).toFixed(4);

  return (
    <div
      className="backdrop-blur-md bg-shark-700/30 border border-shark-600 border-[#f6b355] rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl p-6 h-full opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]"
      style={{
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Hiệu ứng hover border */}
      <div
        className="absolute inset-0 transition-all duration-300 pointer-events-none"
        style={{
          border: "2px solid transparent",
          borderRadius: "1rem",
          filter: "blur(8px)",
          opacity: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "#f6b355";
          e.currentTarget.style.opacity = "0.8";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "transparent";
          e.currentTarget.style.opacity = "0";
        }}
      />

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <div className="bg-amber/20 rounded-full p-2.5 mr-4">
            <Wallet className="h-6 w-6 text-amber" />
          </div>
          <h3 className="text-gray-300 text-xl font-semibold tracking-tight">
            ETH Balance
          </h3>
        </div>
        <a
          href="https://etherscan.io"
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber/70 hover:text-amber transition-colors duration-300 flex items-center text-sm font-medium"
        >
          Etherscan
          <ArrowUpRight className="h-4 w-4 ml-1" />
        </a>
      </div>

      <div className="mt-4 hover:-translate-y-0.5 transition-all duration-300">
        {isLoading ? (
          <Skeleton className="h-16 w-3/4 bg-shark-600/50 rounded-lg" />
        ) : (
          <div className="flex items-baseline space-x-3">
            <span className="bg-gradient-to-r from-amber to-amber-light bg-clip-text text-transparent text-white font-extrabold tracking-tight">
              {formattedBalance}
            </span>
            <span className="text-gray-400 text-lg font-medium">ETH</span>
          </div>
        )}
        <div className="mt-3 text-gray-500 text-sm font-light">
          {isLoading ? (
            <Skeleton className="h-4 w-1/3 bg-shark-600/50 rounded" />
          ) : (
            <span>Last updated: {currentTime || "Just now"}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default BalanceCard;