"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Search, X } from "lucide-react"
import { LoadingScreen } from "@/components/loading-screen";

export default function SearchBar() {
  const [address, setAddress] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address.trim()) return;
    
    setIsLoading(true);
    
    try {
      // Giả lập thời gian tải (có thể thay bằng API call thực tế)
      await new Promise(resolve => setTimeout(resolve, 2500));
      router.push(`/search/?address=${encodeURIComponent(address)}`);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const clearAddress = () => {
    setAddress("")
  }

  return (
    <>
      <form onSubmit={handleSearch} className="flex gap-2 w-full">
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
        
        <Button 
          type="submit" 
          className="bg-amber-500 hover:bg-amber-400 text-black font-medium shadow-md transition-colors duration-200"
          disabled={!address.trim() || isLoading}
        >
          Search
        </Button>
      </form>
      
      <LoadingScreen isLoading={isLoading} />
    </>
  )
}