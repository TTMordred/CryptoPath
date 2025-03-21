// components/NFT/NFTTabs.tsx
import React from 'react';

interface NFTTabsProps {
  activeTab: 'market' | 'owned' | 'listings' | 'mint' | 'whitelist';
  setActiveTab: (tab: 'market' | 'owned' | 'listings' | 'mint' | 'whitelist') => void;
  balances: { market: number; owned: number; listings: number };
  showMintTab: boolean;
  showWhitelistTab: boolean;
}

export default function NFTTabs({ 
  activeTab, 
  setActiveTab, 
  balances,
  showMintTab,
  showWhitelistTab 
}: NFTTabsProps) {
  return (
    <div className="flex flex-wrap gap-4 mb-8 border-b border-orange-400/20 pb-4">
      {/* Market Tab */}
      <button
        onClick={() => setActiveTab('market')}
        className={`px-6 py-2 rounded-full transition-all ${
          activeTab === 'market'
            ? 'bg-orange-400 text-black font-bold'
            : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
        }`}
      >
        Market ({balances.market})
      </button>

      {/* Owned Tab */}
      <button
        onClick={() => setActiveTab('owned')}
        className={`px-6 py-2 rounded-full transition-all ${
          activeTab === 'owned'
            ? 'bg-orange-400 text-black font-bold'
            : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
        }`}
      >
        My NFTs ({balances.owned})
      </button>

      {/* Listings Tab */}
      <button
        onClick={() => setActiveTab('listings')}
        className={`px-6 py-2 rounded-full transition-all ${
          activeTab === 'listings'
            ? 'bg-orange-400 text-black font-bold'
            : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
        }`}
      >
        My Listings ({balances.listings})
      </button>

      {/* Mint Tab */}
      {showMintTab && (
        <button
          onClick={() => setActiveTab('mint')}
          className={`px-6 py-2 rounded-full transition-all ${
            activeTab === 'mint'
              ? 'bg-orange-400 text-black font-bold'
              : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
          }`}
        >
          Mint
        </button>
      )}

      {/* Whitelist Tab */}
      {showWhitelistTab && (
        <button
          onClick={() => setActiveTab('whitelist')}
          className={`px-6 py-2 rounded-full transition-all ${
            activeTab === 'whitelist'
              ? 'bg-orange-400 text-black font-bold'
              : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
          }`}
        >
          Whitelist
        </button>
      )}
    </div>
  );
}