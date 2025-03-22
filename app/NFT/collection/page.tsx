'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  fetchPopularCollections, 
  fetchUserNFTs 
} from '@/lib/api/alchemyNFTApi';
import { useWallet } from '@/components/Faucet/walletcontext';
import ParticlesBackground from '@/components/ParticlesBackground';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import NetworkSelector from '@/components/NFT/NetworkSelector';
import AnimatedNFTCard from '@/components/NFT/AnimatedNFTCard';
import FeaturedSpotlight from '@/components/NFT/FeaturedSpotlight';
import CollectionCard3D from '@/components/NFT/CollectionCard3D';
import { useInView } from 'react-intersection-observer';
import { 
  Search, 
  Wallet, 
  TrendingUp, 
  ArrowLeft,
  FilterX,
  SlidersHorizontal,
  Filter,
  ChevronsUpDown,
  Stars,
  Grid3X3,
  AwardIcon,
  Info
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getChainColorTheme } from '@/lib/api/chainProviders';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

export default function NFTCollectionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { account, connectWallet } = useWallet();
  const { toast } = useToast();
  
  const [collections, setCollections] = useState<any[]>([]);
  const [userNFTs, setUserNFTs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('popular');
  const [chainId, setChainId] = useState('0x1'); // Default to Ethereum Mainnet
  const [pageTransition, setPageTransition] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [currentInfoCollection, setCurrentInfoCollection] = useState<any>(null);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
  
  // Virtual scrolling
  const [visibleItems, setVisibleItems] = useState(8);
  const loadMoreRef = useRef(null);
  const { ref, inView } = useInView({
    threshold: 0.1
  });
  
  // Get chain theme for styling
  const chainTheme = getChainColorTheme(chainId);
  
  // Load more items when scrolling
  useEffect(() => {
    if (inView && !loading) {
      setVisibleItems(prev => Math.min(prev + 8, 
        activeTab === 'popular' ? filteredCollections.length : userNFTs.length
      ));
    }
  }, [inView, loading, collections.length, userNFTs.length, activeTab]);
  
  // Check network and load initial data
  useEffect(() => {
    const checkNetwork = async () => {
      if (window.ethereum) {
        try {
          const chainId = await window.ethereum.request({
            method: 'eth_chainId',
          });
          setChainId(chainId);
        } catch (error) {
          console.error('Error checking network:', error);
        }
      }
    };
    
    checkNetwork();
    loadCollections(chainId);
  }, []);
  
  // Filter collections by category
  const filteredCollections = collections.filter(collection => {
    // Filter by search query if any
    if (searchQuery) {
      return collection.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    
    // Filter by category
    if (categoryFilter !== 'all' && collection.category) {
      return collection.category.toLowerCase() === categoryFilter.toLowerCase();
    }
    
    return true;
  }).sort((a, b) => {
    // Sort collections
    if (sortBy === 'featured') {
      // Featured first (if available)
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return 0;
    } else if (sortBy === 'name-asc') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'name-desc') {
      return b.name.localeCompare(a.name);
    } else if (sortBy === 'price-asc') {
      return parseFloat(a.floorPrice) - parseFloat(b.floorPrice);
    } else if (sortBy === 'price-desc') {
      return parseFloat(b.floorPrice) - parseFloat(a.floorPrice);
    }
    return 0;
  });
  
  // Load user NFTs when account or chain changes
  useEffect(() => {
    if (account && activeTab === 'my-nfts') {
      loadUserNFTs();
    }
  }, [account, activeTab, chainId]);
  
  const loadCollections = useCallback(async (networkId: string) => {
    setLoading(true);
    try {
      const data = await fetchPopularCollections(networkId);
      setCollections(data);
    } catch (error) {
      console.error('Error loading collections:', error);
      toast({
        title: 'Error',
        description: 'Failed to load collections',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  const loadUserNFTs = useCallback(async () => {
    if (!account) return;
    
    setLoading(true);
    try {
      const response = await fetchUserNFTs(account, chainId);
      
      // Group NFTs by collection
      const grouped = response.ownedNfts.reduce((acc, nft) => {
        const contract = nft.contract.address;
        if (!acc[contract]) {
          acc[contract] = {
            contractAddress: contract,
            name: nft.contract.name || 'Unknown Collection',
            symbol: nft.contract.symbol || '',
            count: 0,
            imageUrl: nft.media[0]?.gateway || '',
            chain: chainId
          };
        }
        acc[contract].count++;
        return acc;
      }, {} as Record<string, any>);
      
      setUserNFTs(Object.values(grouped));
    } catch (error) {
      console.error('Error loading user NFTs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your NFTs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [account, chainId, toast]);
  
  const handleNetworkChange = (networkId: string) => {
    setChainId(networkId);
    loadCollections(networkId);
    setVisibleItems(8); // Reset visible items when changing network
    setCategoryFilter('all'); // Reset category filter
    setSortBy('featured'); // Reset sorting
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    
    const isAddress = /^0x[a-fA-F0-9]{40}$/.test(searchQuery);
    
    if (isAddress) {
      setPageTransition(true);
      setTimeout(() => {
        router.push(`/NFT/collection/${searchQuery}?network=${chainId}`);
      }, 300);
    } else {
      toast({
        title: 'Invalid input',
        description: 'Please enter a valid contract address',
        variant: 'destructive',
      });
    }
  };
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setVisibleItems(8); // Reset on tab change
    if (value === 'my-nfts' && account) {
      loadUserNFTs();
    } else if (value === 'popular') {
      loadCollections(chainId);
    }
  };
  
  const handleConnectWallet = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    connectWallet();
  };
  
  const handleCardClick = (collectionId: string) => {
    setPageTransition(true);
    setTimeout(() => {
      router.push(`/NFT/collection/${collectionId}?network=${chainId}`);
    }, 300);
  };
  
  const handleInfoClick = (collection: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentInfoCollection(collection);
    setIsInfoDialogOpen(true);
  };
  
  // Get unique categories from collections
  const categories = ['all', ...Array.from(
    new Set(collections.map(c => c.category?.toLowerCase() || 'other'))
  )].filter(c => c !== undefined);
  
  const renderSkeletons = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="relative">
          <Skeleton className="h-64 md:h-80 w-full rounded-xl" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <Skeleton className="h-16 w-16 rounded-lg" />
          </div>
          <div className="mt-2 flex flex-col items-center gap-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <AnimatePresence>
      <motion.div 
        className="min-h-screen bg-transparent text-white"
        initial={{ opacity: 1 }}
        animate={{ opacity: pageTransition ? 0 : 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <ParticlesBackground/>
        
        <div className="container mx-auto p-4 relative z-10">
          <div className="flex flex-col gap-8 mt-20 mb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-2">
                <Link href="/NFT">
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </Link>
                <h1 className="text-2xl md:text-3xl font-bold text-white">NFT Collections</h1>
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                <NetworkSelector 
                  selectedNetwork={chainId}
                  onNetworkChange={handleNetworkChange}
                />
                
                <form onSubmit={handleSearch} className="relative flex-1 md:w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search by contract address..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-800/50 border-gray-700"
                  />
                  <Button 
                    type="submit" 
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 px-2"
                    style={{ 
                      background: chainTheme.primary,
                      color: 'black'
                    }}
                  >
                    Search
                  </Button>
                </form>
                
                {!account && (
                  <Button onClick={handleConnectWallet} className="whitespace-nowrap">
                    <Wallet className="mr-2 h-4 w-4" /> Connect Wallet
                  </Button>
                )}
              </div>
            </div>
            
            {/* Featured Spotlight - Only show on popular tab with no filters */}
            {activeTab === 'popular' && categoryFilter === 'all' && !searchQuery && (
              <FeaturedSpotlight />
            )}
            
            <div className="flex flex-col gap-6">
              <div className={`p-4 rounded-lg ${chainTheme.backgroundClass} border ${chainTheme.borderClass}`}>
                <h2 className="text-xl font-semibold mb-2" style={{ color: chainTheme.primary }}>
                  {chainId === '0x1' || chainId === '0xaa36a7' ? 'Ethereum' : 'BNB Chain'} Collections
                </h2>
                <p className="text-gray-300">
                  {chainId === '0x1' || chainId === '0xaa36a7' 
                    ? 'Browse NFT collections on the Ethereum blockchain' 
                    : 'Explore NFT collections on the BNB Chain'}
                </p>
              </div>
            
              <Tabs defaultValue={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList 
                  className="grid w-full md:w-auto grid-cols-2 bg-gray-800/50 rounded-lg p-1 border border-gray-700"
                >
                  <TabsTrigger
                    value="popular"
                    className={`data-[state=active]:${chainTheme.textClass} data-[state=active]:${chainTheme.backgroundClass}`}
                  >
                    <TrendingUp className="mr-2 h-4 w-4" /> Popular Collections
                  </TabsTrigger>
                  <TabsTrigger
                    value="my-nfts"
                    className={`data-[state=active]:${chainTheme.textClass} data-[state=active]:${chainTheme.backgroundClass}`}
                    disabled={!account}
                  >
                    <Wallet className="mr-2 h-4 w-4" /> My NFTs
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              {/* Filter controls for Popular tab */}
              {activeTab === 'popular' && !loading && (
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center">
                      <Filter className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-sm text-gray-400 mr-2">Filter:</span>
                    </div>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-40 bg-gray-800/50 border-gray-700">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>
                            {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center">
                      <ChevronsUpDown className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-sm text-gray-400 mr-2">Sort:</span>
                    </div>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-40 bg-gray-800/50 border-gray-700">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="featured">
                          <div className="flex items-center">
                            <Stars className="h-3.5 w-3.5 mr-2 text-yellow-400" />
                            Featured
                          </div>
                        </SelectItem>
                        <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                        <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                        <SelectItem value="price-asc">Floor Price (Low to High)</SelectItem>
                        <SelectItem value="price-desc">Floor Price (High to Low)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              
              {loading ? (
                renderSkeletons()
              ) : (
                <>
                  {activeTab === 'popular' && (
                    <>
                      <motion.div 
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                        initial="hidden"
                        animate="visible"
                        variants={{
                          visible: {
                            transition: {
                              staggerChildren: 0.05
                            }
                          }
                        }}
                      >
                        {filteredCollections.slice(0, visibleItems).map((collection, index) => (
                          <CollectionCard3D
                            key={collection.id}
                            collection={collection}
                            index={index}
                            onClick={() => handleCardClick(collection.id)}
                          />
                        ))}
                      </motion.div>
                      
                      {visibleItems < filteredCollections.length && (
                        <div ref={ref} className="flex justify-center mt-8">
                          <div className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin"
                              style={{ borderColor: `${chainTheme.primary} transparent transparent transparent` }} />
                        </div>
                      )}
                      
                      {filteredCollections.length === 0 && (
                        <motion.div 
                          className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-gray-700 rounded-xl bg-gray-900/50"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5 }}
                        >
                          <FilterX className="h-12 w-12 text-gray-500 mb-4" />
                          <h3 className="text-xl font-medium text-white mb-2">No collections found</h3>
                          <p className="text-gray-400 mb-4 text-center max-w-md">
                            We couldn't find any collections matching your filters.
                          </p>
                          <Button 
                            onClick={() => {
                              setCategoryFilter('all');
                              setSearchQuery('');
                            }}
                            style={{ 
                              background: chainTheme.primary,
                              color: 'black'
                            }}
                          >
                            Clear Filters
                          </Button>
                        </motion.div>
                      )}
                    </>
                  )}
                  
                  {activeTab === 'my-nfts' && (
                    <>
                      {!account ? (
                        <motion.div 
                          className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-gray-700 rounded-xl bg-gray-900/50"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5 }}
                        >
                          <Wallet className="h-12 w-12 text-gray-500 mb-4" />
                          <h3 className="text-xl font-medium text-white mb-2">Connect your wallet to view your NFTs</h3>
                          <p className="text-gray-400 mb-4 text-center max-w-md">
                            Connect your wallet to view all your NFT collections on {chainId === '0x1' || chainId === '0xaa36a7' ? 'Ethereum' : 'BNB Chain'}.
                          </p>
                          <Button 
                            onClick={handleConnectWallet}
                            style={{ 
                              background: chainTheme.primary,
                              color: 'black'
                            }}
                          >
                            Connect Wallet
                          </Button>
                        </motion.div>
                      ) : userNFTs.length === 0 ? (
                        <motion.div 
                          className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-gray-700 rounded-xl bg-gray-900/50"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5 }}
                        >
                          <FilterX className="h-12 w-12 text-gray-500 mb-4" />
                          <h3 className="text-xl font-medium text-white mb-2">No NFTs found</h3>
                          <p className="text-gray-400 mb-4 text-center max-w-md">
                            We couldn't find any NFTs in your wallet on {chainId === '0x1' || chainId === '0xaa36a7' ? 'Ethereum' : 'BNB Chain'}.
                          </p>
                          <NetworkSelector 
                            selectedNetwork={chainId}
                            onNetworkChange={handleNetworkChange}
                          />
                        </motion.div>
                      ) : (
                        <motion.div 
                          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                          initial="hidden"
                          animate="visible"
                          variants={{
                            visible: {
                              transition: {
                                staggerChildren: 0.05
                              }
                            }
                          }}
                        >
                          {userNFTs.slice(0, visibleItems).map((collection, index) => (
                            <AnimatedNFTCard
                              key={collection.contractAddress}
                              nft={{
                                id: collection.contractAddress,
                                tokenId: '0',
                                name: collection.name,
                                description: `Your NFT collection with ${collection.count} items`,
                                imageUrl: collection.imageUrl,
                                chain: chainId,
                                attributes: [
                                  { trait_type: 'Owned', value: collection.count.toString() },
                                  { trait_type: 'Symbol', value: collection.symbol || 'N/A' }
                                ]
                              }}
                              onClick={() => handleCardClick(collection.contractAddress)}
                              index={index}
                            />
                          ))}
                        </motion.div>
                      )}
                      
                      {userNFTs.length > 0 && visibleItems < userNFTs.length && (
                        <div ref={ref} className="flex justify-center mt-8">
                          <div className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin"
                              style={{ borderColor: `${chainTheme.primary} transparent transparent transparent` }} />
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
