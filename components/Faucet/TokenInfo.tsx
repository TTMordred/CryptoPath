'use client';
import React from 'react';

interface TokenInfoProps {
  tokenBalance: string;
  faucetBalance: string;
  faucetEmpty: boolean;
  isBlacklisted: boolean;
  loading: boolean;
}

const TokenInfo: React.FC<TokenInfoProps> = ({
  tokenBalance,
  faucetBalance,
  faucetEmpty,
  isBlacklisted,
  loading,
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
        <h3 className="text-lg font-bold text-[#F5B056] mb-2">Your PATH Balance</h3>
        <p className="text-2xl font-mono">
          {parseFloat(tokenBalance).toFixed(2)} PATH
        </p>
      </div>

      <div className={`p-6 rounded-lg border ${
        faucetEmpty ? 'border-red-500' : 'border-green-500'
      }`}>
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-[#F5B056]">Faucet Status</h3>
            <p className={faucetEmpty ? 'text-red-400' : 'text-green-400'}>
              {faucetEmpty ? 'Empty' : 'Active'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Reserve</p>
            <p className="text-xl font-mono">{parseFloat(faucetBalance).toFixed(2)} PATH</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenInfo;