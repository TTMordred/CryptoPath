"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, Copy, ArrowRight, HelpCircle, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface AddressErrorCardProps {
  address: string
  errorMessage: string
}

export default function AddressErrorCard({ address, errorMessage }: AddressErrorCardProps) {
  const router = useRouter()
  
  const exampleAddresses = [
    "0x690B9A9E9aa1C9dB991C7721a92d351Db4FaC990", // Coinbase address
    "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH contract
    "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT contract
  ]
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Address copied to clipboard")
  }
  
  const navigateToExample = (address: string) => {
    router.push(`/search/?address=${address}&network=mainnet&provider=infura`);
  }
  
  const changeAddress = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    
    // Focus on the search input after a small delay
    setTimeout(() => {
      const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement
      if (searchInput) {
        searchInput.focus()
      }
    }, 500)
  }
  
  return (
    <div className="max-w-3xl mx-auto my-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="overflow-hidden border border-red-500/30 bg-gradient-to-br from-gray-900 to-black">
          <CardContent className="pt-6 pb-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="rounded-full bg-red-500/20 p-3 text-red-400">
                <AlertTriangle size={32} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-red-400">Invalid Ethereum Address</h2>
                <p className="text-gray-400 mt-1">{errorMessage}</p>
              </div>
            </div>

            <div className="bg-red-950/20 border border-red-500/20 rounded-md p-4 mb-6">
              <h3 className="text-gray-300 font-medium mb-2">Entered Address:</h3>
              <div className="flex items-center gap-2">
                <code className="px-3 py-2 bg-gray-900/70 rounded text-amber-500 font-mono break-all">{address}</code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(address)}
                  className="shrink-0"
                >
                  <Copy size={16} />
                </Button>
              </div>
            </div>

            <div className="grid gap-6">
              <div>
                <h3 className="text-gray-300 font-medium mb-3 flex items-center gap-2">
                  <HelpCircle size={16} className="text-blue-400" />
                  How to fix this?
                </h3>
                <ul className="list-disc ml-6 text-gray-400 space-y-2">
                  <li>Ethereum addresses are hexadecimal and 42 characters long (including '0x')</li>
                  <li>Check for typos or missing characters</li>
                  <li>Ensure you copied the entire address from its source</li>
                  <li>Try again with a valid Ethereum address</li>
                </ul>
                <Button 
                  variant="outline" 
                  className="mt-4 border-blue-500/30 text-blue-400 hover:bg-blue-950/30"
                  onClick={changeAddress}
                >
                  <Edit size={16} className="mr-2" />
                  Change Address
                </Button>
              </div>

              <div className="border-t border-gray-800 pt-6 mt-2">
                <h3 className="text-gray-300 font-medium mb-4">Try these example addresses:</h3>
                <div className="space-y-3">
                  {exampleAddresses.map((addr) => (
                    <div key={addr} className="flex flex-wrap items-center gap-2 bg-gray-900/40 p-3 rounded-lg hover:bg-gray-900/60 transition-colors">
                      <code className="px-2 py-1 bg-gray-900/70 rounded text-amber-400 font-mono text-xs sm:text-sm break-all flex-1">{addr}</code>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(addr)}
                          className="h-8 px-2 text-gray-400 hover:text-white"
                        >
                          <Copy size={14} className="mr-1" /> Copy
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => navigateToExample(addr)}
                          className="h-8 px-2 bg-gradient-to-r from-amber-600 to-amber-700"
                        >
                          <ArrowRight size={14} className="mr-1" /> View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
