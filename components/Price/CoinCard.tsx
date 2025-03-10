"use client";
import Link from "next/link";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency, formatPercentage } from "@/lib/format";
import CoinDetailModal from "./CoinDetaiModal";
import { useState } from "react";
interface CoinCardProps {
  coin: {
    id: string;
    name: string;
    symbol: string;
    image: string;
    current_price: number;
    price_change_percentage_24h: number;
    market_cap: number;
    market_cap_rank: number;
  };
  onCardClick: (coinId: string) => void;
}

const CoinCard: React.FC<CoinCardProps> = ({ coin, onCardClick }) => {
  const isPositive = coin.price_change_percentage_24h > 0;
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent the Link navigation
    setIsModalOpen(true); // Open the modal
    onCardClick(coin.id);
  };
  return (
    <Link
      href={`/coin/${coin.id}`}
      onClick={handleCardClick}
      className="crypto-card p-5 flex flex-col h-full pulse-glow cursor-pointer relative glass-dark rounded-xl transition-all duration-300 hover:shadow-[0_0_40px_rgba(245,176,86,0.4)] hover:border-orange-500/80 hover:-translate-y-2"
    >
      <style jsx>{`
        .crypto-card {
          border: 2px solid #f6b355;
          overflow: hidden;
          position: relative;
          border-radius: 12px;
          box-shadow: 0 0 10px rgba(246, 179, 85, 0.6);
        }
        .crypto-card::before {
          content: '';
          position: absolute;
          inset: -10px;
          border: 3px solid #f6b355;
          filter: blur(15px);
          animation: pulseBorder 2s infinite alternate;
          z-index: -1;
          border-radius: inherit;
        }
        .coin-name:hover {
          color: #f6b355;
          transition: color 0.2s ease-in-out;
        }
        @keyframes pulseBorder {
          0% {
            opacity: 0.5;
            transform: scale(1);
            box-shadow: 0 0 15px rgba(246, 179, 85, 0.6);
          }
          100% {
            opacity: 1;
            transform: scale(1.05);
            box-shadow: 0 0 25px rgba(246, 179, 85, 0.9);
          }
        }
      `}</style>
      
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <img 
            src={coin.image} 
            alt={coin.name} 
            className="w-10 h-10 rounded-full neon-border" 
            loading="lazy"
          />
          <div>
            <h3 className="font-semibold gradient-text coin-name">{coin.name}</h3>
            <p className="text-xs text-muted-foreground">{coin.symbol.toUpperCase()}</p>
          </div>
        </div>
        <div className="text-xs px-2 py-1 rounded-full bg-secondary">
          Rank #{coin.market_cap_rank}
        </div>
      </div>
      
      <div className="mt-auto pt-3">
        <div className="text-xl font-bold mb-2 flex justify-between items-center">
          <span>{formatCurrency(coin.current_price)}</span>
          <span className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <span>{formatPercentage(coin.price_change_percentage_24h)}</span>
          </span>
        </div>
        <div className="text-sm text-muted-foreground mt-2">
          Market Cap: {formatCurrency(coin.market_cap)}
        </div>
      </div>
    </Link>
  );
};

export default CoinCard;
