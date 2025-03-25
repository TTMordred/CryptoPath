'use client';
import React from 'react';
import { useGameContext } from './GameContext';
import { FaCoins, FaMousePointer, FaRobot, FaPercentage } from 'react-icons/fa';
import ClaimRewards from './ClaimRewards';

const StatsDisplay: React.FC = () => {
  const { gameState, isOnCooldown, cooldownTimeRemaining } = useGameContext();
  
  // Format cooldown time as mm:ss
  const formatCooldown = () => {
    const minutes = Math.floor(cooldownTimeRemaining / 60000);
    const seconds = Math.floor((cooldownTimeRemaining % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className="bg-black/30 rounded-xl p-6 border border-gray-800">
      <h2 className="text-xl font-bold mb-4 text-white">Stats</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-3">
          <FaCoins className="text-[#F5B056] text-xl" />
          <div>
            <p className="text-gray-400 text-sm">PATH Tokens</p>
            <p className="text-white font-bold">{gameState.tokens.toFixed(1)}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <FaMousePointer className="text-blue-400 text-xl" />
          <div>
            <p className="text-gray-400 text-sm">Total Clicks</p>
            <p className="text-white font-bold">{gameState.totalClicks}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <FaPercentage className="text-green-400 text-xl" />
          <div>
            <p className="text-gray-400 text-sm">Click Value</p>
            <p className="text-white font-bold">×{gameState.clickMultiplier.toFixed(1)}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <FaRobot className="text-purple-400 text-xl" />
          <div>
            <p className="text-gray-400 text-sm">Auto Clickers</p>
            <p className="text-white font-bold">{gameState.autoClickersCount}</p>
          </div>
        </div>
      </div>
      
      {isOnCooldown && (
        <div className="mt-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
          <p className="text-gray-400 text-sm">Next session available in:</p>
          <p className="text-white font-bold text-lg">{formatCooldown()}</p>
        </div>
      )}

      {/* Add Claim Rewards button */}
      {gameState.tokens >= 10 && (
        <ClaimRewards />
      )}
    </div>
  );
};

export default StatsDisplay;
