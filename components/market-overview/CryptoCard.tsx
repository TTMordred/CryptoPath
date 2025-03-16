
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Image from 'next/image';

interface CryptoCardProps {
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  icon: string;
  fallbackIcon: string | null;
}

export default function CryptoCard({ 
  name, 
  symbol, 
  price, 
  change24h, 
  icon, 
  fallbackIcon 
}: CryptoCardProps) {
  const isPositive = change24h >= 0;
  
  // Format price based on value
  const formatPrice = (price: number): string => {
    if (price >= 1000) {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    } else if (price >= 1) {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 })}`;
    }
  };

  return (
    <Card className="border border-gray-800 bg-black/40 overflow-hidden hover:border-gray-700 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-6 w-6 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden">
            {/* Try to load the specific icon, fall back to placeholder */}
            <div className="h-5 w-5 relative">
              <Image 
                src={icon} 
                alt={symbol}
                width={20}
                height={20}
                onError={(e) => {
                  // If specific icon fails, try fallback or use placeholder
                  if (fallbackIcon) {
                    (e.target as HTMLImageElement).src = fallbackIcon;
                  } else {
                    (e.target as HTMLImageElement).src = '/icons/token-placeholder.png';
                  }
                }}
              />
            </div>
          </div>
          <span className="font-medium">{symbol}</span>
        </div>
        
        <div className="text-xl font-bold mb-1">
          {formatPrice(price)}
        </div>
        
        <div className={`flex items-center text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          {isPositive ? (
            <ArrowUpRight className="h-3 w-3 mr-1" />
          ) : (
            <ArrowDownRight className="h-3 w-3 mr-1" />
          )}
          {isPositive ? '+' : ''}{change24h.toFixed(2)}%
        </div>
      </CardContent>
    </Card>
  );
}
