'use client'

import SearchBar from "@/components/SearchBar"
import WalletInfo from "@/components/WalletInfo"
import TransactionGraph from "@/components/TransactionGraph"
import TransactionTable from "@/components/TransactionTable"
import Portfolio from "@/components/Portfolio"
import NFTGallery from "@/components/NFTGallery"
import { useSearchParams } from "next/navigation"


export default function Transactions() {
  const searchParams = useSearchParams()
  const address = searchParams.get("address")
  return (
    <div className="min-h-screen text-white">
      <main className="container mx-auto p-4">
        <div className="mb-8">
          <SearchBar />
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
          </div>
        )}
      </main>
    </div>
  )
}
