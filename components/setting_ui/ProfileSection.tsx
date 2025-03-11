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
    saveProfile();
    toast.success('Profile saved successfully');
  };

  return (
    <div className="w-full max-w-3xl mx-auto animate-slide-up">
      <div className="glass-card rounded-xl p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.12)] relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-amber/10 blur-xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-amber/10 blur-xl"></div>
        
        <div className="relative mb-12">
          {/* Background Image with enhanced styling */}
          <div className="w-full h-52 rounded-lg overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.2)] border border-white/10">
            <ImageUploader
              type="background"
              currentImage={profile.backgroundImage}
              onImageChange={(img) => updateProfile({ backgroundImage: img })}
              className="h-full"
            />
          </div>
          
          {/* Profile Image - positioned at the bottom of the background with enhanced styling */}
          <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 rounded-full shadow-[0_8px_20px_rgba(0,0,0,0.3)] border-4 border-black/80">
            <ImageUploader
              type="profile"
              currentImage={profile.profileImage}
              onImageChange={(img) => updateProfile({ profileImage: img })}
              className="transition-transform duration-300 hover:scale-105"
            />
          </div>
        </div>
        
        {/* Username input - with spacing to account for the profile image */}
        <div className="mt-24 space-y-8">
          <div className="space-y-4">
            <label className="flex items-center text-sm font-medium text-amber gap-2">
              <UserRound className="h-4 w-4" />
              Username
            </label>
            <Input
              value={profile.username}
              onChange={(e) => updateProfile({ username: e.target.value })}
              placeholder="Your username"
              className="bg-black/60 border border-white/15 text-white input-focus hover:border-amber/50 transition-all duration-200"
            />
          </div>
          
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              className={`bg-amber hover:bg-amber-light text-black transition-all duration-300 font-medium rounded-full px-6 ${
                !hasUnsavedChanges ? 'opacity-50 cursor-not-allowed' : 'shadow-[0_2px_10px_rgba(246,179,85,0.3)]'
              }`}
              disabled={!hasUnsavedChanges}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSection;