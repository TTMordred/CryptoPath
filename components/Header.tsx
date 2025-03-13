
"use client"; // Ensures this runs on the client side
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Search } from "lucide-react"; // Icons
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { LoadingScreen } from "@/components/loading-screen";
import { supabase } from "@/src/integrations/supabase/client";
import { toast } from "sonner";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [address, setAddress] = useState("");

  const [searchType, setSearchType] = useState<"onchain" | "offchain">("onchain");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ walletAddress?: string; name?: string; id?: string; email?: string } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Check for authentication state
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // User is logged in with Supabase
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        setCurrentUser({
          id: session.user.id,
          email: session.user.email,
          name: profile?.display_name || session.user.email?.split('@')[0],
        });
      } else {
        // Fallback to localStorage for wallet connections
        const storedUser = localStorage.getItem("currentUser");
        if (storedUser) {
          setCurrentUser(JSON.parse(storedUser));
        } else {
          setCurrentUser(null);
        }
      }
    };
    
    checkUser();
    
    // Listen for authentication state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // When user signs in, update current user state
        setCurrentUser({
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata.full_name || session.user.email?.split('@')[0],
        });
      } else if (event === 'SIGNED_OUT') {
        // When user signs out, clear current user state
        setCurrentUser(null);
      }
    });

    const handleUserUpdate = (event: CustomEvent) => {
      setCurrentUser(event.detail);
    };
    
    window.addEventListener('userUpdated', handleUserUpdate as EventListener);
    
    // Cleanup
    return () => {
      authListener?.subscription.unsubscribe();
      window.removeEventListener('userUpdated', handleUserUpdate as EventListener);
    };
  }, []);

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!address.trim()) return;

    if (address) {
      router.push(`/search/?address=${address}`);
    }

    setIsLoading(true);

    try {
      // Simulate loading time (can be replaced with actual API call)
      await new Promise(resolve => setTimeout(resolve, 2500));
      if (searchType === "onchain") {
        router.push(`/search/?address=${encodeURIComponent(address)}`);
      } else {
        router.push(`/search-offchain/?address=${encodeURIComponent(address)}`);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearAddress = () => {
    setAddress("");
  };

  // Navigate to search page when clicking the search icon
  const handleSearchIconClick = () => {
    router.push('/search');
  };

  const handleLogout = async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear local storage
      localStorage.removeItem("currentUser");
      setCurrentUser(null);
      setDropdownOpen(false);
      toast.success("Logged out successfully");
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to log out. Please try again.");
    }
  };

  const formatWalletAddress = (walletAddress: string) => {
    if (!walletAddress) return "";
    return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <>
      <header className="flex items-center bg-black h-16 px-4">
        {/* Logo */}
        <div className="text-white mr-auto ml-4 text-3xl font-bold">
          <h1 className="ml-8">
            <Link href="/">
              <Image
                src="/Img/logo/logo2.png"
                alt="CryptoPath Logo"
                width={75}
                height={75}
                className="inline-block mr-2"
              />
              Crypto<span className="text-[#F5B056]">Path<sub>&copy;</sub></span>
            </Link>
          </h1>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex justify-center items-center space-x-6">
          <Link href="/" className="text-white text-sm hover:text-[#F5B056] transition">
            Home
          </Link>
          <Link href="/pricetable" className="text-sm hover:text-[#F5B056] transition" onClick={() => setIsOpen(false)}>
                PriceTable
            </Link>
          <Link href="/transactions" className="text-white text-sm hover:text-[#F5B056] transition">
            Transactions
          </Link>
          <Link href="/Faucet" className="text-white text-sm hover:text-[#F5B056] transition">
            Faucet
          </Link>
          <Link href="/NFT" className="text-white text-sm hover:text-[#F5B056] transition">
            NFT
          </Link>
          <a href="mailto:cryptopath@gmail.com" className="text-white text-sm hover:text-[#F5B056] transition">
            Support
          </a>

          {/* Improved Search Form without button */}
          <form onSubmit={handleSearch} className="relative flex items-center">

            {/* Search icon that navigates to search page on click */}
            <button
              type="button"
              onClick={handleSearchIconClick}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors duration-200"
            >
              <Search size={16} />
            </button>

            <Input
              type="text"
              placeholder="Search wallet..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="pl-10 pr-10 py-2 h-9 w-64 text-sm transition-all duration-200 focus:border-amber-500"
            />

            {address.length > 0 && (
              <button
                type="button"
                onClick={clearAddress}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200 bg-transparent p-1 rounded-full transition-colors duration-200"
                aria-label="Clear input"
              >
                <X size={12} />
              </button>
            )}

            <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as "onchain" | "offchain")}
                className="ml-2 px-2 py-1 h-9 text-sm text-white bg-black border border-gray-700 rounded-md focus:outline-none hover:bg-gray-800 transition-colors"
              >
                <option value="onchain">On-Chain</option>
                <option value="offchain">Off-Chain</option>
            </select>
          </form>

          {currentUser ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center text-white text-xs uppercase hover:text-[#F5B056] transition"
              >
                 {currentUser.name || formatWalletAddress(currentUser.walletAddress || '')}
                <svg
                  className="w-4 h-4 ml-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg z-20">
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-white bg-black hover:text-[#F5B056]"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="text-white text-sm hover:text-[#F5B056] transition">
              Login
            </Link>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-white focus:outline-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="absolute top-16 right-0 w-64 bg-black text-white p-6 shadow-lg md:hidden z-50 w-screen">
            <nav className="flex flex-col space-y-4 text-center text-xl">
              <Link href="/" className="text-sm uppercase hover:text-[#F5B056] transition" onClick={() => setIsOpen(false)}>
                Home
              </Link>
              <Link href="/pricetable" className="text-sm uppercase hover:text-[#F5B056] transition" onClick={() => setIsOpen(false)}>
                Pricetable
              </Link>
              <Link href="/transactions" className="text-sm uppercase hover:text-[#F5B056] transition" onClick={() => setIsOpen(false)}>
                Transactions
              </Link>
              <Link href="/Faucet" className="text-sm uppercase hover:text-[#F5B056] transition" onClick={() => setIsOpen(false)}>
                Faucet
              </Link>
              <Link href="/NFT" className="text-sm uppercase hover:text-[#F5B056] transition" onClick={() => setIsOpen(false)}>
                NFT
              </Link>
              <a href="mailto:cryptopath@gmail.com" className="text-sm uppercase hover:text-[#F5B056] transition" onClick={() => setIsOpen(false)}>
                Support
              </a>
              

              {/* Improved Mobile Search Form without button */}
              <form onSubmit={handleSearch} className="relative w-3/4 mx-auto mt-4 pt-2 flex flex-col items-center">
                {/* Search icon that navigates to search page on click */}
                <button 
                  type="button" 
                  onClick={handleSearchIconClick} 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <Search size={18} />
                </button>
                
                <Input
                  type="text"
                  placeholder="Search wallet..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="pl-10 pr-10 py-2 w-full text-black transition-all duration-200 focus:border-amber-500"
                />
                
                {address.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAddress}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent p-1 rounded-full"
                    aria-label="Clear input"
                  >
                    <X size={16} />
                  </button>
                )}
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value as "onchain" | "offchain")}
                  className="mt-2 px-4 py-2 w-full text-sm text-white bg-black border border-gray-700 rounded-md focus:outline-none hover:bg-gray-800 transition-colors"
                >
                  <option value="onchain">On-Chain</option>
                  <option value="offchain">Off-Chain</option>
                </select>
              </form>
              
              {currentUser ? (
                <div className="relative flex justify-center mt-4 pt-2">
                  <Link href="/search" className="text-white text-xs uppercase hover:text-[#F5B056]">
                    {currentUser.name || formatWalletAddress(currentUser.walletAddress || '')}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-xs text-black bg-white hover:bg-[#F5B056] px-4 py-2 rounded transition ml-2"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link href="/login" className="text-white text-sm uppercase hover:text-[#F5B056] transition">
                  Login
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Loading Screen */}
      <LoadingScreen isLoading={isLoading} />
    </>
  );
};

export default Header;
