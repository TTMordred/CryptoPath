'use client';
import React, { useState } from 'react';
import { useSettings } from '@/components/context/SettingsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wallet, Plus, Trash2, Check, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

const WalletSection: React.FC = () => {
  const { wallets, addWallet, removeWallet, setDefaultWallet } = useSettings();
  const [newWalletAddress, setNewWalletAddress] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddWallet = () => {
    if (!newWalletAddress.trim()) {
      toast.error("Wallet address cannot be empty");
      return;
    }

    // Basic validation - could be improved for specific wallet formats
    if (newWalletAddress.length < 5) {
      toast.error("Please enter a valid wallet address");
      return;
    }

    // Check for duplicates
    if (wallets.some(wallet => wallet.address === newWalletAddress)) {
      toast.error("This wallet address is already added");
      return;
    }

    addWallet(newWalletAddress);
    setNewWalletAddress('');
    setIsAdding(false);
    toast.success("Wallet added successfully");
  };

  const handleDeleteWallet = (id: string) => {
    removeWallet(id);
    toast.success("Wallet removed successfully");
  };

  const handleSetDefault = (id: string) => {
    setDefaultWallet(id);
    toast.success("Default wallet updated");
  };

  return (
    <div className="w-full max-w-3xl mx-auto animate-slide-up bg-[f6b355]/70 rounded-[40px] p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.12)] relative overflow-hidden border-2 border-[#f6b355]/60">
      <div className="glass-card rounded-xl p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <CreditCard className="mr-2 h-5 w-5 text-amber" />
            Wallet Addresses
          </h2>
          {!isAdding && (
            <Button 
              className="bg-[#f6b355] text-black hover:bg-amber-light transition-all duration-300 font-medium rounded-full shadow-[0_2px_10px_rgba(246,179,85,0.2)]"
              onClick={() => setIsAdding(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Wallet
            </Button>
          )}
        </div>

        {/* Add new wallet form */}
        {isAdding && (
          <div className="neo-blur p-5 rounded-xl mb-8 animate-fade-in">
            <div className="flex flex-col space-y-4">
              <Input
                value={newWalletAddress}
                onChange={(e) => setNewWalletAddress(e.target.value)}
                placeholder="Enter wallet address"
                className="bg-black/60 border border-[#f6b355]/60 rounded-[40px] text-white input-focus hover:border-amber/50 transition-all duration-200"
              />
              <div className="flex space-x-3">
                <Button 
                  className="bg-[#f6b355]/80 text-black hover:bg-amber-light transition-all duration-300 rounded-full flex-1"
                  onClick={handleAddWallet}
                >
                  Add
                </Button>
                <Button 
                  variant="outline"
                  className="border-[#f6b355]/60 text-white/80 hover:bg-white/5 rounded-full flex-1"
                  onClick={() => {
                    setIsAdding(false);
                    setNewWalletAddress('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Wallet list */}
        <div className="space-y-4">
          {wallets.length === 0 ? (
            <div className="neo-blur rounded-xl p-8 text-center text-white/70">
              <Wallet className="h-12 w-12 mx-auto text-amber/40 mb-3" />
              <p>No wallets added yet</p>
              <p className="text-sm text-white/50 mt-2">Click "Add Wallet" to get started</p>
            </div>
          ) : (
            wallets.map((wallet) => (
              <div 
                key={wallet.id} 
                className={`neo-blur p-4 rounded-xl flex items-center justify-between transition-all duration-300 ${
                  wallet.isDefault ? 'border-amber shadow-[0_0_10px_rgba(246,179,85,0.2)]' : 'border-[#f6b355]/60'
                } hover:border-white/20`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    wallet.isDefault ? 'bg-[#f6b355]/20 text-white' : 'bg-[#f6b355]/70 text-white/80'
                  }`}>
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-white font-medium truncate max-w-[200px] md:max-w-[350px] lg:max-w-[450px]">
                      {wallet.address}
                    </p>
                    {wallet.isDefault && (
                      <span className="text-xs text-amber flex items-center mt-1">
                        <Check className="h-3 w-3 mr-1" />
                        Default wallet
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  {!wallet.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white/70 hover:text-amber hover:bg-black/40 transition-colors duration-200"
                      onClick={() => handleSetDefault(wallet.id)}
                    >
                      Set Default
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/70 hover:text-red-500 hover:bg-black/40 transition-colors duration-200 rounded-full"
                    onClick={() => handleDeleteWallet(wallet.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <style jsx>{`
        
        .neo-blur {
          background: rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
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
      `}</style>
    </div>
  );
};

export default WalletSection;