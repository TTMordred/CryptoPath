import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, ExternalLink, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getChainColorTheme } from '@/lib/api/chainProviders';

interface NFTSpotlight {
  id: string;
  name: string;
  description: string;
  image: string;
  chain: string;
  contractAddress: string;
  artist?: string;
}

const spotlights: NFTSpotlight[] = [
  {
    id: 'cryptopath-genesis',
    name: 'CryptoPath Genesis Collection',
    description: 'Be part of the CryptoPath revolution with our limited Genesis NFT collection. Exclusive benefits, governance rights, and early access to new features await the owners!',
    image: '/images/cryptopath-genesis-hero.png', // Replace with actual path
    chain: '0x61', // BNB Testnet
    contractAddress: '0x2fF12fE4B3C4DEa244c4BdF682d572A90Df3B551',
    artist: 'CryptoPath Team'
  },
  {
    id: 'pancake-squad',
    name: 'Pancake Squad',
    description: 'A collection of 10,000 unique, cute, and sometimes fierce PancakeSwap bunny NFTs that serve as your membership to the Pancake Squad.',
    image: 'https://assets.pancakeswap.finance/pancakeSquad/header.png',
    chain: '0x38', // BNB Chain
    contractAddress: '0xdcbcf766dcd33a7a8abe6b01a8b0e44a006c4ac1',
    artist: 'PancakeSwap'
  },
  {
    id: 'bayc',
    name: 'Bored Ape Yacht Club',
    description: 'The Bored Ape Yacht Club is a collection of 10,000 unique Bored Ape NFTs, unique digital collectibles living on the Ethereum blockchain.',
    image: 'https://i.seadn.io/gae/Ju9CkWtV-1Okvf45wo8UctR-M9He2PjILP0oOvxE89AyiPPGtrR3gysu1Zgy0hjd2xKIgjJJtWIc0ybj4Vd7wv8t3pxDGHoJBzDB?auto=format&dpr=1&w=1000',
    chain: '0x1', // Ethereum
    contractAddress: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
    artist: 'Yuga Labs'
  }
];

export default function FeaturedSpotlight() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const spotlight = spotlights[currentIndex];
  const chainTheme = getChainColorTheme(spotlight.chain);
  
  // Auto-rotate spotlights
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (!isAnimating) {
        setIsAnimating(true);
        setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % spotlights.length);
          setIsAnimating(false);
        }, 500);
      }
    }, 8000);
    
    return () => clearInterval(intervalId);
  }, [isAnimating]);
  
  // Network name mapping
  const getNetworkName = (chainId: string) => {
    const networks: Record<string, string> = {
      '0x1': 'Ethereum',
      '0xaa36a7': 'Sepolia',
      '0x38': 'BNB Chain',
      '0x61': 'BNB Testnet'
    };
    return networks[chainId] || 'Unknown Network';
  };
  
  const handleNext = () => {
    if (!isAnimating) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % spotlights.length);
        setIsAnimating(false);
      }, 500);
    }
  };

  return (
    <div className="relative w-full h-[500px] rounded-2xl overflow-hidden mb-12">
      {/* Background blur gradient */}
      <div 
        className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/60 z-10"
        style={{
          background: `linear-gradient(45deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 50%, ${chainTheme.primary}15 100%)`
        }}
      />
      
      {/* Featured image */}
      <AnimatePresence mode="wait">
        <motion.div
          key={spotlight.id}
          className="absolute inset-0 w-full h-full"
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <Image
            src={spotlight.image}
            alt={spotlight.name}
            fill
            className="object-cover"
            priority
          />
        </motion.div>
      </AnimatePresence>
      
      {/* Content overlay */}
      <div className="absolute inset-0 z-20 flex items-center">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={spotlight.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {/* Network Badge */}
                <Badge 
                  className={`mb-4 py-1 px-3 ${chainTheme.backgroundClass}`}
                  style={{ color: chainTheme.primary }}
                >
                  <div className="flex items-center gap-2">
                    <Image 
                      src={spotlight.chain.includes('0x38') || spotlight.chain.includes('0x61') 
                        ? '/icons/bnb.svg' 
                        : '/icons/eth.svg'} 
                      alt="Chain"
                      width={14}
                      height={14}
                    />
                    {getNetworkName(spotlight.chain)}
                  </div>
                </Badge>
                
                {/* Title with sparkle effect */}
                <div className="mb-4 relative">
                  <h1 className="text-4xl md:text-5xl font-bold text-white">
                    {spotlight.name}
                  </h1>
                  <motion.div
                    className="absolute -top-6 -left-6 text-yellow-400"
                    animate={{
                      rotate: [0, 20, -20, 0],
                      scale: [1, 1.2, 1],
                      opacity: [0.7, 1, 0.7]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                  >
                    <Sparkles className="h-8 w-8" />
                  </motion.div>
                </div>
                
                {/* Artist */}
                {spotlight.artist && (
                  <div className="mb-4">
                    <span className="text-gray-400">by </span>
                    <span className="text-white font-medium">{spotlight.artist}</span>
                  </div>
                )}
                
                {/* Description */}
                <p className="text-gray-300 text-lg mb-8 line-clamp-3">
                  {spotlight.description}
                </p>
                
                {/* CTA Buttons */}
                <div className="flex flex-wrap gap-4">
                  <Link href={`/NFT/collection/${spotlight.contractAddress}?network=${spotlight.chain}`}>
                    <Button 
                      className="group" 
                      style={{ 
                        background: chainTheme.primary,
                        color: spotlight.chain.includes('0x38') || spotlight.chain.includes('0x61') ? 'black' : 'white'
                      }}
                    >
                      Explore Collection
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  
                  <Button variant="outline" className="bg-black/40 backdrop-blur-sm">
                    Learn More <Zap className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      {/* Navigation dots */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30 flex gap-2">
        {spotlights.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              index === currentIndex 
                ? `w-8 ${chainTheme.backgroundClass}` 
                : 'bg-white/30 hover:bg-white/50'
            }`}
            aria-label={`View spotlight ${index + 1}`}
          />
        ))}
      </div>
      
      {/* Next button */}
      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 z-30 bg-black/30 backdrop-blur-sm text-white p-3 rounded-full hover:bg-black/50 transition-all"
        aria-label="Next spotlight"
      >
        <ArrowRight className="h-6 w-6" />
      </button>
    </div>
  );
}
