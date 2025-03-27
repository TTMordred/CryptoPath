// TransactionContent.tsx
'use client'

import SearchBar from "@/components/search/SearchBar"
import WalletInfo from "@/components/search/WalletInfo"
import { default as TransactionGraph } from "@/components/search/TransactionGraph"
import TransactionTable from "@/components/search/TransactionTable"
import Portfolio from "@/components/search/Portfolio"
import NFTGallery from "@/components/search/NFTGallery"
import { useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ErrorCard } from "@/components/ui/error-card"
import AddressErrorCard from "@/components/search/AddressErrorCard"
import ChainalysisDisplay from "@/components/Chainalysis"
import { motion, AnimatePresence } from "framer-motion"

// Ethereum address validation regex pattern
const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

export default function Transactions() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const address = searchParams?.get("address") ?? null
  const networkParam = searchParams?.get("network") ?? "mainnet"
  const providerParam = searchParams?.get("provider") ?? "etherscan"
  const [network, setNetwork] = useState(networkParam)
  const [provider, setProvider] = useState(providerParam)
  const [pendingTxCount, setPendingTxCount] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [addressError, setAddressError] = useState<string | null>(null)
  
  useEffect(() => {
    setNetwork(networkParam)
    setProvider(providerParam)
  }, [networkParam, providerParam])
  
  useEffect(() => {
    if (address) {
      if (!ETH_ADDRESS_REGEX.test(address)) {
        setAddressError(`"${address}" is not a valid Ethereum address. Address must start with 0x followed by 40 hexadecimal characters.`);
      } else {
        setAddressError(null);
      }
    } else {
      setAddressError(null);
    }
  }, [address]);
  
  const getAvailableNetworks = () => {
    if (provider === "infura") {
      return [
        { value: "mainnet", label: "Ethereum Mainnet" },
        { value: "optimism", label: "Optimism" },
        { value: "arbitrum", label: "Arbitrum" },
      ];
    } else {
      return [
        { value: "mainnet", label: "Ethereum Mainnet" },
      ];
    }
  };
  
  const handleNetworkChange = (value: string) => {
    setNetwork(value)
    if (address) {
      router.push(`/search?address=${address}&network=${value}&provider=${provider}`)
    } else {
      router.push(`/search?network=${value}&provider=${provider}`)
    }
  }
  
  const handleProviderChange = (value: string) => {
    setIsLoading(true);
    setProvider(value);
    
    const availableNetworks = getAvailableNetworks().map(net => net.value);
    let newNetwork = network;
    if (!availableNetworks.includes(network)) {
      newNetwork = availableNetworks[0];
    }
    
    setNetwork(newNetwork);
    
    if (address) {
      router.push(`/search?address=${address}&network=${newNetwork}&provider=${value}`)
    } else {
      router.push(`/search?network=${newNetwork}&provider=${value}`)
    }

    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }
  
  useEffect(() => {
    if (network) {
      const baseUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : process.env.NEXT_PUBLIC_URL || ''
      
      fetch(`${baseUrl}/api/pending?network=${network}`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) {
            setPendingTxCount(data.pendingTransactions)
          }
        })
        .catch(err => {
          console.error("Error fetching pending transactions:", err)
          toast.error("Failed to fetch pending transactions")
        })
    }
  }, [network])
  
  const availableNetworks = getAvailableNetworks();
  
  const renderContent = () => {
    if (address && addressError) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <AddressErrorCard address={address} errorMessage={addressError} />
        </motion.div>
      );
    }
    
    if (address) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <WalletInfo />
            </motion.div>
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <TransactionGraph />
            </motion.div>
          </div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <ChainalysisDisplay address={address} />
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
          >
            <Portfolio />
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <TransactionTable />
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <NFTGallery />
          </motion.div>
        </motion.div>
      );
    }
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mt-12"
      >
        <motion.h2 
          className="text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-amber-300"
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          Welcome to CryptoPath Explorer
        </motion.h2>
        
        <motion.p 
          className="text-xl text-gray-300 mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Enter an Ethereum address above to explore wallet details, transactions, and NFTs
        </motion.p>
        
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="px-6 py-4 bg-gray-800/50 rounded-xl border border-amber-500/20 backdrop-blur-sm">
            <p className="text-gray-300">
              Currently connected to:{" "}
              <span className="font-semibold text-amber-400">{network}</span> using{" "}
              <span className="font-semibold text-amber-400">{provider}</span>
              {pendingTxCount !== null && (
                <span className="ml-2 text-gray-400">
                  ({pendingTxCount} pending transactions)
                </span>
              )}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="p-6 bg-gray-800/50 rounded-xl border border-amber-500/20 backdrop-blur-sm"
            >
              <h3 className="text-xl font-semibold text-amber-400 mb-2">On-Chain Data</h3>
              <p className="text-gray-300">Explore transactions, balances, and smart contracts</p>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="p-6 bg-gray-800/50 rounded-xl border border-blue-500/20 backdrop-blur-sm"
            >
              <h3 className="text-xl font-semibold text-blue-400 mb-2">Off-Chain Analysis</h3>
              <p className="text-gray-300">Discover patterns and relationships in the blockchain</p>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="p-6 bg-gray-800/50 rounded-xl border border-purple-500/20 backdrop-blur-sm"
            >
              <h3 className="text-xl font-semibold text-purple-400 mb-2">NFT Gallery</h3>
              <p className="text-gray-300">View and analyze NFT collections</p>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    );
  };
  
  return (
    <div className="min-h-screen text-white">
      <main className="container mx-auto p-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex flex-col items-start justify-between gap-4 mb-4">
            <SearchBar />
          </div>
        </motion.div>
        
        {renderContent()}
      </main>
    </div>
  )
}
