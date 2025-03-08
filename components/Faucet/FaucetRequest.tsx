'use client';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { FaCoins } from 'react-icons/fa';
import { useWallet } from '@/components/Faucet/walletcontext';

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
  const [cooldownActive, setCooldownActive] = useState(false);
  const { account } = useWallet();

  useEffect(() => {
    const updateCooldown = () => {
      const now = Math.floor(Date.now() / 1000);
      const cooldownEnds = faucetData.lastRequest + 21600;
      const isActive = now < cooldownEnds;

      setCooldownActive(isActive);

      if (isActive) {
        const seconds = cooldownEnds - now;
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        setTimeRemaining(`${hours}h ${minutes}m`);
      }
    };

    updateCooldown();
    const interval = setInterval(updateCooldown, 60000);
    return () => clearInterval(interval);
  }, [faucetData]);

  const getButtonState = () => {
    if (!account) return 'Connect Wallet';
    if (isBlacklisted) return 'Blacklisted';
    if (faucetEmpty) return 'Faucet Empty';
    if (cooldownActive) return `Cooldown: ${timeRemaining}`;
    return 'Claim Tokens';
  };

  return (
    <div className="text-center">
      <button
        onClick={requestTokens}
        disabled={!account || loading || faucetEmpty || cooldownActive || isBlacklisted}
        className={`cp-button cp-button--primary w-full ${
          !account || loading || faucetEmpty || cooldownActive || isBlacklisted 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:bg-[#F5B056]/90'
        }`}
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Processing...
          </div>
        ) : (
          <>
            <FaCoins className="inline-block mr-2" />
            {getButtonState()}
          </>
        )}
      </button>
    </div>
  );
};

export default FaucetRequest;