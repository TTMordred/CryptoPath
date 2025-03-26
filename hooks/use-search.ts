import { useState } from 'react';
import { useRouter } from "next/navigation";
import { serialize } from 'v8';
import { toast } from "sonner"

export type SearchType = "All Filters" | "On-Chain" | "Off-Chain" | "Tokens" | "Txn Hash" | "Blocks";
const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
export const useSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<SearchType>("All Filters");
  const [addressError, setAddressError] = useState<string | null>(null)
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  type InputType = "ADDRESS" | "TRANSACTION-HASH" | "TOKEN" | "BLOCK" | "NEO4J" | "UNKNOWN";

  const detectInputType = (input: string): InputType => {
    // Clean the input
    const cleanInput = input.trim().toLowerCase();
  
    // Check for empty input
    if (!cleanInput) return "UNKNOWN";
  
    // Ethereum Address and Token (0x followed by 40 hex characters)
    if (/^0x[a-f0-9]{40}$/.test(cleanInput)) {
      return "ADDRESS";
    }
  
    // Transaction Hash (0x followed by 64 hex characters)
    if (/^0x[a-f0-9]{64}$/.test(cleanInput)) {
      return "TRANSACTION-HASH";
    }
  
    // Block Number (numeric only)
    if (/^\d+$/.test(cleanInput)) {
      return "BLOCK";
    }
  
    // Neo4j identifier (at least 3 characters)
    if (/^0x[a-f0-9]{40}$/.test(cleanInput)) {
      return "NEO4J";
    }
  
    return "UNKNOWN";
  };

  const handleUniversalSearch = async (input: string) => {
    const inputType = detectInputType(input);
    
    switch (inputType) {
      case "ADDRESS":
        // Check if it's a token contract
        const isToken = false; // You would need to implement token detection logic here
        if (isToken) {
          return `/token/?address=${encodeURIComponent(input)}`;
        }
        return `/search/?address=${encodeURIComponent(input)}&network=mainnet&provider=etherscan`;
        
      case "TRANSACTION-HASH":
        return `/txn-hash/?hash=${encodeURIComponent(input)}`;
        
      case "BLOCK":
        return `/block/?number=${encodeURIComponent(input)}`;
        
      case "NEO4J":
        return `/search-offchain/?address=${encodeURIComponent(input)}`;
        
      default:
        throw new Error("Unable to determine search type");
    }
  };

  const validateAddress = (addr: string): boolean => {
    if (!addr) return false;
    
    // For on-chain searches, validate Ethereum address format
    if (searchType === "On-Chain") {
      if (!ETH_ADDRESS_REGEX.test(addr)) {
        setAddressError("Invalid Ethereum address format. Must start with 0x followed by 40 hex characters.");
        return false;
      }
    } else if(searchType === "Txn Hash"){
      if(addr.length !== 66){
        setAddressError("Invalid Transaction Hash format. Must be 66 characters long.");
        return false;
      }
    }else if(searchType === "Tokens"){
      if(addr.length !== 42){
        setAddressError("Invalid Token address format. Must be 42 characters long.");
        return false;
      }
    }else if (searchType === "Blocks"){
      if(addr.length < 1){
        setAddressError("Invalid Block number format. Must be at least 1 character long.");
        return false;
      }
    }else if(searchType === "All Filters"){
      // Detect logic to search for all types
      const inputType = detectInputType(addr);
      if (inputType === "UNKNOWN") {
        setAddressError("Invalid search input. Please enter a valid address, transaction hash, token address, or block number.");
        return false;
      }
    }
    else {
      // For off-chain searches, validate Neo4j ID format
      if (!ETH_ADDRESS_REGEX.test(addr)) {
        setAddressError("Neo4j identifier must be at least 3 characters");
        return false;
      }
    }
    
    setAddressError(null);
    return true;
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!searchQuery.trim()) return;
    // Validate address before proceeding
    if (!validateAddress(searchQuery.trim())) {
      toast.error("Invalid address format", { 
        description: addressError || "Please check the address format and try again.",
        action: {
          label: 'Learn More',
          onClick: () => window.open('https://ethereum.org/en/developers/docs/intro-to-ethereum/#ethereum-accounts', '_blank'),
        }
      });
      return;
    }

    setIsLoading(true);
    try {
      
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Route based on search type
      if (searchType === "Off-Chain") {
        router.push(`/search-offchain/?address=${encodeURIComponent(searchQuery)}`);
      } else if (searchType === "Tokens") {
        router.push(`/token/?address=${encodeURIComponent(searchQuery)}`)
      }else if (searchType === "Txn Hash") {
        router.push(`/txn-hash/?hash=${searchQuery}`)
      }else if (searchType === "Blocks") {
        router.push(`/block/?number=${searchQuery}`)
      }else if (searchType === "All Filters") {
        const route = await handleUniversalSearch(searchQuery);
        router.push(route);
      }
      else {
        // Default to on-chain search for all other types
        router.push(`/search/?address=${encodeURIComponent(searchQuery)}`);
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