'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { 
  fetchPopularCollections, 
  fetchUserNFTs,
  fetchTradeHistory,
  fetchPriceHistory
} from '@/lib/api/alchemyNFTApi';
import { useWallet } from '@/components/Faucet/walletcontext';
import ParticlesBackground from '@/components/ParticlesBackground';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import NetworkSelector from '@/components/NFT/NetworkSelector';
import AnimatedNFTCard from '@/components/NFT/AnimatedNFTCard';
import FeaturedSpotlight from '@/components/NFT/FeaturedSpotlight';
import CollectionCard3D from '@/components/NFT/CollectionCard3D';
import FeaturedCollections from '@/components/NFT/FeaturedCollections';
import { useInView } from 'react-intersection-observer';
import { 
  Search, Wallet, TrendingUp, ArrowLeft, FilterX, SlidersHorizontal,
  Filter, ChevronsUpDown, Stars, Grid3X3, List, Info, LineChart,
  TrendingDown, CircleDollarSign, Tag, Hash, Clock, ChevronDown, ChevronUp, Eye,
  FlameIcon, Crown, Sparkles, Zap, Trophy, Check, Verified
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getChainColorTheme, formatCurrency, getNetworkName } from '@/lib/api/chainProviders';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, 
  DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  HoverCard, HoverCardContent, HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";

// Trending collections types
interface TrendingData {
  period: string;
  data: Array<{
    id: string;
    name: string;
    imageUrl: string;
    chain: string;
    floorPrice: string;
    priceChange: number;
    volume: string;
    volumeChange: number;
  }>;
}

