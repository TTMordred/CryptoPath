
'use client';

import React from 'react';
import { SettingsProvider } from '@/components/context/SettingsContext';
import SettingLayout from '@/components/setting_ui/SettingLayout';
import ProfileSection from '@/components/setting_ui/ProfileSection';
import WalletSection from '@/components/setting_ui/WalletSection';
import SettingSync from '@/components/setting_ui/SettingSync';
import ParticlesBackground from '@/components/ParticlesBackground';
import ClientLayout from '@/components/ClientLayout';

const Settings = () => {
  return (
    <div className="settings-container">
      <ParticlesBackground />
      <SettingsProvider>
        <ClientLayout>
          <SettingLayout
            profileSection={<ProfileSection />}
            walletSection={<WalletSection />}
            syncSection={<SettingSync />}
          />
        </ClientLayout>
      </SettingsProvider>
    </div>
  );
};

export default Settings;
