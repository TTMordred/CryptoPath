import React, { useState, useEffect } from 'react';
import { useRouter } from "next/navigation"

const CryptoPathExplorer = ({ language = 'en' as 'en' | 'vi' }) => {
  const [searchValue, setSearchValue] = useState('');
  const [ethPrice, setEthPrice] = useState('');
  const [ethChange, setEthChange] = useState('');
  const [opPrice, setOpPrice] = useState('');
  const [opChange, setOpChange] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All Filters');
  const router = useRouter()

  const filters = ['All Filters', 'On-Chain', 'Off-Chain', 'Tokens', 'NFTs', 'Addresses'];

  const translations = {
    en: {
      searchPlaceholder: "Search by Address / Txn Hash / Block / Token",
      ethPrice: "ETH Price:",
      latestBlock: "LATEST BLOCK",
      transactions: "TRANSACTIONS",
      l1TxnBatch: "LATEST L1 TXN BATCH",
      l1StateBatch: "LATEST L1 STATE BATCH",
      transactionHistory: "OP MAINNET TRANSACTION HISTORY IN 14 DAYS",
      opPrice: "OP PRICE"
    },
    vi: {
      searchPlaceholder: "Tìm kiếm theo Địa chỉ / Mã Giao dịch / Khối / Token",
      ethPrice: "Giá ETH:",
      latestBlock: "KHỐI MỚI NHẤT",
      transactions: "GIAO DỊCH",
      l1TxnBatch: "LÔ GIAO DỊCH L1 MỚI NHẤT",
      l1StateBatch: "LÔ TRẠNG THÁI L1 MỚI NHẤT",
      transactionHistory: "LỊCH SỬ GIAO DỊCH OP MAINNET TRONG 14 NGÀY",
      opPrice: "GIÁ OP"
    }
  };

  const t = translations[language];

  // Fetch data from CoinGecko when the component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        // CoinGecko API endpoint for Ethereum and Optimism prices with 24h changes
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,optimism&vs_currencies=usd&include_24hr_change=true'
        );
        const data = await response.json();
        // Set ETH data
        if (data.ethereum) {
          setEthPrice(data.ethereum.usd.toFixed(2));
          // Format change with a "+" sign if positive
          const change = data.ethereum.usd_24h_change;
          setEthChange((change >= 0 ? '+' : '') + change.toFixed(2) + '%');
        }
        // Set Optimism data
        if (data.optimism) {
          setOpPrice(data.optimism.usd.toFixed(6));
          const change = data.optimism.usd_24h_change;
          setOpChange((change >= 0 ? '+' : '') + change.toFixed(2) + '%');
        }
      } catch (error) {
        console.error("Error fetching crypto data: ", error);
      }
    };
    fetchData();
  }, []);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
