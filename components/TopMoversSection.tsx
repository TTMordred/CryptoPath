"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCoins } from "@/lib/api/coinApi";
import { Button } from "@/components/ui/button";
import CoinCard from "./CoinCard";
import CoinDetailModal from "./CoinDetaiModal";

export const TopMoversSection = () => {
  const [topGainers, setTopGainers] = useState<any[]>([]);
  const [topLosers, setTopLosers] = useState<any[]>([]);
  const [selectedCoinId, setSelectedCoinId] = useState<string | null>(null); // Thêm trạng thái cho modal

  const handleCardClick = (coinId: string) => {
    setSelectedCoinId(coinId); // Mở modal với coinId được chọn
  };

  const { isLoading, isError } = useQuery({
    queryKey: ["topMovers"],
    queryFn: async () => {
      try {
        const coins = await getCoins(1, 100);
        const sorted = [...coins].sort(
          (a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h
        );
        setTopGainers(sorted.slice(0, 4));
        setTopLosers(sorted.slice(-4).reverse());
        return coins;
      } catch (error) {
        console.error("Lỗi khi lấy top movers:", error);
        const mockCoins = Array.from({ length: 8 }, (_, i) => ({
          id: `mock-${i}`,
          name: `Coin ${i + 1}`,
          symbol: `CN${i + 1}`,
          image: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
          current_price: 50000 - i * 5000,
          price_change_percentage_24h: i < 4 ? 5 + i * 2 : -5 - (i % 4) * 2,
          market_cap: 1000000000000 - i * 50000000000,
          market_cap_rank: i + 1,
        }));
        setTopGainers(mockCoins.slice(0, 4));
        setTopLosers(mockCoins.slice(4, 8));
        return mockCoins;
      }
    },
    staleTime: 60 * 1000,
    retry: 3,
  });

  const renderPlaceholder = () => {
    if (isLoading) {
      return Array(4)
        .fill(0)
        .map((_, index) => (
          <div
            key={`loading-${index}`}
            className="crypto-card p-5 flex flex-col h-full pulse-glow cursor-pointer animate-pulse bg-gray-800/50 rounded-xl"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full neon-border bg-gray-600/50"></div>
                <div>
                  <div className="h-4 bg-gray-600/50 rounded w-24 mb-2"></div>
                  <div className="h-3 bg-gray-600/50 rounded w-12"></div>
                </div>
              </div>
              <div className="text-xs px-2 py-1 rounded-full bg-secondary h-6 w-14"></div>
            </div>
            <div className="mt-auto pt-3">
              <div className="text-xl font-bold mb-2 flex justify-between items-center">
                <div className="h-6 bg-gray-600/50 rounded w-20"></div>
                <div className="h-4 bg-gray-600/50 rounded w-16"></div>
              </div>
              <div className="h-4 bg-gray-600/50 rounded w-32"></div>
            </div>
          </div>
        ));
    }

    if (isError) {
      return (
        <div className="col-span-full p-8 text-center bg-destructive/10 rounded-xl pulse-glow">
          <p className="text-muted-foreground mb-4 font-medium">Không thể tải dữ liệu thị trường</p>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="pulse-glow hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            Thử lại
          </Button>
        </div>
      );
    }
    return null;
  };

  return (
    <section id="gainers" className="py-16 bg-gradient-to-b from-secondary/20 to-secondary/50">
      <style jsx>{`
        .section-title {
          background: linear-gradient(90deg, #f6b355, #9333ea);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .container {
          animation: fadeIn 0.5s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
      <div className="container max-w-7xl mx-auto px-4">
        <div className="mb-10 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 section-title">
            Top Movers (24h)
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Khám phá các coin tăng và giảm mạnh nhất trên thị trường tiền điện tử trong 24 giờ qua.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 pulse-glow">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-3 gradient-text">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10 ring-1 ring-green-500/20 neon-border">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 19L12 5M12 5L18 11M12 5L6 11"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              Top Gainers
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {topGainers.length > 0
                ? topGainers.map((coin) => (
                    <CoinCard 
                      key={coin.id} 
                      coin={coin} 
                      onCardClick={handleCardClick} // Truyền hàm xử lý click
                    />
                  ))
                : renderPlaceholder()}
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 pulse-glow">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-3 gradient-text">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10 ring-1 ring-red-500/20 neon-border">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 5L12 19M12 19L18 13M12 19L6 13"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              Top Losers
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {topLosers.length > 0
                ? topLosers.map((coin) => (
                    <CoinCard 
                      key={coin.id} 
                      coin={coin} 
                      onCardClick={handleCardClick} // Truyền hàm xử lý click
                    />
                  ))
                : renderPlaceholder()}
            </div>
          </div>
        </div>

        {/* Thêm CoinDetailModal */}
        <CoinDetailModal
          coinId={selectedCoinId}
          isOpen={!!selectedCoinId}
          onClose={() => setSelectedCoinId(null)}
        />
      </div>
    </section>
  );
};

export default TopMoversSection;