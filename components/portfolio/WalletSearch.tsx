"use client";
import React, { useState } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from '@/components/ui/use-toast';

interface WalletSearchProps {
  onSearch: (address: string) => void;
  isLoading: boolean;
}

const WalletSearch: React.FC<WalletSearchProps> = ({ onSearch, isLoading }) => {
  const [address, setAddress] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid wallet address",
        variant: "destructive",
      });
      return;
    }
    
    if (address.trim().length < 26) {
      toast({
        title: "Address too short",
        description: "Please enter a complete wallet address",
        variant: "destructive",
      });
      return;
    }
    
    onSearch(address.trim());
  };

  return (
    <div className="w-full max-w-2xl mx-auto opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]">
      <div className="text-center mb-6">
        <h2 className="text-amber bg-gradient-to-r from-amber to-amber-light bg-clip-text text-transparent text-3xl font-bold mb-2 tracking-tight">
          Wallet Portfolio Scanner
        </h2>
        <p className="text-gray-400 text-sm mb-6">
          Enter an Ethereum wallet address to view its assets and activity in real-time
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="relative">
        <div className={`relative transition-all duration-300 ${
          isFocused ? 'animate-[pulse-amber_2.5s_infinite]' : ''
        }`}>
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-amber" />
          </div>
          <Input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter wallet address (0x...)"
            className="pl-10 pr-20 py-6 backdrop-blur-xl bg-shark-800/70 border border-amber/20 text-gray-200 placeholder:text-gray-500 focus:border-amber focus:ring-amber w-full"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            style={{
              boxShadow: isFocused ? '0 0 10px 2px rgba(246, 179, 85, 0.4)' : 'none'
            }}
          />
          <Button
            type="submit"
            disabled={isLoading}
            className="absolute right-1 top-1 bottom-1 bg-amber hover:bg-amber-dark text-black font-medium transition-all duration-300 hover:shadow-[0_0_15px_rgba(246,179,85,0.5)]"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="h-4 w-4 border-2 border-shark-900 border-t-transparent rounded-full animate-spin mr-2"></div>
                <span>Scanning</span>
              </div>
            ) : (
              <div className="flex items-center">
                <span>Scan</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default WalletSearch;
