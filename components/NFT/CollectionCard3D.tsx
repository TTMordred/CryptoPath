import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Sparkles, Verified, Users, ExternalLink, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getChainColorTheme } from '@/lib/api/chainProviders';

interface CollectionCardProps {
  collection: {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    bannerImageUrl?: string;
    floorPrice: string;
    totalSupply: string;
    chain: string;
    verified?: boolean;
    category?: string;
  };
  index: number;
  onClick?: () => void;
}

export default function CollectionCard3D({ collection, index, onClick }: CollectionCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  
  // Chain theme colors
  const chainTheme = getChainColorTheme(collection.chain);
  
  // 3D card effect values
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Smooth springs for more natural motion
  const rotateX = useSpring(useTransform(y, [-100, 100], [5, -5]), {
    stiffness: 150,
    damping: 15
  });
  const rotateY = useSpring(useTransform(x, [-100, 100], [-5, 5]), {
    stiffness: 150, 
    damping: 15
  });
  
  // Shine effect
  const shineOpacity = useMotionValue(0);
  const shineX = useTransform(x, [-100, 100], [0, 1]);
  const shineY = useTransform(y, [-100, 100], [0, 1]);
  
  // Update shine opacity based on mouse position
  const updateShine = (latestX: number, latestY: number) => {
    shineOpacity.set(Math.min((Math.abs(latestX) + Math.abs(latestY)) / 300, 0.3));
  };
  
  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const newX = e.clientX - centerX;
      const newY = e.clientY - centerY;
      x.set(newX);
      y.set(newY);
      updateShine(newX, newY);
    }
  }
  
  function handleMouseLeave() {
    x.set(0);
    y.set(0);
    shineOpacity.set(0);
  }
  
  const cardVariants = {
    hidden: { 
      opacity: 0,
      y: 20,
      scale: 0.95,
    },
    visible: { 
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        delay: index * 0.08, // Stagger effect
        ease: [0.2, 0.65, 0.3, 0.9],
      }
    },
    hover: {
      y: -5,
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    }
  };
  
  // Shimmer animation for placeholder
  const shimmer = {
    hidden: {
      backgroundPosition: '200% 0',
    },
    animate: {
      backgroundPosition: '-200% 0',
      transition: {
        repeat: Infinity,
        duration: 1.5,
        ease: "linear",
      },
    },
  };
  
  // Get network name
  const getNetworkName = () => {
    const networks: Record<string, string> = {
      '0x1': 'Ethereum',
      '0xaa36a7': 'Sepolia',
      '0x38': 'BNB Chain',
      '0x61': 'BNB Testnet'
    };
    return networks[collection.chain] || 'Unknown Network';
  };

  return (
    <motion.div
      ref={cardRef}
      className="w-full"
      style={{ perspective: 1000 }}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => setIsHovered(true)}
      onMouseOut={() => setIsHovered(false)}
      onClick={onClick}
    >
      <motion.div
        className={`w-full h-full overflow-hidden rounded-xl border ${chainTheme.borderClass} bg-black/60 backdrop-blur-sm shadow-xl transition-shadow duration-300`}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
          boxShadow: isHovered ? `0 10px 30px -5px ${chainTheme.primary}30` : '0 10px 30px -15px rgba(0,0,0,0.3)',
        }}
      >
        {/* Shine overlay */}
        <motion.div 
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
          style={{ 
            background: `linear-gradient(45deg, transparent, ${chainTheme.primary}40, transparent)`,
            opacity: shineOpacity,
            backgroundPosition: useTransform(
              x, 
              [-100, 100], 
              ["0% 50%", "100% 50%"]
            ) 
          }}
        />
        
        {/* Banner Image */}
        <div className="relative h-32 w-full overflow-hidden">
          {!imgLoaded && (
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-black/60 via-gray-800/40 to-black/60 background-animate"
              variants={shimmer}
              initial="hidden"
              animate="animate"
            />
          )}
          
          {collection.bannerImageUrl ? (
            <Image 
              src={collection.bannerImageUrl} 
              alt={`${collection.name} banner`}
              fill
              className="object-cover transition-transform duration-1000"
              style={{ 
                transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                opacity: imgLoaded ? 1 : 0,
              }}
              onLoad={() => setImgLoaded(true)}
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900" />
          )}
          
          {/* Network Badge - Top right */}
          <div className="absolute top-2 right-2 z-20">
            <Badge 
              className={`py-1 px-2 ${chainTheme.backgroundClass} border ${chainTheme.borderClass}`} 
              style={{ color: chainTheme.primary }}
            >
              <div className="flex items-center gap-1 text-xs">
                <Image 
                  src={collection.chain.includes('0x38') || collection.chain.includes('0x61') 
                    ? '/icons/bnb.svg' 
                    : '/icons/eth.svg'} 
                  alt="Chain"
                  width={10}
                  height={10}
                />
                {getNetworkName()}
              </div>
            </Badge>
          </div>
        </div>

        {/* Collection Logo - Positioned absolutely relative to the card */}
        <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-[999]" style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.5))" }}>
          <motion.div
            className={`h-20 w-20 rounded-xl overflow-hidden border-4 ${chainTheme.borderClass} shadow-lg`}
            style={{ background: chainTheme.primary + '20' }}
            whileHover={{ rotate: [0, -5, 5, 0], transition: { duration: 0.5 } }}
          >
            <Image
              src={collection.imageUrl}
              alt={collection.name}
              fill
              className="object-cover"
              priority
            />
          </motion.div>
        </div>
        
        {/* Content Area with Padding for Logo */}
        <div className="pt-12 px-4 pb-4">
          {/* Collection Name and Verified Badge */}
          <div className="text-center mb-2">
            <h3 className="text-lg font-bold line-clamp-1 flex items-center justify-center gap-1">
              {collection.name}
              {collection.verified && (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Verified className="h-4 w-4 text-blue-400" />
                </motion.div>
              )}
            </h3>
            {collection.category && (
              <div className="flex justify-center">
                <Badge variant="outline" className="text-xs bg-black/30">
                  {collection.category}
                </Badge>
              </div>
            )}
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className={`rounded-lg p-2 ${chainTheme.backgroundClass}/30 backdrop-blur-sm text-center`}>
              <p className="text-xs text-gray-400">Floor Price</p>
              <p className="text-sm font-semibold" style={{ color: chainTheme.primary }}>
                {collection.floorPrice} {collection.chain.includes('0x38') || collection.chain.includes('0x61') ? 'BNB' : 'ETH'}
              </p>
            </div>
            <div className={`rounded-lg p-2 ${chainTheme.backgroundClass}/30 backdrop-blur-sm text-center`}>
              <p className="text-xs text-gray-400">Items</p>
              <p className="text-sm font-semibold" style={{ color: chainTheme.primary }}>
                {collection.totalSupply}
              </p>
            </div>
          </div>
          
          {/* Description */}
          <p className="text-sm text-gray-400 line-clamp-2 mb-4 text-center">
            {collection.description}
          </p>
          
          {/* View Collection Link */}
          <Link 
            href={`/NFT/collection/${collection.id}?network=${collection.chain}`}
            className={`flex items-center justify-center gap-1 text-sm py-2 rounded-lg border ${chainTheme.borderClass} ${chainTheme.backgroundClass}/50 transition-all hover:${chainTheme.backgroundClass}`}
            style={{ color: chainTheme.primary }}
          >
            View Collection
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}