// Nho minh duy phan nay
  };

  const toggleFilterDropdown = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  const selectFilter = (filter: string) => {
    setSelectedFilter(filter);
    setIsFilterOpen(false);
  };

  return (
    <div className="w-full mb-16 mt-16">
      {/* Explorer Title */}
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-bold text-white">CryptoPath Explorer</h2>
      </div>
      
      {/* Search Bar */}
      <div className="flex justify-center mb-12">
        <div className="relative w-full max-w-2xl mx-auto">
          <div className="flex">
            {/* Filter Dropdown */}
            <div className="relative">
              <button 
                onClick={toggleFilterDropdown}
                className="px-4 py-2 bg-gray-900/80 text-white rounded-l-[10px] border border-gray-700 font-medium flex items-center"
              >
                {selectedFilter}
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-4 w-4 ml-2" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isFilterOpen && (
                <div className="absolute top-full left-0 mt-1 w-40 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-10">
                  {filters.map((filter) => (
                    <div 
                      key={filter}
                      className="px-4 py-2 hover:bg-gray-800 cursor-pointer first:rounded-t-lg last:rounded-b-lg"
                      onClick={() => selectFilter(filter)}
                    >
                      {filter}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Search Input */}
            <form onSubmit={handleSearch} className="flex flex-grow">
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full px-4 py-2 text-white bg-gray-900/80 border-y border-gray-700 focus:outline-none"
              />
              <button 
                type="submit" 
                className="px-4 bg-[#F5B056] rounded-r-[10px] flex items-center justify-center"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-4 w-4 text-white" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                  />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>
      
      {/* Data Display */}
      <div className="bg-white/5 backdrop-blur-[4px] rounded-[10px] p-6 border border-gray-800 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* ETH Price */}
          <div className="flex items-center space-x-4">
            <div className="bg-gray-900/80 p-3 rounded-lg">
              <svg viewBox="0 0 32 32" className="w-6 h-6 text-gray-300 fill-current">
                <path d="M16.498 4v8.87l7.497 3.35z"></path>
                <path d="M16.498 4L9 16.22l7.498-3.35z"></path>
                <path d="M16.498 21.968v6.027L24 17.616z"></path>
                <path d="M16.498 27.995v-6.028L9 17.616z"></path>
                <path d="M16.498 20.573l7.497-4.353-7.497-3.348z"></path>
                <path d="M9 16.22l7.498 4.353v-7.701z"></path>
              </svg>
            </div>
            <div>
              <div className="text-xs text-gray-400">ETH PRICE</div>
              <div className="flex items-center">
                <span className="text-lg font-semibold text-white">${ethPrice || 'Loading...'}</span>
                <span className={`ml-2 text-sm ${ethChange.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                  ({ethChange || '...'})
                </span>
              </div>
            </div>
          </div>
          
          {/* Latest Block (Static Example) */}
          <div>
            <div className="text-xs text-gray-400">{t.latestBlock}</div>
            <div className="font-semibold text-white">133182496 <span className="text-sm text-gray-400">(2.00s)</span></div>
          </div>
          
          {/* Transactions (Static Example) */}
          <div>
            <div className="text-xs text-gray-400">{t.transactions}</div>
            <div className="font-semibold text-white">498.28 M <span className="text-sm text-gray-400">(10.5 TPS)</span></div>
          </div>
          
          {/* OP Price */}
          <div className="flex items-center space-x-4">
            <div className="bg-red-900/80 p-3 rounded-lg">
              <span className="font-bold text-red-400">OP</span>
            </div>
            <div>
              <div className="text-xs text-gray-400">OP PRICE</div>
              <div className="flex items-center">
                <span className="text-lg font-semibold text-white">${opPrice || 'Loading...'}</span>
                <span className={`ml-2 text-sm ${opChange.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                  ({opChange || '...'})
                </span>
              </div>
            </div>
          </div>
          
          {/* L1 TXN BATCH (Static Example) */}
          <div>
            <div className="text-xs text-gray-400">{t.l1TxnBatch}</div>
            <div className="font-semibold text-white">1.17 M</div>
          </div>
          
          {/* L1 STATE BATCH (Static Example) */}
          <div>
            <div className="text-xs text-gray-400">{t.l1StateBatch}</div>
            <div className="font-semibold text-white">8878</div>
          </div>
        </div>
        
        {/* Transaction History Graph (Static SVG Example) */}
        <div className="mt-6">
          <div className="text-xs text-gray-400">{t.transactionHistory}</div>
          <div className="h-32 w-full mt-2">
            <svg viewBox="0 0 400 100" className="w-full h-full overflow-visible">
              <path
                d="M0,50 C20,40 40,30 60,45 C80,60 100,80 120,70 C140,60 160,40 180,50 C200,60 220,90 240,80 C260,70 280,30 300,40 C320,50 340,60 360,50 C380,40 400,30 400,40"
                fill="none"
                stroke="#F5B056"
                strokeWidth="2"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CryptoPathExplorer;
