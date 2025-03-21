import { useState } from 'react';
import { useRouter } from "next/navigation";

export type SearchType = "All Filters" | "On-Chain" | "Off-Chain" | "Tokens" | "NFTs" | "Addresses";

export const useSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<SearchType>("All Filters");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!searchQuery.trim()) return;

    try {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Route based on search type
      if (searchType === "Off-Chain") {
        router.push(`/search-offchain/?address=${encodeURIComponent(searchQuery)}`);
      } else {
        // Default to on-chain search for all other types
        router.push(`/search/?address=${encodeURIComponent(searchQuery)}&network=mainnet`);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    searchQuery,
    setSearchQuery,
    searchType,
    setSearchType,
    isLoading,
    handleSearch
  };
};