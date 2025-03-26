import { useState, useRef, useEffect, memo } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { ExternalLink, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getChainColorTheme } from '@/lib/api/chainProviders';
import LazyImage from './LazyImage';
import { ipfsUriToGatewayUrl } from '@/lib/utils/ipfsUtils';
import Image from "next/legacy/image";

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
  verified?: boolean;
}

interface AnimatedNFTCardProps {
  nft: NFT;
  onClick?: () => void;
  index?: number;
  isVirtualized?: boolean;
  highlight?: boolean;
}

// Component implementation with animations and optimizations
const AnimatedNFTCardComponent = ({ 
  nft, 
  onClick, 
  index = 0, 
  isVirtualized = false,
  highlight = false
}: AnimatedNFTCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Process image URL for IPFS compatibility
  const imageUrl = nft.imageUrl ? ipfsUriToGatewayUrl(nft.imageUrl) : '';
  
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
  
  function handleMouseMove(e: React.MouseEvent) {
    if (nft.isPlaceholder) return;
    
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
    setHovered(false);
  }
  
  function handleMouseEnter() {
    scale.set(1.02);
    setHovered(true);
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
    },
    highlight: { 
      scale: [1, 1.03, 1],
      boxShadow: [
        "0 0 0px rgba(255,255,255,0)",
        "0 0 15px rgba(255,255,255,0.5)",
        "0 0 0px rgba(255,255,255,0)"
      ],
      transition: {
        duration: 1.5,
        repeat: 2,
        repeatType: "reverse" as const, // Fix type error by explicitly typing as const
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

  // If this is a placeholder card (for virtualization), show a loading skeleton
  if (nft.isPlaceholder) {
    return (
      <div 
        className="w-full h-full bg-gray-900/40 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden"
        aria-hidden="true"
      >
        <div className="aspect-square w-full bg-gray-800/60 animate-pulse" />
        <div className="p-3 space-y-2">
          <div className="h-5 bg-gray-800/60 rounded animate-pulse" />
          <div className="h-4 bg-gray-800/60 rounded w-2/3 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      ref={cardRef}
      className="relative cursor-pointer"
      style={{ 
        perspective: 1000, 
        scale 
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      onMouseOut={handleMouseExit}
      onClick={onClick}
      variants={cardVariants}
      initial="hidden"
      animate={highlight ? "highlight" : "visible"}
      exit="exit"
      whileTap={{ scale: 0.98 }}
      layout
      aria-label={`NFT: ${nft.name || `NFT #${nft.tokenId}`}`}
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
            <div className="relative w-3.5 h-3.5 flex-shrink-0 overflow-hidden rounded-full bg-white flex items-center justify-center">
              <Image 
                src={networkBadge.icon} 
                alt={networkBadge.name} 
                layout="fill"
                objectFit="contain"
                className="p-0.5"
                priority={true}
              />
            </div>
            <span className="text-xs font-medium" style={{ color: networkBadge.textColor }}>
              {networkBadge.name}
            </span>
          </div>
        </div>

        {/* Verified Badge */}
        {nft.verified && (
          <div className="absolute top-2 left-2 z-10">
            <div className={`flex items-center gap-1 py-1 px-2 rounded-full bg-green-500/20 border border-green-500/50 backdrop-blur-sm`}>
              <ShieldCheck className="w-3 h-3 text-green-400" />
              <span className="text-xs font-medium text-green-400">
                Verified
              </span>
            </div>
          </div>
        )}

        {/* NFT Image with progressive loading */}
        <div className="aspect-square relative overflow-hidden bg-gray-800">
          <LazyImage
            src={imageUrl}
            alt={nft.name || `NFT #${nft.tokenId}`}
            width={500}
            height={500}
            className="w-full h-full object-cover"
            priority={index < 8}
            onLoad={() => setImageLoaded(true)}
            showLoadingIndicator={true}
          />
          
          {/* Chain indicator corner decoration */}
          <div className={`absolute bottom-0 right-0 w-16 h-16 transform rotate-45 translate-x-8 translate-y-8 ${nft.chain.startsWith('0x38') || nft.chain.startsWith('0x61') ? 'bg-yellow-500/10' : 'bg-blue-500/10'}`}></div>
          
          {/* Hover overlay effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 opacity-0 hover:opacity-100 transition-opacity duration-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: hovered ? 0.6 : 0 }}
            transition={{ duration: 0.3 }}
          />
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
            {(() => {
              const processAttributes = () => {
                let attrs = nft.attributes;
                if (attrs && !Array.isArray(attrs) && typeof attrs === 'object') {
                  attrs = Object.entries(attrs).map(([trait_type, value]) => ({
                    trait_type,
                    value: String(value)
                  }));
                }
                return (Array.isArray(attrs) ? attrs : [])
                  .filter(attr =>
                    attr &&
                    typeof attr === 'object' &&
                    'trait_type' in attr &&
                    'value' in attr &&
                    attr.trait_type !== 'Network' // Filter out Network attribute
                  )
                  .slice(0, 3);
              };
              
              return processAttributes().map((attr, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className={`text-xs ${chainTheme.borderClass}`}
                  style={{ color: chainTheme.primary }}
                >
                  {`${attr.trait_type}: ${attr.value}`}
                </Badge>
              ));
            })()}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Add displayName to fix ESLint warning
AnimatedNFTCardComponent.displayName = 'AnimatedNFTCard';

// Memoize the component to prevent unnecessary re-renders
const AnimatedNFTCard = memo(AnimatedNFTCardComponent);
AnimatedNFTCard.displayName = 'AnimatedNFTCard'; // Also needed here for the memo wrapper

export default AnimatedNFTCard;