
'use client'

import SearchBar from "@/components/search/SearchBar"
import WalletInfo from "@/components/search/WalletInfo"
import TransactionGraph from "@/components/search/TransactionGraph"
import TransactionTable from "@/components/search/TransactionTable"
import Portfolio from "@/components/search/Portfolio"
import NFTGallery from "@/components/search/NFTGallery"
import { useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function Transactions() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const address = searchParams.get("address")
  const networkParam = searchParams.get("network") || "mainnet"
  const [network, setNetwork] = useState(networkParam)
  const [pendingTxCount, setPendingTxCount] = useState<number | null>(null)
  
  // Update network state when URL parameter changes
  useEffect(() => {
    setNetwork(networkParam)
  }, [networkParam])
  
  // Handle network change
  const handleNetworkChange = (value: string) => {
    setNetwork(value)
    
    // Update the URL to include the new network
    if (address) {
      router.push(`/search?address=${address}&network=${value}`)
    } else {
      router.push(`/search?network=${value}`)
    }
  }
  
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
  
  return (
    <div className="min-h-screen text-white">
      <main className="container mx-auto p-4">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <SearchBar />
            
            <div className="w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <span className="text-sm whitespace-nowrap">Network:</span>
                <Select value={network} onValueChange={handleNetworkChange}>
                  <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700">
                    <SelectValue placeholder="Select network" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="mainnet">Ethereum Mainnet</SelectItem>
                    <SelectItem value="optimism">Optimism</SelectItem>
                    <SelectItem value="arbitrum">Arbitrum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {pendingTxCount !== null && (
                <div className="mt-2 text-sm text-gray-400">
                  Pending transactions: {pendingTxCount}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {address ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <WalletInfo />
                <Portfolio />
              </div>
              <TransactionGraph />
            </div>
            <TransactionTable />
            <NFTGallery />
          </>
        ) : (
          <div className="text-center mt-8">
            <h2 className="text-2xl font-bold mb-4">Welcome to CryptoPath</h2>
            <p className="text-lg">
              Enter an Ethereum address above to explore wallet details, transactions, and NFTs.
            </p>
            <p className="mt-4 text-gray-400">
              Currently connected to: <span className="font-semibold text-[#F5B056]">{network}</span>
              {pendingTxCount !== null && (
                <span className="ml-2">({pendingTxCount} pending transactions)</span>
              )}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
