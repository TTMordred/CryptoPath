'use client';

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCoins } from "@/lib/api/coinApi";
import HeroSection from "@/components/HeroSection";
import CoinTable from "@/components/CoinTable";
import CoinCard from "@/components/CoinCard";
import Loader from "@/components/Loader";

export const ClientContent = () => {
  const [topGainers, setTopGainers] = useState<any[]>([]);
  const [topLosers, setTopLosers] = useState<any[]>([]);

  const { isLoading } = useQuery({
    queryKey: ["topMovers"],
    queryFn: async () => {
      const coins = await getCoins(1, 100);
      
      // Sort by percentage change
      const sorted = [...coins].sort((a, b) => 
        b.price_change_percentage_24h - a.price_change_percentage_24h
      );
      
      setTopGainers(sorted.slice(0, 4));
      setTopLosers(sorted.slice(-4).reverse());
      
      return coins;
    },
    staleTime: 60 * 1000, // 1 minute
  });

  return (
    <div className="min-h-screen">
      <HeroSection />
      
      {/* Top Movers Section */}
      <section id="gainers" className="py-16 bg-secondary/50">
        <div className="container">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-3">Top Movers (24h)</h2>
            <p className="text-muted-foreground">
              The biggest gainers and losers in the cryptocurrency market over the last 24 hours.
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-500">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 19L12 5M12 5L18 11M12 5L6 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                Top Gainers
              </h3>
              
              <div className="grid gap-4 sm:grid-cols-2">
                {isLoading ? (
                  <Loader />
                ) : (
                  topGainers.map((coin) => (
                    <CoinCard key={coin.id} coin={coin} />
                  ))
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-500">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5L12 19M12 19L18 13M12 19L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                Top Losers
              </h3>
              
              <div className="grid gap-4 sm:grid-cols-2">
                {isLoading ? (
                  <Loader />
                ) : (
                  topLosers.map((coin) => (
                    <CoinCard key={coin.id} coin={coin} />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Coin Table Section */}
      <section id="circulation">
        <CoinTable />
      </section>
    </div>
  );
};