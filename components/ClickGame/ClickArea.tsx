'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameContext } from './GameContext';
import ClickAnimation from './ClickAnimation';
import { FaCoins } from 'react-icons/fa';

const ClickArea: React.FC = () => {
  const { gameState, isSessionActive, handleClick, sessionClicksRemaining } = useGameContext();
  const [clickPosition, setClickPosition] = useState<{ x: number; y: number } | null>(null);
  
  const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSessionActive) return;
    
    // Get click position for animation
    const rect = e.currentTarget.getBoundingClientRect();
    setClickPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    
    // Register the click
    handleClick();
    
    // Reset click position after a short delay
    setTimeout(() => setClickPosition(null), 50);
  };

  // Calculate progress for the progress bar
  const sessionProgress = ((gameState.maxClicksPerSession - sessionClicksRemaining) / gameState.maxClicksPerSession) * 100;

  return (
    <div className="relative flex flex-col items-center">
      <div className="w-full bg-gray-800 rounded-full h-3 mb-6">
        <div 
          className="bg-green-500 h-3 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${sessionProgress}%` }}
        />
      </div>
      
      <motion.div
        className={`
          relative w-64 h-64 rounded-full flex items-center justify-center
          cursor-pointer select-none overflow-hidden
          ${isSessionActive ? 'bg-[#F5B056]/30 hover:bg-[#F5B056]/40' : 'bg-gray-800/50 cursor-not-allowed'}
          border-4 ${isSessionActive ? 'border-[#F5B056]' : 'border-gray-700'}
          transition-colors duration-300
        `}
        onClick={onClick}
        whileTap={isSessionActive ? { scale: 0.95 } : undefined}
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <FaCoins className="text-7xl text-[#F5B056]" />
        {!isSessionActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <span className="text-white text-xl font-bold">
              {sessionClicksRemaining <= 0 ? "Session Complete" : "Waiting..."}
            </span>
          </div>
        )}
      </motion.div>

      {isSessionActive && (
        <div className="mt-4 font-bold text-[#F5B056]">
          {sessionClicksRemaining} clicks remaining
        </div>
      )}
      
      <ClickAnimation clickPosition={clickPosition} value={gameState.clickMultiplier} />
    </div>
  );
};

export default ClickArea;
