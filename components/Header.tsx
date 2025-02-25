"use client"; // Ensures this runs on the client side
import { useState } from "react";
import Link from "next/link";
import { useRef } from "react";
import { Menu, X } from "lucide-react"; // Icons for open/close
import { useRouter } from "next/navigation";
import { Search } from "lucide-react"
import { useEffect } from "react";
import Image from "next/image";


const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [address, setAddress] = useState("")
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ name: string } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
    }
  }, []);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (address) {
      router.push(`/search/?address=${address}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    setDropdownOpen(false);
    window.location.href = "/login";
  };

  return (
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
        <Link href="/transactions" className="text-white text-sm hover:text-[#F5B056] transition">
          Transactions
        </Link>
        <a href="mailto:cryptopath@gmail.com" className="text-white text-sm hover:text-[#F5B056] transition">
          Support
        </a>
        <form onSubmit={handleSearch} className="relative transition">
          <input
            type="text"
            placeholder="Search wallet..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="p-2 pl-10 rounded-md text-black border border-gray-300 focus:outline-none"
          />
          <button type="submit" className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16}/>
          </button>
        </form>
        {currentUser ? 
              (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center text-white text-xs uppercase hover:text-[#F5B056] transition"
                  >
                      {currentUser.name}
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
                  {dropdownOpen && 
                    (
                      <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg z-20">
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-white bg-black hover:text-[#F5B056]"
                        >
                          Logout
                        </button>
                      </div>
                    )
                  }
                </div>
              ) : 
              (
                <Link href="/login" className="text-white text-sm hover:text-[#F5B056] transition">
                  Login
                </Link>
              )
            }
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
            <Link href="/transactions" className="text-sm uppercase hover:text-[#F5B056] transition" onClick={() => setIsOpen(false)}>
              Transactions
            </Link>
            <a href="mailto:cryptopath@gmail.com" className="text-sm uppercase hover:text-[#F5B056] transition" onClick={() => setIsOpen(false)}>
              Support
            </a>
            <form onSubmit={handleSearch} className="relative flex justify-center mt-4 pt-2 text-xs">
              <input
                type="text"
                placeholder="Search wallet..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="p-2 pl-10 rounded-md text-black border border-gray-300 focus:outline-none w-3/4"
              />
              <button type="submit" className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={25} />
              </button>
            </form>
            {currentUser ? 
              (
                <div className="relative flex justify-center mt-4 pt-2">
                  <Link href="/search" className="text-white text-xs uppercase hover:text-[#F5B056]">
                    {currentUser.name}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-xs text-black bg-white hover:bg-[#F5B056] px-4 py-2 rounded transition"
                  >
                    Logout
                  </button>
                </div>

              ) : 
              (
                <Link href="/login" className="text-white text-sm uppercase hover:text-[#F5B056] transition">
                  Login
                </Link>
              )
            }
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
