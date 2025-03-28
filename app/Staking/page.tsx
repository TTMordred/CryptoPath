// app/staking/page.tsx
'use client';
import React, { useEffect } from 'react';
import ParticlesBackground from '@/components/ParticlesBackground';
import StakingCard from '@/components/Staking/StakingCard';
import { useWallet } from '@/components/Faucet/walletcontext';
import { toast } from 'react-hot-toast';
import { FaWallet, FaInfoCircle } from 'react-icons/fa';

const StakingPage = () => {
  const { account, connectWallet } = useWallet();

  useEffect(() => {
    if (!account && window.ethereum) {
      connectWallet().catch(() => toast.error('Failed to connect wallet'));
    }
  }, [account, connectWallet]);

  return (
    <div className="relative min-h-screen font-sans text-white">
      <ParticlesBackground />
      
      <div className="relative z-10 bg-transparent">
        <header className="container mx-auto px-4 pt-6">
          <div className="flex justify-between items-center">
            <div className="w-32">
              {/* Empty div for flex spacing */}
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              <span className="text-[#F5B056]">
                PATH <span className="font-extrabold">Staking Platform</span>
              </span>
            </h1>
            
            <button 
              onClick={(e) => connectWallet()} 
              className="bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white px-4 py-2 rounded-xl border border-[#333] flex items-center transition-all hover:scale-105"
            >
              <FaWallet className="mr-2" />
              {account ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}` : 'Connect Wallet'}
            </button>
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <StakingCard />
            
            <div className="mt-8 p-4 rounded-xl bg-[#1a1a1a] border border-[#333] text-sm text-gray-300 space-y-3">
              <div className="flex items-start">
                <FaInfoCircle className="text-[#F5B056] mt-1 mr-2 flex-shrink-0" />
                <p>Stake your PATH tokens to earn rewards. The Annual Percentage Rate (APR) may vary based on the total amount staked.</p>
              </div>
              <div className="flex space-x-4 pt-2 border-t border-[#333]">
                <span className="text-xs bg-[#1a1a1a] px-2 py-1 rounded-md text-[#F5B056] border border-[#F5B056]/20">BSC Testnet</span>
                <span className="text-xs bg-[#1a1a1a] px-2 py-1 rounded-md text-[#F5B056] border border-[#F5B056]/20">Test Tokens</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StakingPage;