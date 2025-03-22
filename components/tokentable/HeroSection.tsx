"use client";
import { useQuery } from "@tanstack/react-query";

import {
  TrendingUp,
  CircleDollarSign,
  BarChart4,
  Clock,
} from "lucide-react";
// Import từ các file trong lib/ thay vì app/api/service/routen
import { getGlobalData } from "@/lib/api/globalApi"; // Import getGlobalData từ globalApi
import {
  formatCurrency,
  formatNumber,
  formatPercentage,
  getColorForPercentChange,
} from "@/lib/format";  // Giả sử các hàm API được tách vào đây
import { Skeleton } from "@/components/ui/skeleton";


const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  change,
  isLoading 
}: { 
  title: string; 
  value: string; 
  icon: React.ElementType; 
  change?: { value: string; color: string } 
  isLoading: boolean;
}) => (
  <div className="glass rounded-xl p-5 flex flex-col justify-between h-full border border-border/50 transition-all duration-300 hover:shadow-[0_0_40px_rgba(245,176,86,0.4)] hover:border-orange-500/80 hover:-translate-y-2">
    <div className="flex justify-between items-start mb-3">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <Icon className="h-4 w-4 text-primary opacity-70" />
    </div>
    
    <div>
      {isLoading ? (
        <Skeleton className="h-7 w-[100px] mb-1" />
      ) : (
        <p className="text-2xl font-semibold mb-1">{value}</p>
      )}
      
      {change && !isLoading && (
        <p className={`text-xs ${change.color}`}>
          {change.value}
        </p>
      )}
    </div>
  </div>
);

const HeroSection = () => {
  const { data: globalData, isLoading } = useQuery({
    queryKey: ['globalData'],
    queryFn: getGlobalData,
    staleTime: 60 * 1000, // 1 minute
  });

  const getMarketCapUSD = () => {
    if (!globalData) return 0;
    return globalData.total_market_cap.usd || 0;
  };

  const getVolumeUSD = () => {
    if (!globalData) return 0;
    return globalData.total_volume.usd || 0;
  };

  const getFormattedDate = () => {
    if (!globalData) return '';
    const date = new Date(globalData.updated_at * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <section className="pt-8 pb-12 relative overflow-hidden ">
      {/* Background decoration */}
      <div className="absolute -top-[300px] -right-[300px] w-[600px] h-[600px] bg-primary/5 rounded-full filter blur-3xl opacity-50" />
      <div className="absolute -bottom-[200px] -left-[200px] w-[400px] h-[400px] bg-primary/5 rounded-full filter blur-3xl opacity-50" />
      
      <div className="container relative">
        <div className="text-center max-w-3xl mx-auto mb-12 animate-fade-in">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary mb-4 text-xs font-medium">
            <span>Live Circulation Data</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight text-balance">
            Track Cryptocurrency Circulation in Real-Time
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Get detailed insights into market circulation, supply metrics, and trading volumes for top cryptocurrencies.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard 
            title="Total Market Cap"
            value={formatCurrency(getMarketCapUSD())}
            icon={CircleDollarSign}
            change={{
              value: formatPercentage(globalData?.market_cap_change_percentage_24h_usd || 0), 
              color: getColorForPercentChange(globalData?.market_cap_change_percentage_24h_usd || 0)
            }}
            isLoading={isLoading}
          />
          <StatCard 
            title="24h Volume"
            value={formatCurrency(getVolumeUSD())}
            icon={BarChart4}
            isLoading={isLoading}
          />
          <StatCard 
            title="BTC Dominance"
            value={globalData ? `${globalData.market_cap_percentage.btc.toFixed(1)}%` : '0%'}
            icon={TrendingUp}
            isLoading={isLoading}
          />
          <StatCard 
            title="Last Updated"
            value={getFormattedDate()}
            icon={Clock}
            isLoading={isLoading}
          />
        </div>
        
        <div className="flex justify-center animate-fade-in" style={{animationDelay: '0.2s'}}>
          <a href="#market-table" className="glass rounded-full p-2 hover:shadow-md transition-all duration-300">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-float">
              <path d="M12 5L12 19M12 19L18 13M12 19L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;