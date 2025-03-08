'use client';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { FaCoins } from 'react-icons/fa';

interface FaucetRequestProps {
  requestTokens: () => Promise<void>;
  faucetData: { lastRequest: number; dailyCount: number };
  loading: boolean;
  faucetEmpty: boolean;
  isBlacklisted: boolean;
}

const FaucetRequest: React.FC<FaucetRequestProps> = ({
  requestTokens,
  faucetData,
  loading,
  faucetEmpty,
  isBlacklisted,
}) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    const calculateCooldown = () => {
      const now = Math.floor(Date.now() / 1000);
      const cooldownEnds = faucetData.lastRequest + 21600; // 6 hours
      const remaining = cooldownEnds - now;

      if (remaining > 0) {
        const hours = Math.floor(remaining / 3600);
        const minutes = Math.floor((remaining % 3600) / 60);
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else {
        setTimeRemaining('');
      }
    };

    calculateCooldown();
    const interval = setInterval(calculateCooldown, 60000);
    return () => clearInterval(interval);
  }, [faucetData]);

  return (
    <div className="text-center">
      <button
        onClick={requestTokens}
        disabled={loading || faucetEmpty || !!timeRemaining}
        className={`w-full py-3 rounded-lg text-lg font-semibold transition-all ${
          loading || faucetEmpty || timeRemaining
            ? 'bg-gray-600 cursor-not-allowed'
            : 'bg-[#F5B056] hover:bg-[#F5B056]/90'
        }`}
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white rounded-full animate-spin" />
            Processing...
          </div>
        ) : (
          <>
            <FaCoins className="inline-block mr-2" />
            {timeRemaining ? `Cooldown: ${timeRemaining}` : 'Claim tBNB'}
          </>
        )}
      </button>
      
      {faucetEmpty && (
        <div className="mt-4 text-red-400 text-sm">
          Faucet is temporarily empty. Please check back later.
        </div>
      )}
    </div>
  );
};

export default FaucetRequest;