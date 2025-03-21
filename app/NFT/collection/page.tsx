
'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  fetchPopularCollections, 
  fetchUserNFTs 
} from '@/lib/api/alchemyNFTApi';
import { useWallet } from '@/components/Faucet/walletcontext';
import ParticlesBackground from '@/components/ParticlesBackground';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Wallet, 
  TrendingUp, 
  ArrowLeft,
  ExternalLink,
  Grid,
  Info
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';


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
  
  const supportedChains = [
    { id: '0x1', name: 'Ethereum', icon: '/icons/eth.svg' },
    { id: '0x89', name: 'Polygon', icon: '/icons/matic.svg' },
    { id: '0xa', name: 'Optimism', icon: '/icons/op.svg' },
    { id: '0xa4b1', name: 'Arbitrum', icon: '/icons/arb.svg' },
    { id: '0x38', name: 'BSC', icon: '/icons/bnb.svg' },
  ];
  
  // Check network and load initial data
  useEffect(() => {
    const checkNetwork = async () => {
      if (window.ethereum) {
        try {
          const chainId = await window.ethereum.request({
            method: 'eth_chainId',
          });
          if (Object.keys(supportedChains).includes(chainId)) {
            setChainId(chainId);
          }
        } catch (error) {
          console.error('Error checking network:', error);
        }
      }
    };
    
    checkNetwork();
    loadPopularCollections();
  }, []);
  
  // Load user NFTs when account changes
  useEffect(() => {
    if (account && activeTab === 'my-nfts') {
      loadUserNFTs();
    }
  }, [account, activeTab, chainId]);
  
  const loadPopularCollections = async () => {
    setLoading(true);
    try {
      const data = await fetchPopularCollections(chainId);
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
  };
  
  const loadUserNFTs = async () => {
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
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    
    const isAddress = /^0x[a-fA-F0-9]{40}$/.test(searchQuery);
    
    if (isAddress) {
      router.push(`/NFT/collection/${searchQuery}`);
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
    if (value === 'my-nfts' && account) {
      loadUserNFTs();
    } else if (value === 'popular') {
      loadPopularCollections();
    }
  };
  
  const handleConnectWallet = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    connectWallet();
  };
  
  const renderCollectionCard = (collection: any) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border border-gray-800 bg-black/40">
      <Link href={`/NFT/collection/${collection.id || collection.contractAddress}`}>
        <div className="aspect-square relative">
          {collection.imageUrl ? (
            <Image
              src={collection.imageUrl}
              alt={collection.name}
              fill
              className="object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.classList.add('bg-gray-800', 'flex', 'items-center', 'justify-center');
                const icon = document.createElement('div');
                icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
                target.parentElement!.appendChild(icon);
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-800">
              <Info className="h-12 w-12 text-gray-400" />
            </div>
          )}
        </div>
      </Link>
      <CardContent className="p-4">
        <Link href={`/NFT/collection/${collection.id || collection.contractAddress}`}>
          <h3 className="font-medium text-lg text-white truncate">{collection.name}</h3>
        </Link>
        {collection.floorPrice && (
          <p className="text-sm text-gray-400">
            Floor: {collection.floorPrice} ETH
          </p>
        )}
        {collection.count && (
          <p className="text-sm text-gray-400">
            Owned: {collection.count}
          </p>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-gray-800 hover:bg-gray-700">
            {collection.totalSupply ? `${collection.totalSupply} items` : 'View Collection'}
          </Badge>
        </div>
        <Link 
          href={`https://etherscan.io/address/${collection.id || collection.contractAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="h-4 w-4" />
        </Link>
      </CardFooter>
    </Card>
  );
  
  return (
    <div className="min-h-screen bg-transparent text-white">
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
            
            <div className="flex items-center gap-4 w-full md:w-auto">
              <form onSubmit={handleSearch} className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search by contract address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-800/50 border-gray-700"
                />
                <Button type="submit" className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 px-2">
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
          
          <div className="flex flex-col gap-6">
            <Tabs defaultValue={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full md:w-auto grid-cols-2 bg-gray-800/50 rounded-lg p-1">
                <TabsTrigger
                  value="popular"
                  className="data-[state=active]:bg-orange-500"
                >
                  <TrendingUp className="mr-2 h-4 w-4" /> Popular Collections
                </TabsTrigger>
                <TabsTrigger
                  value="my-nfts"
                  className="data-[state=active]:bg-orange-500"
                  disabled={!account}
                >
                  <Wallet className="mr-2 h-4 w-4" /> My NFTs
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="overflow-hidden border border-gray-800 bg-black/40">
                    <Skeleton className="aspect-square w-full" />
                    <CardContent className="p-4">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                    <CardFooter className="p-4 pt-0">
                      <Skeleton className="h-8 w-full" />
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <>
                {activeTab === 'popular' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {collections.map((collection) => (
                      <div key={collection.id} className="animate-fade-in-up">
                        {renderCollectionCard(collection)}
                      </div>
                    ))}
                  </div>
                )}
                
                {activeTab === 'my-nfts' && (
                  <>
                    {!account ? (
                      <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-gray-700 rounded-xl bg-gray-900/50">
                        <Wallet className="h-12 w-12 text-gray-500 mb-4" />
                        <h3 className="text-xl font-medium text-white mb-2">Connect your wallet to view your NFTs</h3>
                        <p className="text-gray-400 mb-4 text-center max-w-md">
                          Connect your wallet to view all your NFT collections across different blockchains.
                        </p>
                        <Button onClick={handleConnectWallet}>
                          Connect Wallet
                        </Button>
                      </div>
                    ) : userNFTs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-gray-700 rounded-xl bg-gray-900/50">
                        <Info className="h-12 w-12 text-gray-500 mb-4" />
                        <h3 className="text-xl font-medium text-white mb-2">No NFTs found</h3>
                        <p className="text-gray-400 mb-4 text-center max-w-md">
                          We couldn't find any NFTs in your wallet. If you believe this is an error, try switching networks.
                        </p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {supportedChains.map((chain) => (
                            <Button
                              key={chain.id}
                              variant={chainId === chain.id ? "secondary" : "outline"}
                              className="flex items-center gap-2"
                              onClick={() => setChainId(chain.id)}
                            >
                              <Image src={chain.icon} alt={chain.name} width={16} height={16} />
                              {chain.name}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {userNFTs.map((collection) => (
                          <div key={collection.contractAddress} className="animate-fade-in-up">
                            {renderCollectionCard(collection)}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
