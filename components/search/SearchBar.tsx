"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Search, X, Globe, AlertTriangle } from "lucide-react"
import { LoadingScreen } from "@/components/loading-screen"
import Neo4jIcon from "@/components/icons/Neo4jIcon"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue, 
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export type NetworkType = "mainnet" | "optimism" | "arbitrum"
export type ProviderType = "etherscan" | "infura"

// Ethereum address validation regex pattern
const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

export default function SearchBar() {
  const [address, setAddress] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [addressError, setAddressError] = useState<string | null>(null)
  const router = useRouter()

  const [searchType, setSearchType] = useState<"onchain" | "offchain">("onchain")
  const [network, setNetwork] = useState<NetworkType>("mainnet")
  const [provider, setProvider] = useState<ProviderType>("etherscan")
  
  // Validate Ethereum address
  const validateAddress = (addr: string): boolean => {
    if (!addr) return false;
    
    // For on-chain searches, validate Ethereum address format
    if (searchType === "onchain") {
      if (!ETH_ADDRESS_REGEX.test(addr)) {
        setAddressError("Invalid Ethereum address format. Must start with 0x followed by 40 hex characters.");
        return false;
      }
    } else {
      // For off-chain searches, validate Neo4j ID format
      if (addr.length < 3) {
        setAddressError("Neo4j identifier must be at least 3 characters");
        return false;
      }
    }
    
    setAddressError(null);
    return true;
  };
  
  // Get available networks based on selected provider
  const getAvailableNetworks = () => {
    if (provider === "infura") {
      return [
        { value: "mainnet", label: "Ethereum Mainnet" },
        { value: "optimism", label: "Optimism" },
        { value: "arbitrum", label: "Arbitrum" },
      ]
    } else {
      // Default Etherscan only supports Ethereum mainnet
      return [
        { value: "mainnet", label: "Ethereum Mainnet" },
      ]
    }
  }
  
  // When provider changes, reset network if it's not available in the new provider
  const handleProviderChange = (newProvider: ProviderType) => {
    setProvider(newProvider)
    
    // Get available networks for the new provider
    const availableNetworks = getAvailableNetworks().map(net => net.value)
    
    // Check if current network is available in the new provider
    if (!availableNetworks.includes(network)) {
      // If not, set to the first available network
      setNetwork(availableNetworks[0] as NetworkType)
    }
  }
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;

    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push(`/search?address=${encodeURIComponent(address)}&network=mainnet`);
    } catch (error) {
      console.error("Search error:", error);
      toast.error("An error occurred during search. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const clearAddress = () => {
    setAddress("")
    setAddressError(null)
  }
  
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value);
    
    // Clear error when user starts typing again
    if (addressError) {
      setAddressError(null);
    }
  };
  
  const availableNetworks = getAvailableNetworks()

  return (
    <>
      <form onSubmit={handleSearch} className="flex flex-col gap-4 w-full max-w-4xl mx-auto">
        <div className="relative group">
          <Search 
            className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400 group-hover:text-amber-300 transition-all duration-300 ease-out"
            size={20}
          />
          
          <Input
            type="text"
            placeholder={searchType === "onchain" ? "Enter wallet address (0x...)..." : "Enter Neo4j node identifier..."}
            value={address}
            onChange={handleAddressChange}
            className={`w-full pl-14 pr-12 py-3 text-white bg-gray-900/80 border rounded-xl focus:ring-2 placeholder-gray-400 transition-all duration-300 ease-out shadow-[0_0_15px_rgba(245,166,35,0.2)] hover:shadow-[0_0_25px_rgba(245,166,35,0.4)] ${
              addressError 
                ? "border-red-500 focus:ring-red-500/50 focus:border-red-500" 
                : searchType === "onchain" 
                  ? "border-amber-500/20 focus:ring-amber-500/50 focus:border-amber-500" 
                  : "border-blue-500/20 focus:ring-blue-500/50 focus:border-blue-500"
            }`}
          />
          
          {address.length > 0 && (
            <button
              type="button"
              onClick={clearAddress}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-400 bg-transparent p-1 rounded-full transition-all duration-300 ease-out hover:scale-110"
              aria-label="Clear input"
            >
              <X size={18} />
            </button>
          )}
        </div>
        
        {addressError && (
          <div className="text-red-500 text-sm flex items-center gap-1 ml-1">
            <AlertTriangle size={16} className="inline-block" />
            <span>{addressError}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Select
            value={searchType}
            onValueChange={(value) => setSearchType(value as "onchain" | "offchain")}
          >
            <SelectTrigger 
              className={`w-full sm:w-[160px] bg-gray-900/80 text-white rounded-xl focus:ring-2 transition-all duration-300 ease-out shadow-md hover:shadow-lg ${
                searchType === "onchain" 
                  ? "border-amber-500/20 focus:ring-amber-500/50" 
                  : "border-blue-500/20 focus:ring-blue-500/50"
              }`}
            >
              <SelectValue placeholder="Search Type" className="font-medium" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900/80 border border-amber-500/20 text-white rounded-xl z-50">
              <SelectItem value="onchain" className="hover:bg-amber-500/20 transition-colors duration-200">On-Chain</SelectItem>
              <SelectItem value="offchain" className="hover:bg-blue-500/20 transition-colors duration-200">Off-Chain (Neo4j)</SelectItem>
            </SelectContent>
          </Select>
          
          {searchType === "onchain" ? (
            <>
              <div className="w-full sm:w-auto">
                <RadioGroup 
                  defaultValue="etherscan" 
                  value={provider}
                  onValueChange={(value) => handleProviderChange(value as ProviderType)}
                  className="flex space-x-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="etherscan" id="etherscan" className="text-amber-500 border-amber-500 focus:ring-amber-500/50" />
                    <Label htmlFor="etherscan" className="cursor-pointer text-white hover:text-amber-400 transition-colors duration-200">Etherscan</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="infura" id="infura" className="text-amber-500 border-amber-500 focus:ring-amber-500/50" />
                    <Label htmlFor="infura" className="cursor-pointer text-white hover:text-amber-400 transition-colors duration-200">Infura</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <Select
                value={network}
                onValueChange={(value) => setNetwork(value as NetworkType)}
              >
                <SelectTrigger className="w-full sm:w-[200px] bg-gray-900/80 border border-amber-500/20 text-white rounded-xl focus:ring-2 focus:ring-amber-500/50 transition-all duration-300 ease-out shadow-md hover:shadow-lg flex items-center gap-2">
                  <Globe size={18} className="text-amber-400" />
                  <SelectValue placeholder="Network" className="font-medium" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900/80 border border-amber-500/20 text-white rounded-xl z-50">
                  {availableNetworks.map((network) => (
                    <SelectItem 
                      key={network.value} 
                      value={network.value}
                      className="hover:bg-amber-500/20 transition-colors duration-200"
                    >
                      {network.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          ) : (
            <div className="flex items-center gap-3 px-4 py-2 w-full sm:w-auto bg-gray-900/80 border border-blue-500/20 text-white rounded-xl">
              <Neo4jIcon className="text-[#008CC1]" size={22} />
              <span className="text-sm font-medium">Neo4j Graph Database</span>
            </div>
          )}
          
          <Button 
            type="submit" 
            className={`font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-white ${
              searchType === "onchain" 
                ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700" 
                : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            }`}
            disabled={!address.trim() || isLoading}
          >
            <Search className="mr-2 h-5 w-5" />
            Search
          </Button>
        </div>
      </form>
      
      <LoadingScreen isLoading={isLoading} />
    </>
  )
}