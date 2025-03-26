// app/staking/page.tsx
'use client';
import React, { useEffect } from 'react';
import ParticlesBackground from '@/components/ParticlesBackground';
import StakingCard from '@/components/Staking/StakingCard';
import { useWallet } from '@/components/Faucet/walletcontext';
import { toast } from 'react-hot-toast';

const StakingPage = () => {
  const { account, connectWallet } = useWallet();

  useEffect(() => {
    if (!account && window.ethereum) {
      connectWallet().catch(() => toast.error('Failed to connect wallet'));
    }
  }, [account, connectWallet]);

  return (
    <div className="relative min-h-screen font-sans">
      <ParticlesBackground />
      <div className="relative z-10 bg-transparent">
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto">
            <StakingCard />
          </div>
        </main>
      </div>
    </div>
  );
};

export default StakingPage;