"use client";
import React, { useState } from "react";
import { Coins, ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface Token {
  name: string;
  symbol: string;
  balance: string; // Chuỗi thập phân đã định dạng
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
  const tokensPerPage = 3; // Giới hạn 5 token mỗi trang

  // Tính toán chỉ số token hiển thị trên trang hiện tại
  const indexOfLastToken = currentPage * tokensPerPage;
  const indexOfFirstToken = indexOfLastToken - tokensPerPage;
  const currentTokens = tokens.slice(indexOfFirstToken, indexOfLastToken);
  const totalPages = Math.ceil(tokens.length / tokensPerPage);

  // Hàm chuyển trang
  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  return (
    <div className="backdrop-blur-md bg-shark-700/30 border border-shark-600 border-[#f6b355] rounded-2xl shadow-lg transition-all duration-300 hover:border-amber/30 p-6 h-full opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]">
      <div className="flex items-center mb-5">
        <div className="bg-amber/20 rounded-full p-2 mr-3">
          <Coins className="h-5 w-5 text-amber" />
        </div>
        <h3 className="text-gray-300 font-medium">Tokens</h3>
      </div>

      <div className="space-y-4 min-h-[300px]">
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full bg-shark-600/50" />
          ))
        ) : tokens.length > 0 ? (
          currentTokens.map((token, index) => (
            <div
              key={index}
              className="flex items-center p-3 border border-shark-600 border-[#f6b355] rounded-[15px] hover:border-[#f6b355] hover:-translate-y-0.5 transition-all duration-300 "
            >
              <div className="h-10 w-10 rounded-full overflow-hidden bg-shark-600 mr-3">
                {token.logo ? (
                  <img
                    src={token.logo}
                    alt={token.symbol}
                    className="h-full w-full object-cover"
                    onError={(e) => (e.currentTarget.src = "/placeholder-token.png")}
                  />
                ) : (
                  <Coins className="h-full w-full text-shark-400" />
                )}
              </div>
              <div className="flex-1">
                <div className="text-gray-200 font-medium">{token.name}</div>
                <div className="text-gray-400 text-sm">
                  {parseFloat(token.balance).toFixed(4)} {token.symbol}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-[250px]">
            <Coins className="h-12 w-12 text-shark-400 mb-4" />
            <p className="text-shark-300 text-center">No tokens found</p>
          </div>
        )}
      </div>

      {/* Nút chuyển trang */}
      {tokens.length > tokensPerPage && (
        <div className="flex justify-between mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={prevPage}
            disabled={currentPage === 1}
            className="text-gray-400 border-shark-600 border-[#f6b355] rounded-[15px] hover:text-amber hover:border-amber/40 bg-transparent"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Prev
          </Button>
          <div className="text-gray-400 text-sm self-center">
            Page {currentPage} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={nextPage}
            disabled={currentPage === totalPages}
            className="text-gray-400 border-shark-600  border-[#f6b355] rounded-[15px] hover:text-amber hover:border-amber/40 bg-transparent"
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