'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from "next/legacy/image";
import { motion } from 'framer-motion';
import { FaFacebookF, FaGithub, FaLinkedinIn, FaCoins, FaExchangeAlt, FaPalette, FaChartLine, FaGamepad } from 'react-icons/fa';
import ParticlesBackground from '@/components/ParticlesBackground';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, TrendingUp, Wallet, Box } from 'lucide-react';
import DemoShowcase from '@/components/home/DemoShowcase';
import EthPriceLine from '@/components/home/EthPriceLine';
import CryptoPathExplorer from '@/components/home/CryptoExplorer';
import TrendingProjects from '@/components/home/TrendingProjects';
import TrendingNFTCollections from '@/components/home/TrendingNFTs';
import PartnerBar from '@/components/PartnerBar';
import FAQ from './FAQ';
import AOS from 'aos';
import 'aos/dist/aos.css';
import toast from 'react-hot-toast';

// FeatureCardProps interface should include language
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  imageUrl?: string;
  delay: number;
  language: Language; // Add language prop
}

// Tab types
type Tab = 'sgd' | 'web3';

// Language types
type Language = 'en' | 'vi';

// Translation object
const translations = {
  en: {
    vietnamPremierCrypto: "Vietnam's Premier Blockchain Explorer",
    joinAllInOne: "Your all-in-one crypto ",
    appInVietnam: "transaction explorer",
    emailPlaceholder: "Your Email Address...",
    signUpSuccess: "Sign Up Successfully!",
    processing: "Processing...",
    tryCryptoPath: "Try CryptoPath",
    tradeLikePro: "Track transactions ",
    aPro: "like never before",
    getLowestFees: "Real-time transaction monitoring, comprehensive analytics, and powerful visualization tools",
    oneApplication: "One Platform. ",
    infinitePotential: "Complete Insights",
    exploreNFTMarketplace: "Track real-time cryptocurrency transactions, monitor market trends, and analyze blockchain metrics with our comprehensive dashboard.",
    exploreDecentralized: "Explore detailed transaction histories, wallet analytics, and network statistics with our powerful blockchain explorer.",
    exchange: "Analytics",
    web3: "Explorer",
    accompanyingYou: "Your Gateway to ",
    everyStep: "Blockchain Data",
    fromCryptoTransactions: "From real-time transaction tracking to comprehensive market analysis, CryptoPath provides you with all the tools you need to understand blockchain activity.",
    believeInYourself: "Make informed decisions with data-driven insights.",
    meetTheTeam: "Meet the ",
    team: "Team",
    willingToListen: "Dedicated to building the best blockchain explorer!",
    whatIsCryptoPath: "Why ",
    cryptoPath: "CryptoPath?",
    hearFromTopIndustry: "A powerful blockchain explorer that helps you",
    whyCryptoPathIsFavorite: "track, analyze, and understand cryptocurrency transactions.",
    learnMore: "Learn More",
    whatIsCryptocurrency: "Real-Time Analytics",
    explainingNewCurrency: "Track market trends and transaction flows",
    redefiningSystem: "Transaction Explorer",
    welcomeToWeb3: "Monitor blockchain activity in real-time",
    whatIsBlockchain: "Network Statistics",
    understandBlockchain: "Comprehensive blockchain metrics and insights",
    trustedBy: "Trusted",
    industryLeaders: "by crypto enthusiasts",
    testimonialText: "\"CryptoPath provides the most comprehensive and user-friendly blockchain explorer I've ever used. The real-time analytics and transaction tracking are invaluable.\"",
    founderOf: "Founder of CryptoPath",
    readyToStart: "Ready to explore the blockchain?",
    joinThousands: "Join thousands of users who are already using CryptoPath to track and analyze cryptocurrency transactions.",
    downloadNow: "Start Exploring",
    pleaseEnterEmail: "Please enter your email address",
    pleaseEnterValidEmail: "Please enter a valid email address",
    errorOccurred: "An error occurred while registering!",
    registrationSuccessful: "Registration successful! Please check your email.",
    exploreFuture: "Explore the Future of Blockchain",
    cryptoPathProvides: "CryptoPath provides powerful tools to navigate the decentralized landscape. Track transactions, explore NFTs, and gain insights into the crypto market.",
    exploreMarkets: "Explore Markets",
    discoverNFTs: "Discover NFTs",
    powerfulTools: "Powerful Blockchain Tools",
    exploreFeatureRich: "Explore our feature-rich platform designed for both beginners and experienced crypto enthusiasts",
    marketAnalytics: "Market Analytics",
    marketAnalyticsDesc: "Real-time price data, market trends, and comprehensive analysis of cryptocurrencies.",
    nftMarketplace: "NFT Marketplace",
    nftMarketplaceDesc: "Buy, sell, and create NFTs on the PATH token ecosystem, or explore NFT collections across the blockchain.",
    transactionExplorer: "Transaction Explorer",
    transactionExplorerDesc: "Track and analyze blockchain transactions with detailed visualizations and insights.",
    getStarted: "Get Started",
    tryDemo: "Try Demo",
    explore: "Explore"
  },
  vi: {
    vietnamPremierCrypto: "Nền Tảng Khám Phá Blockchain Hàng Đầu Việt Nam",
    joinAllInOne: "Nền tảng theo dõi giao dịch ",
    appInVietnam: "tiền điện tử toàn diện",
    emailPlaceholder: "Địa chỉ Email của bạn...",
    signUpSuccess: "Đăng ký thành công!",
    processing: "Đang xử lý...",
    tryCryptoPath: "Thử CryptoPath",
    tradeLikePro: "Theo dõi giao dịch ",
    aPro: "theo cách mới",
    getLowestFees: "Giám sát giao dịch thời gian thực, phân tích toàn diện và công cụ trực quan mạnh mẽ",
    oneApplication: "Một nền tảng. ",
    infinitePotential: "Thông tin đầy đủ",
    exploreNFTMarketplace: "Theo dõi giao dịch tiền điện tử thời gian thực, giám sát xu hướng thị trường và phân tích các chỉ số blockchain với bảng điều khiển toàn diện của chúng tôi.",
    exploreDecentralized: "Khám phá lịch sử giao dịch chi tiết, phân tích ví và thống kê mạng lưới với công cụ khám phá blockchain mạnh mẽ của chúng tôi.",
    exchange: "Phân tích",
    web3: "Khám phá",
    accompanyingYou: "Cổng thông tin ",
    everyStep: "Blockchain của bạn",
    fromCryptoTransactions: "Từ theo dõi giao dịch thời gian thực đến phân tích thị trường toàn diện, CryptoPath cung cấp cho bạn tất cả các công cụ cần thiết để hiểu hoạt động blockchain.",
    believeInYourself: "Đưa ra quyết định dựa trên dữ liệu thực tế.",
    meetTheTeam: "Gặp gỡ ",
    team: "Đội ngũ",
    willingToListen: "Luôn nỗ lực xây dựng nền tảng khám phá blockchain tốt nhất!",
    whatIsCryptoPath: "Tại sao chọn ",
    cryptoPath: "CryptoPath?",
    hearFromTopIndustry: "Một công cụ khám phá blockchain mạnh mẽ giúp bạn",
    whyCryptoPathIsFavorite: "theo dõi, phân tích và hiểu các giao dịch tiền điện tử.",
    learnMore: "Tìm hiểu thêm",
    whatIsCryptocurrency: "Phân tích thời gian thực",
    explainingNewCurrency: "Theo dõi xu hướng thị trường và luồng giao dịch",
    redefiningSystem: "Khám phá giao dịch",
    welcomeToWeb3: "Giám sát hoạt động blockchain theo thời gian thực",
    whatIsBlockchain: "Thống kê mạng lưới",
    understandBlockchain: "Số liệu và thông tin blockchain toàn diện",
    trustedBy: "Được tin dùng",
    industryLeaders: "bởi cộng đồng crypto",
    testimonialText: "\"CryptoPath cung cấp công cụ khám phá blockchain toàn diện và thân thiện nhất mà tôi từng sử dụng. Phân tích thời gian thực và theo dõi giao dịch là vô giá.\"",
    founderOf: "Nhà sáng lập CryptoPath",
    readyToStart: "Sẵn sàng khám phá blockchain?",
    joinThousands: "Tham gia cùng hàng nghìn người dùng đang sử dụng CryptoPath để theo dõi và phân tích giao dịch tiền điện tử.",
    downloadNow: "Bắt đầu khám phá",
    pleaseEnterEmail: "Vui lòng nhập địa chỉ email của bạn",
    pleaseEnterValidEmail: "Vui lòng nhập địa chỉ email hợp lệ",
    errorOccurred: "Đã xảy ra lỗi khi đăng ký!",
    registrationSuccessful: "Đăng ký thành công! Vui lòng kiểm tra email của bạn.",
    exploreFuture: "Khám Phá Tương Lai Của Blockchain",
    cryptoPathProvides: "CryptoPath cung cấp các công cụ mạnh mẽ để điều hướng trong không gian phi tập trung. Theo dõi giao dịch, khám phá NFT và nhận thông tin chi tiết về thị trường tiền điện tử.",
    exploreMarkets: "Khám Phá Thị Trường",
    discoverNFTs: "Khám Phá NFTs",
    powerfulTools: "Công Cụ Blockchain Mạnh Mẽ",
    exploreFeatureRich: "Khám phá nền tảng đầy tính năng của chúng tôi được thiết kế cho cả người mới bắt đầu và những người đam mê tiền điện tử có kinh nghiệm",
    marketAnalytics: "Phân Tích Thị Trường",
    marketAnalyticsDesc: "Dữ liệu giá thời gian thực, xu hướng thị trường và phân tích toàn diện về tiền điện tử.",
    nftMarketplace: "Thị Trường NFT",
    nftMarketplaceDesc: "Mua, bán và tạo NFT trên hệ sinh thái token PATH, hoặc khám phá các bộ sưu tập NFT trên blockchain.",
    transactionExplorer: "Khám Phá Giao Dịch",
    transactionExplorerDesc: "Theo dõi và phân tích các giao dịch blockchain với hình ảnh trực quan và chi tiết chi tiết.",
    getStarted: "Bắt Đầu",
    tryDemo: "Dùng Thử",
    explore: "Khám Phá"
  }
};

