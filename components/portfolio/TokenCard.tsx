"use client";
import React, { useState } from 'react';
import { Coins, ChevronRight, ChevronLeft } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface Token {
  name: string;
  symbol: string;
  balance: string;
  tokenAddress: string;
  decimals: number;
  logo?: string;
  value: number;
}

interface TokensCardProps {
  tokens: Token[];
  isLoading: boolean;
}

const TokensCard: React.FC<TokensCardProps> = ({ tokens, isLoading }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const tokensPerPage = 3;
  
  const indexOfLastToken = currentPage * tokensPerPage;
  const indexOfFirstToken = indexOfLastToken - tokensPerPage;
  const currentTokens = tokens.slice(indexOfFirstToken, indexOfLastToken);
  const totalPages = Math.ceil(tokens.length / tokensPerPage);
  
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

  return (
    <div className="backdrop-blur-md bg-shark-700/30 border border-shark-600 rounded-2xl shadow-lg transition-all duration-300 hover:border-amber/30 p-6 h-full opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]">
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center">
          <div className="bg-amber/20 rounded-full p-2 mr-3">
            <Coins className="h-5 w-5 text-amber" />
          </div>
          <h3 className="text-gray-300 font-medium">Token Holdings</h3>
        </div>
        {tokens.length > 0 && (
          <div className="text-xs text-gray-400">
            {indexOfFirstToken + 1}-{Math.min(indexOfLastToken, tokens.length)} of {tokens.length}
          </div>
        )}
      </div>
      
      <div className="space-y-4 min-h-[240px]">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 border border-shark-600 rounded-lg">
              <div className="flex items-center">
                <Skeleton className="h-8 w-8 rounded-full bg-shark-600/50" />
                <div className="ml-3">
                  <Skeleton className="h-4 w-28 bg-shark-600/50 mb-1" />
                  <Skeleton className="h-3 w-20 bg-shark-600/50" />
                </div>
              </div>
              <Skeleton className="h-5 w-16 bg-shark-600/50" />
            </div>
          ))
        ) : tokens.length > 0 ? (
          currentTokens.map((token, index) => {
            // Function to format token balance based on decimals
            const formatTokenBalance = (balance: string, decimals: number) => {
              const value = parseInt(balance) / Math.pow(10, decimals);
              return value.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 4
              });
            };
            
            return (
              <div 
                key={index} 
                className="flex items-center justify-between p-3 border border-shark-600 rounded-lg hover:border-amber/30 transition-all duration-300 bg-shark-800/30"
              >
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-amber/20 flex items-center justify-center text-amber">
                    {token.logo ? (
                      <img 
                        src={token.logo} 
                        alt={token.symbol} 
                        className="h-full w-full rounded-full object-cover" 
                      />
                    ) : (
                      token.symbol.charAt(0)
                    )}
                  </div>
                  <div className="ml-3">
                    <div className="text-gray-200 font-medium">{token.name || token.symbol}</div>
                    <div className="text-gray-500 text-xs">{token.symbol}</div>
                  </div>
                </div>
                <div className="text-gray-300 font-medium">
                  {formatTokenBalance(token.balance, token.decimals)}
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-[200px]">
            <Coins className="h-12 w-12 text-shark-400 mb-4" />
            <p className="text-shark-300 text-center">No tokens found for this wallet</p>
          </div>
        )}
      </div>
      
      {tokens.length > tokensPerPage && (
        <div className="flex justify-between mt-4">
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

export default TokensCard;
