"use client";
import React, { useState } from 'react';
import { ArrowDownUp, ArrowDown, ArrowUp, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

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
  
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  // Format address to shortened form
  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  // Format ETH value
  const formatEthValue = (value: string) => {
    const ethValue = parseFloat(value) / 1e18;
    return ethValue.toFixed(ethValue < 0.001 ? 6 : 4);
  };
  
  // Determine transaction type (incoming or outgoing)
  const getTransactionType = (tx: Transaction) => {
    const isIncoming = tx.to.toLowerCase() === walletAddress.toLowerCase();
    return isIncoming ? 'incoming' : 'outgoing';
  };

  return (
    <div className="backdrop-blur-md bg-shark-700/30 border border-shark-600 rounded-2xl shadow-lg transition-all duration-300 hover:border-amber/30 p-6 h-full opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]">
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center">
          <div className="bg-amber/20 rounded-full p-2 mr-3">
            <ArrowDownUp className="h-5 w-5 text-amber" />
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
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="border border-shark-600 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-6 w-36 bg-shark-600/50" />
                  <Skeleton className="h-4 w-24 bg-shark-600/50" />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Skeleton className="h-4 w-full bg-shark-600/50" />
                  <Skeleton className="h-4 w-full bg-shark-600/50" />
                </div>
                <div className="mt-2">
                  <Skeleton className="h-4 w-20 bg-shark-600/50" />
                </div>
              </div>
            ))}
          </div>
        ) : transactions.length > 0 ? (
          <div className="space-y-4">
            {currentTxs.map((tx, index) => {
              const txType = getTransactionType(tx);
              const isSuccess = tx.isError === "0";
              
              return (
                <div 
                  key={index} 
                  className={`border ${
                    !isSuccess ? 'border-red-800/40 bg-red-950/10' : 'border-shark-600 bg-shark-800/30'
                  } rounded-lg p-4 hover:border-amber/30 transition-all duration-300`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className={`p-1.5 rounded-full mr-3 ${
                        !isSuccess 
                          ? 'bg-red-800/20 text-red-400' 
                          : txType === 'incoming' 
                            ? 'bg-green-800/20 text-green-400' 
                            : 'bg-amber/20 text-amber'
                      }`}>
                        {!isSuccess ? (
                          <div className="h-4 w-4 text-red-400">✕</div>
                        ) : txType === 'incoming' ? (
                          <ArrowDown className="h-4 w-4" />
                        ) : (
                          <ArrowUp className="h-4 w-4" />
                        )}
                      </div>
                      <div className={`font-medium ${!isSuccess ? 'text-red-400' : 'text-gray-300'}`}>
                        {!isSuccess 
                          ? 'Failed Transaction' 
                          : txType === 'incoming' 
                            ? 'Received ETH' 
                            : 'Sent ETH'
                        }
                      </div>
                    </div>
                    <div className="text-gray-500 text-sm">
                      {formatDistanceToNow(new Date(parseInt(tx.timeStamp) * 1000), { addSuffix: true })}
                    </div>
                  </div>
                  
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-gray-500 mb-1">From</div>
                      <div className="text-gray-300">{formatAddress(tx.from)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1">To</div>
                      <div className="text-gray-300">{formatAddress(tx.to)}</div>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex justify-between items-center">
                    <div className={`text-base font-medium ${
                      !isSuccess 
                        ? 'text-red-400' 
                        : txType === 'incoming' 
                          ? 'text-green-400' 
                          : 'text-amber'
                    }`}>
                      {txType === 'incoming' ? '+' : '-'} {formatEthValue(tx.value)} ETH
                    </div>
                    <a 
                      href={`https://etherscan.io/tx/${tx.hash}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-amber transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[300px]">
            <ArrowDownUp className="h-12 w-12 text-shark-400 mb-4" />
            <p className="text-shark-300 text-center">No activity found for this wallet</p>
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
            className="text-gray-400 border-shark-600 hover:text-amber hover:border-amber/40 bg-transparent"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Prev
          </Button>
          <div className="text-gray-400 text-sm">
            Page {currentPage} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={nextPage}
            disabled={currentPage === totalPages}
            className="text-gray-400 border-shark-600 hover:text-amber hover:border-amber/40 bg-transparent"
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
