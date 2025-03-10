
import { useState } from "react";
import Page from "@/app/pricetable/page";
import CoinDetailModal from "./CoinDetaiModal";

export const DashboardPage = () => {
  // State for modal
  const [selectedCoinId, setSelectedCoinId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Extract components from the Page component
  const { ParticlesBackground, Navigation, HeroSection, TopMoversSection, CoinTable } = Page as any;
  
  // Handler for coin click
  const handleCoinClick = (coinId: string) => {
    setSelectedCoinId(coinId);
    setIsModalOpen(true);
  };
  
  // Close modal handler
  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Add a slight delay before clearing the coin ID to prevent flickering
    setTimeout(() => {
      setSelectedCoinId(null);
    }, 300);
  };
  
  return (
    <div className="min-h-screen">
      <ParticlesBackground />
      <Navigation />
      
      <main className="flex-1 relative z-10">
        <HeroSection />
        <TopMoversSection onCoinClick={handleCoinClick} />
        <CoinTable onCoinClick={handleCoinClick} />
      </main>
      
      <CoinDetailModal 
        coinId={selectedCoinId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default DashboardPage;