export default function NFTCollectionPage() {
  // Core state
  const router = useRouter();
  const searchParams = useSearchParams();
  const { account, connectWallet } = useWallet();
  const { toast } = useToast();
  const { scrollY } = useScroll();
  
  // Collection data state
  const [collections, setCollections] = useState<any[]>([]);
  const [userNFTs, setUserNFTs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('popular');
  const [chainId, setChainId] = useState('0x1'); // Default to Ethereum Mainnet
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [currentInfoCollection, setCurrentInfoCollection] = useState<any>(null);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  
  // UI state
  const [pageTransition, setPageTransition] = useState(false);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
  const [visibleItems, setVisibleItems] = useState(8);
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [showRarityScore, setShowRarityScore] = useState(false);
  const [activeChip, setActiveChip] = useState('all');
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // Market statistics
  const [marketStats, setMarketStats] = useState({
    floorPrice: 0,
    volume24h: 0,
    holders: 0,
    listings: 0,
    items: 0,
  });
  
  // Trending collections
  const [trendingData, setTrendingData] = useState<TrendingData>({
    period: '24h',
    data: []
  });
  const [trendingPeriod, setTrendingPeriod] = useState('24h');
  
  // Virtualization
  const loadMoreRef = useRef(null);
  const { ref, inView } = useInView({
    threshold: 0.1
  });
  
  // Animation and parallax effects
  const headerOpacity = useTransform(scrollY, [0, 100], [1, 0.2]);
  const headerY = useTransform(scrollY, [0, 100], [0, -20]);
  const spotlightScale = useTransform(scrollY, [0, 200], [1, 0.95]);
  
  // Get chain theme for styling
  const chainTheme = getChainColorTheme(chainId);
  
  // Filter collections by applied criteria
  const filteredCollections = collections.filter(collection => {
    // Filter by search query if any
    if (searchQuery) {
      return collection.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    
    // Filter by category chip
    if (activeChip !== 'all') {
      if (activeChip === 'verified' && !collection.verified) return false;
      if (activeChip === 'new' && !collection.isNew) return false;
      if (activeChip === 'trending' && !collection.isTrending) return false;
    }
    
    // Filter by category dropdown
    if (categoryFilter !== 'all' && collection.category) {
      return collection.category.toLowerCase() === categoryFilter.toLowerCase();
    }
    
    // Filter by verified status
    if (onlyVerified && !collection.verified) return false;
    
    // Apply price range filter to floor price
    const floorPrice = parseFloat(collection.floorPrice);
    if (floorPrice < priceRange[0] || floorPrice > priceRange[1]) return false;
    
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
    } else if (sortBy === 'volume-desc') {
      return parseFloat(b.volume24h || '0') - parseFloat(a.volume24h || '0');
    } else if (sortBy === 'listings-desc') {
      return (b.listings || 0) - (a.listings || 0);
    }
    return 0;
  });
  
  // Load more items when scrolling
  useEffect(() => {
    if (inView && !loading) {
      setVisibleItems(prev => Math.min(prev + 8, 
        activeTab === 'popular' ? filteredCollections.length : userNFTs.length
      ));
    }
  }, [inView, loading, filteredCollections.length, userNFTs.length, activeTab]);
  
  // Check network and load initial data
  useEffect(() => {
    const checkNetwork = async () => {
      if (window.ethereum) {
        try {
          const chainId = await window.ethereum.request({
            method: 'eth_chainId',
          });
          setChainId(chainId);
          // Load collections immediately after setting chainId
          loadCollections(chainId);
          // Initial trending data - load for default period
          loadTrendingCollections('24h');
        } catch (error) {
          console.error('Error checking network:', error);
          // If there's an error, still load with default chainId
          loadCollections(chainId);
          loadTrendingCollections('24h');
        }
      } else {
        // If no window.ethereum, load with default chainId
        loadCollections(chainId);
        loadTrendingCollections('24h');
      }
    };
    
    checkNetwork();
  }, []);
  
  // Load user NFTs when account or chain changes
  useEffect(() => {
    if (account && activeTab === 'my-nfts') {
      loadUserNFTs();
    }
  }, [account, activeTab, chainId]);
  
  // Load collection data from API
  const loadCollections = useCallback(async (networkId: string) => {
    setLoading(true);
    try {
      // Set max price for priceRange based on network
      const maxPrice = networkId === '0x1' || networkId === '0xaa36a7' ? 100 : 500;
      setPriceRange([0, maxPrice]);
      
      const data = await fetchPopularCollections(networkId);
      setCollections(data);
      
      // Calculate market stats (in a real app this could come from the API)
      setMarketStats({
        floorPrice: data.reduce((min: number, col: any) => {
          const price = parseFloat(col.floorPrice);
          return price < min && price > 0 ? price : min;
        }, Infinity),
        volume24h: data.reduce((sum: number, col: any) => 
          sum + parseFloat(col.volume24h || '0'), 0),
        holders: Math.floor(Math.random() * 5000) + 2000, // Mock data
        listings: data.reduce((sum: number, col: any) => 
          sum + (col.listings || 0), 0),
        items: data.reduce((sum: number, col: any) => 
          sum + parseInt(col.totalSupply || '0'), 0),
      });
      
      // Generate search suggestions based on collection names
      const suggestions = data.map(col => col.name).slice(0, 5);
      setSearchSuggestions(suggestions);
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
  
  // Load user NFTs
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
  
  // Load trending collections
  const loadTrendingCollections = useCallback(async (period: string) => {
    try {
      // Create placeholder data with empty array if collections not loaded yet
      if (collections.length === 0) {
        // Set mock empty data with period to display the section even when data is loading
        setTrendingData({
          period,
          data: [
            {
              id: 'loading-1',
              name: 'Loading...',
              imageUrl: '/images/placeholder-nft.png',
              chain: chainId,
              floorPrice: '0.00',
              priceChange: 0,
              volume: '0.00',
              volumeChange: 0,
            },
            // Add more placeholder items as needed
          ]
        });
        // Return early - real data will be loaded once collections are available
        return;
      }
      
      // In real app this would fetch real data
      const mockTrendingData = {
        period,
        data: collections.slice(0, 5).map(col => ({
          id: col.id,
          name: col.name,
          imageUrl: col.imageUrl,
          chain: col.chain,
          floorPrice: col.floorPrice,
          priceChange: (Math.random() * 40) - 20, // -20% to +20%
          volume: ((Math.random() * 100) + 10).toFixed(2),
          volumeChange: (Math.random() * 60) - 20, // -20% to +40%
        }))
      };
      setTrendingData(mockTrendingData);
      setTrendingPeriod(period);
    } catch (error) {
      console.error('Error loading trending data:', error);
    }
  }, [collections, chainId]);
  
  useEffect(() => {
    // When collections are loaded, update the trending data
    if (collections.length > 0) {
      loadTrendingCollections(trendingPeriod);
    }
  }, [collections, loadTrendingCollections, trendingPeriod]);
  
  const handleNetworkChange = (networkId: string) => {
    setChainId(networkId);
    loadCollections(networkId);
    setVisibleItems(8); // Reset visible items
    setCategoryFilter('all'); // Reset filters
    setSortBy('featured');
    setActiveChip('all');
    setShowAdvancedFilters(false);
    setOnlyVerified(false);
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery) {
      return;
    }
    
    // Check if it's a contract address
    const isAddress = /^0x[a-fA-F0-9]{40}$/.test(searchQuery);
    
    if (isAddress) {
      setPageTransition(true);
      setTimeout(() => {
        router.push(`/NFT/collection/${searchQuery}?network=${chainId}`);
      }, 300);
    } else {
      // Treat as collection name search
      // Focus on search results section
      window.scrollTo({
        top: document.getElementById('collections-grid')?.offsetTop || 0,
        behavior: 'smooth'
      });
    }
    
    setShowSearchSuggestions(false);
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
  
  const handleTrendingPeriodChange = (period: string) => {
    setTrendingPeriod(period);
    loadTrendingCollections(period);
  };
  
  const handleSearchFocus = () => {
    setShowSearchSuggestions(true);
  };
  
  const handleSearchSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSearchSuggestions(false);
  };
  
  const handlePriceRangeChange = (values: number[]) => {
    setPriceRange([values[0], values[1]]);
  };
  
  // Get unique categories from collections
  const categories = ['all', ...Array.from(
    new Set(collections.map(c => c.category?.toLowerCase() || 'other'))
  )].filter(c => c !== undefined);
  
  // Market stats rendering with animation 
  const renderMarketStats = () => (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {[
        { 
          label: 'Floor Price', 
          value: `${marketStats.floorPrice.toFixed(2)} ${chainId === '0x1' || chainId === '0xaa36a7' ? 'ETH' : 'BNB'}`,
          icon: <Tag className="h-5 w-5" style={{ color: chainTheme.primary }} />,
          change: '+5.2%'
        },
        { 
          label: '24h Volume', 
          value: `${formatCurrency(marketStats.volume24h, chainId, 1)} ${chainId === '0x1' || chainId === '0xaa36a7' ? 'ETH' : 'BNB'}`,
          icon: <CircleDollarSign className="h-5 w-5" style={{ color: chainTheme.primary }} />,
          change: '+12.7%',
          positive: true
        },
        { 
          label: 'Holders', 
          value: marketStats.holders.toLocaleString(),
          icon: <Wallet className="h-5 w-5" style={{ color: chainTheme.primary }} />,
          change: '+0.8%',
          positive: true
        },
        { 
          label: 'Listings', 
          value: marketStats.listings.toLocaleString(),
          icon: <Hash className="h-5 w-5" style={{ color: chainTheme.primary }} />,
          change: '-3.5%',
          positive: false
        },
        { 
          label: 'Total Items', 
          value: marketStats.items.toLocaleString(),
          icon: <Grid3X3 className="h-5 w-5" style={{ color: chainTheme.primary }} />,
          change: '+0.2%',
          positive: true
        }
      ].map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + i * 0.1 }}
          className={`${chainTheme.backgroundClass}/20 rounded-xl p-4 backdrop-blur-sm border ${chainTheme.borderClass}/20`}
        >
          <div className="flex justify-between">
            <div className="text-gray-400 text-sm mb-1 flex items-center gap-1">
              {stat.icon}
              {stat.label}
            </div>
            <Badge 
              variant={stat.positive ? 'default' : 'destructive'} 
              className="text-xs font-semibold"
            >
              {stat.change}
            </Badge>
          </div>
          <div className="text-xl font-semibold" style={{ color: chainTheme.primary }}>
            {stat.value}
          </div>
        </motion.div>
      ))}
    </div>
  );
  
  // Trending collections table
  const renderTrendingCollections = () => (
    <motion.div 
      className={`mt-8 p-5 rounded-xl border ${chainTheme.borderClass} ${chainTheme.backgroundClass}/10 backdrop-blur-sm`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FlameIcon className="h-5 w-5 text-orange-500" />
          <h3 className="text-lg font-semibold">Trending Collections</h3>
        </div>
        
        <div className="flex gap-2">
          {['24h', '7d', '30d'].map((period) => (
            <Button
              key={period}
              variant={trendingPeriod === period ? "secondary" : "ghost"}
              size="sm"
              onClick={() => handleTrendingPeriodChange(period)}
              className={trendingPeriod === period ? `${chainTheme.backgroundClass}` : ""}
            >
              {period}
            </Button>
          ))}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-gray-400 border-b border-gray-800">
              <th className="text-left p-2">#</th>
              <th className="text-left p-2">Collection</th>
              <th className="text-right p-2">Floor Price</th>
              <th className="text-right p-2">Change</th>
              <th className="text-right p-2">Volume</th>
              <th className="text-right p-2">Vol Change</th>
            </tr>
          </thead>
          <tbody>
            {trendingData.data.length > 0 ? (
              trendingData.data.map((item, i) => (
                <motion.tr 
                  key={item.id}
                  whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                  className="cursor-pointer border-b border-gray-800/50"
                  onClick={() => handleCardClick(item.id)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                >
                  <td className="p-2 text-gray-400">{i + 1}</td>
                  <td className="p-2">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 rounded-lg overflow-hidden">
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-medium flex items-center gap-1">
                          {item.name}
                          {(i === 0 || i === 2) && <Verified className="h-3.5 w-3.5 text-blue-400" />}
                        </div>
                        <div className="text-xs text-gray-400">
                          {getNetworkName(item.chain)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-2 text-right font-medium">
                    {item.floorPrice} {item.chain === '0x1' || item.chain === '0xaa36a7' ? 'ETH' : 'BNB'}
                  </td>
                  <td className={`p-2 text-right ${item.priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {item.priceChange >= 0 ? '+' : ''}{item.priceChange.toFixed(2)}%
                  </td>
                  <td className="p-2 text-right font-medium">
                    {item.volume} {item.chain === '0x1' || item.chain === '0xaa36a7' ? 'ETH' : 'BNB'}
                  </td>
                  <td className={`p-2 text-right ${item.volumeChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {item.volumeChange >= 0 ? '+' : ''}{item.volumeChange.toFixed(2)}%
                  </td>
                </motion.tr>
              ))
            ) : (
              <tr className="border-b border-gray-800/50">
                <td colSpan={6} className="p-4 text-center text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-5 w-5 border-2 border-t-transparent animate-spin rounded-full" />
                    <span>Loading trending collections...</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
  
  // Collection rendering
  const renderCollections = () => (
    <div id="collections-grid">
      {/* Collection category chips */}
      <motion.div
        className="flex flex-wrap gap-2 mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {[
          { id: 'all', label: 'All', icon: <Grid3X3 className="h-3.5 w-3.5 mr-1" /> },
          { id: 'verified', label: 'Verified', icon: <Check className="h-3.5 w-3.5 mr-1" /> },
          { id: 'new', label: 'New', icon: <Sparkles className="h-3.5 w-3.5 mr-1" /> },
          { id: 'trending', label: 'Trending', icon: <TrendingUp className="h-3.5 w-3.5 mr-1" /> }
        ].map(chip => (
          <Button
            key={chip.id}
            variant={activeChip === chip.id ? "secondary" : "outline"}
            size="sm"
            onClick={() => setActiveChip(chip.id)}
            className={`rounded-full ${activeChip === chip.id ? `${chainTheme.backgroundClass}` : 'bg-gray-900/50'}`}
          >
            {chip.icon}
            {chip.label}
          </Button>
        ))}
      </motion.div>

      {/* Main collection grid */}
      <motion.div 
        className={viewMode === 'grid' 
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          : "grid grid-cols-1 sm:grid-cols-2 gap-4"
        }
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
      
      {/* Load more indicator */}
      {visibleItems < filteredCollections.length && (
        <div ref={ref} className="flex justify-center mt-8">
          <div className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: `${chainTheme.primary} transparent transparent transparent` }} />
        </div>
      )}
      
      {/* No results message */}
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
              setActiveChip('all');
              setOnlyVerified(false);
              setPriceRange([0, chainId === '0x1' || chainId === '0xaa36a7' ? 100 : 500]);
            }}
            style={{ 
              background: chainTheme.primary,
              color: chainId.includes('0x38') || chainId.includes('0x61') ? 'black' : 'white'
            }}
          >
            Clear Filters
          </Button>
        </motion.div>
      )}
    </div>
  );
  
  // Skeleton loading animation
  const renderSkeletons = () => (
    <div className="space-y-8">
      {/* Market stats skeletons */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
      
      {/* Trending collections skeleton */}
      <Skeleton className="h-60 w-full rounded-xl" />
      
      {/* Collection grid skeletons */}
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
    </div>
  );
  
  // CryptoPath Ecosystem card when on BNB Testnet - Make it EXTRA special!
  const renderEcosystemCard = () => {
    if (chainId !== '0x61') return null;
    
    return (
      <motion.div
        className="mb-8 p-6 rounded-xl border-2 border-yellow-500/30 bg-gradient-to-r from-yellow-950/30 to-black/50 backdrop-blur-xl shadow-lg relative overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {/* Background glow effects */}
        <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-yellow-500/10 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/3 w-40 h-40 rounded-full bg-yellow-500/5 blur-3xl"></div>
        <div className="absolute bottom-10 right-1/4 w-20 h-20 rounded-full bg-yellow-400/10 blur-xl animate-pulse"></div>
        
        {/* Animated stars - Tensor-inspired decoration */}
        <motion.div 
          className="absolute top-8 right-10 text-yellow-400"
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: 'reverse'
          }}
        >
          <Sparkles className="h-6 w-6" />
        </motion.div>
        
        <motion.div 
          className="absolute bottom-10 left-16 text-amber-500"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, -5, 5, 0],
          }}
          transition={{
            duration: 4,
            delay: 1,
            repeat: Infinity,
            repeatType: 'reverse'
          }}
        >
          <Sparkles className="h-5 w-5" />
        </motion.div>
        
        <div className="flex flex-col md:flex-row gap-6 items-center">
          {/* NFT Image with animated container */}
          <motion.div 
            className="relative h-24 w-24 md:h-32 md:w-32 rounded-2xl border-2 border-yellow-500/50 overflow-hidden"
            whileHover={{ scale: 1.05 }}
            animate={{
              boxShadow: ['0 0 10px rgba(240, 185, 11, 0.3)', '0 0 20px rgba(240, 185, 11, 0.5)', '0 0 10px rgba(240, 185, 11, 0.3)']
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: 'reverse'
            }}
          >
            <Image
              src="/Img/logo/cryptopath.png"
              alt="CryptoPath Genesis Collection"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
            
            {/* 'Genesis' label */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-yellow-500/80 text-black text-xs font-bold px-2 py-0.5 rounded-full">
              Genesis
            </div>
          </motion.div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <motion.h2 
                className="text-xl font-bold text-yellow-500"
                animate={{ 
                  textShadow: [
                    '0 0 5px rgba(240, 185, 11, 0.3)', 
                    '0 0 10px rgba(240, 185, 11, 0.5)', 
                    '0 0 5px rgba(240, 185, 11, 0.3)'
                  ] 
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  repeatType: 'reverse'
                }}
              >
                CryptoPath Genesis Collection
              </motion.h2>
              <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                Exclusive
              </Badge>
              <Badge className="bg-yellow-900/30 text-yellow-400 border border-yellow-500/30">
                <Zap className="h-3 w-3 mr-1" /> Official
              </Badge>
            </div>
            
            <p className="text-gray-300 mb-4">
              Be part of the CryptoPath revolution with our limited Genesis NFT collection. Exclusive benefits, governance rights, and early access to new features await the owners!
            </p>
            
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={() => handleCardClick('0x2fF12fE4B3C4DEa244c4BdF682d572A90Df3B551')}
                className="bg-gradient-to-r from-yellow-600 to-amber-500 hover:from-yellow-500 hover:to-amber-400 text-black group"
              >
                <Zap className="mr-2 h-4 w-4 transition-transform group-hover:scale-125" />
                Explore Genesis Collection
                <motion.div 
                  className="absolute inset-0 bg-white/20 rounded-md"
                  initial={{ scale: 0, opacity: 0 }}
                  whileHover={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4 }}
                />
              </Button>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" className="border-yellow-500/30 group">
                      <Info className="mr-2 h-4 w-4 group-hover:text-yellow-400 transition-colors" />
                      Benefits & Perks
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-md bg-black/90 border-yellow-500/20">
                    <p>CryptoPath Genesis NFT holders receive exclusive benefits including reduced fees, governance voting rights, and early access to new features.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <div className="bg-black/40 p-3 rounded-lg border border-yellow-500/20">
              <div className="text-gray-400 text-xs">Floor Price</div>
              <div className="text-xl font-bold text-yellow-500">10 BNB</div>
            </div>
            <div className="bg-black/40 p-3 rounded-lg border border-yellow-500/20">
              <div className="text-gray-400 text-xs">Total Supply</div>
              <div className="text-xl font-bold text-yellow-500">1,000</div>
            </div>
          </div>
        </div>
        
        {/* Progress bar showing minting progress - Tensor-inspired */}
        <div className="mt-5 bg-black/50 rounded-full h-3 overflow-hidden border border-yellow-500/20">
          <motion.div 
            className="h-full bg-gradient-to-r from-yellow-600 to-amber-500"
            style={{ width: '63%' }}
            initial={{ x: -100 }}
            animate={{ x: 0 }}
            transition={{ duration: 1 }}
          />
        </div>
        
        <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
          <span>630 / 1,000 minted</span>
          <span>63% complete</span>
        </div>
      </motion.div>
    );
  };

  return (
    <AnimatePresence>
      <motion.div 
        className="min-h-screen bg-transparent text-white"
        initial={{ opacity: 1 }}
        animate={{ opacity: pageTransition ? 0 : 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <ParticlesBackground />
        
        <div className="container mx-auto p-4 relative z-10">
          <div className="flex flex-col gap-8 mt-20 mb-10">
            {/* Sticky Header */}
            <motion.div
              className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-4 z-30 bg-black/20 backdrop-blur-lg p-4 rounded-xl border border-gray-800/50"
              style={{ opacity: headerOpacity, y: headerY }}
            >
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
                
                {/* Enhanced search with suggestions */}
                <div className="relative flex-1 md:w-80">
                  <form onSubmit={handleSearch} className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type="text"
                      placeholder="Search by name or address..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={handleSearchFocus}
                      onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 100)}
                      className="pl-10 bg-gray-800/50 border-gray-700"
                    />
                    <Button 
                      type="submit" 
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 px-2"
                      style={{ 
                        background: chainTheme.primary,
                        color: chainId.includes('0x38') || chainId.includes('0x61') ? 'black' : 'white'
                      }}
                    >
                      Search
                    </Button>
                  </form>
                  
                  {/* Search suggestions dropdown */}
                  {showSearchSuggestions && searchSuggestions.length > 0 && (
                    <motion.div 
                      className="absolute z-10 mt-1 w-full bg-gray-900 border border-gray-800 rounded-lg shadow-lg overflow-hidden"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {searchSuggestions.map((suggestion, i) => (
                        <div 
                          key={i}
                          className="px-4 py-2 hover:bg-gray-800 cursor-pointer"
                          onClick={() => handleSearchSuggestionClick(suggestion)}
                        >
                          {suggestion}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </div>
                
                {!account && (
                  <Button 
                    onClick={handleConnectWallet} 
                    className={`whitespace-nowrap bg-gradient-to-r ${
                      chainId === '0x61' || chainId === '0x38' 
                        ? 'from-yellow-600 to-amber-500 hover:from-yellow-500 hover:to-amber-400' 
                        : 'from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400'
                    }`}
                  >
                    <Wallet className="mr-2 h-4 w-4" /> Connect Wallet
                  </Button>
                )}
              </div>
            </motion.div>
            
            {/* CryptoPath Ecosystem Special Card - only on BNB Testnet */}
            {renderEcosystemCard()}
            
            {/* Featured Spotlight - Only show on popular tab with no filters */}
            {activeTab === 'popular' && activeChip === 'all' && categoryFilter === 'all' && !searchQuery && (
              <motion.div style={{ scale: spotlightScale }}>
                <FeaturedSpotlight />
              </motion.div>
            )}
            
            {/* Main Content */}
            <div className="flex flex-col gap-6">
              {/* Network Info Banner */}
              <motion.div 
                className={`p-4 rounded-lg ${chainTheme.backgroundClass}/30 border ${chainTheme.borderClass} backdrop-blur-sm`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <h2 className="text-xl font-medium flex items-center gap-2" style={{ color: chainTheme.primary }}>
                  <Image 
                    src={chainId.includes('0x38') || chainId.includes('0x61') 
                      ? '/icons/bnb.svg' 
                      : '/icons/eth.svg'} 
                    alt="Chain"
                    width={20}
                    height={20}
                  />
                  {chainId === '0x1' || chainId === '0xaa36a7' ? 'Ethereum' : 'BNB Chain'} Collections
                </h2>
                <p className="text-gray-300 mt-1">
                  {chainId === '0x61' 
                    ? 'Explore the CryptoPath NFT ecosystem and other collections on BNB Testnet'
                    : chainId === '0x38' 
                    ? 'Browse NFT collections on the BNB Chain mainnet'
                    : 'Discover NFT collections on the Ethereum blockchain'}
                </p>
              </motion.div>
              
              {/* Tab Navigation */}
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
              
              {/* Market Stats */}
              {activeTab === 'popular' && !loading && renderMarketStats()}
              
              {/* Trending Collections Table */}
              {activeTab === 'popular' && !loading && renderTrendingCollections()}
              
              {/* Filter controls for Popular tab */}
              {activeTab === 'popular' && !loading && (
                <motion.div 
                  className="flex flex-col gap-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center">
                        <Filter className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-sm text-gray-400 mr-2">Filter:</span>
                      </div>
                      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-40 bg-gray-800/50 border-gray-700">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent className='bg-gray-800 border-gray-700'>
                          {categories.map(category => (
                            <SelectItem key={category} value={category}>
                              {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center gap-1"
                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                      >
                        <SlidersHorizontal className="h-4 w-4" />
                        Advanced
                        {showAdvancedFilters ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </Button>
                      
                      {getSelectedFilterCount() > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearFilters}
                          className="text-xs text-gray-400"
                        >
                          <FilterX className="h-3.5 w-3.5 mr-1" />
                          Clear ({getSelectedFilterCount()})
                        </Button>
                      )}
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
                        <SelectContent className='bg-gray-800 border-gray-700'>
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
                          <SelectItem value="volume-desc">Volume (High to Low)</SelectItem>
                          <SelectItem value="listings-desc">Most Listings</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon" className="h-9 w-9">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setViewMode('grid')}>
                            <Grid3X3 className="mr-2 h-4 w-4" /> Grid View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setViewMode('compact')}>
                            <List className="mr-2 h-4 w-4" /> Compact View
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setShowRarityScore(!showRarityScore)}>
                            <div className="flex items-center">
                              <Crown className="mr-2 h-4 w-4" /> 
                              Show Rarity
                              <div className="ml-2">
                                <Switch 
                                  checked={showRarityScore} 
                                  onCheckedChange={setShowRarityScore} 
                                />
                              </div>
                            </div>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  
                  {/* Advanced Filters Panel - Tensor-inspired */}
                  <AnimatePresence>
                    {showAdvancedFilters && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className={`p-4 rounded-lg border ${chainTheme.borderClass} bg-black/30 backdrop-blur-sm`}>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-4">
                              <Label className="text-sm text-gray-400">Price Range ({chainId === '0x1' || chainId === '0xaa36a7' ? 'ETH' : 'BNB'})</Label>
                              <div className="px-2">
                                <Slider
                                  defaultValue={[priceRange[0], priceRange[1]]}
                                  max={chainId === '0x1' || chainId === '0xaa36a7' ? 100 : 500}
                                  step={1}
                                  onValueChange={handlePriceRangeChange}
                                />
                                <div className="flex justify-between text-xs text-gray-400 mt-1">
                                  <span>{priceRange[0]}</span>
                                  <span>{priceRange[1]}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="text-sm text-gray-400">Verified Status</Label>
                              <div className="flex items-center space-x-2">
                                <Switch 
                                  id="verified-filter" 
                                  checked={onlyVerified} 
                                  onCheckedChange={setOnlyVerified} 
                                />
                                <Label htmlFor="verified-filter">Show only verified collections</Label>
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              <Button variant="outline" size="sm" onClick={clearFilters}>
                                <FilterX className="mr-2 h-4 w-4" />
                                Reset Filters
                              </Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
              
              {/* Main Content Area */}
              {loading ? (
                renderSkeletons()
              ) : (
                <>
                  {activeTab === 'popular' && renderCollections()}
                  
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
                              color: chainId.includes('0x38') || chainId.includes('0x61') ? 'black' : 'white'
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
                        <>
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
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
  
  // Helper function to count selected filters
  function getSelectedFilterCount() {
    let count = 0;
    if (categoryFilter !== 'all') count++;
    if (activeChip !== 'all') count++;
    if (onlyVerified) count++;
    if (priceRange[0] > 0 || priceRange[1] < 100) count++;
    return count;
  }
  
  // Helper function to clear all filters
  function clearFilters() {
    setCategoryFilter('all');
    setActiveChip('all');
    setOnlyVerified(false);
    setPriceRange([0, 100]);
    setSearchQuery('');
  }
}
