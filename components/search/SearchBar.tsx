
"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Search, X, Globe } from "lucide-react"
import { LoadingScreen } from "@/components/loading-screen";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue, 
} from "@/components/ui/select"
import { toast } from "sonner"

export type NetworkType = "mainnet" | "optimism" | "arbitrum";

export default function SearchBar() {
  const [address, setAddress] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const [searchType, setSearchType] = useState<"onchain" | "offchain">("onchain");
  const [network, setNetwork] = useState<NetworkType>("mainnet");
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address.trim()) return;
    
    setIsLoading(true);
    
    try {
      // Simulate loading time
      await new Promise(resolve => setTimeout(resolve, 2500));
      if (searchType === "onchain") {
        router.push(`/search/?address=${encodeURIComponent(address)}&network=${network}`);
      } else {
        router.push(`/search-offchain/?address=${encodeURIComponent(address)}`);
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("An error occurred during search. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const clearAddress = () => {
    setAddress("")
  }

  return (
    <>
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 w-full">
        <div className="relative flex-grow">
          <Search 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 transition-colors duration-200" 
            size={18}
          />
          
          <Input
            type="text"
            placeholder="Enter wallet address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="pl-10 pr-10 py-2 w-full transition-all duration-200 focus:border-amber-500"
          />
          
          {address.length > 0 && (
            <button
              type="button"
              onClick={clearAddress}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200 bg-transparent p-1 rounded-full transition-colors duration-200"
              aria-label="Clear input"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <Select
            value={network}
            onValueChange={(value) => setNetwork(value as NetworkType)}
          >
            <SelectTrigger className="w-[140px] bg-black border border-gray-700">
              <div className="flex items-center gap-2">
                <Globe size={16} />
                <SelectValue placeholder="Network" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-black border border-gray-700 text-white z-50">
              <SelectItem value="mainnet">Ethereum</SelectItem>
              <SelectItem value="optimism">Optimism</SelectItem>
              <SelectItem value="arbitrum">Arbitrum</SelectItem>
            </SelectContent>
          </Select>
          
          <Select
            value={searchType}
            onValueChange={(value) => setSearchType(value as "onchain" | "offchain")}
          >
            <SelectTrigger className="w-[140px] bg-black border border-gray-700">
              <SelectValue placeholder="Search Type" />
            </SelectTrigger>
            <SelectContent className="bg-black border border-gray-700 text-white z-50">
              <SelectItem value="onchain">On-Chain</SelectItem>
              <SelectItem value="offchain">Off-Chain</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            type="submit" 
            className="bg-amber-500 hover:bg-amber-400 text-black font-medium shadow-md transition-colors duration-200"
            disabled={!address.trim() || isLoading}
          >
            Search
          </Button>
        </div>
      </form>
      
      <LoadingScreen isLoading={isLoading} />
    </>
  )
}
