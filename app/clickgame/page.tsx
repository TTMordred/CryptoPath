'use client';
import React from 'react';
import { GameProvider } from '@/components/ClickGame/GameContext';
import ClickArea from '@/components/ClickGame/ClickArea';
import StatsDisplay from '@/components/ClickGame/StatsDisplay';
import UpgradesShop from '@/components/ClickGame/UpgradesShop';
import SessionTimer from '@/components/ClickGame/SessionTimer';
import { FaCoins, FaQuestion } from 'react-icons/fa';
import Link from 'next/link';

export default function ClickGamePage() {
  return (
    <GameProvider>
      <div className="relative min-h-screen font-exo2 bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              <FaCoins className="inline-block text-[#F5B056] mr-2" />
              PATH <span className="text-[#F5B056]">Clicker</span>
            </h1>
            <p className="text-gray-400">Click to earn PATH tokens and upgrade your clicker!</p>
          </div>
          
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 order-2 md:order-1">
                <StatsDisplay />
                
                <div className="mt-6">
                  <UpgradesShop />
                </div>
                
                <div className="mt-6 text-center md:text-left">
                  <Link href="/NFT" className="text-[#F5B056] hover:underline flex items-center justify-center md:justify-start">
                    <FaCoins className="mr-1" />
                    Spend your PATH tokens on NFTs!
                  </Link>
                </div>
              </div>
              
              <div className="md:col-span-2 flex flex-col items-center justify-center order-1 md:order-2">
                <ClickArea />
              </div>
            </div>
          </div>
          
          <div className="mt-10 text-center text-gray-500 text-sm">
            <p>Click to earn PATH tokens. Each session has a limit of 50 clicks.</p>
            <p className="mt-1">Upgrade your clicker to earn more with each click!</p>
            
            <div className="mt-4 flex justify-center space-x-2">
              <button className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm flex items-center">
                <FaQuestion className="mr-2" /> How to Play
              </button>
              <Link href="/" className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
        
        {/* Session Timer that appears at the bottom during cooldown */}
        <SessionTimer />
      </div>
    </GameProvider>
  );
}