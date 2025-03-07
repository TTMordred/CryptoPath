"use client";
import CoinDetailModal from "./CoinDetaiModal";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
// import { HeaderTable } from '@/components/HeaderTable';
import Loader from "./Loader";
import {
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
} from "lucide-react";
// Import từ các file trong lib/ thay vì app/api/service/route
import { getCoins, getCoinDetail } from "@/lib/api/coinApi"; // Chỉ import các hàm liên quan đến coin
import {
  formatCurrency,
  formatNumber,
  formatPercentage,
  getColorForPercentChange,
} from "@/lib/format";  // Giả sử các hàm API được tách vào đây

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";


const CoinTable = () => {
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<string>("market_cap");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const perPage = 20;
  const [selectedCoinId, setSelectedCoinId] = useState<string | null>(null); // Thêm trạng thái cho modal
  const handleCardClick = (coinId: string) => {
    setSelectedCoinId(coinId); // Mở modal với coinId được chọn
  };
  const { data: coins, isLoading, isFetching } = useQuery({
    queryKey: ["coins", page, perPage],
    queryFn: () => getCoins(page, perPage),
    staleTime: 60 * 1000, // 1 minute
    placeholderData: previousData => previousData, // This replaces keepPreviousData
  });

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  };

  const sortedCoins = () => {
    if (!coins) return [];
    
    return [...coins].sort((a, b) => {
      const aValue = a[sortKey as keyof typeof a];
      const bValue = b[sortKey as keyof typeof b];
      
      // Handle null values
      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return sortDirection === "asc" ? -1 : 1;
      if (bValue === null) return sortDirection === "asc" ? 1 : -1;
      
      // Sort numerically
      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortDirection === "asc" ? comparison : -comparison;
    });
  };

  useEffect(() => {
    // Reset to first page when sorting changes
    setPage(1);
  }, [sortKey, sortDirection]);

  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    setPage(page + 1);
  };

  const renderSortIndicator = (key: string) => {
    if (sortKey !== key) return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    return sortDirection === "asc" ? (
      <ChevronUp className="h-4 w-4 ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 ml-1" />
    );
  };

  return (
    <section id="market-table" className="py-16">
      <div className="container">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">Cryptocurrency Market Data</h2>
          <p className="text-muted-foreground">
            Comprehensive view of circulation, market cap, and price data for top cryptocurrencies.
          </p>
        </div>
        
        <div className="glass-dark rounded-xl border border-blue-900/30 shadow-lg shadow-blue-500/5 overflow-hidden animate-scale-up">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-blue-950/40 border-blue-900/50">
                  <TableHead className="w-12 text-center">Rank</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:text-primary transition-colors"
                    onClick={() => handleSort("current_price")}
                  >
                    <div className="flex items-center">
                      Price {renderSortIndicator("current_price")}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:text-primary transition-colors"
                    onClick={() => handleSort("price_change_percentage_24h")}
                  >
                    <div className="flex items-center">
                      24h % {renderSortIndicator("price_change_percentage_24h")}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:text-primary transition-colors"
                    onClick={() => handleSort("market_cap")}
                  >
                    <div className="flex items-center">
                      Market Cap {renderSortIndicator("market_cap")}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:text-primary transition-colors"
                    onClick={() => handleSort("total_volume")}
                  >
                    <div className="flex items-center">
                      Volume (24h) {renderSortIndicator("total_volume")}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:text-primary transition-colors"
                    onClick={() => handleSort("circulating_supply")}
                  >
                    <div className="flex items-center">
                      Circulating Supply {renderSortIndicator("circulating_supply")}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <Loader />
                    </TableCell>
                  </TableRow>
                ) : sortedCoins().length > 0 ? (
                  sortedCoins().map((coin) => (
                    <TableRow 
                      key={coin.id}
                      className="transition-colors hover:bg-blue-900/10 border-blue-900/20"
                    >
                      <TableCell className="font-medium text-center">
                        {coin.market_cap_rank}
                      </TableCell>
                      <TableCell>
                        <div 
                          onClick={() => handleCardClick(coin.id)}
                          className="flex items-center gap-3 hover:text-primary transition-colors"
                        >
                          <img 
                            src={coin.image} 
                            alt={coin.name} 
                            className="w-6 h-6" 
                            loading="lazy"
                          />
                          <div>
                            <span className="font-medium">{coin.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {coin.symbol.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(coin.current_price)}</TableCell>
                      <TableCell className={getColorForPercentChange(coin.price_change_percentage_24h)}>
                        {formatPercentage(coin.price_change_percentage_24h)}
                      </TableCell>
                      <TableCell>{formatCurrency(coin.market_cap)}</TableCell>
                      <TableCell>{formatCurrency(coin.total_volume)}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex flex-col">
                          <span>{formatNumber(coin.circulating_supply)} {coin.symbol.toUpperCase()}</span>
                          {coin.max_supply && (
                            <span className="text-xs text-muted-foreground">
                              {Math.round((coin.circulating_supply / coin.max_supply) * 100)}% of max supply
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No coins found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="flex items-center justify-between px-4 py-4 border-t border-blue-900/20 bg-blue-950/20">
            <Button
              variant="outline"
              onClick={handlePrevPage}
              disabled={page === 1 || isFetching}
              className="gap-1 border-blue-800/50 hover:bg-blue-900/20 hover:text-blue-400"
            >
              <ChevronUp className="h-4 w-4 rotate-90" />
              Previous
            </Button>
            <span className="text-sm">
              Page {page}
            </span>
            <Button
              variant="outline"
              onClick={handleNextPage}
              disabled={isFetching}
              className="gap-1 border-blue-800/50 hover:bg-blue-900/20 hover:text-blue-400"
            >
              Next
              <ChevronDown className="h-4 w-4 -rotate-90" />
            </Button>
          </div>
        </div>
      </div>
      <CoinDetailModal
          coinId={selectedCoinId}
          isOpen={!!selectedCoinId}
          onClose={() => setSelectedCoinId(null)}
        />
    </section>
  );
};

export default CoinTable;