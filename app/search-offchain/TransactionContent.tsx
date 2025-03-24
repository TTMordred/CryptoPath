'use client'

import WalletInfo from "@/components/search/WalletInfo"
import TransactionGraphOffChain from "@/components/search-offchain/TransactionGraphOffChain"
import TransactionTableOffChain from "@/components/search-offchain/TransactionTableOffChain"
import Portfolio from "@/components/search/Portfolio"
import { useSearchParams } from "next/navigation"
import SearchBarOffChain from "@/components/search-offchain/SearchBarOffChain"


export default function Transactions() {
  const searchParams = useSearchParams()
  const address = searchParams?.get("address") ?? null
  return (
    <div className="min-h-screen text-white">
      <main className="container mx-auto p-4">
        <div className="mb-8">
          <SearchBarOffChain />
        </div>
        {address ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <WalletInfo />
                <Portfolio />
              </div>
              <TransactionGraphOffChain />
            </div>
            <TransactionTableOffChain />
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
