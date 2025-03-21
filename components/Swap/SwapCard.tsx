// components/Swap/SwapCard.tsx
import React from 'react';
import TokenInput from './TokenInput';
import SwapButton from './SwapButton';
import RateInfo from './RateInfo';

interface SwapCardProps {
  fromToken: string;
  toToken: string;
  amountIn: string;
  amountOut: string;
  tbnbBalance: string;
  wbnbBalance: string;
  pathBalance: string;
  onSwap: () => void;
  loading: boolean;
  onAmountChange: (value: string) => void;
  onTokenFlip: () => void;
  rate: string;
  isWrap?: boolean;
}

const SwapCard: React.FC<SwapCardProps> = ({
  fromToken,
  toToken,
  amountIn,
  amountOut,
  tbnbBalance,
  wbnbBalance,
  pathBalance,
  onSwap,
  loading,
  onAmountChange,
  onTokenFlip,
  rate,
  isWrap = false
}) => {
  // Hàm xử lý hiển thị số dư chính xác
  const getBalance = (token: string) => {
    switch(token) {
      case 'tBNB':
        return parseFloat(tbnbBalance).toFixed(4);
      case 'WBNB':
        return parseFloat(wbnbBalance).toFixed(4);
      case 'PATH':
        return parseFloat(pathBalance).toFixed(4);
      default:
        return '0.0000';
    }
  };

  return (
    <div className="bg-black/30 rounded-xl p-6 border border-gray-800 shadow-xl">
      <div className="space-y-4">
        {/* From Token Input */}
        <TokenInput
          label="From"
          token={fromToken}
          value={amountIn}
          balance={getBalance(fromToken)}
          onValueChange={onAmountChange}
        />

        {/* Flip Button */}
        <div className="flex justify-center">
          <button
            onClick={onTokenFlip}
            className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors"
            aria-label="Flip tokens"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-[#F5B056]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </button>
        </div>

        {/* To Token Input */}
        <TokenInput
          label="To"
          token={toToken}
          value={amountOut}
          balance={getBalance(toToken)}
          readOnly
          onValueChange={() => {}}
        />

        {/* Rate & Fee Info */}
        <RateInfo rate={rate} />

        {/* Swap/Wrap Button */}
        <SwapButton
          onClick={onSwap}
          loading={loading}
          disabled={
            !amountIn || 
            parseFloat(amountIn) <= 0 || 
            loading ||
            (isWrap && parseFloat(amountIn) > parseFloat(getBalance(fromToken)))
          }
          text={isWrap ? (fromToken === 'tBNB' ? 'Wrap' : 'Unwrap') : 'Swap'}
        />
      </div>

      {/* Network Warning */}
      <div className="mt-4 text-sm text-center text-yellow-500">
        <p>Make sure you're connected to BSC Testnet</p>
      </div>
    </div>
  );
};

export default SwapCard;