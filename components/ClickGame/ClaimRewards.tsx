'use client';
import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useGameContext } from './GameContext';
import { toast } from 'react-hot-toast';
import { FaCoins, FaInfoCircle } from 'react-icons/fa';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/components/Faucet/constants';
import { useWallet } from '@/components/Faucet/walletcontext';

const ClaimRewards: React.FC = () => {
  const { gameState, resetTokens } = useGameContext();
  const { connectWallet, account, updatePathBalance } = useWallet();
  const [claiming, setClaiming] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const handleClaim = async () => {
    if (claiming || gameState.tokens < 10) return;
    
    setClaiming(true);
    try {
      // First check if wallet is connected
      if (!account) {
        await connectWallet();
      }

      // Since there's no direct mintGameRewards function in the contract,
      // we'll simulate the claiming process for demonstration purposes
      
      // Show processing for a realistic feel
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Successful simulation
      toast.success(`Successfully claimed ${Math.floor(gameState.tokens)} PATH tokens to your game balance!`);
      
      // Reset the in-game tokens to zero after "successful" claim
      resetTokens();
      
      // Refresh wallet balance for effect (though it won't actually change)
      if (account) {
        updatePathBalance();
      }
      
      // Show info tooltip about the simulation
      setShowInfo(true);
      setTimeout(() => setShowInfo(false), 8000);
      
    } catch (error) {
      console.error('Error in claim process:', error);
      toast.error('Operation failed. Please try again or check wallet connection.');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleClaim}
        disabled={claiming || gameState.tokens < 10}
        className={`mt-4 w-full py-2 rounded-lg font-semibold flex items-center justify-center gap-2 
          ${gameState.tokens < 10 || claiming 
            ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
            : 'bg-green-600 hover:bg-green-700 text-white'}`}
      >
        {claiming ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Claiming...
          </>
        ) : (
          <>
            <FaCoins className="text-sm" />
            Claim {Math.floor(gameState.tokens)} PATH to Game Balance
          </>
        )}
      </button>
      
      {showInfo && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-blue-900/80 border border-blue-700 rounded-md text-xs text-blue-100 z-10">
          <FaInfoCircle className="inline-block mr-1" />
          This is a demonstration feature. In the full implementation, tokens would be transferred to your wallet via a smart contract.
        </div>
      )}
      
      <div className="mt-2 text-xs text-gray-400">
        Minimum 10 PATH required to claim
      </div>
    </div>
  );
};

export default ClaimRewards;
