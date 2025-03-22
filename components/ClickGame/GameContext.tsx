'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { saveGameState, loadGameState } from './storageService';

// Define types for our game state
export interface Upgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  multiplier: number;
  level: number;
  maxLevel: number;
  isAutoClicker: boolean;
  clicksPerSecond?: number;
}

export interface GameState {
  tokens: number;
  totalClicks: number;
  clickMultiplier: number;
  clicksThisSession: number;
  maxClicksPerSession: number;
  nextSessionTime: number;
  sessionDuration: number;
  upgrades: Upgrade[];
  autoClickerActive: boolean;
  autoClickersCount: number;
}

interface GameContextType {
  gameState: GameState;
  isSessionActive: boolean;
  isOnCooldown: boolean;
  cooldownTimeRemaining: number;
  sessionClicksRemaining: number;
  handleClick: () => void;
  purchaseUpgrade: (upgradeId: string) => void;
  resetSession: () => void;
  resetTokens: () => void; // Add this line to include resetTokens function
}

const defaultUpgrades: Upgrade[] = [
  {
    id: 'multiplier1',
    name: 'Click Booster',
    description: 'Increase click value by 0.2 per level',
    cost: 10,
    multiplier: 0.2,
    level: 0,
    maxLevel: 10,
    isAutoClicker: false
  },
  {
    id: 'multiplier2',
    name: 'Super Clicker',
    description: 'Increase click value by 0.5 per level',
    cost: 50,
    multiplier: 0.5,
    level: 0,
    maxLevel: 5,
    isAutoClicker: false
  },
  {
    id: 'autoclicker1',
    name: 'Auto Clicker',
    description: 'Automatically clicks once per second',
    cost: 100,
    multiplier: 1,
    level: 0,
    maxLevel: 5,
    isAutoClicker: true,
    clicksPerSecond: 1
  },
  {
    id: 'autoclicker2',
    name: 'Fast Auto Clicker',
    description: 'Automatically clicks twice per second',
    cost: 300,
    multiplier: 1,
    level: 0,
    maxLevel: 3,
    isAutoClicker: true,
    clicksPerSecond: 2
  }
];

const initialState: GameState = {
  tokens: 0,
  totalClicks: 0,
  clickMultiplier: 1,
  clicksThisSession: 0,
  maxClicksPerSession: 50,
  nextSessionTime: 0,
  sessionDuration: 300000, // 5 minutes cooldown
  upgrades: defaultUpgrades,
  autoClickerActive: false,
  autoClickersCount: 0
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>(initialState);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load game state from local storage on component mount
  useEffect(() => {
    const savedState = loadGameState();
    if (savedState) {
      setGameState(savedState);
    }
    setIsInitialized(true);
  }, []);

  // Save game state to local storage whenever it changes
  useEffect(() => {
    if (isInitialized) {
      saveGameState(gameState);
    }
  }, [gameState, isInitialized]);

  // Auto-clicker effect
  useEffect(() => {
    if (!gameState.autoClickerActive) return;

    const autoClickersTotal = gameState.upgrades
      .filter(upgrade => upgrade.isAutoClicker)
      .reduce((total, upgrade) => {
        return total + (upgrade.level * (upgrade.clicksPerSecond || 0));
      }, 0);

    if (autoClickersTotal === 0) return;

    const interval = setInterval(() => {
      setGameState(prevState => {
        // Don't auto-click if we've reached the session limit or on cooldown
        if (prevState.clicksThisSession >= prevState.maxClicksPerSession || 
            prevState.nextSessionTime > Date.now()) {
          return prevState;
        }

        const newTokens = prevState.tokens + (prevState.clickMultiplier * autoClickersTotal);
        const newClicksThisSession = Math.min(
          prevState.clicksThisSession + autoClickersTotal,
          prevState.maxClicksPerSession
        );
        
        const isSessionComplete = newClicksThisSession >= prevState.maxClicksPerSession;
        const newNextSessionTime = isSessionComplete ? Date.now() + prevState.sessionDuration : prevState.nextSessionTime;

        return {
          ...prevState,
          tokens: newTokens,
          clicksThisSession: newClicksThisSession,
          totalClicks: prevState.totalClicks + autoClickersTotal,
          nextSessionTime: newNextSessionTime
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState.autoClickerActive, gameState.upgrades]);

  // Calculate cooldown and session status
  const now = Date.now();
  const isOnCooldown = gameState.nextSessionTime > now;
  const isSessionActive = !isOnCooldown && gameState.clicksThisSession < gameState.maxClicksPerSession;
  const cooldownTimeRemaining = Math.max(0, gameState.nextSessionTime - now);
  const sessionClicksRemaining = gameState.maxClicksPerSession - gameState.clicksThisSession;

  // Handle manual click
  const handleClick = () => {
    if (!isSessionActive) return;

    setGameState(prevState => {
      const newClicksThisSession = prevState.clicksThisSession + 1;
      const isSessionComplete = newClicksThisSession >= prevState.maxClicksPerSession;
      
      return {
        ...prevState,
        tokens: prevState.tokens + prevState.clickMultiplier,
        totalClicks: prevState.totalClicks + 1,
        clicksThisSession: newClicksThisSession,
        nextSessionTime: isSessionComplete ? now + prevState.sessionDuration : prevState.nextSessionTime
      };
    });
  };

  // Purchase upgrade
  const purchaseUpgrade = (upgradeId: string) => {
    setGameState(prevState => {
      const upgradeIndex = prevState.upgrades.findIndex(u => u.id === upgradeId);
      if (upgradeIndex === -1) return prevState;

      const upgrade = prevState.upgrades[upgradeIndex];
      
      // Check if the upgrade can be purchased
      if (
        upgrade.level >= upgrade.maxLevel ||
        prevState.tokens < upgrade.cost * (upgrade.level + 1)
      ) {
        return prevState;
      }

      // Create a new upgrades array with the updated upgrade
      const newUpgrades = [...prevState.upgrades];
      newUpgrades[upgradeIndex] = {
        ...upgrade,
        level: upgrade.level + 1
      };

      // Calculate new multiplier
      let newMultiplier = 1;
      let newAutoClickersCount = 0;
      
      for (const u of newUpgrades) {
        if (!u.isAutoClicker) {
          newMultiplier += u.multiplier * u.level;
        } else if (u.level > 0) {
          newAutoClickersCount += u.level;
        }
      }

      return {
        ...prevState,
        tokens: prevState.tokens - (upgrade.cost * (upgrade.level + 1)),
        clickMultiplier: newMultiplier,
        upgrades: newUpgrades,
        autoClickerActive: newAutoClickersCount > 0,
        autoClickersCount: newAutoClickersCount
      };
    });
  };

  // Reset session (can be implemented for special items or features)
  const resetSession = () => {
    setGameState(prevState => ({
      ...prevState,
      clicksThisSession: 0,
      nextSessionTime: 0
    }));
  };

  // Add resetTokens function to reset tokens to zero (for claiming)
  const resetTokens = () => {
    setGameState(prevState => ({
      ...prevState,
      tokens: 0
    }));
  };

  const contextValue: GameContextType = {
    gameState,
    isSessionActive,
    isOnCooldown,
    cooldownTimeRemaining,
    sessionClicksRemaining,
    handleClick,
    purchaseUpgrade,
    resetSession,
    resetTokens // Add this line to include resetTokens in the context value
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
};

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
};
