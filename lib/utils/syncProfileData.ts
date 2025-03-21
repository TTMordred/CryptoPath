import { supabase } from "@/src/integrations/supabase/client";
import { toast } from "sonner";

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

type UserSettings = {
  profile: ProfileSettings;
  wallets: Wallet[];
};

// Fetch profile and wallet data from Supabase
export const fetchProfileFromSupabase = async (userId: string): Promise<UserSettings | null> => {
  try {
    // Fetch profile data
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      console.error("Error fetching profile from Supabase:", profileError);
      return null;
    }

    // Fetch wallet data
    const { data: walletData, error: walletError } = await supabase
      .from("user_wallets")
      .select("*")
      .eq("user_id", userId);

    if (walletError) {
      console.error("Error fetching wallets from Supabase:", walletError);
      return null;
    }

    // Format data for return
    const profile: ProfileSettings = {
      username: profileData?.display_name || profileData?.username || "User",
      profileImage: profileData?.profile_image || null,
      backgroundImage: profileData?.background_image || null,
    };

    const wallets: Wallet[] = walletData
      ? walletData.map((wallet) => ({
          id: wallet.id,
          address: wallet.wallet_address,
          isDefault: wallet.is_default || false,
        }))
      : [];

    return { profile, wallets };
  } catch (error) {
    console.error("Error fetching profile data from Supabase:", error);
    return null;
  }
};

// Sync profile and wallet data to Supabase
export const syncProfileWithSupabase = async (userId: string): Promise<void> => {
  try {
    // Get settings from localStorage
    const currentUser = localStorage.getItem("currentUser");
    if (!currentUser) {
      toast.error("No user information found");
      return;
    }

    const userData = JSON.parse(currentUser);
    const settingsKey = userData.settingsKey;

    if (!settingsKey) {
      toast.error("No settings key found");
      return;
    }

    const savedSettings = localStorage.getItem(settingsKey);
    if (!savedSettings) {
      toast.error("No saved settings found");
      return;
    }

    // Định nghĩa kiểu cho settings
    const settings: UserSettings = JSON.parse(savedSettings);

    // Update profile in Supabase
    if (settings.profile) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          display_name: settings.profile.username,
          profile_image: settings.profile.profileImage,
          background_image: settings.profile.backgroundImage,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (profileError) {
        console.error("Error updating profile in Supabase:", profileError);
        toast.error("Failed to update profile in database");
        return;
      }
    }

    // Handle wallets - more complex because we need to compare what exists already
    if (settings.wallets && settings.wallets.length > 0) {
      const { data: existingWallets, error: walletFetchError } = await supabase
        .from("user_wallets")
        .select("*")
        .eq("user_id", userId);

      if (walletFetchError) {
        console.error("Error fetching existing wallets:", walletFetchError);
        toast.error("Failed to fetch existing wallets from database");
        return;
      }

      // Process each wallet from localStorage
      for (const wallet of settings.wallets) {
        const existingWallet = existingWallets?.find((w) => w.wallet_address === wallet.address);

        if (!existingWallet) {
          // Add new wallet
          const { error: insertError } = await supabase
            .from("user_wallets")
            .insert({
              user_id: userId,
              wallet_address: wallet.address,
              is_default: wallet.isDefault,
            });

          if (insertError) {
            console.error("Error adding wallet to Supabase:", insertError);
            toast.error(
              `Failed to add wallet ${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)} to database`
            );
          }
        } else if (existingWallet.is_default !== wallet.isDefault) {
          // Update wallet if default status changed
          const { error: updateError } = await supabase
            .from("user_wallets")
            .update({ is_default: wallet.isDefault })
            .eq("id", existingWallet.id);

          if (updateError) {
            console.error("Error updating wallet in Supabase:", updateError);
            toast.error(
              `Failed to update wallet ${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)} in database`
            );
          }
        }
      }

      // Remove wallets that exist in Supabase but not in localStorage
      if (existingWallets) {
        for (const existingWallet of existingWallets) {
          const shouldKeep = settings.wallets.some((w) => w.address === existingWallet.wallet_address);

          if (!shouldKeep) {
            // Remove wallet that's no longer in the list
            const { error: deleteError } = await supabase
              .from("user_wallets")
              .delete()
              .eq("id", existingWallet.id);

            if (deleteError) {
              console.error("Error removing wallet from Supabase:", deleteError);
              toast.error(
                `Failed to remove wallet ${existingWallet.wallet_address.slice(
                  0,
                  6
                )}...${existingWallet.wallet_address.slice(-4)} from database`
              );
            }
          }
        }
      }
    }

    // Update last synced time
    localStorage.setItem("lastProfileSync", new Date().toISOString());
  } catch (error) {
    console.error("Error syncing profile with Supabase:", error);
    toast.error("An error occurred while syncing profile with database");
    throw error;
  }
};