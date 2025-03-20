
'use client';
import React, { useState } from 'react';
import { UserRound, Wallet, Cloud } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

type Tab = 'profile' | 'wallet' | 'sync';

interface SettingLayoutProps {
  profileSection: React.ReactNode;
  walletSection: React.ReactNode;
  syncSection?: React.ReactNode;
}

const SettingLayout: React.FC<SettingLayoutProps> = ({ 
  profileSection, 
  walletSection,
  syncSection
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const isMobile = useIsMobile();

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <UserRound className="h-5 w-5" /> },
    { id: 'wallet', label: 'Wallet Addresses', icon: <Wallet className="h-5 w-5" /> },
    { id: 'sync', label: 'Sync', icon: <Cloud className="h-5 w-5" /> },
  ];

  return (
    <div className="min-h-screen bg-transparent text-white relative">
      {/* Enhanced background gradients */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-amber/5 blur-[150px] rounded-full -z-0" />
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-amber/5 blur-[150px] rounded-full -z-0" />
      <div className="absolute top-1/3 left-1/4 w-1/4 h-1/4 bg-amber/3 blur-[100px] rounded-full -z-0" />
      
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-10 text-center">
          <span className="text-[#f6b355]">SETTINGS</span>
        </h1>
        
        {/* Enhanced tabs */}
        <div className="flex justify-center mb-10">
          <div className="glass-card rounded-full p-1.5 inline-flex shadow-[0_0_15px_rgba(246,179,85,0.15)] border border-amber/20">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={cn(
                  "py-2.5 px-5 md:px-7 rounded-full flex items-center transition-all duration-300 font-medium ",
                  activeTab === tab.id 
                    ? "bg-[#f6b355] text-white shadow-[0_2px_10px_rgba(246,179,85,0.3)]" 
                    : "text-white/80 hover:text-white hover:bg-white/10"
                )}
                onClick={() => setActiveTab(tab.id as Tab)}
              >
                {tab.icon}
                {!isMobile && <span className="ml-2">{tab.label}</span>}
              </button>
            ))}
          </div>
        </div>
        
        {/* Content with improved transitions */}
        <div className="section-transition min-h-[400px]">
          {activeTab === 'profile' && (
            <div className="animate-fade-in">
              {profileSection}
            </div>
          )}
          {activeTab === 'wallet' && (
            <div className="animate-fade-in">
              {walletSection}
            </div>
          )}
          {activeTab === 'sync' && syncSection && (
            <div className="animate-fade-in">
              {syncSection}
            </div>
          )}
        </div>
      </div>
      <style jsx>{`
        text-gradient-amber {
          background: linear-gradient(135deg, #f6b355 0%, #f7d794 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
        }

        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .section-transition {
          position: relative;
        }
      `}</style>
    </div>
  );
};

export default SettingLayout;
