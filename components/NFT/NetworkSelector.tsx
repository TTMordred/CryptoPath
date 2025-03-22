import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface Network {
  id: string;
  name: string;
  icon: string;
  color: string;
  hexColor: string;
  testnet?: boolean;
}

interface NetworkSelectorProps {
  selectedNetwork: string;
  onNetworkChange: (networkId: string) => void;
  className?: string;
  disableTestnets?: boolean;
}

const networks: Network[] = [
  { 
    id: '0x1', 
    name: 'Ethereum', 
    icon: '/icons/eth.svg', 
    color: 'bg-blue-500/20 border-blue-500/50', 
    hexColor: '#6b8df7' 
  },
  { 
    id: '0xaa36a7', 
    name: 'Sepolia', 
    icon: '/icons/eth.svg', 
    color: 'bg-blue-400/20 border-blue-400/50', 
    hexColor: '#8aa2f2',
    testnet: true 
  },
  { 
    id: '0x38', 
    name: 'BNB Chain', 
    icon: '/icons/bnb.svg', 
    color: 'bg-yellow-500/20 border-yellow-500/50', 
    hexColor: '#F0B90B' 
  },
  { 
    id: '0x61', 
    name: 'BNB Testnet', 
    icon: '/icons/bnb.svg', 
    color: 'bg-yellow-400/20 border-yellow-400/50', 
    hexColor: '#F5CA3B',
    testnet: true 
  }
];

export default function NetworkSelector({ 
  selectedNetwork, 
  onNetworkChange,
  className = '',
  disableTestnets = false
}: NetworkSelectorProps) {
  const [network, setNetwork] = useState<Network | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const found = networks.find(n => n.id === selectedNetwork);
    setNetwork(found || networks[0]);
  }, [selectedNetwork]);

  const handleNetworkSelect = (networkId: string) => {
    onNetworkChange(networkId);
    setIsOpen(false);
  };

  // Filter networks based on testnet flag
  const filteredNetworks = disableTestnets 
    ? networks.filter(n => !n.testnet)
    : networks;

  if (!network) return null;

  return (
    <div className={className}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <motion.button
            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium
                       border ${network.color} backdrop-blur-sm transition-all
                       hover:border-opacity-80 hover:shadow-md`}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <div className="relative h-5 w-5">
              <Image
                src={network.icon}
                alt={network.name}
                layout="fill"
                className="object-contain"
              />
            </div>
            <span style={{ color: network.hexColor }}>{network.name}</span>
            {network.testnet && (
              <span className="rounded-full bg-gray-800 px-2 py-0.5 text-xs">testnet</span>
            )}
            <ChevronDown className="h-4 w-4" style={{ color: network.hexColor }} />
          </motion.button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[240px] bg-black/90 backdrop-blur-xl border border-gray-800 shadow-xl shadow-black/50">
          <div className="p-2">
            <h3 className="px-2 py-1 text-sm font-medium text-gray-400">
              Select Network
            </h3>
            <div className="space-y-1 mt-1">
              {filteredNetworks.map((n) => (
                <DropdownMenuItem
                  key={n.id}
                  className={`flex items-center justify-between rounded-lg p-2 cursor-pointer
                              ${selectedNetwork === n.id ? 'bg-gray-800' : 'hover:bg-gray-900'}`}
                  onClick={() => handleNetworkSelect(n.id)}
                >
                  <div className="flex items-center gap-2">
                    <div className="relative h-5 w-5">
                      <Image
                        src={n.icon}
                        alt={n.name}
                        layout="fill"
                        className="object-contain"
                      />
                    </div>
                    <div>
                      <span className="font-medium" style={{ color: n.hexColor }}>
                        {n.name}
                      </span>
                      {n.testnet && (
                        <span className="ml-2 rounded-full bg-gray-800 px-2 py-0.5 text-xs">
                          testnet
                        </span>
                      )}
                    </div>
                  </div>
                  {selectedNetwork === n.id && (
                    <Check className="h-4 w-4 text-green-500" />
                  )}
                </DropdownMenuItem>
              ))}
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
