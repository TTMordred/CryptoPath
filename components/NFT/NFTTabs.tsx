// components/NFT/NFTTabs.tsx
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { useRef, useLayoutEffect, useState } from 'react';

interface NFTTabsProps {
  activeTab: 'market' | 'owned' | 'listings' | 'mint';
  setActiveTab: (tab: 'market' | 'owned' | 'listings' | 'mint') => void;
  balances: {
    market: number;
    owned: number;
    listings: number;
  };
  showMintTab: boolean;
}

export default function NFTTabs({ 
  activeTab, 
  setActiveTab, 
  balances,
  showMintTab 
}: NFTTabsProps) {
  const marketRef = useRef<HTMLButtonElement>(null!);
  const ownedRef = useRef<HTMLButtonElement>(null!);
  const listingsRef = useRef<HTMLButtonElement>(null!);
  const mintRef = useRef<HTMLButtonElement>(null!);
  const containerRef = useRef<HTMLDivElement>(null!);

  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    let activeRef;
    switch(activeTab) {
      case 'market':
        activeRef = marketRef;
        break;
      case 'owned':
        activeRef = ownedRef;
        break;
      case 'listings':
        activeRef = listingsRef;
        break;
      case 'mint':
        activeRef = mintRef;
        break;
      default:
        activeRef = marketRef;
    }

    if (activeRef.current && containerRef.current) {
      setIndicatorStyle({
        left: activeRef.current.offsetLeft,
        width: activeRef.current.offsetWidth,
      });
    }
  }, [activeTab, balances, showMintTab]);

  return (
    <Tabs defaultValue={activeTab} className="w-full mb-6">
      <div ref={containerRef} className="relative">
        <TabsList className="flex items-center justify-center gap-6 p-2 bg-transparent">
          <TabsTrigger
            ref={marketRef}
            value="market"
            onClick={() => setActiveTab('market')}
            className="px-4 py-2 rounded-full text-sm font-medium text-white transition-colors hover:text-white"
          >
            Market ({balances.market})
          </TabsTrigger>

          <TabsTrigger
            ref={ownedRef}
            value="owned"
            onClick={() => setActiveTab('owned')}
            className="px-4 py-2 rounded-full text-sm font-medium text-white transition-colors hover:text-white"
          >
            Owned ({balances.owned})
          </TabsTrigger>

          <TabsTrigger
            ref={listingsRef}
            value="listings"
            onClick={() => setActiveTab('listings')}
            className="px-4 py-2 rounded-full text-sm font-medium text-white transition-colors hover:text-white"
          >
            Listings ({balances.listings})
          </TabsTrigger>

          {showMintTab && (
            <TabsTrigger
              ref={mintRef}
              value="mint"
              onClick={() => setActiveTab('mint')}
              className="px-4 py-2 rounded-full text-sm font-medium text-white transition-colors hover:text-white"
            >
              Mint NFT
            </TabsTrigger>
          )}
        </TabsList>

        <motion.div
          className="absolute bottom-0 h-1 bg-orange-500 rounded-full"
          animate={indicatorStyle}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      </div>
    </Tabs>
  );
}