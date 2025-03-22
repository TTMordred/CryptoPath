"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import BalanceCard from "@/components/portfolio/BalanceCard";
import TokensCard from "@/components/portfolio/TokenCard";
import NFTsCard from "@/components/portfolio/NFTsCard";
import HistoryChart from "@/components/portfolio/HistoryCard";
import AllocationChart from "@/components/portfolio/Allocation";
import ActivityTable from "@/components/portfolio/ActivityTable";
import { getWalletData, WalletData } from "@/components/portfolio_service/alchemyService";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/src/integrations/supabase/client";
import { ethers } from "ethers";
import ParticlesBackground from "@/components/ParticlesBackground";

// Định nghĩa keyframes
const keyframeStyles = `
  @keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
  @keyframes shine { 0% { transform: rotate(30deg) translate(-100%, -100%); } 100% { transform: rotate(30deg) translate(100%, 100%); } }
  @keyframes pulse-amber { 0%, 100% { box-shadow: 0 0 10px 2px rgba(246, 179, 85, 0.4); } 50% { box-shadow: 0 0 20px 4px rgba(246, 179, 85, 0.6); } }
  @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
`;

interface Wallet {
  address: string;
  is_default: boolean;
}

interface Profile {
  wallets: Wallet[];
}

const PortfolioPage = () => {
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [walletData, setWalletData] = useState<WalletData>({
    balance: "0",
    tokens: [],
    nfts: [],
    transactions: [],
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  // Thêm keyframes vào head
  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.innerHTML = keyframeStyles;
    document.head.appendChild(styleElement);

    return () => {
      if (styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement);
      }
    };
  }, []);

  // Hàm lấy dữ liệu ví - tách riêng và memoized
  const fetchWalletAddress = useCallback(async () => {
    setIsLoading(true);
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session) {
        toast({
          title: "Not logged in",
          description: "Please log in to view your portfolio.",
          variant: "destructive",
        });
        router.push("/login");
        return;
      }

      const userId = session.user.id;

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("wallets")
        .eq("id", userId)
        .single();

      if (profileError || !profileData) {
        throw new Error("No profile found or query error.");
      }

      const wallets = profileData.wallets as Wallet[];
      if (!wallets || !Array.isArray(wallets) || wallets.length === 0) {
        console.warn("No valid wallets found, redirecting to settings.");
        router.push("/settings");
        return;
      }

      const defaultWallet = wallets.find((wallet) => wallet.is_default);
      if (!defaultWallet || !defaultWallet.address) {
        console.warn("No default wallet address found, redirecting to settings.");
        router.push("/settings");
        return;
      }

      const address = defaultWallet.address;
      if (!ethers.utils.isAddress(address)) {
        throw new Error("Invalid wallet address format.");
      }

      setWalletAddress(address);

      const portfolioData = await getWalletData(address);
      setWalletData(portfolioData);
      toast({
        title: "Portfolio loaded",
        description: `Data for wallet ${address.slice(0, 6)}...${address.slice(-4)} has been loaded.`,
      });
    } catch (error: any) {
      console.error("Error fetching wallet data:", error.message);
      toast({
        title: "Error",
        description: "Unable to load portfolio data. Please check your profile settings.",
        variant: "destructive",
      });
      router.push("/settings");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Gọi hàm lấy dữ liệu ví
  useEffect(() => {
    fetchWalletAddress();
  }, [fetchWalletAddress]);

  // Hiệu ứng animation khi scroll
  useEffect(() => {
    const animateElements = () => {
      const elements = document.querySelectorAll(".opacity-0");
      elements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.9) { // Trigger sớm hơn một chút
          (element as HTMLElement).style.opacity = "1";
          (element as HTMLElement).style.transform = "translateY(0)";
          (element as HTMLElement).style.transition = "opacity 0.5s ease, transform 0.5s ease";
        }
      });
    };

    window.addEventListener("scroll", animateElements);
    animateElements(); // Gọi ngay lần đầu
    return () => window.removeEventListener("scroll", animateElements);
  }, []);

  return (
    <div className="relative min-h-screen">
      {/* Hiệu ứng nền Particles */}
      <ParticlesBackground />

      {/* Nội dung chính */}
      <div
        className="relative min-h-screen pb-20 z-10"
        style={{
          backgroundImage: `
            radial-gradient(circle at 30% 5%, #f6b355 0, rgba(246, 179, 85, 0) 10%), 
            radial-gradient(circle at 75% 60%, #f6b355 0, rgba(246, 179, 85, 0) 15%)
          `,
          backgroundAttachment: "fixed",
        }}
      >
        <header className="px-6 py-12 md:py-16 mx-auto max-w-7xl">
          <h2 className="text-amber bg-gradient-to-r from-amber to-amber-light bg-clip-text text-transparent text-3xl font-bold mb-2 tracking-tight text-center">
            Your Wallet Portfolio
          </h2>
          {walletAddress && (
            <p className="text-gray-400 text-sm text-center">
              Viewing portfolio for: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </p>
          )}
        </header>

        {walletAddress && (
          <main className="px-6 mx-auto max-w-7xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="opacity-0 translate-y-10">
                <BalanceCard balance={walletData.balance} isLoading={isLoading} />
              </div>
              <div className="md:col-span-2 opacity-0 translate-y-10">
                <HistoryChart transactions={walletData.transactions} isLoading={isLoading} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="opacity-0 translate-y-10">
                <AllocationChart
                  tokens={walletData.tokens}
                  ethBalance={walletData.balance}
                  isLoading={isLoading}
                />
              </div>
              <div className="opacity-0 translate-y-10">
                <TokensCard tokens={walletData.tokens} isLoading={isLoading} />
              </div>
              <div className="opacity-0 translate-y-10">
                <NFTsCard nfts={walletData.nfts} isLoading={isLoading} />
              </div>
            </div>
            <div className="mb-6 opacity-0 translate-y-10">
              <ActivityTable
                transactions={walletData.transactions}
                walletAddress={walletAddress}
                isLoading={isLoading}
              />
            </div>
          </main>
        )}

        <footer className="text-center py-8 text-gray-500 text-sm">
          <div className="relative overflow-hidden inline-block px-4 py-2 rounded-full backdrop-blur-xl bg-shark-700/30 border border-shark-600 shadow-lg animate-pulse-amber">
            Wallet Portfolio Scanner • Powered by Alchemy
            <div
              className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%]"
              style={{
                background:
                  "linear-gradient(to right, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.05) 50%, rgba(255, 255, 255, 0) 100%)",
                transform: "rotate(30deg)",
                animation: "shine 2s infinite",
              }}
            />
          </div>
        </footer>
      </div>
    </div>
  );
};

export default PortfolioPage;