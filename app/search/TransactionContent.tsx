// transactioncontent.tsx
// Search page content with wallet info, transaction graph, table, and NFT gallery
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

// Ethereum address validation regex pattern
const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

export default function Transactions() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const address = searchParams.get("address")
  const networkParam = searchParams.get("network") || "mainnet"
  const providerParam = searchParams.get("provider") || "etherscan"
  const [network, setNetwork] = useState(networkParam)
  const [provider, setProvider] = useState(providerParam)
  const [pendingTxCount, setPendingTxCount] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [addressError, setAddressError] = useState<string | null>(null)
  
  // Update network and provider state when URL parameters change
  useEffect(() => {
    setNetwork(networkParam)
    setProvider(providerParam)
  }, [networkParam, providerParam])
  
  // Validate address on component mount and when address changes
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
  
  // Get available networks based on selected provider
  const getAvailableNetworks = () => {
    if (provider === "infura") {
      return [
        { value: "mainnet", label: "Ethereum Mainnet" },
        { value: "optimism", label: "Optimism" },
        { value: "arbitrum", label: "Arbitrum" },
      ];
    } else {
      // Default Etherscan only supports Ethereum mainnet
      return [
        { value: "mainnet", label: "Ethereum Mainnet" },
      ];
    }
  };
  
  // Handle network change
  const handleNetworkChange = (value: string) => {
    setNetwork(value);
    if (address) {
      router.push(`/search?address=${address}&network=${value}&provider=${provider}`);
    } else {
      router.push(`/search?network=${value}&provider=${provider}`);
    }
  };

  // Handle provider change
  const handleProviderChange = (value: string) => {
    setProvider(value);
    if (address) {
      router.push(`/search?address=${address}&network=${network}&provider=${value}`);
    } else {
      router.push(`/search?network=${network}&provider=${value}`);
    }
  };

  // Fetch pending transactions for the current network
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
        })
    }
  }, [network])
  
  const availableNetworks = getAvailableNetworks();
  
  // Function to render appropriate content
  const renderContent = () => {
    // If we have an address but it's invalid
    if (address && addressError) {
      return <AddressErrorCard address={address} errorMessage={addressError} />;
    }
    
    // If we have a valid address, render the wallet info
    if (address) {
      return (
      <>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <WalletInfo />
        <TransactionGraph />
        </div>
        <div className="mb-8">
        <Portfolio />
        </div>
        <TransactionTable />
        <NFTGallery />
      </>
      );
    }
    
    // Default welcome screen
    return (
      <div className="text-center mt-8">
        <h2 className="text-2xl font-bold mb-4">Welcome to CryptoPath</h2>
        <p className="text-lg">
          Enter an Ethereum address above to explore wallet details, transactions, and NFTs.
        </p>
        <p className="mt-4 text-gray-400">
          Currently connected to: <span className="font-semibold text-[#F5B056]">{network}</span> using <span className="font-semibold text-[#F5B056]">{provider}</span>
          {pendingTxCount !== null && (
            <span className="ml-2">({pendingTxCount} pending transactions)</span>
          )}
        </p>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen text-white">
      <main className="container mx-auto p-4">
        <div className="mb-8">
          <div className="flex flex-col items-start justify-between gap-4 mb-4">
            <SearchBar />
          </div>
        </div>
        
        {renderContent()}
      </main>
    </div>
  )
}
