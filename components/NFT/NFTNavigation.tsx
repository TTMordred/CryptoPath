import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, BadgePercent, Grid3X3, Wallet, ExternalLink, Search, ShoppingBag, Tag, BarChart2 } from 'lucide-react';
import { useWallet } from '@/components/Faucet/walletcontext';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

interface NavCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  color: string;
  delay: number;
  isActive?: boolean;
  image?: string;
}

const NavCard = ({ icon, title, description, href, color, delay, isActive, image }: NavCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="h-full"
  >
    <Link href={href}>
      <Card className={`h-full overflow-hidden transition-transform duration-300 hover:shadow-xl hover:-translate-y-1 ${isActive ? 'ring-2 ring-blue-500' : ''} border ${color}`}>
        {image && (
          <div className="w-full h-40 overflow-hidden relative">
            <img 
              src={image} 
              alt={title} 
              className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
            />
            <div className={`absolute inset-0 bg-gradient-to-b ${color.replace('border', 'from')}/10 to-black/40`}></div>
          </div>
        )}
        <CardContent className="p-6">
          <div className={`mb-4 p-3 rounded-lg inline-flex ${color.replace('border', 'bg')}/10`}>
            {icon}
          </div>
          <h3 className="text-xl font-semibold mb-2">{title}</h3>
          <p className="text-gray-400 mb-6">{description}</p>
          <div className="flex items-center text-blue-500">
            <span className="mr-2">Explore</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </CardContent>
      </Card>
    </Link>
  </motion.div>
);

interface NFTNavigationProps {
  activeSection: 'marketplace' | 'collections';
  pathBalance: string;
  hasWallet: boolean;
}

