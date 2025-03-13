'use client'; // Đánh dấu đây là Client Component trong Next.js

import React from 'react';
import { SettingsProvider } from '@/components/context/SettingsContext';
import SettingLayout from '@/components/setting_ui/SettingLayout';
import ProfileSection from '@/components/setting_ui/ProfileSection';
import WalletSection from '@/components/setting_ui/WalletSection';
import ParticlesBackground from '@/components/ParticlesBackground';
// Component Settings không nhận props
const Settings = () => {
  return (
    <div className="settings-container">
      <ParticlesBackground /> {/* Render as a sibling */}
      <SettingsProvider>
        <SettingLayout
          profileSection={<ProfileSection />}
          walletSection={<WalletSection />}
        />
      </SettingsProvider>
    </div>
  );
};

export default Settings;