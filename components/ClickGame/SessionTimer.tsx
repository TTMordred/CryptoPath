'use client';
import React, { useEffect, useState } from 'react';
import { useGameContext } from './GameContext';

const SessionTimer: React.FC = () => {
  const { isOnCooldown, cooldownTimeRemaining } = useGameContext();
  const [timeLeft, setTimeLeft] = useState(cooldownTimeRemaining);
  
  useEffect(() => {
    if (!isOnCooldown) {
      setTimeLeft(0);
      return;
    }
    
    setTimeLeft(cooldownTimeRemaining);
    
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1000;
        return newTime > 0 ? newTime : 0;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isOnCooldown, cooldownTimeRemaining]);
  
  if (!isOnCooldown) return null;
  
  // Format time as minutes:seconds
  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  
  // Calculate progress percentage
  const initialDuration = 300000; // 5 minutes, should match the value in GameContext
  const progress = ((initialDuration - timeLeft) / initialDuration) * 100;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 flex justify-center">
      <div className="bg-black/80 backdrop-blur-sm rounded-t-xl p-4 border border-b-0 border-gray-700 shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-2">
          <span className="text-white font-bold">Session cooldown</span>
          <span className="text-[#F5B056] font-mono font-bold">{formattedTime}</span>
        </div>
        
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div 
            className="bg-[#F5B056] h-2 rounded-full transition-all duration-700 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default SessionTimer;
