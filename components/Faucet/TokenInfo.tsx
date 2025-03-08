'use client';

import React from 'react';

interface TokenInfoProps {
  tokenBalance: string;
  faucetBalance: string;
  faucetEmpty: boolean;
  isOwner: boolean;
  isBlacklisted: boolean;
  loading: boolean;
}

const TokenInfo: React.FC<TokenInfoProps> = ({
  tokenBalance,
  faucetBalance,
  faucetEmpty,
  isOwner,
  isBlacklisted,
  loading,
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-800">
        <h3 className="text-sm font-medium text-gray-400 mb-2">Your Balance</h3>
        <p className="text-3xl font-bold text-[#F5B056]">
          {parseFloat(tokenBalance).toFixed(2)} PATH
        </p>
      </div>

      <div className={`p-6 rounded-xl border ${
        faucetEmpty ? 'border-red-800 bg-red-900/20' : 'border-green-800 bg-green-900/20'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-gray-400">Faucet Status</h3>
            <p className={`text-xl font-bold ${faucetEmpty ? 'text-red-400' : 'text-green-400'}`}>
              {faucetEmpty ? 'Empty' : 'Active'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${faucetEmpty ? 'bg-red-400' : 'bg-green-400'}`}></div>
            <span className="text-sm text-gray-400">
              {parseFloat(faucetBalance).toFixed(2)} PATH
            </span>
          </div>
        </div>

        {isOwner && (
          <div className="mt-4 pt-4 border-t border-gray-800">
            <p className="text-sm text-gray-400 mb-2">Admin Controls</p>
            <button
              className="cp-button cp-button--secondary w-full"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Refill Faucet'}
            </button>
          </div>
        )}
      </div>

      {isBlacklisted && (
        <div className="bg-red-900/20 p-4 rounded-lg border border-red-800">
          <p className="text-red-400 text-sm">
            ⚠️ Your address has been restricted from using the faucet
          </p>
        </div>
      )}
    </div>
  );
};

export default TokenInfo;