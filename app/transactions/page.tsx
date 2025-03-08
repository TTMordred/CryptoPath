'use client';

import Link from 'next/link';
import NetworkStats from '@/components/ui/NetworkStats';
import ParticlesBackground from '@/components/ParticlesBackground';
import RevenueGraph from '@/components/ui/RevenueGraph';
import WalletCharts from '@/components/ui/WalletCharts';

export default function TransactionExplorer() {
  return (
    <div className="relative min-h-screen text-white font-exo2">
      <ParticlesBackground />
      
      <div className="relative z-10">
        {/* Main Content */}
        <div className="container mx-auto p-4">
          <div className="mb-6">
            <RevenueGraph />
          </div>
          <WalletCharts />
          <NetworkStats />
        </div>
      </div>
    </div>
  );
}
