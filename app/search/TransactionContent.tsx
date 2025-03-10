'use client'

import dynamic from 'next/dynamic'
import { Suspense, useEffect } from 'react'
import SearchBar from "@/components/SearchBar"
import WalletInfo from "@/components/WalletInfo"
import { Card, CardContent } from "@/components/ui/card"
import { useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"

// Preload critical components
const FilteredTransactionTable = dynamic(() => import("@/components/transactions/FilteredTransactionTable"), {
  loading: () => <LoadingCard>Loading transactions...</LoadingCard>,
  ssr: false
})

// Defer loading of non-critical components
const TransactionGraph = dynamic(() => import("@/components/TransactionGraph"), {
  loading: () => <LoadingCard>Loading transaction graph...</LoadingCard>,
  ssr: false,
})

const Portfolio = dynamic(() => import("@/components/Portfolio"), {
  loading: () => <LoadingCard>Loading portfolio...</LoadingCard>,
  ssr: false,
})

const NFTGallery = dynamic(() => import("@/components/NFTGallery"), {
  loading: () => <LoadingCard>Loading NFTs...</LoadingCard>,
  ssr: false,
})

// Loading component optimized for frequent reuse
const LoadingCard = ({ children }: { children: React.ReactNode }) => (
  <Card className="w-full p-4">
    <CardContent className="flex items-center justify-center gap-2">
      <Loader2 className="h-4 w-4 animate-spin" />
      <p className="text-sm text-gray-500">{children}</p>
    </CardContent>
  </Card>
)

export default function Transactions() {
  const searchParams = useSearchParams()
  const address = searchParams.get("address")

  // Preload components when address is available
  useEffect(() => {
    if (address) {
      // Preload critical components immediately
      const preloadCritical = async () => {
        const [FilteredTransactionTable, WalletInfo] = await Promise.all([
          import("@/components/transactions/FilteredTransactionTable"),
          import("@/components/WalletInfo")
        ])
      }
      preloadCritical()

      // Defer loading of non-critical components
      const preloadNonCritical = async () => {
        const [TransactionGraph, Portfolio, NFTGallery] = await Promise.all([
          import("@/components/TransactionGraph"),
          import("@/components/Portfolio"),
          import("@/components/NFTGallery")
        ])
      }
      // Delay loading non-critical components
      const timer = setTimeout(preloadNonCritical, 2000)
      return () => clearTimeout(timer)
    }
  }, [address])

  return (
    <div className="min-h-screen text-white">
      <main className="container mx-auto p-4">
        <div className="mb-8">
          <SearchBar />
        </div>
        {address ? (
          <>
            {/* Critical content loaded first */}
            <Suspense fallback={<LoadingCard>Loading transactions...</LoadingCard>}>
              <FilteredTransactionTable />
            </Suspense>

            {/* Non-critical content loaded after */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
              <div>
                <Suspense fallback={<LoadingCard>Loading wallet info...</LoadingCard>}>
                  <WalletInfo />
                </Suspense>
                <Suspense fallback={<LoadingCard>Loading portfolio...</LoadingCard>}>
                  <Portfolio />
                </Suspense>
              </div>
              <Suspense fallback={<LoadingCard>Loading graph...</LoadingCard>}>
                <TransactionGraph />
              </Suspense>
            </div>

            {/* Load NFTs last */}
            <div className="mt-8">
              <Suspense fallback={<LoadingCard>Loading NFTs...</LoadingCard>}>
                <NFTGallery />
              </Suspense>
            </div>
          </>
        ) : (
          <div className="text-center mt-8">
            <h2 className="text-2xl font-bold mb-4">Welcome to CryptoPath</h2>
            <p className="text-lg">
              Enter an Ethereum address above to explore wallet details, transactions, and NFTs.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
