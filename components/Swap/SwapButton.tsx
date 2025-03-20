// components/Swap/SwapButton.tsx
import React from 'react';

interface SwapButtonProps {
  onClick: () => void;
  loading: boolean;
  disabled: boolean;
  text: string;
}

const SwapButton: React.FC<SwapButtonProps> = ({ 
  loading, 
  onClick, 
  disabled = false,
  text 
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`w-full py-4 rounded-xl font-bold transition-all ${
        disabled || loading
          ? 'bg-gray-600 cursor-not-allowed'
          : 'bg-[#F5B056] hover:bg-[#E69F4D]'
      }`}
    >
      {loading ? (
        <div className="flex items-center justify-center space-x-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>Processing...</span>
        </div>
      ) : (
        text // Sử dụng prop text thay vì chữ cứng
      )}
    </button>
  );
};

export default SwapButton;