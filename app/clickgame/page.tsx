'use client';
import React from 'react';
import { GameProvider } from '@/components/ClickGame/GameContext';
import ClickArea from '@/components/ClickGame/ClickArea';
import StatsDisplay from '@/components/ClickGame/StatsDisplay';
import UpgradesShop from '@/components/ClickGame/UpgradesShop';
import SessionTimer from '@/components/ClickGame/SessionTimer';
import { FaCoins, FaQuestion, FaHome, FaShoppingCart, FaInfoCircle } from 'react-icons/fa';
import Link from 'next/link';
import ParticlesBackground from '@/components/ParticlesBackground';
import { motion } from 'framer-motion';

export default function ClickGamePage() {
  return (
    <GameProvider>
      <div className="relative min-h-screen font-exo2 overflow-hidden">
        {/* ParticlesBackground for background effect */}
        <ParticlesBackground />
        
        <div className="container mx-auto px-4 py-8 relative z-10">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#F5B056] to-amber-400">
                PATH <span className="font-extrabold">Clicker</span>
              </span>
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Click to earn PATH tokens, upgrade your clicker, and dominate the leaderboard!
            </p>
          </motion.div>
          
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div 
                className="md:col-span-1 order-2 md:order-1 space-y-6"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="backdrop-blur-md bg-black/30 rounded-2xl p-6 border border-[#F5B056]/20 shadow-lg hover:shadow-[#F5B056]/10 transition-all duration-300">
                  <StatsDisplay />
                </div>
                
                <div className="backdrop-blur-md bg-black/30 rounded-2xl p-6 border border-[#F5B056]/20 shadow-lg hover:shadow-[#F5B056]/10 transition-all duration-300">
                  <UpgradesShop />
                </div>
                
                <div className="backdrop-blur-md bg-black/30 rounded-2xl p-4 border border-[#F5B056]/20 text-center md:text-left shadow-lg">
                  <Link href="/NFT" className="text-[#F5B056] flex items-center justify-center md:justify-start hover:scale-105 transition-transform p-2 group">
                    <FaShoppingCart className="mr-2 group-hover:rotate-12 transition-transform" />
                    <span className="font-medium">Spend your PATH tokens on NFTs!</span>
                    <span className="ml-1 group-hover:ml-2 transition-all">→</span>
                  </Link>
                </div>
              </motion.div>
              
              <motion.div 
                className="md:col-span-2 flex flex-col items-center justify-center order-1 md:order-2"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="backdrop-blur-md bg-black/20 p-10 rounded-2xl border border-[#F5B056]/20 shadow-[0_0_50px_rgba(245,176,86,0.1)]">
                  <ClickArea />
                </div>
              </motion.div>
            </div>
          </div>
          
          <motion.div 
            className="mt-16 text-center text-gray-400 backdrop-blur-md bg-black/30 max-w-4xl mx-auto rounded-xl p-6 border border-gray-800/50"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex items-center justify-center mb-4">
              <FaInfoCircle className="text-[#F5B056] mr-2 text-xl" />
              <h3 className="text-white text-xl font-medium">How to Play</h3>
            </div>
            <p>Click the coin to earn PATH tokens. Each session has a limit of 50 clicks.</p>
            <p className="mt-1">Upgrade your clicker to earn more with each click and purchase auto-clickers to earn while idle!</p>
            
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <Link href="/" className="bg-gradient-to-r from-[#F5B056] to-amber-500 text-black px-6 py-3 rounded-full text-sm font-bold flex items-center hover:shadow-lg hover:from-[#F5B056] hover:to-amber-400 transition-all duration-300 hover:-translate-y-1">
                <FaHome className="mr-2" /> Return Home
              </Link>
              <Link href="/NFT" className="bg-black/50 text-white border border-[#F5B056]/50 px-6 py-3 rounded-full text-sm font-bold flex items-center hover:bg-[#F5B056]/10 transition-colors duration-300 hover:-translate-y-1">
                <FaCoins className="mr-2" /> NFT Marketplace
              </Link>
            </div>
          </motion.div>
        </div>
        
        {/* Session Timer that appears at the bottom during cooldown */}
        <SessionTimer />
      </div>
    </GameProvider>
  );
}