export default function NFTNavigation({ 
  activeSection, 
  pathBalance, 
  hasWallet 
}: NFTNavigationProps) {
  const router = useRouter();
  const { connectWallet, account } = useWallet();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSectionMenu, setShowSectionMenu] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    if (activeSection === 'marketplace') {
      router.push(`/NFT?search=${encodeURIComponent(searchQuery)}`);
    } else {
      if (/^0x[a-fA-F0-9]{40}$/.test(searchQuery)) {
        router.push(`/NFT/collection/${searchQuery}`);
      } else {
        router.push(`/NFT/collection?search=${encodeURIComponent(searchQuery)}`);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation Bar */}
      <Card className="border border-gray-800 bg-black/40 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Section Tabs */}
            <div className="flex flex-1 space-x-1">
              <div className="relative group">
                <Link
                  href="/NFT"
                  className={`px-6 py-2 rounded-lg font-medium text-center flex items-center ${
                    activeSection === 'marketplace'
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
                      : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                  }`}
                >
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Marketplace
                </Link>
                {activeSection === 'marketplace' && (
                  <div className="absolute -bottom-1 left-0 right-0 h-[3px] bg-orange-400 rounded-full"></div>
                )}

                {/* Marketplace Dropdown */}
                <div className="absolute left-0 right-0 mt-1 pt-2 hidden group-hover:block z-10">
                  <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-800 rounded-lg shadow-xl p-2 space-y-1">
                    <Link 
                      href="/NFT" 
                      className="block px-3 py-2 rounded-md hover:bg-gray-800 text-sm flex items-center"
                    >
                      <Tag className="mr-2 h-4 w-4 text-orange-400" />
                      PATH NFT Market
                    </Link>
                    <Link 
                      href="/NFT?tab=owned"
                      className="block px-3 py-2 rounded-md hover:bg-gray-800 text-sm flex items-center"
                    >
                      <Wallet className="mr-2 h-4 w-4 text-orange-400" />
                      My NFTs
                    </Link>
                    <Link 
                      href="/NFT?tab=listings"
                      className="block px-3 py-2 rounded-md hover:bg-gray-800 text-sm flex items-center"
                    >
                      <BarChart2 className="mr-2 h-4 w-4 text-orange-400" />
                      My Listings
                    </Link>
                  </div>
                </div>
              </div>

              <div className="relative group">
                <Link
                  href="/NFT/collection"
                  className={`px-6 py-2 rounded-lg font-medium text-center flex items-center ${
                    activeSection === 'collections'
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
                      : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                  }`}
                >
                  <Grid3X3 className="mr-2 h-4 w-4" />
                  Collections
                </Link>
                {activeSection === 'collections' && (
                  <div className="absolute -bottom-1 left-0 right-0 h-[3px] bg-orange-400 rounded-full"></div>
                )}

                {/* Collections Dropdown */}
                <div className="absolute left-0 right-0 mt-1 pt-2 hidden group-hover:block z-10">
                  <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-800 rounded-lg shadow-xl p-2 space-y-1">
                    <Link 
                      href="/NFT/collection" 
                      className="block px-3 py-2 rounded-md hover:bg-gray-800 text-sm flex items-center"
                    >
                      <BarChart2 className="mr-2 h-4 w-4 text-orange-400" />
                      Popular Collections
                    </Link>
                    <Link 
                      href="/NFT/collection?tab=my-nfts"
                      className="block px-3 py-2 rounded-md hover:bg-gray-800 text-sm flex items-center"
                    >
                      <Wallet className="mr-2 h-4 w-4 text-orange-400" />
                      My Collections
                    </Link>
                    <div className="py-1 px-3">
                      <div className="border-t border-gray-800 my-1"></div>
                    </div>
                    <Link 
                      href="/NFT/collection?category=art"
                      className="block px-3 py-2 rounded-md hover:bg-gray-800 text-sm flex items-center"
                    >
                      <Badge variant="outline" className="mr-2">Art</Badge>
                      Art Collections
                    </Link>
                    <Link 
                      href="/NFT/collection?category=gaming"
                      className="block px-3 py-2 rounded-md hover:bg-gray-800 text-sm flex items-center"
                    >
                      <Badge variant="outline" className="mr-2">Gaming</Badge>
                      Gaming Collections
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder={activeSection === 'marketplace' 
                    ? "Search NFTs by name, ID..." 
                    : "Search collections or enter address..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-800/50 border-gray-700 w-full"
                />
              </div>
              <Button type="submit">Search</Button>
            </form>

            {/* Wallet Section */}
            <div className="flex items-center gap-4">
              {hasWallet && (
                <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700">
                  <span className="text-orange-500 font-mono font-medium">
                    {pathBalance}
                  </span>
                  <span className="text-white font-medium">PATH</span>
                </div>
              )}
              
              <Button
                onClick={() => {
                  if (!hasWallet) {
                    connectWallet();
                  }
                }}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
              >
                {hasWallet ? (
                  <span className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    {account?.substring(0, 6)}...{account?.substring(account.length - 4)}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Connect Wallet
                  </span>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Filters */}
      {activeSection === 'marketplace' ? (
        <div className="flex items-center overflow-x-auto gap-2 py-2 px-2 bg-gray-900/50 backdrop-blur-sm rounded-lg border border-gray-800">
          <Badge className="bg-orange-500 hover:bg-orange-600">All NFTs</Badge>
          <Badge variant="outline" className="hover:bg-gray-800 cursor-pointer">Art</Badge>
          <Badge variant="outline" className="hover:bg-gray-800 cursor-pointer">Collectibles</Badge>
          <Badge variant="outline" className="hover:bg-gray-800 cursor-pointer">Gaming</Badge>
          <Badge variant="outline" className="hover:bg-gray-800 cursor-pointer">Membership</Badge>
          <Badge variant="outline" className="hover:bg-gray-800 cursor-pointer">Virtual Land</Badge>
          <Badge variant="outline" className="hover:bg-gray-800 cursor-pointer">Music</Badge>
          <Badge variant="outline" className="hover:bg-gray-800 cursor-pointer">Photography</Badge>
          <Badge variant="outline" className="hover:bg-gray-800 cursor-pointer">Sports</Badge>
          <Badge variant="outline" className="hover:bg-gray-800 cursor-pointer">Utility</Badge>
        </div>
      ) : (
        <div className="flex items-center overflow-x-auto gap-2 py-2 px-2 bg-gray-900/50 backdrop-blur-sm rounded-lg border border-gray-800">
          <Badge className="bg-orange-500 hover:bg-orange-600">All Collections</Badge>
          <Badge variant="outline" className="hover:bg-gray-800 cursor-pointer">Verified</Badge>
          <Badge variant="outline" className="hover:bg-gray-800 cursor-pointer">Art</Badge>
          <Badge variant="outline" className="hover:bg-gray-800 cursor-pointer">Gaming</Badge>
          <Badge variant="outline" className="hover:bg-gray-800 cursor-pointer">PFP</Badge>
          <Badge variant="outline" className="hover:bg-gray-800 cursor-pointer">Photography</Badge>
          <Badge variant="outline" className="hover:bg-gray-800 cursor-pointer">Music</Badge>
          <Badge variant="outline" className="hover:bg-gray-800 cursor-pointer">Metaverse</Badge>
        </div>
      )}

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <NavCard
          icon={<BadgePercent className="h-6 w-6 text-blue-500" />}
          title="PATH NFT Marketplace"
          description="Buy, sell, and create NFTs on the PATH token ecosystem. List your digital assets and trade with other users."
          href="/NFT"
          color="border-blue-500/30"
          delay={0.1}
          isActive={activeSection === 'marketplace'}
          image="/Img/Web3.webp"
        />
        
        <NavCard
          icon={<Grid3X3 className="h-6 w-6 text-purple-500" />}
          title="NFT Collection Scanner"
          description="Explore NFT collections across all EVM-based blockchains. Browse popular collections or connect your wallet to view your own NFTs."
          href="/NFT/collection"
          color="border-purple-500/30"
          delay={0.2}
          isActive={activeSection === 'collections'}
          image="/Img/Web3.webp"
        />
      </div>

      {/* Tutorial Section */}
      <div className="bg-gray-800/30 rounded-lg p-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-medium text-white">New to NFTs?</h3>
            <p className="text-gray-400">Learn how to connect your wallet and explore the world of NFTs</p>
          </div>
          <Button variant="outline" className="border-blue-500/50 text-blue-400">
            <ExternalLink className="mr-2 h-4 w-4" />
            View Tutorial
          </Button>
        </div>
      </div>
    </div>
  );
}