const teamMembers = [
  {
    name: 'Minh Duy',
    role: 'Founder & CEO',
    bio: 'Blockchain enthusiast with 5+ years in cryptocurrency development.',
    image: '/minhduy.png',
    facebook: 'https://www.facebook.com/TTMordred210',
    github: 'https://github.com/TTMordred',
    linkedin: 'https://linkedin.com/in/',
  },
  {
    name: 'Dang Duy',
    role: 'Co-Founder',
    bio: 'Full-stack developer specializing in secure blockchain infrastructure.',
    image: '/dangduy.png',
    facebook: 'https://www.facebook.com/Duy3000/',
    github: 'https://github.com/DangDuyLe',
    linkedin: 'https://linkedin.com/in/',
  },
  {
    name: 'Cong Hung',
    role: 'Co-Founder',
    bio: 'Operations specialist with experience in cryptocurrency projects.',
    image: '/conghung.png',
    facebook: 'https://www.facebook.com/hung.phan.612060',
    github: 'https://github.com/HungPhan-0612',
    linkedin: 'https://linkedin.com/in/',
  },
];

const LandingPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>('sgd');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [language, setLanguage] = useState<Language>('en');

  // Declare t only once
  const t = translations[language];

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
    });

    // Initialize language based on browser preference
    const browserLanguage = getUserLanguage();
    setLanguage(browserLanguage);

    // Get language from localStorage if available
    const storedLanguage = localStorage.getItem('language') as Language;
    if (storedLanguage) {
      setLanguage(storedLanguage);
    }
  }, []);

  // Simple browser language detection
  const getUserLanguage = (): Language => {
    return typeof navigator !== 'undefined' && navigator.language.startsWith('vi') ? 'vi' : 'en';
  };

  const switchContent = (tab: Tab) => {
    setActiveTab(tab);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setEmailError('');
    setIsSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Email validation with language-specific messages
    if (!email) {
      setEmailError(t.pleaseEnterEmail); // Use t directly
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError(t.pleaseEnterValidEmail); // Use t directly
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Call API to register email with language parameter
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, language }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t.errorOccurred); // Use t directly
      }

      // Handle success
      setEmail('');
      setIsSuccess(true);
      
      // Success message based on language
      toast.success(t.registrationSuccessful); // Use t directly
      
    } catch (error) {
      console.error(language === 'en' ? 'Error:' : 'Lỗi:', error);
      toast.error(error instanceof Error ? error.message : t.errorOccurred); // Use t directly
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative font-sans">
      <ParticlesBackground />
      <EthPriceLine />
     
      {/* Hero Section */}
      <div className="min-h-screen w-full flex items-center" data-aos="fade-up">
          <div className="container mx-auto px-4">
            {/* CryptoPath Explorer Section */}
            <CryptoPathExplorer language={language} />
            <div className="flex flex-col md:flex-row items-center">
              <div className="text-center md:text-left md:w-1/2 md:pl-12">
              <p className="text-[#F5B056] mb-2 md:ml-40">
                {t.vietnamPremierCrypto}
              </p>
              <h1 className="text-4xl md:text-6xl font-bold leading-tight text-center md:text-left mx-4 md:ml-40 mb-10 md:mb-20">
                {t.joinAllInOne}<span className="text-[#F5B056]">{t.appInVietnam}</span>
              </h1>
              <form onSubmit={handleSubmit} className="mt-6 flex flex-col md:flex-row gap-4 md:ml-40">
                <div className="relative w-full md:w-auto">
                <input
                type="email"
                placeholder={t.emailPlaceholder}
                value={email}
                onChange={handleEmailChange}
                disabled={isSubmitting}
                className={`px-4 py-3 w-full md:w-64 rounded-[5px] bg-gray-900 border ${
                emailError ? 'border-red-500' : isSuccess ? 'border-green-500' : 'border-gray-700'
                } text-white focus:outline-none transition-colors`}
                />
                {emailError && <p className="text-red-500 text-sm mt-1 absolute">{emailError}</p>}
                {isSuccess && <p className="text-green-500 text-sm mt-1 absolute">
                {t.signUpSuccess}
                </p>}
                </div>
                <button 
                type="submit" 
                disabled={isSubmitting}
                className={`cp-button cp-button--primary ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                {isSubmitting ? t.processing : t.tryCryptoPath}
                </button>
              </form>
                <div className="md:ml-40 mt-6">
                <motion.div 
                className="flex flex-wrap justify-center md:justify-start gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                >
                <Link href="/market-overview">
                  <button className="cp-button cp-button--primary flex items-center">
                  {t.exploreMarkets} <ArrowRight className="ml-2 h-5 w-5" />
                  </button>
                </Link>
                <Link href="/NFT">
                  <Button size="lg" variant="outline" className="border-[#F5B056] text-[#F5B056] hover:bg-[#F5B056]/10 rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-[#F5B056]/20">
                  {t.discoverNFTs}
                  </Button>
                </Link>
                </motion.div>
                </div>
              </div>

              <div className="md:w-1/2 flex justify-center mt-10 md:mt-0">
                <video className="max-w-[250px] mx-auto" autoPlay loop muted>
                  <source src="/Img/Videos/TradingVideo.webm" type="video/webm" />
                  <source src="/Img/Videos/TradingVideo.mp4" type="video/mp4" />
                </video>
              </div>
            </div>
          </div>
        </div>

      
      {/* Trending Projects & Partner Bar */}
      <PartnerBar />
      <TrendingProjects />

      {/* Demo Showcase Section */}
      <DemoShowcase />

      {/* Trade Like a Pro Section */}
      <div className="min-h-screen w-full flex items-center" data-aos="fade-up">
        <div className="container mx-auto px-4 py-12 text-center" data-aos="fade-up">
          <h1 className="text-4xl font-bold mb-4">{t.tradeLikePro}<span className="text-[#F5B056]">{t.aPro}</span></h1>
          <p className="text-lg mb-20">
            {t.getLowestFees}
          </p>
          <div className="flex justify-center">
            <div className="video-container relative">
              <div className="absolute -inset-1 bg-[#f5b056]/20 rounded-[10px] blur"></div>
              <video 
                className="w-full rounded-[10px] relative" 
                autoPlay 
                loop 
                muted
                playsInline
              >
                <source src="/Img/Videos/video.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <div className="absolute inset-0 rounded-[10px] border border-#f5b056"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-20 px-4 md:px-8 lg:px-12 relative z-10 bg-black/50" data-aos="fade-up">
        <div className="container mx-auto max-w-7xl">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.powerfulTools}</h2>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto">
              {t.exploreFeatureRich}
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<TrendingUp className="h-10 w-10 text-orange-500" />}
              title={t.marketAnalytics}
              description={t.marketAnalyticsDesc}
              href="/pricetable"
              imageUrl="/feature-market.png"
              delay={0.1}
              language={language}
            />
            
            <FeatureCard 
              icon={<Box className="h-10 w-10 text-purple-500" />}
              title={t.nftMarketplace}
              description={t.nftMarketplaceDesc}
              href="/NFT"
              imageUrl="/feature-nft.png"
              delay={0.2}
              language={language}
            />
            
            <FeatureCard 
              icon={<Wallet className="h-10 w-10 text-blue-500" />}
              title={t.transactionExplorer}
              description={t.transactionExplorerDesc}
              href="/search"
              imageUrl="/feature-transaction.png"
              delay={0.3}
              language={language}
            />
          </div>
        </div>
      </section>

      {/* Dynamic Content Section */}
      <div className="container mx-auto px-4 py-12" data-aos="fade-up">
        <div className="flex flex-col md:flex-row items-center">
          <div className="max-w-[250px] mx-auto">
            <Image
              src={activeTab === 'sgd' ? '/Img/Exchange.webp' : '/Img/Web3.webp'}
              width={250}
              height={250}
              alt="CryptoPath Content"
            />
          </div>
          <div className="w-full md:w-1/2 text-center md:text-left mt-8 md:mt-0 md:ml-8">
            <h1 className="text-4xl font-bold mb-4">{t.oneApplication}<span className="text-[#F5B056]">{t.infinitePotential}</span></h1>
            <p className="text-lg mb-6">
              {activeTab === 'sgd' ? t.exploreNFTMarketplace : t.exploreDecentralized}
            </p>
            <div className="flex justify-center md:justify-start space-x-4">
              <button
                className={`px-4 py-2 rounded-[5px] font-semibold ${
                  activeTab === 'sgd' ? 'bg-[#F5B056] hover:bg-[#ff6500] text-black' : 'bg-black text-white'
                }`}
                onClick={() => switchContent('sgd')}
              >
                {t.exchange}
              </button>
              <button
                className={`px-4 py-2 rounded-[5px] font-semibold ${
                  activeTab === 'web3' ? 'bg-[#F5B056] text-black' : 'bg-black text-white'
                }`}
                onClick={() => switchContent('web3')}
              >
                {t.web3}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Trending NFTs Section */}
      <TrendingNFTCollections />

      {/* Evolution Illustration Section */}
      <div className="container mx-auto px-4 py-12 text-center" data-aos="fade-up">
        <h1 className="text-4xl font-bold mb-4">{t.accompanyingYou}<span className="text-[#F5B056]">{t.everyStep}</span></h1>
        <p className="text-lg mb-12">
          {t.fromCryptoTransactions}
          <br />
          {t.believeInYourself}
        </p>
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute -inset-1 bg-[#f5b056]/20 rounded-[10px] blur"></div>
            <video className="max-w-full relative rounded-[10px]" autoPlay loop muted playsInline>
              <source src="/Img/Videos/Evolution.webm" type="video/webm" />
              <source src="/Img/Videos/Evolution.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </div>

      {/* Meet the Team */}
      <section className="py-12 mb-8 md:mb-12" data-aos="fade-up">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold">
            {t.meetTheTeam}<span className="text-[#ff6500]">{t.team}</span>
          </h2>
          <p className="mt-2 text-base md:text-lg text-gray-300">
            {t.willingToListen}
          </p>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {teamMembers.map((member) => (
              <div key={member.name} className="group flex flex-col items-center bg-black/30 p-6 rounded-[10px] border border-transparent transition duration-300">
                {/* Profile Image */}
                <div className="w-36 h-36 rounded-[10px] overflow-hidden border-2 border-transparent group-hover:border-[#F5B056] transition duration-300">
                  <Image
                    src={member.image}
                    alt={member.name}
                    width={144}
                    height={144}
                    className="object-cover w-full h-full"
                  />
                </div>
                {/* Name and Role */}
                <div className="mt-4 text-center">
                  <h3 className="text-xl font-semibold">{member.name}</h3>
                  <p className="text-sm text-gray-300">{member.role}</p>
                </div>
                {/* Bio */}
                <p className="mt-2 text-sm text-gray-400 text-center">{member.bio}</p>
                {/* Social Links */}
                <div className="mt-4 flex space-x-4">
                  <a href={member.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition duration-300">
                    <FaFacebookF />
                  </a>
                  <a href={member.github} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition duration-300">
                    <FaGithub />
                  </a>
                  <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition duration-300">
                    <FaLinkedinIn />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQ language={language} />

      {/* CTA Section */}
      <section className="py-20 px-4 md:px-8 lg:px-12 relative z-10">
        <div className="container mx-auto max-w-7xl">
          <div className="bg-gradient-to-r from-orange-500/20 to-purple-600/20 rounded-3xl p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-4 max-w-2xl">
                <h2 className="text-3xl md:text-4xl font-bold">{t.readyToStart}</h2>
                <p className="text-lg text-gray-300">
                  {t.joinThousands}
                </p>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <Link href="/signup">
                  <Button size="lg" className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700">
                    {t.getStarted}
                  </Button>
                </Link>
                <Link href="/Faucet">
                  <Button size="lg" variant="outline" className="border-gray-600 hover:bg-gray-800">
                    {t.tryDemo}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* New Features Section */}
      <div className="bg-black py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-16" data-aos="fade-up">
            Platform <span className="text-[#F5B056]">Features</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {/* Market Analysis */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 transform transition-all hover:scale-105" data-aos="fade-up" data-aos-delay="100">
              <div className="text-[#F5B056] text-4xl mb-4">
                <FaChartLine />
              </div>
              <h3 className="text-white text-xl font-bold mb-3">Market Analysis</h3>
              <p className="text-gray-400">
                Real-time market data and analysis tools to help you make informed decisions.
              </p>
              <Link href="/market-overview" className="text-[#F5B056] mt-4 inline-block hover:underline">
                Explore Markets →
              </Link>
            </div>
            
            {/* Token Swapping */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 transform transition-all hover:scale-105" data-aos="fade-up" data-aos-delay="200">
              <div className="text-[#F5B056] text-4xl mb-4">
                <FaExchangeAlt />
              </div>
              <h3 className="text-white text-xl font-bold mb-3">Token Swapping</h3>
              <p className="text-gray-400">
                Easily exchange different cryptocurrencies with our simple swap interface.
              </p>
              <Link href="/Swap" className="text-[#F5B056] mt-4 inline-block hover:underline">
                Swap Tokens →
              </Link>
            </div>
            
            {/* NFT Marketplace */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 transform transition-all hover:scale-105" data-aos="fade-up" data-aos-delay="300">
              <div className="text-[#F5B056] text-4xl mb-4">
                <FaPalette />
              </div>
              <h3 className="text-white text-xl font-bold mb-3">NFT Marketplace</h3>
              <p className="text-gray-400">
                Buy, sell, and trade unique digital collectibles on our NFT marketplace.
              </p>
              <Link href="/NFT" className="text-[#F5B056] mt-4 inline-block hover:underline">
                Discover NFTs →
              </Link>
            </div>
            
            {/* Faucet */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 transform transition-all hover:scale-105" data-aos="fade-up" data-aos-delay="400">
              <div className="text-[#F5B056] text-4xl mb-4">
                <FaCoins />
              </div>
              <h3 className="text-white text-xl font-bold mb-3">Token Faucet</h3>
              <p className="text-gray-400">
                Get free tokens to start your journey and explore the CryptoPath ecosystem.
              </p>
              <Link href="/Faucet" className="text-[#F5B056] mt-4 inline-block hover:underline">
                Claim Tokens →
              </Link>
            </div>

            {/* Click-to-Earn Game - NEW FEATURE */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 transform transition-all hover:scale-105 relative overflow-hidden" data-aos="fade-up" data-aos-delay="500">
              <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                NEW
              </div>
              <div className="text-[#F5B056] text-4xl mb-4">
                <FaGamepad />
              </div>
              <h3 className="text-white text-xl font-bold mb-3">Clicker Game</h3>
              <p className="text-gray-400">
                Earn PATH tokens by playing our addictive click-to-earn game with upgrades and boosts.
              </p>
              <Link href="/clickgame" className="text-[#F5B056] mt-4 inline-block hover:underline">
                Play Now →
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Call to Action */}
      <div className="relative bg-gradient-to-b from-gray-900 to-black py-20 px-4 text-center">
        <div className="container mx-auto max-w-3xl" data-aos="fade-up">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Start Your <span className="text-[#F5B056]">Crypto Journey</span>?
          </h2>
          <p className="text-gray-400 text-lg mb-10">
            Join thousands of users exploring the crypto universe with CryptoPath
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/login" className="bg-[#F5B056] text-black font-bold px-8 py-3 rounded-full hover:bg-[#F5B056]/90 transition">
              Get Started Now
            </Link>
            <Link href="/clickgame" className="bg-transparent border-2 border-[#F5B056] text-white font-bold px-8 py-3 rounded-full hover:bg-[#F5B056]/10 transition flex items-center">
              <FaGamepad className="mr-2" /> Try the Game
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// FeatureCard component updated to use language prop
const FeatureCard = ({ icon, title, description, href, imageUrl, delay, language }: FeatureCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={href}>
        <Card className="h-full bg-gray-900/50 border border-gray-800 overflow-hidden transition-all duration-300 hover:border-orange-500/50 hover:bg-gray-800/50">
          <div className="absolute inset-0 overflow-hidden">
            {imageUrl && (
              <div className={`transition-all duration-500 ${isHovered ? 'opacity-20' : 'opacity-10'}`}>
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent z-10" />
              </div>
            )}
          </div>
          
          <CardContent className="p-6 relative z-10">
            <div className="mb-4">{icon}</div>
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-gray-400">{description}</p>
            
            <div className={`mt-4 flex items-center text-orange-500 transition-all duration-300 ${isHovered ? 'translate-x-2' : ''}`}>
              <span className="mr-2">{translations[language].explore}</span> {/* Use language prop */}
              <ArrowRight className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
};

export default LandingPage;