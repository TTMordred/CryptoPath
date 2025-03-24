import { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getChainColorTheme } from '@/lib/api/chainProviders';
import LazyImage from './LazyImage';

interface NFT {
  id: string;
  tokenId: string;
  name: string;
  description?: string;
  imageUrl: string;
  chain: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
  isPlaceholder?: boolean;
}

interface AnimatedNFTCardProps {
  nft: NFT;
  onClick?: () => void;
  index?: number;
  isVirtualized?: boolean;
}

export default function AnimatedNFTCard({ nft, onClick, index = 0, isVirtualized = false }: AnimatedNFTCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Chain-specific styling
  const chainTheme = getChainColorTheme(nft.chain);
  
  // 3D rotation values
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Smooth springs for more natural motion
  const rotateX = useSpring(useTransform(y, [-100, 100], [10, -10]), {
    stiffness: 200,
    damping: 15
  });
  const rotateY = useSpring(useTransform(x, [-100, 100], [-10, 10]), {
    stiffness: 200, 
    damping: 15
  });
  
  // Scale on hover
  const scale = useSpring(1, {
    stiffness: 400,
    damping: 17
  });

  // Card shine effect
  const shineX = useTransform(x, [-100, 100], [0, 1]);
  const shineY = useTransform(y, [-100, 100], [0, 1]);
  const shineOpacity = useMotionValue(0);
  const shinePosition = useTransform(x, [-100, 100], ["45% 45%", "55% 55%"]);
  
  // Update shine opacity based on mouse position
  // Update shine opacity based on mouse position
  useEffect(() => {
    function updateShineOpacity() {
      const latestX = shineX.get();
      const latestY = shineY.get();
      shineOpacity.set((latestX + latestY) / 8);
    }
    
    const unsubscribeX = shineX.on("change", updateShineOpacity);
    const unsubscribeY = shineY.on("change", updateShineOpacity);
    
    return () => {
      unsubscribeX();
      unsubscribeY();
    };
  }, [shineX, shineY, shineOpacity]);
  // Progressive loading animation
  useEffect(() => {
    // Image loading effect is now handled by LazyImage component
    // No need to manipulate blurAmount
  }, [imageLoaded]);
  
  function handleMouseMove(e: React.MouseEvent) {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      x.set(e.clientX - centerX);
      y.set(e.clientY - centerY);
    }
  }
  
  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }
  
  function handleMouseEnter() {
    scale.set(1.02);
  }
  
  function handleMouseExit() {
    scale.set(1);
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
        duration: 0.5,
        delay: isVirtualized ? 0 : index * 0.06, // Only stagger if not virtualized
        ease: [0.2, 0.65, 0.3, 0.9],
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1],
      }
    }
  };

  // Get network badge details
  const getNetworkBadge = () => {
    switch (nft.chain) {
      case '0x1':
        return { 
          icon: '/icons/eth.svg', 
          name: 'ETH', 
          bgClass: 'bg-blue-500/20 border-blue-500',
          textColor: '#6b8df7',
          borderColor: 'border-blue-500/90' 
        };
      case '0xaa36a7':
        return { 
          icon: '/icons/eth.svg', 
          name: 'Sepolia', 
          bgClass: 'bg-blue-400/20 border-blue-400',
          textColor: '#8aa2f2',
          borderColor: 'border-blue-400/90' 
        };
      case '0x38':
        return { 
          icon: '/icons/bnb.svg', 
          name: 'BNB', 
          bgClass: 'bg-yellow-500/20 border-yellow-500',
          textColor: '#F0B90B',
          borderColor: 'border-yellow-500/90' 
        };
      case '0x61':
        return { 
          icon: '/icons/bnb.svg', 
          name: 'BNB Testnet', 
          bgClass: 'bg-yellow-400/20 border-yellow-400',
          textColor: '#F5CA3B',
          borderColor: 'border-yellow-400/90' 
        };
      default:
        return { 
          icon: '/icons/eth.svg', 
          name: 'ETH', 
          bgClass: 'bg-blue-500/20 border-blue-500',
          textColor: '#6b8df7',
          borderColor: 'border-blue-500/90' 
        };
    }
  };

  const networkBadge = getNetworkBadge();
  
  // Get dynamic border glow based on chain
  const getBorderGlow = () => {
    if (nft.chain === '0x38' || nft.chain === '0x61') {
      return 'hover:shadow-[0_0_15px_rgba(240,185,11,0.3)]';
    }
    return 'hover:shadow-[0_0_15px_rgba(107,141,247,0.3)]';
  };

  // If this is a placeholder card (for virtualization), show a simpler version
  if (nft.isPlaceholder) {
    return (
      <div className="w-full h-full aspect-square bg-gray-800/40 rounded-xl animate-pulse" />
    );
  }

  return (
    <motion.div
      ref={cardRef}
      className="relative cursor-pointer"
      style={{ perspective: 1000, scale }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      onMouseOut={handleMouseExit}
      onClick={onClick}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      whileTap={{ scale: 0.98 }}
      layout
    >
      <motion.div
        className={`overflow-hidden rounded-xl border ${chainTheme.borderClass} ${getBorderGlow()} bg-black/60 backdrop-blur-sm shadow-lg transition-shadow duration-300`}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Network Badge - Positioned absolutely top-right */}
        <div className="absolute top-2 right-2 z-10">
          <div className={`flex items-center gap-1 py-1 px-2 rounded-full ${networkBadge.bgClass} border ${networkBadge.borderColor} backdrop-blur-sm shadow-sm`}>
            <div className="relative h-3 w-3">
              <LazyImage 
                src={networkBadge.icon} 
                alt={networkBadge.name} 
                width={12} 
                height={12} 
                className="object-contain"
                priority={true} // Small icon, always prioritize
              />
            </div>
            <span className="text-xs font-medium" style={{ color: networkBadge.textColor }}>
              {networkBadge.name}
            </span>
              <div className="relative h-3 w-3 flex items-center justify-center overflow-hidden rounded-full bg-transparent">
                <LazyImage 
                  src={networkBadge.icon} 
                  alt={networkBadge.name} 
                  width={12} 
                  height={12} 
                  className="object-contain"
                  priority={true} // Small icon, always prioritize
                />
              </div>
            </div>
          </div>

          {/* NFT Image with progressive loading */}
          <div className="aspect-square relative overflow-hidden bg-gray-800">
            {/* Use our optimized LazyImage component */}
            <LazyImage
              src={nft.imageUrl}
              alt={nft.name || `NFT #${nft.tokenId}`}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              objectFit="cover"
              priority={index < 4} // Only prioritize the first 4 images
              onLoad={() => setImageLoaded(true)}
              onError={() => {/* Error handled inside LazyImage */}}
            />
            
            {/* Chain indicator corner decoration */}
            <div className={`absolute bottom-0 right-0 w-16 h-16 transform rotate-45 translate-x-8 translate-y-8 ${nft.chain.startsWith('0x38') || nft.chain.startsWith('0x61') ? 'bg-yellow-500/10' : 'bg-blue-500/10'}`}></div>
          </div>

          {/* Info Section */}
          <div className="p-4 bg-gradient-to-b from-black/40 to-black/70 backdrop-blur-sm">
            <h3 className="font-bold text-white truncate">
              {nft.name || `NFT #${nft.tokenId}`}
            </h3>
            
            <div className="flex justify-between items-center mt-1">
              <p className="text-sm text-gray-300">
                ID: {parseInt(nft.tokenId, 16) ? parseInt(nft.tokenId, 16).toString() : nft.tokenId}
              </p>
              <ExternalLink className="h-4 w-4 text-gray-400 hover:text-white transition-colors" />
            </div>
            
            {/* Attributes */}
            <div className="flex flex-wrap gap-1 mt-3">
              {nft.attributes?.slice(0, 3).map((attr, i) => (
                <Badge 
                  key={i} 
                  variant="outline" 
                  className={`text-xs ${chainTheme.borderClass}`}
                  style={{ color: chainTheme.primary }}
                >
                  {attr.trait_type === 'Network' ? null : `${attr.trait_type}: ${attr.value}`}
                </Badge>
              ))}
            </div>
          </div>
        </motion.div>
    </motion.div>
  );
}
