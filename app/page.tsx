import SearchBar from '@/components/SearchBar'
import WalletInfo from '@/components/WalletInfo'
import TransactionGraph from '@/components/TransactionGraph'
import TransactionTable from '@/components/TransactionTable'

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Blockchain Transaction Visualization</h1>
      <SearchBar />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <WalletInfo />
        <TransactionGraph />
      </div>
      <TransactionTable />
    </main>
  )
}

