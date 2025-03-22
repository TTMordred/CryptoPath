import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Info, ExternalLink, Tag, Clock, Hash, 
  DollarSign, Sparkles, Heart, ArrowRight, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getChainColorTheme, formatAddress, getExplorerUrl } from '@/lib/api/chainProviders';

interface NFTDetailWidgetProps {
  nft: {
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
    creator?: string;
    owner?: string;
    price?: string;
    lastSale?: string;
    listed?: boolean;
  };
  onClose: () => void;
}

export default function NFTDetailWidget({ nft, onClose }: NFTDetailWidgetProps) {
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [liked, setLiked] = useState(false);
  
  // Get chain theme colors
  const chainTheme = getChainColorTheme(nft.chain);
  
  // Get network name
  const getNetworkName = () => {
    const networks: Record<string, string> = {
      '0x1': 'Ethereum',
      '0xaa36a7': 'Sepolia',
      '0x38': 'BNB Chain',
      '0x61': 'BNB Testnet'
    };
    return networks[nft.chain] || 'Unknown Network';
  };
  
  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Transition in details after image loads
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        setShowDetails(true);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [loading]);
  
  return (
    <motion.div 
      className="relative max-w-4xl mx-auto overflow-hidden rounded-xl border border-gray-800 bg-black/80 backdrop-blur-xl"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-black/50 via-transparent to-transparent z-0"></div>
      
      {/* Background glow effect based on chain */}
      <div 
        className={`absolute -bottom-20 -right-20 w-40 h-40 rounded-full blur-3xl z-0 opacity-20`}
        style={{ background: chainTheme.primary }}
      ></div>
      
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-50 rounded-full bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          whileHover={{ rotate: 90 }}
          transition={{ duration: 0.2 }}
        >
          <ArrowRight className="h-5 w-5" />
        </motion.div>
      </Button>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
        {/* Image container */}
        <div className="relative aspect-square">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="h-10 w-10 rounded-full border-2 border-t-transparent animate-spin"
                   style={{ borderColor: `${chainTheme.primary} transparent transparent transparent` }} />
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="relative h-full w-full"
            >
              <Image
                src={nft.imageUrl || '/placeholder.png'}
                alt={nft.name}
                fill
                className="object-cover"
              />
              
              {/* Chain indicator */}
              <div className="absolute top-4 left-4">
                <Badge 
                  className={`${chainTheme.backgroundClass} border ${chainTheme.borderClass}`}
                  style={{ color: chainTheme.primary }}
                >
                  <div className="flex items-center gap-1">
                    <Image 
                      src={nft.chain.includes('0x38') || nft.chain.includes('0x61') 
                        ? '/icons/bnb.svg' 
                        : '/icons/eth.svg'} 
                      alt="Chain"
                      width={12}
                      height={12}
                    />
                    {getNetworkName()}
                  </div>
                </Badge>
              </div>
              
              {/* Like button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute bottom-4 right-4 z-10 rounded-full bg-black/40 backdrop-blur-sm hover:bg-gray-800/60"
                onClick={() => setLiked(!liked)}
              >
                <Heart 
                  className={`h-5 w-5 ${liked ? 'text-red-500 fill-red-500' : 'text-gray-400'}`} 
                />
              </Button>
            </motion.div>
          )}
        </div>
        
        {/* Details container */}
        <div className="relative p-6 bg-black/70 backdrop-blur-md overflow-y-auto max-h-[600px] border-l border-gray-800">
          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                {/* Title and ID */}
                <div>
                  <motion.h2 
                    className="text-2xl font-bold mb-1"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                  >
                    {nft.name}
                  </motion.h2>
                  
                  <motion.div 
                    className="flex items-center gap-2 text-sm text-gray-400"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                  >
                    <Hash className="h-3.5 w-3.5" />
                    Token ID: {parseInt(nft.tokenId, 16).toString()}
                  </motion.div>
                </div>
                
                {/* Price info - if available */}
                {nft.price && (
                  <motion.div 
                    className={`p-4 rounded-lg ${chainTheme.backgroundClass}/10 border ${chainTheme.borderClass}/20`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Current Price</span>
                      {nft.listed && (
                        <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">
                          Listed
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-2xl font-bold" style={{ color: chainTheme.primary }}>
                        {nft.price} {nft.chain.includes('0x38') || nft.chain.includes('0x61') ? 'BNB' : 'ETH'}
                      </span>
                      {nft.lastSale && (
                        <span className="text-xs text-gray-400">
                          Last: {nft.lastSale} {nft.chain.includes('0x38') || nft.chain.includes('0x61') ? 'BNB' : 'ETH'}
                        </span>
                      )}
                    </div>
                    
                    {nft.listed && (
                      <Button 
                        className="w-full mt-3"
                        style={{ 
                          background: chainTheme.primary,
                          color: nft.chain.includes('0x38') || nft.chain.includes('0x61') ? 'black' : 'white'
                        }}
                      >
                        <DollarSign className="h-4 w-4 mr-2" /> Buy Now
                      </Button>
                    )}
                  </motion.div>
                )}
                
                {/* Description */}
                {nft.description && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                  >
                    <h3 className="text-sm text-gray-400 mb-1">Description</h3>
                    <p className="text-sm text-gray-300">{nft.description}</p>
                  </motion.div>
                )}
                
                {/* Owner/Creator */}
                {(nft.owner || nft.creator) && (
                  <motion.div 
                    className="flex flex-col gap-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.3 }}
                  >
                    {nft.owner && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-800">
                        <span className="text-sm text-gray-400">Owner</span>
                        <a 
                          href={`${getExplorerUrl(nft.chain, nft.owner, 'address')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm flex items-center gap-1 text-blue-400 hover:text-blue-300"
                        >
                          {formatAddress(nft.owner)}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                    
                    {nft.creator && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-800">
                        <span className="text-sm text-gray-400">Creator</span>
                        <a 
                          href={`${getExplorerUrl(nft.chain, nft.creator, 'address')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm flex items-center gap-1 text-blue-400 hover:text-blue-300"
                        >
                          {formatAddress(nft.creator)}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </motion.div>
                )}
                
                {/* Attributes/Traits */}
                {nft.attributes && nft.attributes.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.3 }}
                  >
                    <h3 className="text-sm text-gray-400 mb-3">Attributes</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {nft.attributes.map((attr, index) => {
                        // Skip network attribute which is already shown in the badge
                        if (attr.trait_type.toLowerCase() === 'network') return null;
                        
                        return (
                          <motion.div 
                            key={index}
                            className={`p-2 rounded-lg ${chainTheme.backgroundClass}/10 border ${chainTheme.borderClass}/20`}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.6 + index * 0.05, duration: 0.3 }}
                          >
                            <div className="text-xs text-gray-400">{attr.trait_type}</div>
                            <div className="text-sm font-medium" style={{ color: chainTheme.primary }}>
                              {attr.value}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
                
                {/* Contract info and links */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.3 }}
                  className="pt-4 mt-4 border-t border-gray-800"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Contract</span>
                    <a 
                      href={`${getExplorerUrl(nft.chain, nft.id.split('-')[0], 'address')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm flex items-center gap-1 text-blue-400 hover:text-blue-300"
                    >
                      {formatAddress(nft.id.split('-')[0])}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {loading && (
            <div className="h-full w-full flex items-center justify-center">
              <div className="h-10 w-10 rounded-full border-2 border-t-transparent animate-spin"
                   style={{ borderColor: `${chainTheme.primary} transparent transparent transparent` }} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
