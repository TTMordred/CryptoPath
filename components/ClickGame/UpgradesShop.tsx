'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { useGameContext } from './GameContext';
import { FaCoins, FaRocket, FaRobot } from 'react-icons/fa';

const UpgradesShop: React.FC = () => {
  const { gameState, purchaseUpgrade } = useGameContext();
  
  const handlePurchase = (upgradeId: string) => {
    purchaseUpgrade(upgradeId);
  };

  // Get the upgrade cost with level scaling
  const getUpgradeCost = (upgrade: any) => {
    return upgrade.cost * (upgrade.level + 1);
  };

  // Check if player can afford an upgrade
  const canAfford = (upgrade: any) => {
    const cost = getUpgradeCost(upgrade);
    return gameState.tokens >= cost && upgrade.level < upgrade.maxLevel;
  };

  return (
    <div className="bg-black/30 rounded-xl p-6 border border-gray-800">
      <h2 className="text-xl font-bold mb-4 text-white">Upgrades</h2>
      
      <div className="space-y-4">
        {gameState.upgrades.map(upgrade => (
          <motion.div
            key={upgrade.id}
            className={`
              relative rounded-lg p-4 border
              ${canAfford(upgrade) 
                ? 'border-green-500/30 bg-black/50 hover:bg-black/70' 
                : upgrade.level >= upgrade.maxLevel
                  ? 'border-purple-500/30 bg-black/50'
                  : 'border-gray-700/30 bg-black/20'}
              transition-colors duration-200
            `}
            whileHover={canAfford(upgrade) ? { scale: 1.02 } : {}}
            whileTap={canAfford(upgrade) ? { scale: 0.98 } : {}}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                {upgrade.isAutoClicker ? (
                  <FaRobot className="text-purple-400 text-xl" />
                ) : (
                  <FaRocket className="text-blue-400 text-xl" />
                )}
                <div>
                  <h3 className="font-bold text-white">{upgrade.name}</h3>
                  <p className="text-sm text-gray-400">{upgrade.description}</p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center justify-end mb-1">
                  <FaCoins className="text-[#F5B056] mr-1 text-sm" />
                  <span className={`text-sm font-bold ${canAfford(upgrade) ? 'text-green-400' : 'text-gray-400'}`}>
                    {upgrade.level < upgrade.maxLevel ? getUpgradeCost(upgrade) : 'MAX'}
                  </span>
                </div>
                
                <button
                  className={`
                    px-3 py-1 rounded text-xs font-bold
                    ${canAfford(upgrade) 
                      ? 'bg-green-500 hover:bg-green-600 text-white cursor-pointer' 
                      : upgrade.level >= upgrade.maxLevel
                        ? 'bg-purple-700 text-white cursor-not-allowed'
                        : 'bg-gray-700 text-gray-400 cursor-not-allowed'}
                  `}
                  onClick={() => handlePurchase(upgrade.id)}
                  disabled={!canAfford(upgrade)}
                >
                  {upgrade.level >= upgrade.maxLevel ? 'MAXED' : 'BUY'}
                </button>
              </div>
            </div>
            
            {/* Level indicator */}
            <div className="mt-3">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-gray-400">Level {upgrade.level}/{upgrade.maxLevel}</span>
                {upgrade.isAutoClicker && upgrade.level > 0 && (
                  <span className="text-purple-400">
                    {upgrade.clicksPerSecond! * upgrade.level} click{upgrade.clicksPerSecond! * upgrade.level !== 1 ? 's' : ''}/s
                  </span>
                )}
              </div>
              
              <div className="w-full bg-gray-800 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full ${upgrade.isAutoClicker ? 'bg-purple-500' : 'bg-blue-500'}`}
                  style={{ width: `${(upgrade.level / upgrade.maxLevel) * 100}%` }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default UpgradesShop;
