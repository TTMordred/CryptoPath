'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types
type Wallet = {
  id: string;
  address: string;
  isDefault: boolean;
};

type ProfileSettings = {
  username: string;
  profileImage: string | null;
  backgroundImage: string | null;
};

type SettingsContextType = {
  profile: ProfileSettings;
  wallets: Wallet[];
  updateProfile: (profile: Partial<ProfileSettings>) => void;
  saveProfile: () => void;
  addWallet: (address: string) => void;
  removeWallet: (id: string) => void;
  setDefaultWallet: (id: string) => void;
  hasUnsavedChanges: boolean;
};

// Default values
const defaultProfile: ProfileSettings = {
  username: 'User',
  profileImage: null,
  backgroundImage: null,
};

// Create context
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Provider component
export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Khởi tạo trạng thái mà không truy cập localStorage trực tiếp
  const [profile, setProfile] = useState<ProfileSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('profile');
      return saved ? JSON.parse(saved) : defaultProfile;
    }
    return defaultProfile; // Giá trị mặc định trên server
  });

  const [wallets, setWallets] = useState<Wallet[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('wallets');
      return saved ? JSON.parse(saved) : [];
    }
    return []; // Giá trị mặc định trên server
  });

  const [savedProfile, setSavedProfile] = useState<ProfileSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('profile');
      return saved ? JSON.parse(saved) : defaultProfile;
    }
    return defaultProfile; // Giá trị mặc định trên server
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Đồng bộ với localStorage chỉ khi chạy trên client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedProfileData = localStorage.getItem('profile');
      const savedWalletsData = localStorage.getItem('wallets');
      
      if (savedProfileData) setProfile(JSON.parse(savedProfileData));
      if (savedWalletsData) setWallets(JSON.parse(savedWalletsData));
    }
  }, []);

  // Check for unsaved changes
  useEffect(() => {
    const isChanged = JSON.stringify(profile) !== JSON.stringify(savedProfile);
    setHasUnsavedChanges(isChanged);
  }, [profile, savedProfile]);

  // Save profile changes
  const saveProfile = () => {
    setSavedProfile(profile);
    if (typeof window !== 'undefined') {
      localStorage.setItem('profile', JSON.stringify(profile));
    }
  };

  // Update profile
  const updateProfile = (updates: Partial<ProfileSettings>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  // Wallet functions
  const addWallet = (address: string) => {
    const newWallet: Wallet = {
      id: Date.now().toString(),
      address,
      isDefault: wallets.length === 0,
    };
    const updatedWallets = [...wallets, newWallet];
    setWallets(updatedWallets);
    if (typeof window !== 'undefined') {
      localStorage.setItem('wallets', JSON.stringify(updatedWallets));
    }
  };

  const removeWallet = (id: string) => {
    const walletToRemove = wallets.find(w => w.id === id);
    const remainingWallets = wallets.filter(w => w.id !== id);
    
    if (walletToRemove?.isDefault && remainingWallets.length > 0) {
      remainingWallets[0].isDefault = true;
    }
    
    setWallets(remainingWallets);
    if (typeof window !== 'undefined') {
      localStorage.setItem('wallets', JSON.stringify(remainingWallets));
    }
  };

  const setDefaultWallet = (id: string) => {
    const updatedWallets = wallets.map(wallet => ({
      ...wallet,
      isDefault: wallet.id === id,
    }));
    setWallets(updatedWallets);
    if (typeof window !== 'undefined') {
      localStorage.setItem('wallets', JSON.stringify(updatedWallets));
    }
  };

  const value = {
    profile,
    wallets,
    updateProfile,
    saveProfile,
    addWallet,
    removeWallet,
    setDefaultWallet,
    hasUnsavedChanges,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

// Hook for using the context
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};