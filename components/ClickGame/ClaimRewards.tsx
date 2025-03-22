'use client';
import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useGameContext } from './GameContext';
import { toast } from 'react-hot-toast';
import { FaCoins } from 'react-icons/fa';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/components/Faucet/constants';

const ClaimRewards: React.FC = () => {
  const { gameState, resetTokens } = useGameContext();
  const [claiming, setClaiming] = useState(false);

  const handleClaim = async () => {
    if (claiming || gameState.tokens < 10) return;
    
    setClaiming(true);
    try {
      if (!window.ethereum) {
        toast.error('Please install MetaMask to claim tokens');
        setClaiming(false);
        return;
      }

      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Connect to the network and contract
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      // You'd need an admin-controlled function in your PATH contract that allows
      // minting tokens to users based on game rewards
      const amountToMint = ethers.utils.parseEther(Math.floor(gameState.tokens).toString());
      const tx = await contract.mintGameRewards(await signer.getAddress(), amountToMint);
      
      await tx.wait();
      
      // Reset the in-game tokens to zero after successful claim
      resetTokens();
      
      toast.success(`Successfully claimed ${Math.floor(gameState.tokens)} PATH tokens!`);
    } catch (error) {
      console.error('Error claiming tokens:', error);
      toast.error('Failed to claim tokens. Please try again.');
    } finally {
      setClaiming(false);
    }
  };

  return (
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
          Claim {Math.floor(gameState.tokens)} PATH to Wallet
        </>
      )}
    </button>
  );
};

export default ClaimRewards;
