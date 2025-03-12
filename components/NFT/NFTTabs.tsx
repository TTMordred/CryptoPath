// components/NFT/NFTTabs.tsx
import { ReactNode } from 'react';

// Sửa type props để đảm bảo type safety
type TabButtonProps = {
  children: ReactNode;
  active: boolean;
  onClick: () => void;
  count?: number;
};

const TabButton = ({ children, active, onClick, count }: TabButtonProps) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 flex items-center gap-2 border-b-2 transition-colors ${
      active
        ? 'border-orange-500 text-orange-400'
        : 'border-transparent text-gray-400 hover:text-gray-200'
    }`}
  >
    {children}
  </button>
);

// Sửa type cho component NFTTabs
type NFTTabsProps = {
  activeTab: 'market' | 'owned' | 'listings';
  setActiveTab: (tab: 'market' | 'owned' | 'listings') => void;
  balances: { market: number; owned: number; listings: number };
};

export default function NFTTabs({ activeTab, setActiveTab, balances }: NFTTabsProps) {
  return (
    <div className="flex gap-4 mb-8 border-b border-gray-800">
      <TabButton
        active={activeTab === 'market'}
        onClick={() => setActiveTab('market')}
        count={balances.market}
      >
        Marketplace
      </TabButton>
      
      <TabButton
        active={activeTab === 'owned'}
        onClick={() => setActiveTab('owned')}
        count={balances.owned}
      >
        My NFTs ({balances.owned})
      </TabButton>

      <TabButton
        active={activeTab === 'listings'}
        onClick={() => setActiveTab('listings')}
        count={balances.listings}
      >
        My Listings ({balances.listings})
      </TabButton>
    </div>
  );
}