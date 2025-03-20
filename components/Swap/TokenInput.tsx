// components/Swap/TokenInput.tsx
import React from 'react';

interface TokenInputProps {
  label: string;
  token: string;
  value: string;
  balance: string;
  onValueChange: (value: string) => void;
  readOnly?: boolean;
}

const TokenInput: React.FC<TokenInputProps> = ({
  label,
  token,
  value,
  balance,
  onValueChange,
  readOnly = false
}) => {
  return (
    <div className="bg-gray-800/50 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <span className="text-gray-400 text-sm">{label}</span>
        <span className="text-sm text-gray-400">Balance: {parseFloat(balance).toFixed(4)}</span>
      </div>
      
      <div className="flex items-center gap-2">
        <input
          type="number"
          className="w-full bg-transparent text-2xl text-white focus:outline-none"
          placeholder="0.0"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          readOnly={readOnly}
        />
        <span className="text-xl font-semibold text-[#F5B056]">{token}</span>
      </div>

      {!readOnly && (
        <div className="mt-2 flex justify-end">
          <button
            onClick={() => onValueChange(balance)}
            className="text-xs bg-gray-700 px-2 py-1 rounded hover:bg-gray-600 text-[#F5B056]"
          >
            MAX
          </button>
        </div>
      )}
    </div>
  );
};

export default TokenInput;