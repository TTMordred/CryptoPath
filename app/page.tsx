'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from "next/legacy/image";
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { FaFacebookF, FaGithub, FaLinkedinIn, FaCoins, FaExchangeAlt, FaPalette, FaChartLine, FaGamepad, FaUsers, FaRocket } from 'react-icons/fa';
import ParticlesBackground from '@/components/ParticlesBackground';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, TrendingUp, Wallet, Box, ChevronDown, BarChart3, Zap, ArrowUpRight } from 'lucide-react';
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
import CountUp from 'react-countup';
import { Swiper, SwiperSlide } from 'swiper/react';

// Import Swiper modules
import SwiperCore from 'swiper';
import { Autoplay, Pagination, Navigation, EffectCoverflow } from 'swiper/modules';

// Install Swiper modules
SwiperCore.use([Autoplay, Pagination, Navigation, EffectCoverflow]);

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/effect-coverflow';

// Remove this line - no longer needed
// SwiperCore.use([Autoplay, Pagination, Navigation, EffectCoverflow]);

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

// New stats for animated counter section
const platformStats = [
  { icon: <FaUsers className="text-blue-400 text-2xl" />, value: 25000, label: "Active Users", suffix: "+" },
  { icon: <BarChart3 className="text-green-400 text-2xl" />, value: 1000000, label: "Transactions Tracked", suffix: "+" },
  { icon: <FaRocket className="text-purple-400 text-2xl" />, value: 99.9, label: "Uptime", suffix: "%" },
  { icon: <Zap className="text-yellow-400 text-2xl" />, value: 240, label: "Blockchains", suffix: "" }
];

// News items for the "What's New" carousel
const whatsNewItems = [
  {
    title: "Multichain Support",
    description: "We've expanded our blockchain explorer to support all major networks including Ethereum, BSC, Polygon, and more.",
    image: "/feature-market.png",
    link: "/market-overview"
  },
  {
    title: "Advanced Analytics",
    description: "New dashboard features with customizable charts and real-time data visualization for crypto assets.",
    image: "/feature-transaction.png",
    link: "/search"
  },
  {
    title: "NFT Collections",
    description: "Explore trending NFT collections across multiple blockchains with our enhanced NFT browser.",
    image: "/feature-nft.png",
    link: "/NFT"
  },
  {
    title: "Play-to-Earn Game",
    description: "Our new click-to-earn game lets you collect PATH tokens while having fun with our ecosystem.",
    image: "/feature-game.png",
    link: "/clickgame"
  }
];

const LandingPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>('sgd');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef(null);
  const statsRef = useRef(null);
  const [statsVisible, setStatsVisible] = useState(false);
  
  // Animated cursor effect - follows mouse with delay
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const cursorVariants = {
    default: {
      x: cursorPos.x - 32,
      y: cursorPos.y - 32,
      transition: {
        type: "spring",
        mass: 1,
        damping: 14,
        stiffness: 120,
        restDelta: 0.001
      }
    }
  };

  // Parallax scroll effect
  const { scrollYProgress } = useScroll();
  const headerOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  
  // Floating elements animation
  const floatingAnimation = {
    y: [0, -10, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      repeatType: "reverse" as const
    }
  };

  // Declare t only once
  const t = translations[language];

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      mirror: true, // Animate elements each time they appear in the viewport
      anchorPlacement: 'top-bottom'
    });

    // Initialize language based on browser preference
    const browserLanguage = getUserLanguage();
    setLanguage(browserLanguage);

    // Get language from localStorage if available
    const storedLanguage = localStorage.getItem('language') as Language;
    if (storedLanguage) {
      setLanguage(storedLanguage);
    }
    
    // Scroll listener for parallax effects
    const handleScroll = () => {
      setScrollY(window.scrollY);
      
      // Check if stats section is in view
      if (statsRef.current) {
        const rect = (statsRef.current as HTMLElement).getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          setStatsVisible(true);
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    // Mouse move listener for custom cursor
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
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

  // Smooth scroll to the next section
  const scrollToNextSection = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth'
    });
  };

  return (
    <div className="relative font-sans overflow-hidden">

      
      
      <ParticlesBackground />
      
      
      
      <EthPriceLine />
     
      {/* Hero Section with 3D Blockchain Visualization */}
      <div className="min-h-screen w-full flex flex-col items-center relative" ref={heroRef} data-aos="fade-up">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10 z-0"></div>
        
        <div className="container mx-auto px-4 flex flex-col h-full z-10">
          {/* CryptoPath Explorer Section */}
          <div className="flex-1 flex flex-col justify-center">
            <CryptoPathExplorer language={language} />
            <div className="flex flex-col md:flex-row items-center">
              <div className="text-center md:text-left md:w-1/2 md:pl-12">
                <motion.p 
                  className="text-[#F5B056] mb-2 md:ml-40 font-medium tracking-wide"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  {t.vietnamPremierCrypto}
                </motion.p>
                <motion.h1 
                  className="text-4xl md:text-6xl font-bold leading-tight text-center md:text-left mx-4 md:ml-40 mb-10 md:mb-20"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  {t.joinAllInOne}
                  <motion.span 
                    className="text-[#F5B056] bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-orange-400"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                  >
                    {t.appInVietnam}
                  </motion.span>
                </motion.h1>
                <form onSubmit={handleSubmit} className="mt-6 flex flex-col md:flex-row gap-4 md:ml-40">
                  <div className="relative w-full md:w-auto">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.6 }}
                    >
                      <input
                        type="email"
                        placeholder={t.emailPlaceholder}
                        value={email}
                        onChange={handleEmailChange}
                        disabled={isSubmitting}
                        className={`px-4 py-3 w-full md:w-64 rounded-[5px] bg-black/50 backdrop-blur-md border ${
                          emailError ? 'border-red-500' : isSuccess ? 'border-green-500' : 'border-gray-700'
                        } text-white focus:outline-none focus:ring-2 focus:ring-[#F5B056] transition-all duration-300`}
                      />
                      {emailError && <p className="text-red-500 text-sm mt-1 absolute">{emailError}</p>}
                      {isSuccess && <p className="text-green-500 text-sm mt-1 absolute">
                        {t.signUpSuccess}
                      </p>}
                    </motion.div>
                  </div>
                  <motion.button 
                    type="submit" 
                    disabled={isSubmitting}
                    className={`cp-button cp-button--primary relative overflow-hidden group ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-amber-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    <span className="relative">{isSubmitting ? t.processing : t.tryCryptoPath}</span>
                  </motion.button>
                </form>
                <div className="md:ml-40 mt-6">
                  <motion.div 
                    className="flex flex-wrap justify-center md:justify-start gap-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1 }}
                  >
                    <Link href="/market-overview">
                      <button className="cp-button cp-button--primary flex items-center group">
                        {t.exploreMarkets} 
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                      </button>
                    </Link>
                    <Link href="/NFT">
                      <Button size="lg" variant="outline" className="border-[#F5B056] text-[#F5B056] hover:bg-[#F5B056]/10 rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-[#F5B056]/20 group">
                        {t.discoverNFTs}
                        <motion.span 
                          className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          animate={{ x: [0, 5, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          ✨
                        </motion.span>
                      </Button>
                    </Link>
                  </motion.div>
                </div>
              </div>

              <div className="md:w-1/2 flex justify-center mt-10 md:mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="relative"
                >

                  <video className="max-w-[300px] mx-auto rounded-xl border border-white/10" autoPlay loop muted playsInline>
                    <source src="/Img/Videos/TradingVideo.webm" type="video/webm" />
                    <source src="/Img/Videos/TradingVideo.mp4" type="video/mp4" />
                  </video>
                  
                  {/* Floating blockchain nodes */}
                  <motion.div 
                    className="absolute -top-10 -left-10 w-20 h-20 rounded-full bg-blue-500/10 backdrop-blur-md border border-blue-500/20"
                    animate={floatingAnimation}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Image src="/icons/eth.svg" width={30} height={30} alt="Ethereum" />
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    className="absolute -bottom-5 -right-5 w-16 h-16 rounded-full bg-amber-500/10 backdrop-blur-md border border-amber-500/20"
                    animate={{
                      ...floatingAnimation,
                      transition: { ...floatingAnimation.transition, delay: 1 }
                    }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Image src="/icons/bnb.svg" width={24} height={24} alt="BNB" />
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    className="absolute top-1/2 -right-12 w-14 h-14 rounded-full bg-purple-500/10 backdrop-blur-md border border-purple-500/20"
                    animate={{
                      ...floatingAnimation,
                      transition: { ...floatingAnimation.transition, delay: 2 }
                    }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Image src="/icons/matic.svg" width={22} height={22} alt="Polygon" />
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </div>
          
          {/* Scroll down indicator */}
          <motion.div 
            className="flex justify-center mt-4 mb-8 cursor-pointer"
            onClick={scrollToNextSection}
            whileHover={{ scale: 1.1 }}
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ChevronDown className="h-8 w-8 text-[#F5B056]" />
          </motion.div>
        </div>
      </div>

<div className="py-24 bg-transparent" ref={statsRef}>
  <div className="container mx-auto px-4">
    <motion.div 
      className="text-center mb-16"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <h2 className="text-3xl md:text-4xl font-bold mb-2">Platform <span className="text-[#F5B056]">Metrics</span></h2>
      <p className="text-gray-400 max-w-2xl mx-auto">Real-time statistics showcasing our blockchain explorer's performance and reach</p>
    </motion.div>
    
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
      {platformStats.map((stat, index) => (
        <motion.div
          key={index}
          className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl p-6 text-center hover:border-[#F5B056]/50 transition-all duration-300 group"
          initial={{ opacity: 0, y: 20 }}
          animate={statsVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          whileHover={{ y: -5, boxShadow: '0 10px 30px -10px rgba(246,179,85,0.2)' }}
        >
          <div className="flex justify-center mb-4">
            <div className="bg-gray-800/50 p-3 rounded-full group-hover:bg-[#F5B056]/10 transition-colors duration-300">
              {stat.icon}
            </div>
          </div>
          <h3 className="text-4xl font-bold text-white mb-2">
            {statsVisible ? (
              <CountUp 
                end={stat.value} 
                duration={2.5} 
                separator="," 
                suffix={stat.suffix}
                decimal="."
                decimals={stat.value % 1 ? 1 : 0}
              />
            ) : '0'}
          </h3>
          <p className="text-gray-400">{stat.label}</p>
        </motion.div>
      ))}
    </div>
  </div>
</div>
      
      {/* What's New Section with Modern Carousel */}
      <div className="py-24 overflow-hidden">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-2">What's <span className="text-[#F5B056]">New</span></h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Latest features and improvements to enhance your blockchain experience</p>
          </motion.div>
          
          <Swiper
  effect={'coverflow'}
  grabCursor={true}
  centeredSlides={true}
  slidesPerView={'auto'}
  coverflowEffect={{
    rotate: 50,
    stretch: 0,
    depth: 100,
    modifier: 1,
    slideShadows: true,
  }}
  autoplay={{
    delay: 3500,
    disableOnInteraction: false,
  }}
  pagination={{
    clickable: true,
  }}
  navigation={true}
  // Remove the modules prop when using SwiperCore.use()
  // modules={[EffectCoverflow, Autoplay, Pagination, Navigation]}
  className="whats-new-swiper"
>
            {whatsNewItems.map((item, index) => (
              <SwiperSlide key={index} className="max-w-md">
                <motion.div 
                  className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl overflow-hidden hover:border-[#F5B056]/30 transition-all duration-300 group"
                  whileHover={{ y: -5 }}
                >
                  <div className="relative h-48 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent z-10"></div>
                    <Image 
                      src={item.image} 
                      alt={item.title}
                      layout="fill"
                      objectFit="cover"
                      className="group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2 text-white group-hover:text-[#F5B056] transition-colors duration-300">{item.title}</h3>
                    <p className="text-gray-400 mb-4">{item.description}</p>
                    <Link href={item.link}>
                      <span className="flex items-center text-[#F5B056] font-medium cursor-pointer">
                        Learn more <ArrowUpRight className="ml-2 h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
                      </span>
                    </Link>
                  </div>
                </motion.div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
      
      <PartnerBar />
      <TrendingProjects />

      {/* Demo Showcase Section with enhanced animations */}
      <DemoShowcase />

      {/* Trade Like a Pro Section */}
      <div className="min-h-screen w-full flex items-center" data-aos="fade-up">
        <div className="container mx-auto px-4 py-12 text-center" data-aos="fade-up">
          <motion.h1 
            className="text-4xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {t.tradeLikePro}<span className="text-[#F5B056]">{t.aPro}</span>
          </motion.h1>
          <motion.p 
            className="text-lg mb-20 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {t.getLowestFees}
          </motion.p>
          <div className="flex justify-center">
            <motion.div 
              className="video-container relative"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="absolute -inset-2 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-purple-500/20 rounded-[20px] blur-xl animate-pulse"></div>
              <video 
                className="w-full rounded-[20px] relative border border-white/10" 
                autoPlay 
                loop 
                muted
                playsInline
              >
                <source src="/Img/Videos/video.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <div className="absolute inset-0 rounded-[20px] border border-#f5b056"></div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section with glass morphism cards */}
      <section className="py-20 px-4 md:px-8 lg:px-12 relative z-10 bg-black/70" data-aos="fade-up">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5 z-0"></div>
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

      {/* Continue with the rest of the page sections with enhanced styling */}
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

     {/* New Features Section - Enhanced grid with hover effects */}
<div className="py-20 px-4 bg-gradient-to-b from-gray-900/50 to-black/50">
  <div className="container mx-auto">
    <motion.h2 
      className="text-3xl md:text-4xl font-bold text-center text-white mb-16"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      data-aos="fade-up"
    >
      Platform <span className="text-[#F5B056]">Features</span>
    </motion.h2>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
      {/* Market Analysis */}
      <motion.div 
        className="glass-card bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-md rounded-xl p-6 border border-gray-800/50 transform transition-all hover:scale-105 hover:border-[#F5B056]/30 relative overflow-hidden group"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        whileHover={{ y: -10 }}
        data-aos="fade-up" 
        data-aos-delay="100"
      >
        <div className="text-[#F5B056] text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
          <FaChartLine />
        </div>
        <h3 className="text-white text-xl font-bold mb-3 group-hover:text-[#F5B056] transition-colors duration-300">Market Analysis</h3>
        <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
          Real-time market data and analysis tools to help you make informed decisions.
        </p>
        <Link href="/market-overview" className="text-[#F5B056] mt-4 inline-block group-hover:translate-x-2 transition-transform duration-300">
          Explore Markets <span className="group-hover:ml-1 transition-all duration-300">→</span>
        </Link>
      </motion.div>

      {/* Token Swapping */}
      <motion.div 
        className="glass-card bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-md rounded-xl p-6 border border-gray-800/50 transform transition-all hover:scale-105 hover:border-[#F5B056]/30 relative overflow-hidden group"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        whileHover={{ y: -10 }}
        data-aos="fade-up" 
        data-aos-delay="200"
      >
        <div className="text-[#F5B056] text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
          <FaExchangeAlt />
        </div>
        <h3 className="text-white text-xl font-bold mb-3 group-hover:text-[#F5B056] transition-colors duration-300">Token Swapping</h3>
        <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
          Easily exchange different cryptocurrencies with our simple swap interface.
        </p>
        <Link href="/Swap" className="text-[#F5B056] mt-4 inline-block group-hover:translate-x-2 transition-transform duration-300">
          Swap Tokens <span className="group-hover:ml-1 transition-all duration-300">→</span>
        </Link>
      </motion.div>

      {/* NFT Marketplace */}
      <motion.div 
        className="glass-card bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-md rounded-xl p-6 border border-gray-800/50 transform transition-all hover:scale-105 hover:border-[#F5B056]/30 relative overflow-hidden group"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        whileHover={{ y: -10 }}
        data-aos="fade-up" 
        data-aos-delay="300"
      >
        <div className="text-[#F5B056] text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
          <FaPalette />
        </div>
        <h3 className="text-white text-xl font-bold mb-3 group-hover:text-[#F5B056] transition-colors duration-300">NFT Marketplace</h3>
        <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
          Buy, sell, and trade unique digital collectibles on our NFT marketplace.
        </p>
        <Link href="/NFT" className="text-[#F5B056] mt-4 inline-block group-hover:translate-x-2 transition-transform duration-300">
          Discover NFTs <span className="group-hover:ml-1 transition-all duration-300">→</span>
        </Link>
      </motion.div>

      {/* Token Faucet */}
      <motion.div 
        className="glass-card bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-md rounded-xl p-6 border border-gray-800/50 transform transition-all hover:scale-105 hover:border-[#F5B056]/30 relative overflow-hidden group"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        whileHover={{ y: -10 }}
        data-aos="fade-up" 
        data-aos-delay="400"
      >
        <div className="text-[#F5B056] text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
          <FaCoins />
        </div>
        <h3 className="text-white text-xl font-bold mb-3 group-hover:text-[#F5B056] transition-colors duration-300">Token Faucet</h3>
        <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
          Get free tokens to start your journey and explore the CryptoPath ecosystem.
        </p>
        <Link href="/Faucet" className="text-[#F5B056] mt-4 inline-block group-hover:translate-x-2 transition-transform duration-300">
          Claim Tokens <span className="group-hover:ml-1 transition-all duration-300">→</span>
        </Link>
      </motion.div>

      {/* Clicker Game (NEW FEATURE) */}
      <motion.div 
        className="glass-card bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-md rounded-xl p-6 border border-gray-800/50 transform transition-all hover:scale-105 hover:border-[#F5B056]/30 relative overflow-hidden group"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        whileHover={{ y: -10 }}
        data-aos="fade-up" 
        data-aos-delay="500"
      >
        <div className="absolute top-2 right-2 bg-gradient-to-r from-green-500 to-emerald-400 text-white text-xs px-3 py-1 rounded-full font-semibold shadow-md">
          NEW
        </div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#F5B056]/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="text-[#F5B056] text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
          <FaGamepad />
        </div>
        <h3 className="text-white text-xl font-bold mb-3 group-hover:text-[#F5B056] transition-colors duration-300">Clicker Game</h3>
        <p className="text-gray-300">
          Earn PATH tokens by playing our addictive click-to-earn game with upgrades and boosts.
        </p>
        <Link href="/clickgame" className="flex items-center text-[#F5B056] mt-6 group-hover:translate-x-2 transition-transform duration-300 font-medium">
          Play Now <ArrowRight className="ml-2 h-4 w-4 group-hover:ml-3 transition-all duration-300" />
        </Link>
        <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-[#F5B056]/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      </motion.div>

      {/* Add Search Function Feature (BETA) */}
      <motion.div 
        className="glass-card bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-md rounded-xl p-6 border border-gray-800/50 transform transition-all hover:scale-105 hover:border-blue-500/30 relative overflow-hidden group"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        whileHover={{ y: -10 }}
        data-aos="fade-up" 
        data-aos-delay="600"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-600 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
        <div className="absolute top-2 right-2 bg-gradient-to-r from-blue-500 to-indigo-400 text-white text-xs px-3 py-1 rounded-full font-semibold shadow-md">
          HOT
        </div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="text-blue-400 text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
        <h3 className="text-white text-xl font-bold mb-3 group-hover:text-blue-400 transition-colors duration-300">Blockchain Search</h3>
        <p className="text-gray-300">
          Explore blockchain transactions, addresses, and tokens with our powerful search engine. Get detailed insights into any blockchain activity.
        </p>
        <Link href="/search" className="flex items-center text-blue-400 mt-6 group-hover:translate-x-2 transition-all duration-300 font-medium">
          Search Blockchain <ArrowRight className="ml-2 h-4 w-4 group-hover:ml-3 transition-all duration-300" />
        </Link>
        <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-blue-500/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      </motion.div>
    </div>
  </div>
</div>

      
      {/* Call to Action with enhanced visual effects */}
      <div className="relative py-28 px-4 text-center overflow-hidden">
        {/* Background Elements */}
        <div className="py-24 bg-transparent"></div>
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10 z-0"></div>
        
        {/* Dynamic animated glow effects */}
        <motion.div 
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#F5B056]/20 rounded-full blur-[100px]"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2] 
          }}
          transition={{ 
            duration: 4,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-[100px]"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2] 
          }}
          transition={{ 
            duration: 4,
            delay: 2,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
        
        <motion.div 
          className="container mx-auto max-w-4xl relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          data-aos="fade-up"
        >
          <div className="relative">
            <motion.span 
              className="absolute -top-10 left-1/2 transform -translate-x-1/2 text-5xl"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.2, 0.5, 0.2] 
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity
              }}
            >
              ✨
            </motion.span>
            
            <motion.h2 
              className="text-3xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-[#F5B056] to-white"
              animate={{ 
                backgroundPosition: ['0% center', '100% center', '0% center'],
              }}
              transition={{ 
                duration: 10,
                repeat: Infinity
              }}
            >
              Ready to Start Your <span className="text-[#F5B056]">Crypto Journey</span>?
            </motion.h2>
            
            <div className="w-24 h-1 bg-gradient-to-r from-[#F5B056] to-purple-500 mx-auto my-8 rounded-full"></div>
            
            <p className="text-gray-300 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
              Join thousands of users exploring the crypto universe with CryptoPath's intuitive tools and comprehensive analytics
            </p>
            
            <div className="flex flex-wrap justify-center gap-6 mt-10">
              <Link href="/login">
                <motion.button 
                  className="relative group overflow-hidden rounded-full"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-[#F5B056] to-orange-500 group-hover:from-orange-500 group-hover:to-[#F5B056] transition-all duration-500"></span>
                  <span className="relative block px-8 py-4 font-bold text-black">
                    Get Started Now
                  </span>
                  <span className="absolute bottom-0 left-0 h-1 w-0 bg-white group-hover:w-full transition-all duration-500"></span>
                </motion.button>
              </Link>
              
              <Link href="/clickgame">
                <motion.button 
                  className="relative group overflow-hidden rounded-full px-8 py-4 bg-transparent border-2 border-[#F5B056] text-white hover:text-[#F5B056] transition-colors duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="absolute inset-0 bg-[#F5B056]/0 group-hover:bg-[#F5B056]/10 transition-colors duration-300"></span>
                  <span className="relative flex items-center">
                    <FaGamepad className="mr-2 group-hover:scale-110 transition-transform duration-300" /> 
                    <span className="font-bold">Try the Game</span>
                  </span>
                </motion.button>
              </Link>
            </div>
            
            {/* Trust indicators */}
            <motion.div 
              className="mt-16 flex flex-col items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <p className="text-gray-400 mb-4 text-sm uppercase tracking-widest">Trusted by crypto enthusiasts</p>
              <div className="flex items-center gap-1 text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <motion.svg 
                    key={i}
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 + i * 0.1 }}
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </motion.svg>
                ))}
                <span className="ml-2 text-white font-bold">4.9/5</span>
              </div>
              <p className="text-sm text-gray-400 mt-2">Based on 2,500+ user reviews</p>
            </motion.div>
          </div>
        </motion.div>
      </div>
      
      {/* Add global styles */}
      <style jsx global>{`
        .glass-card {
          position: relative;
          backdrop-filter: blur(10px);
          transition: all 0.5s ease;
          box-shadow: 0 10px 30px -15px rgba(0,0,0,0.3);
        }
        
        .glass-card:hover {
          box-shadow: 0 15px 30px -10px rgba(246,179,85,0.2);
        }
        
        .whats-new-swiper {
          width: 100%;
          padding-top: 50px;
          padding-bottom: 50px;
        }
        
        .whats-new-swiper .swiper-slide {
          width: 300px;
          height: 360px;
          margin: 0 20px;
        }
        
        @media (min-width: 768px) {
          .whats-new-swiper .swiper-slide {
            width: 400px;
          }
        }
        
        .swiper-pagination-bullet {
          background: rgba(246,179,85,0.5) !important;
        }
        
        .swiper-pagination-bullet-active {
          background: #F5B056 !important;
        }
      `}</style>
    </div>
  );
};

// FeatureCard component enhanced with more interactive elements
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
        <Card className="h-full bg-black/60 backdrop-blur-md border border-gray-800/50 overflow-hidden transition-all duration-500 hover:border-orange-500/50 hover:bg-gray-800/50 group">
          <div className="absolute inset-0 overflow-hidden">
            {imageUrl && (
              <div className={`transition-all duration-500 ${isHovered ? 'opacity-20 scale-110' : 'opacity-10 scale-100'}`}>
                <Image
                  src={imageUrl}
                  layout="fill"
                  objectFit="cover"
                  alt={title}
                  className="transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent z-10" />
              </div>
            )}
          </div>
          
          <CardContent className="p-6 relative z-10">
            <motion.div 
              className="mb-4 text-orange-500"
              animate={isHovered ? { 
                scale: [1, 1.2, 1],
                rotate: [0, 5, 0],
                transition: { duration: 0.5 }
              } : {}}
            >
              {icon}
            </motion.div>
            <h3 className="text-xl font-semibold mb-2 group-hover:text-orange-400 transition-colors duration-300">{title}</h3>
            <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">{description}</p>
            
            <div className={`mt-4 flex items-center text-orange-500 transition-all duration-300 ${isHovered ? 'translate-x-2' : ''}`}>
              <span className="mr-2">{translations[language].explore}</span>
              <ArrowRight className={`h-4 w-4 transition-all duration-300 ${isHovered ? 'translate-x-1' : ''}`} />
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
};

export default LandingPage;