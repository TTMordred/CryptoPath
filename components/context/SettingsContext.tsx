
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/src/integrations/supabase/client';
import { toast } from 'sonner';

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
  isSyncing: boolean;
  syncWithSupabase: () => Promise<void>;
};

const defaultProfile: ProfileSettings = {
  username: 'User',
  profileImage: null,
  backgroundImage: null,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [settingsKey, setSettingsKey] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileSettings>(defaultProfile);
  const [savedProfile, setSavedProfile] = useState<ProfileSettings>(defaultProfile);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Get user information and settings key
  useEffect(() => {
    const getCurrentUserInfo = async () => {
      try {
        // Check if we have a session
        const { data: { session } } = await supabase.auth.getSession();
        const currentUserId = session?.user?.id || null;
        
        if (currentUserId) {
          setUserId(currentUserId);
          
          // Check localStorage for current user
          if (typeof window !== 'undefined') {
            const currentUser = localStorage.getItem('currentUser');
            if (currentUser) {
              const userData = JSON.parse(currentUser);
              const key = userData.settingsKey || `settings_${userData.email || currentUserId}`;
              setSettingsKey(key);
            } else {
              // Create a settingsKey if none exists
              const newKey = `settings_${currentUserId}`;
              setSettingsKey(newKey);
            }
          }
        }
      } catch (error) {
        console.error('Error getting user info:', error);
      }
    };

    getCurrentUserInfo();
  }, []);

  // Load settings from localStorage or Supabase
  useEffect(() => {
    const loadSettings = async () => {
      if (!userId) return;
      
      try {
        // First, try to fetch from Supabase
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
          
        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error fetching profile from Supabase:', profileError);
        }
        
        const { data: walletData, error: walletError } = await supabase
          .from('user_wallets')
          .select('*')
          .eq('user_id', userId);
          
        if (walletError) {
          console.error('Error fetching wallets from Supabase:', walletError);
        }
        
        // If we have Supabase data, use it
        if (profileData) {
          const profileSettings: ProfileSettings = {
            username: profileData.display_name || profileData.username || 'User',
            profileImage: profileData.profile_image || null,
            backgroundImage: profileData.background_image || null,
          };
          
          setProfile(profileSettings);
          setSavedProfile(profileSettings);
        }
        
        if (walletData && walletData.length > 0) {
          const formattedWallets: Wallet[] = walletData.map(wallet => ({
            id: wallet.id,
            address: wallet.wallet_address,
            isDefault: wallet.is_default || false,
          }));
          
          setWallets(formattedWallets);
        }
        
        // If no Supabase data or incomplete data, try localStorage as fallback
        if ((!profileData || !walletData || walletData.length === 0) && typeof window !== 'undefined' && settingsKey) {
          const saved = localStorage.getItem(settingsKey);
          const settings = saved ? JSON.parse(saved) : null;
          
          if (settings) {
            if (!profileData && settings.profile) {
              setProfile(settings.profile);
              setSavedProfile(settings.profile);
            }
            
            if ((!walletData || walletData.length === 0) && settings.wallets) {
              setWallets(settings.wallets);
            }
            
            // If we loaded from localStorage, sync with Supabase
            syncSettingsToSupabase(userId, settings.profile, settings.wallets);
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        
        // Fallback to localStorage if Supabase fails
        if (typeof window !== 'undefined' && settingsKey) {
          const saved = localStorage.getItem(settingsKey);
          const settings = saved ? JSON.parse(saved) : null;
          
          if (settings) {
            setProfile(settings.profile || defaultProfile);
            setSavedProfile(settings.profile || defaultProfile);
            setWallets(settings.wallets || []);
          }
        }
      }
    };

    if (userId) {
      loadSettings();
    }
  }, [userId, settingsKey]);

  // Check for unsaved changes
  useEffect(() => {
    const isChanged = JSON.stringify(profile) !== JSON.stringify(savedProfile);
    setHasUnsavedChanges(isChanged);
  }, [profile, savedProfile]);

  // Function to sync settings to Supabase
  const syncSettingsToSupabase = async (userId: string, profileSettings: ProfileSettings, walletSettings: Wallet[]) => {
    if (!userId) return;
    
    try {
      // Update profile
      await supabase
        .from('profiles')
        .update({
          display_name: profileSettings.username,
          profile_image: profileSettings.profileImage,
          background_image: profileSettings.backgroundImage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
      
      // Handle wallets - more complex because we need to compare what exists already
      const { data: existingWallets, error: walletFetchError } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', userId);
        
      if (walletFetchError) {
        console.error('Error fetching existing wallets:', walletFetchError);
        return;
      }
      
      // Convert walletSettings to a format we can work with
      const walletsToSync = walletSettings.map(wallet => ({
        user_id: userId,
        wallet_address: wallet.address,
        is_default: wallet.isDefault,
      }));
      
      // Identify wallets to add or update
      for (const wallet of walletsToSync) {
        const existingWallet = existingWallets?.find(w => w.wallet_address === wallet.wallet_address);
        
        if (!existingWallet) {
          // Add new wallet
          await supabase
            .from('user_wallets')
            .insert(wallet);
        } else if (existingWallet.is_default !== wallet.is_default) {
          // Update wallet if default status changed
          await supabase
            .from('user_wallets')
            .update({ is_default: wallet.is_default })
            .eq('id', existingWallet.id);
        }
      }
      
      // Identify wallets to remove
      if (existingWallets) {
        for (const existingWallet of existingWallets) {
          const shouldKeep = walletsToSync.some(w => w.wallet_address === existingWallet.wallet_address);
          
          if (!shouldKeep) {
            // Remove wallet that's no longer in the list
            await supabase
              .from('user_wallets')
              .delete()
              .eq('id', existingWallet.id);
          }
        }
      }
    } catch (error) {
      console.error('Error syncing settings to Supabase:', error);
      throw error;
    }
  };

  const updateProfile = (updates: Partial<ProfileSettings>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  const saveProfile = async () => {
    if (!userId) {
      toast.error('You must be logged in to save settings');
      return;
    }
    
    try {
      // Update Supabase
      await supabase
        .from('profiles')
        .update({
          display_name: profile.username,
          profile_image: profile.profileImage,
          background_image: profile.backgroundImage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
      
      // Update localStorage
      if (settingsKey && typeof window !== 'undefined') {
        setSavedProfile(profile);
        const settingsData = { profile, wallets };
        localStorage.setItem(settingsKey, JSON.stringify(settingsData));
      }
      
      toast.success('Profile saved successfully');
      
      // Update currentUser data in localStorage
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        const userData = JSON.parse(currentUser);
        userData.name = profile.username;
        localStorage.setItem('currentUser', JSON.stringify(userData));
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    }
  };

  const addWallet = async (address: string) => {
    if (!userId) {
      toast.error('You must be logged in to add a wallet');
      return;
    }
    
    // Check if wallet already exists
    const walletExists = wallets.some(wallet => wallet.address.toLowerCase() === address.toLowerCase());
    if (walletExists) {
      toast.error('This wallet address is already added');
      return;
    }
    
    const newWallet: Wallet = {
      id: Date.now().toString(),
      address,
      isDefault: wallets.length === 0,
    };
    
    const updatedWallets = [...wallets, newWallet];
    setWallets(updatedWallets);
    
    try {
      // Add to Supabase
      const { error } = await supabase
        .from('user_wallets')
        .insert({
          user_id: userId,
          wallet_address: address,
          is_default: newWallet.isDefault,
        });
        
      if (error) throw error;
      
      // Update localStorage
      if (settingsKey) {
        const settingsData = { profile, wallets: updatedWallets };
        localStorage.setItem(settingsKey, JSON.stringify(settingsData));
      }
      
      toast.success('Wallet added successfully');
    } catch (error) {
      console.error('Error adding wallet:', error);
      toast.error('Failed to add wallet');
    }
  };

  const removeWallet = async (id: string) => {
    if (!userId) {
      toast.error('You must be logged in to remove a wallet');
      return;
    }
    
    const walletToRemove = wallets.find(w => w.id === id);
    if (!walletToRemove) return;
    
    const remainingWallets = wallets.filter(w => w.id !== id);
    
    // If removing the default wallet, make another one default
    if (walletToRemove.isDefault && remainingWallets.length > 0) {
      remainingWallets[0].isDefault = true;
    }
    
    setWallets(remainingWallets);
    
    try {
      // Remove from Supabase - first find the actual database ID
      const { data, error: fetchError } = await supabase
        .from('user_wallets')
        .select('id')
        .eq('wallet_address', walletToRemove.address)
        .eq('user_id', userId);
        
      if (fetchError) throw fetchError;
      
      if (data && data.length > 0) {
        const { error: deleteError } = await supabase
          .from('user_wallets')
          .delete()
          .eq('id', data[0].id);
          
        if (deleteError) throw deleteError;
      }
      
      // Update localStorage
      if (settingsKey) {
        const settingsData = { profile, wallets: remainingWallets };
        localStorage.setItem(settingsKey, JSON.stringify(settingsData));
      }
      
      toast.success('Wallet removed successfully');
      
      // Update default wallet if needed
      if (walletToRemove.isDefault && remainingWallets.length > 0) {
        await setDefaultWallet(remainingWallets[0].id);
      }
    } catch (error) {
      console.error('Error removing wallet:', error);
      toast.error('Failed to remove wallet');
    }
  };

  const setDefaultWallet = async (id: string) => {
    if (!userId) {
      toast.error('You must be logged in to set a default wallet');
      return;
    }
    
    const updatedWallets = wallets.map(wallet => ({
      ...wallet,
      isDefault: wallet.id === id,
    }));
    
    setWallets(updatedWallets);
    
    try {
      // Find the wallet that's being set as default
      const newDefaultWallet = updatedWallets.find(w => w.id === id);
      if (!newDefaultWallet) return;
      
      // Reset all wallets to non-default first
      const { error: resetError } = await supabase
        .from('user_wallets')
        .update({ is_default: false })
        .eq('user_id', userId);
        
      if (resetError) throw resetError;
      
      // Then set the new default
      const { data, error: fetchError } = await supabase
        .from('user_wallets')
        .select('id')
        .eq('wallet_address', newDefaultWallet.address)
        .eq('user_id', userId);
        
      if (fetchError) throw fetchError;
      
      if (data && data.length > 0) {
        const { error: updateError } = await supabase
          .from('user_wallets')
          .update({ is_default: true })
          .eq('id', data[0].id);
          
        if (updateError) throw updateError;
      }
      
      // Update localStorage
      if (settingsKey) {
        const settingsData = { profile, wallets: updatedWallets };
        localStorage.setItem(settingsKey, JSON.stringify(settingsData));
      }
      
      toast.success('Default wallet updated');
    } catch (error) {
      console.error('Error setting default wallet:', error);
      toast.error('Failed to update default wallet');
    }
  };

  const syncWithSupabase = async () => {
    if (!userId) {
      toast.error('You must be logged in to sync settings');
      return;
    }
    
    setIsSyncing(true);
    
    try {
      await syncSettingsToSupabase(userId, profile, wallets);
      toast.success('Settings synchronized with database');
    } catch (error) {
      console.error('Error during sync:', error);
      toast.error('Failed to sync settings with database');
    } finally {
      setIsSyncing(false);
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
    isSyncing,
    syncWithSupabase,
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
