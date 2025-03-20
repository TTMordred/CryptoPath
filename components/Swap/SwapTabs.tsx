import React from 'react';

interface SwapTabsProps {
  activeTab: 'wrap' | 'swap';
  onTabChange: (tab: 'wrap' | 'swap') => void;
}

const SwapTabs: React.FC<SwapTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="flex gap-4 mb-6 border-b border-gray-800">
      <button
        onClick={() => onTabChange('wrap')}
        className={`pb-2 px-4 ${
          activeTab === 'wrap'
            ? 'border-b-2 border-[#F5B056] text-[#F5B056]'
            : 'text-gray-400 hover:text-gray-300'
        }`}
      >
        Wrap/Unwrap
      </button>
      <button
        onClick={() => onTabChange('swap')}
        className={`pb-2 px-4 ${
          activeTab === 'swap'
            ? 'border-b-2 border-[#F5B056] text-[#F5B056]'
            : 'text-gray-400 hover:text-gray-300'
        }`}
      >
        Swap
      </button>
    </div>
  );
};

export default SwapTabs;