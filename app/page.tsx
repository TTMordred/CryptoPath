import SearchBar from "@/components/SearchBar"
import WalletInfo from "@/components/WalletInfo"
import TransactionGraph from "@/components/TransactionGraph"
import TransactionTable from "@/components/TransactionTable"
import Portfolio from "@/components/Portfolio"
import Header from "@/components/Header"

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-theme-navy">
      <Header />
      <main className="container mx-auto p-4">
        <div className="mb-8">
          <SearchBar />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <WalletInfo />
            <Portfolio />
          </div>
          <TransactionGraph />
        </div>
        <TransactionTable />
      </main>
    </div>
  )
}

