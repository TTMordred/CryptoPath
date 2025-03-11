'use client'; // Đánh dấu đây là Client Component trong Next.js

import React from 'react';
import { SettingsProvider } from '@/components/context/SettingsContext';
import SettingLayout from '@/components/setting_ui/SettingLayout';
import ProfileSection from '@/components/setting_ui/ProfileSection';
import WalletSection from '@/components/setting_ui/WalletSection';

// Component Settings không nhận props
const Settings = () => {
  return (
    <SettingsProvider>
      {/* Hiển thị loading tạm thời nếu cần thiết */}
      <SettingLayout
        profileSection={<ProfileSection />}
        walletSection={<WalletSection />}
      />
    </SettingsProvider>
  );
};

export default Settings;