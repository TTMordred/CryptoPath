
'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from "next/legacy/image";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

const pageShowcases = [
  {
    title: 'Crypto Price Dashboard',
    description: 'Track real-time prices and market data across thousands of cryptocurrencies.',
    image: '/Img/Exchange.webp',
    path: '/pricetable',
    color: 'from-blue-500 to-purple-600'
  },
  {
    title: 'Market Overview',
    description: 'Get comprehensive insights into global crypto market metrics and trends.',
    image: '/Img/market-overview.png', // Fixed path by removing 'public/'
    path: '/market-overview',
    color: 'from-green-500 to-teal-600'
  },
  {
    title: 'NFT Marketplace',
    description: 'Buy, sell, and create unique digital assets on the PATH token ecosystem.',
    image: '/Img/Web3.webp',
    path: '/NFT',
    color: 'from-purple-500 to-pink-600'
  },
  {
    title: 'NFT Collection Scanner',
    description: 'Explore popular NFT collections or connect your wallet to browse your own NFTs.',
    image: '/Img/Web3.webp',
    path: '/NFT/collection',
    color: 'from-indigo-500 to-blue-600'
  },
  {
    title: 'Transaction Explorer',
    description: 'Search and analyze blockchain transactions with detailed visualizations.',
    image: '/Img/Web3.webp',
    path: '/search',
    color: 'from-orange-500 to-red-600'
  }
];

export default function DemoShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  
  // Auto rotation for slides
  useEffect(() => {
    if (!autoplay) return;
    
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % pageShowcases.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [autoplay]);
  
  const nextSlide = () => {
    setAutoplay(false);
    setActiveIndex((prev) => (prev + 1) % pageShowcases.length);
  };
  
  const prevSlide = () => {
    setAutoplay(false);
    setActiveIndex((prev) => (prev - 1 + pageShowcases.length) % pageShowcases.length);
  };
  
  const goToSlide = (index: number) => {
    setAutoplay(false);
    setActiveIndex(index);
  };
  
  return (
    <section className="py-20 px-4 md:px-8 lg:px-12 relative z-10">
      <div className="container mx-auto max-w-7xl">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Explore Our Platform</h2>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">
            See what CryptoPath has to offer with our comprehensive suite of blockchain tools
          </p>
        </motion.div>
        
        <div className="relative">
          <div className="flex overflow-hidden relative rounded-xl shadow-2xl">
            {pageShowcases.map((showcase, index) => (
              <motion.div 
                key={index}
                className={`w-full flex-shrink-0 transition-all duration-500 ease-out ${
                  index === activeIndex ? 'opacity-100 z-10' : 'opacity-0 absolute'
                }`}
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: index === activeIndex ? 1 : 0,
                  x: index === activeIndex ? 0 : (index < activeIndex ? '-100%' : '100%')
                }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex flex-col md:flex-row gap-8 items-center p-6 bg-black/40 rounded-xl">
                  <div className="md:w-1/2 relative aspect-video rounded-xl overflow-hidden">
                    <Image 
                      src={showcase.image} 
                      alt={showcase.title}
                      layout="fill"
                      objectFit="cover"
                      className="rounded-xl"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-r ${showcase.color} opacity-20`}></div>
                  </div>
                  
                  <div className="md:w-1/2 space-y-6 text-left px-4">
                    <div className="flex items-start justify-between">
                      <h3 className="text-3xl font-bold text-white">{showcase.title}</h3>
                      <span className="text-sm text-gray-400">
                        {index + 1}/{pageShowcases.length}
                      </span>
                    </div>
                    <p className="text-lg text-gray-300">{showcase.description}</p>
                    <div className="flex gap-3">
                      <Link href={showcase.path}>
                        <Button 
                          className={`bg-gradient-to-r ${showcase.color} hover:opacity-90`}
                          size="lg"
                        >
                          Explore
                        </Button>
                      </Link>
                      <Link href={showcase.path} className="flex items-center text-gray-300 hover:text-white transition-colors">
                        <span className="mr-1">View Demo</span>
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 rounded-full p-2 hover:bg-black/70 z-20"
            onClick={prevSlide}
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 rounded-full p-2 hover:bg-black/70 z-20"
            onClick={nextSlide}
          >
            <ChevronRight className="h-6 w-6 text-white" />
          </Button>
          
          <div className="flex justify-center mt-8 space-x-2">
            {pageShowcases.map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === activeIndex ? 'bg-white scale-110 w-6' : 'bg-gray-600'
                }`}
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
