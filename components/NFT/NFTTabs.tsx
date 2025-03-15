// components/NFT/NFTTabs.tsx
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { useRef, useLayoutEffect, useState } from 'react';

interface NFTTabsProps {
  activeTab: 'market' | 'owned' | 'listings';
  setActiveTab: (tab: 'market' | 'owned' | 'listings') => void;
  balances: {
    market: number;
    owned: number;
    listings: number;
  };
}

export default function NFTTabs({ activeTab, setActiveTab, balances }: NFTTabsProps) {
  // Use non-null assertions for the refs.
  const marketRef = useRef<HTMLButtonElement>(null!);
  const ownedRef = useRef<HTMLButtonElement>(null!);
  const listingsRef = useRef<HTMLButtonElement>(null!);
  const containerRef = useRef<HTMLDivElement>(null!);

  // State for the indicator's left position and width.
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    let activeRef;
    if (activeTab === 'market') {
      activeRef = marketRef;
    } else if (activeTab === 'owned') {
      activeRef = ownedRef;
    } else {
      activeRef = listingsRef;
    }
    if (activeRef.current && containerRef.current) {
      // Calculate the left offset relative to the container and the button's width.
      setIndicatorStyle({
        left: activeRef.current.offsetLeft,
        width: activeRef.current.offsetWidth,
      });
    }
  }, [activeTab, balances]);

  return (
    <Tabs defaultValue={activeTab} className="w-full mb-6">
      <div ref={containerRef} className="relative">
        <TabsList className="flex items-center justify-center gap-6 p-2 bg-transparent">
          <TabsTrigger
            ref={marketRef}
            value="market"
            onClick={() => setActiveTab('market')}
            className="
              px-4 py-2 rounded-full text-sm font-medium text-white transition-colors
              hover:text-white
            "
          >
            Market ({balances.market})
          </TabsTrigger>
          <TabsTrigger
            ref={ownedRef}
            value="owned"
            onClick={() => setActiveTab('owned')}
            className="
              px-4 py-2 rounded-full text-sm font-medium text-white transition-colors
              hover:text-white
            "
          >
            Owned ({balances.owned})
          </TabsTrigger>
          <TabsTrigger
            ref={listingsRef}
            value="listings"
            onClick={() => setActiveTab('listings')}
            className="
              px-4 py-2 rounded-full text-sm font-medium text-white transition-colors
              hover:text-white
            "
          >
            Listings ({balances.listings})
          </TabsTrigger>
        </TabsList>
        {/* Animated indicator */}
        <motion.div
          className="absolute bottom-0 h-1 bg-orange-500 rounded-full"
          animate={indicatorStyle}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      </div>
    </Tabs>
  );
}
