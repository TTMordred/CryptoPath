'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { LayoutGrid, Layers, Bookmark, Activity, ChevronRight, Info } from 'lucide-react';

export default function NFTLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Determine active section based on URL
  const isMarketplace = pathname === '/NFT';
  const isCollections = pathname.includes('/NFT/collection');
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-transparent text-white">
      <div className="container mx-auto px-4 pt-20 pb-8">
        {/* Navigation Tabs */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-black/60 rounded-full p-1 flex gap-1 backdrop-blur-sm border border-gray-800">
            <Link href="/NFT" passHref>
              <button 
                className={`relative px-4 py-2 rounded-full flex items-center text-sm font-medium transition-all ${
                  isMarketplace 
                    ? 'text-black' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {isMarketplace && (
                  <motion.div 
                    className="absolute inset-0 bg-[#F5B056] rounded-full -z-10"
                    layoutId="activeTab"
                    transition={{ type: "spring", duration: 0.6 }}
                  />
                )}
                <Activity className="w-4 h-4 mr-2" />
                PATH Marketplace
              </button>
            </Link>
            <Link href="/NFT/collection" passHref>
              <button 
                className={`relative px-4 py-2 rounded-full flex items-center text-sm font-medium transition-all ${
                  isCollections 
                    ? 'text-black' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {isCollections && (
                  <motion.div 
                    className="absolute inset-0 bg-[#F5B056] rounded-full -z-10"
                    layoutId="activeTab"
                    transition={{ type: "spring", duration: 0.6 }}
                  />
                )}
                <Layers className="w-4 h-4 mr-2" />
                Collections Explorer
              </button>
            </Link>
          </div>
        </div>

        {/* Breadcrumb Navigation */}
        <nav className="flex mb-6 text-sm text-gray-400" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link href="/" className="hover:text-white">
                Home
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <ChevronRight className="w-4 h-4 mx-1" />
                <Link href="/NFT" className="hover:text-white">
                  NFTs
                </Link>
              </div>
            </li>
            {isCollections && (
              <li>
                <div className="flex items-center">
                  <ChevronRight className="w-4 h-4 mx-1" />
                  <span className={pathname === '/NFT/collection' ? 'text-white' : ''}>
                    Collections
                  </span>
                </div>
              </li>
            )}
            {pathname.includes('/NFT/collection/') && pathname !== '/NFT/collection' && (
              <li>
                <div className="flex items-center">
                  <ChevronRight className="w-4 h-4 mx-1" />
                  <span className="text-white">Collection Details</span>
                </div>
              </li>
            )}
          </ol>
        </nav>

        {/* Info Banner */}
        {isMarketplace && (
          <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4 mb-6 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-blue-300 mb-1">About PATH Marketplace</h3>
              <p className="text-sm text-blue-200/80">
                This marketplace is exclusive to CryptoPath ecosystem NFTs. Connect your wallet to start trading PATH NFTs.
                You&apos;ll need PATH tokens for transactions, which you can get from our <Link href="/Faucet" className="underline hover:text-white">Faucet</Link>.
              </p>
            </div>
          </div>
        )}

        {/* Page Title */}
        <h1 className="text-3xl font-bold mb-6 text-center lg:text-left">
          {isMarketplace ? (
            <>PATH NFT <span className="text-[#F5B056]">Marketplace</span></>
          ) : (
            <>NFT <span className="text-[#F5B056]">Collections Explorer</span></>
          )}
        </h1>

        {/* Main Content */}
        <main>{children}</main>
      </div>
    </div>
  );
}
