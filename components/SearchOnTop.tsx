'use client';
import React, { useState } from 'react';
import { useRouter } from "next/navigation";
import { FaSearch, FaMapPin, FaSun, FaEthereum } from 'react-icons/fa';
import { LoadingScreen } from "@/components/loading-screen";

const SearchOnTop = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchType, setSearchType] = useState<"onchain" | "offchain">("onchain");
  const router = useRouter();

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2500)); // Simulated delay
      if (searchType === "onchain") {
        router.push(`/search/?address=${encodeURIComponent(searchQuery)}&network=mainnet`);
      } else {
        router.push(`/search-offchain/?address=${encodeURIComponent(searchQuery)}`);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between bg-transparent p-4 shadow-md">
        {/* ETH Price and Gas Data */}
        <div className="hidden md:flex items-center space-x-4 text-sm text-white">
          <span>ETH Price: $1,931.60 (+1.41%)</span>
          <span>Gas: 0.462 Gwei</span>
        </div>

        {/* Search Bar */}
        <div className="flex items-center bg-gray-100 p-1 rounded-full shadow-inner w-full md:w-1/2">
          <form onSubmit={handleSearch} className="relative flex-grow">
            <button
              type="button"
              onClick={handleSearch}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black hover:text-gray-600 transition-colors duration-200"
            >
              <FaSearch size={16} />
            </button>
            <input
              type="text"
              placeholder="Search by Address / Txn Hash / Block / Token / Domain Name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 py-1 w-full text-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </form>

          <div className="flex items-center space-x-2 ml-2 text-black">
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as "onchain" | "offchain")}
              className="bg-white border border-gray-300 text-gray-700 py-1 px-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="onchain">On-Chain</option>
              <option value="offchain">Off-Chain</option>
            </select>
            <button className="p-1 rounded-full hover:bg-gray-200 transition hidden sm:block">
              <FaMapPin size={16} />
            </button>
            <button className="p-1 rounded-full hover:bg-gray-200 transition hidden sm:block">
              <FaSun size={16} />
            </button>
            <button className="p-1 rounded-full hover:bg-gray-200 transition hidden sm:block">
              <FaEthereum size={16} />
            </button>
          </div>
        </div>
      </div>
      <LoadingScreen isLoading={isLoading} />
    </>
  );
};

export default SearchOnTop;