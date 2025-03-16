
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, BadgePercent, Grid3X3, Wallet, ExternalLink } from 'lucide-react';

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

const NavCard = ({ icon, title, description, href, color, delay, isActive, image }: NavCardProps) => {
  return (
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
};

export default function NFTNavigation({ currentPath }: { currentPath?: string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
      <NavCard
        icon={<BadgePercent className="h-6 w-6 text-blue-500" />}
        title="PATH NFT Marketplace"
        description="Buy, sell, and create NFTs on the PATH token ecosystem. List your digital assets and trade with other users."
        href="/NFT"
        color="border-blue-500/30"
        delay={0.1}
        isActive={currentPath === '/NFT'}
        image="/Img/Web3.webp"
      />
      
      <NavCard
        icon={<Grid3X3 className="h-6 w-6 text-purple-500" />}
        title="NFT Collection Scanner"
        description="Explore NFT collections across all EVM-based blockchains. Browse popular collections or connect your wallet to view your own NFTs."
        href="/NFT/collection"
        color="border-purple-500/30"
        delay={0.2}
        isActive={currentPath?.startsWith('/NFT/collection')}
        image="/Img/Web3.webp"
      />

      <div className="md:col-span-2 mt-4 bg-gray-800/30 rounded-lg p-4">
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
