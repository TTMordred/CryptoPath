import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, ExternalLink, Info, Tag, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

// Define type for featured NFT item
interface FeaturedNFT {
  id: string;
  name: string;
  contractAddress: string;
  tokenId: string;
  description: string;
  imageUrl: string;
  chain: string;
  price?: string;
  seller?: string;
  timeLeft?: string;
  collection?: {
    name: string;
    imageUrl: string;
    verified: boolean;
  };
  rarity?: string;
  rarityRank?: number;
}

export default function FeaturedSpotlight() {
  const router = useRouter();
  const { toast } = useToast();
  const [featuredNFTs, setFeaturedNFTs] = useState<FeaturedNFT[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load featured NFTs (in a real app this would come from an API)
  useEffect(() => {
    // Simulating API call with a timeout
    const loadFeaturedNFTs = async () => {
      setIsLoading(true);
      // In a real app, you would fetch this data from your backend
      const mockFeaturedNFTs: FeaturedNFT[] = [
        {
          id: 'featured-1',
          name: 'CryptoPath Genesis #42',
          contractAddress: '0x2fF12fE4B3C4DEa244c4BdF682d572A90Df3B551',
          tokenId: '42',
          description: 'Special edition CryptoPath Genesis NFT with exclusive utility for platform governance.',
          imageUrl: '/Img/nft/sample-1.jpg',
          chain: '0x61', // BNB Testnet
          price: '10 BNB',
          seller: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
          timeLeft: '2 days',
          collection: {
            name: 'CryptoPath Genesis',
            imageUrl: '/Img/logo/cryptopath.png',
            verified: true
          },
          rarity: 'Legendary',
          rarityRank: 1
        },
        {
          id: 'featured-2',
          name: 'Azuki #9605',
          contractAddress: '0xED5AF388653567Af2F388E6224dC7C4b3241C544',
          tokenId: '9605',
          description: 'Azuki starts with a collection of 10,000 avatars that give you membership access to The Garden.',
          imageUrl: '/Img/nft/sample-2.jpg',
          chain: '0x1', // Ethereum Mainnet
          price: '12.3 ETH',
          seller: '0x3bE0271C63cE5ED0B5Fc10D2693f06c96ED78Dc1',
          timeLeft: '5 hours',
          collection: {
            name: 'Azuki',
            imageUrl: 'https://i.seadn.io/gae/H8jOCJuQokNqGBpkBN5wk1oZwO7LM8bNnrHCaekV2nKjnCqw6UB5oaH8XyNeBDj6bA_n1mjejzhFQUP3O1NfjFLHr3FOaeHcTOOT?auto=format&dpr=1&w=1000',
            verified: true
          },
          rarity: 'Epic',
          rarityRank: 245
        },
        {
          id: 'featured-3',
          name: 'Bored Ape Yacht Club #7495',
          contractAddress: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
          tokenId: '7495',
          description: 'The Bored Ape Yacht Club is a collection of 10,000 unique Bored Ape NFTs.',
          imageUrl: '/Img/nft/sample-3.jpg',
          chain: '0x1', // Ethereum Mainnet
          price: '68.5 ETH',
          seller: '0x7Fe37118c2D1DB4A67A0Ee8C8510BB2D7696fD63',
          timeLeft: '12 hours',
          collection: {
            name: 'Bored Ape Yacht Club',
            imageUrl: 'https://i.seadn.io/gae/Ju9CkWtV-1Okvf45wo8UctR-M9He2PjILP0oOvxE89AyiPPGtrR3gysu1Zgy0hjd2xKIgjJJtWIc0ybj4Vd7wv8t3pxDGHoJBzDB?auto=format&dpr=1&w=1000',
            verified: true
          },
          rarity: 'Mythic',
          rarityRank: 123
        }
      ];
      
      // Wait a bit to simulate network latency
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setFeaturedNFTs(mockFeaturedNFTs);
      setIsLoading(false);
    };
    
    loadFeaturedNFTs();
    
    // Auto-rotate featured NFTs every 7 seconds
    const interval = setInterval(() => {
      setCurrentIndex(prevIndex => 
        prevIndex === featuredNFTs.length - 1 ? 0 : prevIndex + 1
      );
    }, 7000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Handle click on a featured NFT
  const handleNFTClick = (nft: FeaturedNFT) => {
    router.push(`/NFT/collection/${nft.contractAddress}?network=${nft.chain}`);
  };
  
  // No items to display
  if (featuredNFTs.length === 0 && !isLoading) {
    return null;
  }
  
  // Current featured NFT
  const currentNFT = featuredNFTs[currentIndex];

  return (
    <div className="relative mb-8">
      {/* Title */}
      <div className="flex items-center mb-4">
        <Sparkles className="mr-2 h-5 w-5 text-yellow-400" />
        <h2 className="text-2xl font-bold text-white">Featured NFTs</h2>
      </div>
      
      {isLoading ? (
        // Loading skeleton
        <div className="h-[400px] rounded-xl bg-black/50 border border-gray-800 animate-pulse backdrop-blur-sm overflow-hidden"></div>
      ) : (
        // Spotlight card
        <motion.div
          key={currentNFT.id}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <div className="relative h-[400px] overflow-hidden rounded-xl border border-gray-800 bg-gradient-to-r from-black/60 to-gray-900/80 backdrop-blur-md">
            {/* Background image with overlay */}
            <div className="absolute inset-0 z-0 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/50 z-10"></div>
              <motion.div 
                initial={{ scale: 1.1 }} 
                animate={{ scale: 1 }} 
                transition={{ duration: 20, repeat: Infinity, repeatType: 'reverse' }}
                className="w-full h-full"
              >
                <Image
                  src={currentNFT.imageUrl}
                  alt={currentNFT.name}
                  fill
                  className="object-cover opacity-40"
                  priority
                />
              </motion.div>
            </div>
            
            {/* NFT Content Grid */}
            <div className="relative z-10 h-full grid grid-cols-1 md:grid-cols-2 p-6 md:p-8">
              {/* Left column - NFT details */}
              <div className="flex flex-col justify-center space-y-6">
                {/* Collection info */}
                <div className="flex items-center space-x-2">
                  <div className="relative h-8 w-8 rounded-full overflow-hidden border-2 border-gray-700">
                    <Image
                      src={currentNFT.collection?.imageUrl || '/Img/logo/cryptopath.png'}
                      alt={currentNFT.collection?.name || 'Collection'}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-300 mr-1">{currentNFT.collection?.name}</span>
                    {currentNFT.collection?.verified && (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-blue-500">
                          <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </motion.div>
                    )}
                  </div>
                </div>
                
                {/* NFT name */}
                <h1 className="text-3xl md:text-4xl font-bold text-white">{currentNFT.name}</h1>
                
                {/* Description */}
                <p className="text-gray-300 line-clamp-3">{currentNFT.description}</p>
                
                {/* Price & details */}
                <div className="flex flex-wrap gap-3">
                  {currentNFT.price && (
                    <div className="flex items-center bg-black/40 rounded-lg px-3 py-2 border border-gray-800">
                      <Tag className="mr-2 h-4 w-4 text-green-400" />
                      <span className="text-white font-semibold">{currentNFT.price}</span>
                    </div>
                  )}
                  
                  {currentNFT.timeLeft && (
                    <div className="flex items-center bg-black/40 rounded-lg px-3 py-2 border border-gray-800">
                      <Clock className="mr-2 h-4 w-4 text-yellow-400" />
                      <span className="text-gray-300">{currentNFT.timeLeft}</span>
                    </div>
                  )}
                  
                  {currentNFT.rarity && (
                    <div className="flex items-center bg-black/40 rounded-lg px-3 py-2 border border-gray-800">
                      <Sparkles className="mr-2 h-4 w-4 text-purple-400" />
                      <span className="text-gray-300">{currentNFT.rarity}</span>
                      {currentNFT.rarityRank && (
                        <span className="ml-1 text-gray-400 text-sm">#{currentNFT.rarityRank}</span>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Buttons */}
                <div className="flex space-x-3 mt-4">
                  <Button
                    onClick={() => handleNFTClick(currentNFT)}
                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-semibold"
                  >
                    View Details
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  
                  <Link href={`https://${currentNFT.chain === '0x1' ? 'etherscan.io' : 'testnet.bscscan.com'}/token/${currentNFT.contractAddress}?a=${currentNFT.tokenId}`} target="_blank">
                    <Button variant="outline" className="border-gray-700 hover:bg-gray-800">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Explorer
                    </Button>
                  </Link>
                </div>
              </div>
              
              {/* Right column - NFT image */}
              <div className="hidden md:flex items-center justify-center p-6">
                <motion.div 
                  className="relative aspect-square w-full max-w-[320px] rounded-xl overflow-hidden border-4 border-gray-800 shadow-2xl"
                  whileHover={{ scale: 1.03, rotate: 1 }}
                  transition={{ duration: 0.3 }}
                  animate={{ 
                    y: [0, 10, 0],
                    boxShadow: [
                      '0 20px 30px rgba(0, 0, 0, 0.3)',
                      '0 25px 40px rgba(0, 0, 0, 0.5)',
                      '0 20px 30px rgba(0, 0, 0, 0.3)'
                    ]
                  }}
                  drag
                  dragConstraints={{
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                  }}
                  dragElastic={0.1}
                >
                  <Image
                    src={currentNFT.imageUrl}
                    alt={currentNFT.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 320px"
                    priority
                  />
                  
                  {/* Rarity badge */}
                  {currentNFT.rarity && (
                    <div className="absolute top-2 right-2">
                      <Badge className={`${currentNFT.rarity === 'Legendary' ? 'bg-yellow-500/80' : currentNFT.rarity === 'Mythic' ? 'bg-purple-500/80' : 'bg-blue-500/80'} text-white font-semibold shadow-md`}>
                        {currentNFT.rarity}
                      </Badge>
                    </div>
                  )}
                </motion.div>
                
                {/* Shadow element */}
                <div className="absolute bottom-12 w-64 h-8 bg-black/40 filter blur-xl rounded-full"></div>
              </div>
            </div>
          </div>
          
          {/* Navigation dots */}
          {featuredNFTs.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {featuredNFTs.map((_, i) => (
                <button
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all ${i === currentIndex ? 'bg-white w-4' : 'bg-gray-500'}`}
                  onClick={() => setCurrentIndex(i)}
                  aria-label={`View featured NFT ${i + 1}`}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
