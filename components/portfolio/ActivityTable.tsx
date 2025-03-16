"use client";
import React, { useState } from "react";
import { ArrowDownUp, ArrowDown, ArrowUp, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ethers } from "ethers";

interface Transaction {
  hash: string;
  timeStamp: string;
  from: string;
  to: string;
  value: string;
  isError: string;
}

interface ActivityTableProps {
  transactions: Transaction[];
  walletAddress: string;
  isLoading: boolean;
}

const ActivityTable: React.FC<ActivityTableProps> = ({ transactions, walletAddress, isLoading }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const txPerPage = 5;

  const indexOfLastTx = currentPage * txPerPage;
  const indexOfFirstTx = indexOfLastTx - txPerPage;
  const currentTxs = transactions.slice(indexOfFirstTx, indexOfLastTx);
  const totalPages = Math.ceil(transactions.length / txPerPage);

  const nextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  const formatAddress = (address: string) =>
    address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Unknown";

  const formatEthValue = (value: string) =>
    ethers.utils.formatEther(value || "0").substring(0, 6);

  const getTransactionType = (tx: Transaction) =>
    tx.to.toLowerCase() === walletAddress.toLowerCase() ? "incoming" : "outgoing";

  return (
    <div className="backdrop-blur-md bg-shark-700/30 border border-[#f6b355] rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 p-6 h-full opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]">
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center">
          <div className="bg-[#f6b355]/20 rounded-full p-2 mr-3 transition-all duration-300 hover:bg-[#f6b355]/30">
            <ArrowDownUp className="h-5 w-5 text-[#f6b355]" />
          </div>
          <h3 className="text-gray-300 font-medium">Activity</h3>
        </div>
        {transactions.length > 0 && (
          <div className="text-xs text-gray-400">
            {indexOfFirstTx + 1}-{Math.min(indexOfLastTx, transactions.length)} of {transactions.length}
          </div>
        )}
      </div>

      <div className="min-h-[300px]">
        {isLoading ? (
          [...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full bg-shark-600/50 mb-4" />)
        ) : transactions.length > 0 ? (
          currentTxs.map((tx, index) => (
            <div
              key={index}
              className="border border-[#f6b355] rounded-[15px] p-4 mb-4 transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:border-[#f6b355]/70"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div
                    className={`p-1.5 rounded-full mr-3 transition-all duration-300 ${
                      tx.isError === "1" 
                        ? "bg-red-800/20 hover:bg-red-800/30" 
                        : "bg-[#f6b355]/20 hover:bg-[#f6b355]/30"
                    }`}
                  >
                    {tx.isError === "1" ? (
                      "✕"
                    ) : getTransactionType(tx) === "incoming" ? (
                      <ArrowDown className="h-4 w-4 text-[#f6b355]" />
                    ) : (
                      <ArrowUp className="h-4 w-4 text-[#f6b355]" />
                    )}
                  </div>
                  <div className="text-gray-300 font-medium">
                    {tx.isError === "1"
                      ? "Failed"
                      : getTransactionType(tx) === "incoming"
                      ? "Received"
                      : "Sent"}
                  </div>
                </div>
                <div className="text-gray-500 text-sm">
                  {formatDistanceToNow(parseInt(tx.timeStamp) * 1000, { addSuffix: true })}
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-400">
                <p>From: {formatAddress(tx.from)}</p>
                <p>To: {formatAddress(tx.to)}</p>
                <p>Value: {formatEthValue(tx.value)} ETH</p>
                <a
                  href={`https://etherscan.io/tx/${tx.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#f6b355] hover:underline transition-all duration-300"
                >
                  View on Etherscan <ExternalLink className="h-4 w-4 inline text-[#f6b355]" />
                </a>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <ArrowDownUp className="h-12 w-12 text-[#f6b355] mb-4" />
            <p className="text-shark-300 text-center">No activity found</p>
          </div>
        )}
      </div>

      {transactions.length > txPerPage && (
        <div className="flex justify-between mt-6">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={prevPage} 
            disabled={currentPage === 1}
            className="border-[#f6b355] text-[#f6b355] rounded-[20px] hover:bg-[#f6b355]/20 hover:-translate-y-0.5 transition-all duration-300"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Prev
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={nextPage} 
            disabled={currentPage === totalPages}
            className="border-[#f6b355] text-[#f6b355] rounded-[20px] hover:bg-[#f6b355]/20 hover:-translate-y-0.5 transition-all duration-300"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ActivityTable;