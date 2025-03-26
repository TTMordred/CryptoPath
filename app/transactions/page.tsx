'use client';

import { Suspense, useState } from "react"
import NetworkStats from '@/components/transactions/NetworkStats';
import ParticlesBackground from '@/components/ParticlesBackground';
import RevenueGraph from '@/components/transactions/RevenueGraph';
import WalletCharts from '@/components/transactions/WalletCharts';
import TransactionSection from '@/components/transactions/TransactionSection';
import TradingViewLayout from '@/components/transactions/TradingViewLayout';
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, BarChart3, Wallet, LineChart, Activity, History } from "lucide-react";
import { CoinOption } from "@/services/cryptoService";
import { motion } from "framer-motion";

// Loading component
const LoadingCard = ({ children }: { children: React.ReactNode }) => (
  <Card className="w-full p-4 bg-white/5 rounded-[14px] border border-gray-800/50 backdrop-blur-[6px] animate-pulse shadow-lg">
    <CardContent className="flex items-center justify-center gap-3 py-10">
      <Loader2 className="h-5 w-5 animate-spin text-[#F5B056]" />
      <p className="text-base text-white/80">{children}</p>
    </CardContent>
  </Card>
);

// Section header component
const SectionHeader = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2"
  >
    <div className="flex items-center gap-3">
      <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm border border-white/5">
        {icon}
      </div>
      <h2 className="text-xl font-bold text-white">{title}</h2>
    </div>
    <p className="text-gray-400 text-sm max-w-lg">{description}</p>
  </motion.div>
);

export default function TransactionExplorer() {
  const [selectedCoin, setSelectedCoin] = useState<CoinOption | null>(null);

  // Animation variants for staggered animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  return (
    <div className="relative min-h-screen text-white font-exo2">
      {/* Fix: Keep particles background with correct z-index */}
      <div className="fixed inset-0 -z-10">
        <ParticlesBackground />
      </div>
      
      <motion.div 
        className="relative z-10 pt-4 pb-16"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="container mx-auto px-4">
          {/* Page Title */}
          <motion.div 
            variants={itemVariants}
            className="mb-10 text-center"
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-[#F5B056] to-[#E09346]">
              Cryptocurrency Transaction Explorer
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Analyze real-time cryptocurrency market data, track transactions, and monitor network statistics
            </p>
          </motion.div>
        
          {/* Revenue Graph Section */}
          <motion.div variants={itemVariants} className="mb-12">
            <SectionHeader 
              icon={<BarChart3 className="h-5 w-5 text-[#F5B056]" />}
              title="Market Analytics"
              description="Track price and volume movements of cryptocurrencies with detailed historical data"
            />
            <Suspense fallback={<LoadingCard>Loading market analytics...</LoadingCard>}>
              <RevenueGraph onCoinChange={setSelectedCoin} />
            </Suspense>
          </motion.div>

          {/* Wallet Charts Section */}
          <motion.div variants={itemVariants} className="mb-12">
            <SectionHeader 
              icon={<Wallet className="h-5 w-5 text-[#3b82f6]" />}
              title="Wallet Statistics"
              description="Visual representation of wallet activities and distribution across the blockchain"
            />
            <Suspense fallback={<LoadingCard>Loading wallet statistics...</LoadingCard>}>
              <WalletCharts />
            </Suspense>
          </motion.div>
          
          {/* Trading View Section */}
          <motion.div variants={itemVariants} className="mb-12">
            <SectionHeader 
              icon={<LineChart className="h-5 w-5 text-[#22c55e]" />}
              title="Live Trading Charts"
              description="Professional trading charts with technical analysis indicators powered by TradingView"
            />
            <Suspense fallback={<LoadingCard>Loading trading charts...</LoadingCard>}>
              <TradingViewLayout />
            </Suspense>
          </motion.div>

          {/* Network Stats Section */}
          <motion.div variants={itemVariants} className="mb-12">
            <SectionHeader 
              icon={<Activity className="h-5 w-5 text-[#a855f7]" />}
              title="Network Health"
              description="Real-time stats tracking blockchain network performance, congestion, and gas fees"
            />
            <Suspense fallback={<LoadingCard>Loading network health data...</LoadingCard>}>
              <NetworkStats />
            </Suspense>
          </motion.div>

          {/* Transaction Section */}
          <motion.div variants={itemVariants}>
            <SectionHeader 
              icon={<History className="h-5 w-5 text-[#ec4899]" />}
              title="Recent Transactions"
              description="Latest blockchain transactions with detailed insights and tracking information"
            />
            <Suspense fallback={<LoadingCard>Loading transaction history...</LoadingCard>}>
              <TransactionSection selectedCoin={selectedCoin} />
            </Suspense>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}