'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type ProfileSettings = {
  username: string;
  profileImage: string | null;
  backgroundImage: string | null;
};

type Wallet = {
  id: string;
  address: string;
  isDefault: boolean;
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

const defaultProfile: ProfileSettings = {
  username: 'User',
  profileImage: null,
  backgroundImage: null,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const getCurrentUserSettingsKey = () => {
    if (typeof window !== 'undefined') {
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        const userData = JSON.parse(currentUser);
        return userData.settingsKey;
      }
    }
    return null;
  };

  const [settingsKey] = useState<string | null>(getCurrentUserSettingsKey());

  const getInitialProfile = () => {
    if (typeof window !== 'undefined' && settingsKey) {
      const saved = localStorage.getItem(settingsKey);
      return saved ? JSON.parse(saved).profile || defaultProfile : defaultProfile;
    }
    return defaultProfile;
  };

  const getInitialWallets = () => {
    if (typeof window !== 'undefined' && settingsKey) {
      const saved = localStorage.getItem(settingsKey);
      return saved ? JSON.parse(saved).wallets || [] : [];
    }
    return [];
  };

  const [profile, setProfile] = useState<ProfileSettings>(getInitialProfile());
  const [savedProfile, setSavedProfile] = useState<ProfileSettings>(getInitialProfile());
  const [wallets, setWallets] = useState<Wallet[]>(getInitialWallets());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    const isChanged = JSON.stringify(profile) !== JSON.stringify(savedProfile);
    setHasUnsavedChanges(isChanged);
  }, [profile, savedProfile]);

  const updateProfile = (updates: Partial<ProfileSettings>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  const saveProfile = () => {
    if (settingsKey && typeof window !== 'undefined') {
      setSavedProfile(profile);
      const settingsData = { profile, wallets };
      localStorage.setItem(settingsKey, JSON.stringify(settingsData));

      // Cập nhật currentUser nhưng giữ nguyên walletAddress
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        const userData = JSON.parse(currentUser);
        userData.name = profile.username; // Chỉ cập nhật name
        // Không ghi đè walletAddress
        localStorage.setItem('currentUser', JSON.stringify(userData));
      }
    }
  };

  const addWallet = (address: string) => {
    const newWallet: Wallet = {
      id: Date.now().toString(),
      address,
      isDefault: wallets.length === 0,
    };
    const updatedWallets = [...wallets, newWallet];
    setWallets(updatedWallets);
    if (settingsKey) {
      const settingsData = { profile, wallets: updatedWallets };
      localStorage.setItem(settingsKey, JSON.stringify(settingsData));
    }
  };

  const removeWallet = (id: string) => {
    const walletToRemove = wallets.find(w => w.id === id);
    const remainingWallets = wallets.filter(w => w.id !== id);
    if (walletToRemove?.isDefault && remainingWallets.length > 0) {
      remainingWallets[0].isDefault = true;
    }
    setWallets(remainingWallets);
    if (settingsKey) {
      const settingsData = { profile, wallets: remainingWallets };
      localStorage.setItem(settingsKey, JSON.stringify(settingsData));
    }
  };

  const setDefaultWallet = (id: string) => {
    const updatedWallets = wallets.map(wallet => ({
      ...wallet,
      isDefault: wallet.id === id,
    }));
    setWallets(updatedWallets);
    if (settingsKey) {
      const settingsData = { profile, wallets: updatedWallets };
      localStorage.setItem(settingsKey, JSON.stringify(settingsData));
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

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};