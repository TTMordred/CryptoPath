import { GameState } from './GameContext';

const STORAGE_KEY = 'cryptopath_clicker_game';

export const saveGameState = (gameState: GameState): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const serializedState = JSON.stringify(gameState);
    localStorage.setItem(STORAGE_KEY, serializedState);
  } catch (error) {
    console.error('Error saving game state:', error);
  }
};

export const loadGameState = (): GameState | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const serializedState = localStorage.getItem(STORAGE_KEY);
    if (!serializedState) return null;
    
    return JSON.parse(serializedState) as GameState;
  } catch (error) {
    console.error('Error loading game state:', error);
    return null;
  }
};

export const clearGameState = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing game state:', error);
  }
};
