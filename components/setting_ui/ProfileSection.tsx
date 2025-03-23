'use client';

import React from 'react';
import { useSettings } from '@/components/context/SettingsContext';
import ImageUploader from './ImageUploader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, UserRound } from 'lucide-react';
import { toast } from 'sonner';

const ProfileSection: React.FC = () => {
  const { profile, updateProfile, saveProfile, hasUnsavedChanges } = useSettings();

  const handleSave = () => {
    console.log('Saving changes...');
    saveProfile();
    toast.success('Profile saved successfully');
  };

  return (
    <div className="w-full max-w-3xl mx-auto animate-slide-up bg-white/5 rounded-[40px] p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.12)] relative overflow-hidden border-2 border-[#f6b355]/50">
      <div className="glass-card rounded-[40px] p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.12)] relative overflow-hidden bg-transparent transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.2)]">
        {/* Decorative elements */}
        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-[#f6b355]/50 blur-xl animate-pulse"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-[#f6b355]/50 blur-xl animate-pulse"></div>

        <div className="relative mb-12">
          {/* Background Image */}
          <div className="w-full h-52 rounded-[40px] overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.2)] border-2 border-[#f6b355]/50 hover:border-[#f6b355] transition-all duration-300">
            <ImageUploader
              type="background"
              currentImage={profile.backgroundImage}
              onImageChange={(img) => updateProfile({ backgroundImage: img })}
              className="h-full object-cover"
            />
          </div>

          {/* Profile Image */}
          <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 rounded-[40px] shadow-[0_8px_20px_rgba(0,0,0,0.3)] hover:border-[#f9c27a] transition-all duration-300 z-[99]">
            <ImageUploader
              type="profile"
              currentImage={profile.profileImage}
              onImageChange={(img) => updateProfile({ profileImage: img })}
              className="transition-transform duration-300 hover:scale-105 w-32 h-32 object-cover rounded-full"
            />
          </div>
        </div>

        {/* Username input */}
        <div className="mt-24 space-y-8 border-2 border-[#f6b355]/50 p-6 rounded-[40px] bg-white/5 backdrop-blur-md hover:border-[#f6b355] transition-all duration-300">
          <div className="space-y-4">
            <label className="flex items-center text-sm font-medium text-[#f6b355] gap-2">
              <UserRound className="h-4 w-4" />
              User name
            </label>
            <Input
              value={profile.username || ''}
              onChange={(e) => {
                console.log('New username:', e.target.value);
                updateProfile({ username: e.target.value });
              }}
              placeholder="Your username"
              className="bg-transparent border-2 border-[#f6b355]/50 text-white placeholder-[#f6b355]/50 focus:ring-2 focus:ring-[#f6b355] hover:border-[#f6b355] transition-all duration-200 rounded-[40px] py-2 px-4"
            />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              className={`bg-[#f6b355] hover:bg-[#f9c27a] text-black transition-all duration-300 font-medium px-6 py-2 rounded-[40px] flex items-center ${
                !hasUnsavedChanges
                  ? 'opacity-50 cursor-not-allowed'
                  : 'shadow-[0_4px_15px_rgba(246,179,85,0.4)] hover:shadow-[0_6px_20px_rgba(246,179,85,0.6)]'
              }`}
              disabled={!hasUnsavedChanges}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>
      <style jsx>{`
        .neo-blur {
          background: rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .input-focus:focus {
          border-color: rgba(246, 179, 85, 0.5);
          box-shadow: 0 0 0 2px rgba(246, 179, 85, 0.2);
        }
      `}</style>
    </div>
  );
};

export default ProfileSection;