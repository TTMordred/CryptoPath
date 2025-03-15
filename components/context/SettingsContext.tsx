"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/src/integrations/supabase/client";
import { toast } from "sonner";
import { Database } from "@/src/integrations/supabase/types";
type ProfileData = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileSettings = {
  username: string;
  profileImage: string | null;
  backgroundImage: string | null;
};

type Wallet = {
  address: string;
  isDefault: boolean;
};

type SettingsContextType = {
  profile: ProfileSettings;
  wallets: Wallet[];
  updateProfile: (profile: Partial<ProfileSettings>) => void;
  saveProfile: () => void;
  addWallet: (address: string) => void;
  removeWallet: (address: string) => void; // Sửa để dùng address thay vì id
  setDefaultWallet: (address: string) => void; // Sửa để dùng address thay vì id
  hasUnsavedChanges: boolean;
  isSyncing: boolean;
  syncWithSupabase: () => Promise<void>;
};

const defaultProfile: ProfileSettings = {
  username: "User",
  profileImage: null,
  backgroundImage: null,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileSettings>(defaultProfile);
  const [savedProfile, setSavedProfile] = useState<ProfileSettings>(defaultProfile);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Lấy userId từ session
  useEffect(() => {
    const getCurrentUserInfo = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id || null);
    };
    getCurrentUserInfo();

    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Tải settings từ Supabase
  useEffect(() => {
    const loadSettings = async () => {
      if (!userId) return;

      try {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (profileError && profileError.code === "PGRST116") {
          const newProfile = {
            id: userId,
            display_name: defaultProfile.username,
            profile_image: null,
            background_image: null,
            wallets: [],
            updated_at: new Date().toISOString(),
          };
          await supabase.from("profiles").insert(newProfile);
          setProfile(defaultProfile);
          setSavedProfile(defaultProfile);
        } else if (profileData) {
          const profileSettings: ProfileSettings = {
            username: profileData.display_name || "User",
            profileImage: profileData.profile_image || null,
            backgroundImage: profileData.background_image || null,
          };
          setProfile(profileSettings);
          setSavedProfile(profileSettings);

          // Tải wallets từ cột wallets
          const walletData = profileData.wallets || [];
          const formattedWallets: Wallet[] = walletData.map((wallet: any) => ({
            address: wallet.address,
            isDefault: wallet.is_default || false,
          }));
          setWallets(formattedWallets);
        }
      } catch (error) {
        console.error("Error loading settings:", error);
        toast.error("Failed to load settings");
      }
    };

    loadSettings();
  }, [userId]);

  // Kiểm tra thay đổi
  useEffect(() => {
    const isChanged = JSON.stringify(profile) !== JSON.stringify(savedProfile);
    setHasUnsavedChanges(isChanged);
  }, [profile, savedProfile]);

  const updateProfile = (updates: Partial<ProfileSettings>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  };

  const saveProfile = async () => {
    if (!userId) {
      toast.error("You must be logged in to save settings");
      return;
    }
    try {
      await supabase
        .from("profiles")
        .update({
          display_name: profile.username,
          profile_image: profile.profileImage,
          background_image: profile.backgroundImage,
          updated_at: new Date().toISOString(),
          wallets: wallets.map((w) => ({ address: w.address, is_default: w.isDefault })),
        })
        .eq("id", userId);
      setSavedProfile(profile);
      toast.success("Profile saved successfully");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile");
    }
  };

  const addWallet = async (address: string) => {
    if (!userId) {
      toast.error("You must be logged in to add a wallet");
      return;
    }
    if (wallets.some((w) => w.address.toLowerCase() === address.toLowerCase())) {
      toast.error("This wallet address is already added");
      return;
    }

    const newWallet: Wallet = {
      address,
      isDefault: wallets.length === 0,
    };
    const updatedWallets = [...wallets, newWallet];
    setWallets(updatedWallets);

    try {
      await supabase
        .from("profiles")
        .update({
          wallets: updatedWallets.map((w) => ({ address: w.address, is_default: w.isDefault })),
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
      toast.success("Wallet added successfully");
    } catch (error) {
      console.error("Error adding wallet:", error);
      toast.error("Failed to add wallet");
    }
  };

  const removeWallet = async (address: string) => {
    if (!userId) {
      toast.error("You must be logged in to remove a wallet");
      return;
    }
    const updatedWallets = wallets.filter((w) => w.address !== address);
    if (wallets.find((w) => w.address === address)?.isDefault && updatedWallets.length > 0) {
      updatedWallets[0].isDefault = true;
    }
    setWallets(updatedWallets);

    try {
      await supabase
        .from("profiles")
        .update({
          wallets: updatedWallets.map((w) => ({ address: w.address, is_default: w.isDefault })),
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
      toast.success("Wallet removed successfully");
    } catch (error) {
      console.error("Error removing wallet:", error);
      toast.error("Failed to remove wallet");
    }
  };

  const setDefaultWallet = async (address: string) => {
    if (!userId) {
      toast.error("You must be logged in to set a default wallet");
      return;
    }
    const updatedWallets = wallets.map((w) => ({
      ...w,
      isDefault: w.address === address,
    }));
    setWallets(updatedWallets);

    try {
      await supabase
        .from("profiles")
        .update({
          wallets: updatedWallets.map((w) => ({ address: w.address, is_default: w.isDefault })),
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
      toast.success("Default wallet updated");
    } catch (error) {
      console.error("Error setting default wallet:", error);
      toast.error("Failed to update default wallet");
    }
  };

  const syncWithSupabase = async () => {
    if (!userId) {
      toast.error("You must be logged in to sync settings");
      return;
    }
    setIsSyncing(true);
    try {
      await supabase
        .from("profiles")
        .update({
          display_name: profile.username,
          profile_image: profile.profileImage,
          background_image: profile.backgroundImage,
          wallets: wallets.map((w) => ({ address: w.address, is_default: w.isDefault })),
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
      toast.success("Settings synchronized with database");
    } catch (error) {
      console.error("Error syncing settings:", error);
      toast.error("Failed to sync settings with database");
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
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};