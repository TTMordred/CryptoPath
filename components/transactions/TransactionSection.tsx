'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import NetworkTransactionTable from './NetworkTransactionTable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TOKEN_CONTRACTS, fetchAvailableCoins, CoinOption } from "@/services/cryptoService";
import { Loader2, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";

export default function TransactionSection() {
  const [selectedCoin, setSelectedCoin] = useState<CoinOption | null>(null);
  const [availableCoins, setAvailableCoins] = useState<CoinOption[]>([]);
  const [loadingCoins, setLoadingCoins] = useState(true);

  // Fetch available coins on mount
  useEffect(() => {
    let mounted = true;
    const fetchCoins = async () => {
      try {
        setLoadingCoins(true);
        const coins = await fetchAvailableCoins();
        if (!mounted) return;
        
        // Filter coins to only those with contract addresses
        const supportedCoins = coins.filter(coin => TOKEN_CONTRACTS[coin.id]);
        setAvailableCoins(supportedCoins);
        
        if (supportedCoins.length > 0) {
          const ethereum = supportedCoins.find(c => c.id === 'ethereum') || supportedCoins[0];
          setSelectedCoin(ethereum);
        }
      } catch (err) {
        console.error('Error fetching coins:', err);
      } finally {
        if (mounted) {
          setLoadingCoins(false);
        }
      }
    };

    fetchCoins();
    return () => { mounted = false; };
  }, []);

  const handleCoinChange = (coinId: string) => {
    const coin = availableCoins.find(c => c.id === coinId);
    if (coin) {
      setSelectedCoin(coin);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-gray-900 to-gray-800/95 border-gray-800/50 rounded-2xl shadow-xl backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between p-6">
        <CardTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
          Transaction History
        </CardTitle>
        <Select
          value={selectedCoin?.id}
          onValueChange={handleCoinChange}
          disabled={loadingCoins}
        >
          <SelectTrigger className="w-[200px] bg-gray-800/50 border-gray-700/50 text-gray-300 hover:bg-gray-700/50">
            {loadingCoins ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading...
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <SelectValue placeholder="Select a coin" />
                <ChevronDown className="h-4 w-4 opacity-50" />
              </div>
            )}
          </SelectTrigger>
          <SelectContent className="bg-gray-800/95 border-gray-700/50 backdrop-blur-md">
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
              {availableCoins.map((coin) => (
                <SelectItem
                  key={coin.id}
                  value={coin.id}
                  className="text-gray-300 hover:bg-gray-700/50 focus:bg-gray-700/50 focus:text-white"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[#F5B056]">{coin.symbol}</span>
                    <span className="text-gray-400">-</span>
                    <span>{coin.name}</span>
                  </div>
                </SelectItem>
              ))}
            </div>
          </SelectContent>
        </Select>
      </CardHeader>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <NetworkTransactionTable selectedCoin={selectedCoin} />
      </motion.div>
    </Card>
  );
} 