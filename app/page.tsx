'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { FaFacebookF, FaGithub, FaLinkedinIn } from 'react-icons/fa';
import ParticlesBackground from '@/components/ParticlesBackground';
import FAQ from './FAQ';
import AOS from 'aos';
import 'aos/dist/aos.css';
import PartnerBar from '@/components/PartnerBar';
import toast from 'react-hot-toast';

type Tab = 'sgd' | 'web3';

// Language types
type Language = 'en' | 'vi';

// Translation object
const translations = {
  en: {
    vietnamPremierCrypto: "Vietnam's Premier Crypto Platform",
    joinAllInOne: "Join the all-in-one crypto ",
    appInVietnam: "app in Vietnam",
    emailPlaceholder: "Your Email Address...",
    signUpSuccess: "Sign Up Successfully!",
    processing: "Processing...",
    tryCryptoPath: "Try CryptoPath",
    tradeLikePro: "Trade like ",
    aPro: "a pro",
    getLowestFees: "Get the lowest fees, fastest transactions, powerful APIs, and more",
    oneApplication: "One Application. ",
    infinitePotential: "Infinite Potential",
    exploreNFTMarketplace: "Explore the world's best NFT marketplace, DEX, and wallets supporting all your favorite chains.",
    exploreDecentralized: "Explore decentralized applications and experience cutting-edge blockchain technology.",
    exchange: "Exchange",
    web3: "Web3",
    accompanyingYou: "Accompanying You ",
    everyStep: "Every Step of the Way",
    fromCryptoTransactions: "From cryptocurrency transactions to your first NFT purchase, CryptoPath will guide you through the entire process.",
    believeInYourself: "Believe in yourself and never stop learning.",
    meetTheTeam: "Meet the ",
    team: "Team",
    willingToListen: "We are always willing to listen to everyone!",
    whatIsCryptoPath: "What is ",
    cryptoPath: "CryptoPath?",
    hearFromTopIndustry: "Hear from top industry leaders to understand",
    whyCryptoPathIsFavorite: "why CryptoPath is everyone's favorite application.",
    learnMore: "Learn More",
    whatIsCryptocurrency: "What is Cryptocurrency?",
    explainingNewCurrency: "Explaining the \"new currency of the world\"",
    redefiningSystem: "Redefining the system",
    welcomeToWeb3: "Welcome to Web3",
    whatIsBlockchain: "What is Blockchain?",
    understandBlockchain: "Understand how Blockchain works",
    trustedBy: "Trusted",
    industryLeaders: "by industry leaders",
    testimonialText: "\"CryptoPath is an amazing platform for tracking transactions. I can't even picture what the world would be like without it\"",
    founderOf: "Founder of CryptoPath",
    readyToStart: "Ready to start your crypto journey?",
    joinThousands: "Join thousands of Vietnamese users who are already trading, investing, and earning with CryptoPath.",
    downloadNow: "Download Now",
    pleaseEnterEmail: "Please enter your email address",
    pleaseEnterValidEmail: "Please enter a valid email address",
    errorOccurred: "An error occurred while registering!",
    registrationSuccessful: "Registration successful! Please check your email."
  },
  vi: {
    vietnamPremierCrypto: "Nền tảng Crypto hàng đầu Việt Nam",
    joinAllInOne: "Tham gia ứng dụng crypto ",
    appInVietnam: "tất cả trong một ở Việt Nam",
    emailPlaceholder: "Địa chỉ Email của bạn...",
    signUpSuccess: "Đăng ký thành công!",
    processing: "Đang xử lý...",
    tryCryptoPath: "Dùng thử CryptoPath",
    tradeLikePro: "Giao dịch như ",
    aPro: "chuyên gia",
    getLowestFees: "Nhận phí thấp nhất, giao dịch nhanh nhất, API mạnh mẽ và nhiều hơn nữa",
    oneApplication: "Một ứng dụng. ",
    infinitePotential: "Tiềm năng vô hạn",
    exploreNFTMarketplace: "Khám phá thị trường NFT, DEX tốt nhất thế giới và ví hỗ trợ tất cả các chuỗi yêu thích của bạn.",
    exploreDecentralized: "Khám phá các ứng dụng phi tập trung và trải nghiệm công nghệ blockchain tiên tiến.",
    exchange: "Sàn giao dịch",
    web3: "Web3",
    accompanyingYou: "Đồng hành cùng bạn ",
    everyStep: "trong từng bước đi",
    fromCryptoTransactions: "Từ giao dịch tiền điện tử đến việc mua NFT đầu tiên, CryptoPath sẽ hướng dẫn bạn qua toàn bộ quá trình.",
    believeInYourself: "Hãy tin vào chính mình và không ngừng học hỏi.",
    meetTheTeam: "Gặp gỡ ",
    team: "Đội ngũ",
    willingToListen: "Chúng tôi luôn sẵn sàng lắng nghe mọi người!",
    whatIsCryptoPath: "CryptoPath ",
    cryptoPath: "là gì?",
    hearFromTopIndustry: "Lắng nghe từ các nhà lãnh đạo hàng đầu trong ngành để hiểu",
    whyCryptoPathIsFavorite: "tại sao CryptoPath là ứng dụng yêu thích của mọi người.",
    learnMore: "Tìm hiểu thêm",
    whatIsCryptocurrency: "Tiền điện tử là gì?",
    explainingNewCurrency: "Giải thích về \"đồng tiền mới của thế giới\"",
    redefiningSystem: "Định nghĩa lại hệ thống",
    welcomeToWeb3: "Chào mừng đến với Web3",
    whatIsBlockchain: "Blockchain là gì?",
    understandBlockchain: "Hiểu cách Blockchain hoạt động",
    trustedBy: "Được tin dùng",
    industryLeaders: "bởi các nhà lãnh đạo ngành",
    testimonialText: "\"CryptoPath là một nền tảng tuyệt vời để theo dõi giao dịch. Tôi thậm chí không thể tưởng tượng thế giới sẽ như thế nào nếu không có nó\"",
    founderOf: "Nhà sáng lập CryptoPath",
    readyToStart: "Sẵn sàng bắt đầu hành trình tiền điện tử của bạn?",
    joinThousands: "Tham gia cùng hàng nghìn người dùng Việt Nam đang giao dịch, đầu tư và kiếm tiền với CryptoPath.",
    downloadNow: "Tải xuống ngay",
    pleaseEnterEmail: "Vui lòng nhập địa chỉ email của bạn",
    pleaseEnterValidEmail: "Vui lòng nhập địa chỉ email hợp lệ",
    errorOccurred: "Đã xảy ra lỗi khi đăng ký!",
    registrationSuccessful: "Đăng ký thành công! Vui lòng kiểm tra email của bạn."
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

const HomePage = () => {
  const [activeTab, setActiveTab] = useState<Tab>('sgd');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    AOS.init({
      duration: 1000, // Animation duration (in ms)
      once: true, // Whether animation should happen only once while scrolling down
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
      setEmailError(translations[language].pleaseEnterEmail);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError(translations[language].pleaseEnterValidEmail);
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
        throw new Error(data.message || translations[language].errorOccurred);
      }

      // Handle success
      setEmail('');
      setIsSuccess(true);
      
      // Success message based on language
      toast.success(translations[language].registrationSuccessful);
      
    } catch (error) {
      console.error(language === 'en' ? 'Error:' : 'Lỗi:', error);
      toast.error(error instanceof Error ? error.message : translations[language].errorOccurred);
    } finally {
      setIsSubmitting(false);
    }
  };

  const t = translations[language];

  return (
    <div className="relative font-sans">
      <ParticlesBackground />

      <div className="relative z-10 bg-transparent">
        {/* Description Section */}
        <div className="min-h-screen w-full flex items-center" data-aos="fade-up">
          <div className="container mx-auto px-4">
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
                      className={`px-4 py-3 w-full md:w-64 rounded-md bg-gray-900 border ${
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

        <PartnerBar />

        {/* Trade Like a Pro Section */}
        <div className="min-h-screen w-full flex items-center" data-aos="fade-up">
          <div className="container mx-auto px-4 py-12 text-center" data-aos="fade-up">
            <h1 className="text-4xl font-bold mb-4">{t.tradeLikePro}<span className="text-[#F5B056]">{t.aPro}</span></h1>
            <p className="text-lg mb-20">
              {t.getLowestFees}
            </p>
            <div className="flex justify-center">
              <div className="video-container relative">
                <div className="absolute -inset-1 bg-[#F5B056]/20 rounded-lg blur"></div>
                <video 
                  className="w-full rounded-lg border-4 border-black relative" 
                  autoPlay 
                  loop 
                  muted
                  playsInline
                >
                  <source src="/Img/Videos/video.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                <div className="absolute inset-0 rounded-lg border border-white"></div>
              </div>
            </div>
          </div>
        </div>

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
            <div className="w-full md:w-1/2 text-center md:text-left mt-8 md:mt-0">
              <h1 className="text-4xl font-bold mb-4">{t.oneApplication}<span className="text-[#F5B056]">{t.infinitePotential}</span></h1>
              <p className="text-lg mb-6">
                {activeTab === 'sgd' ? t.exploreNFTMarketplace : t.exploreDecentralized}
              </p>
              <div className="flex justify-center md:justify-start space-x-4">
                <button
                  className={`px-4 py-2 rounded-md font-semibold ${
                    activeTab === 'sgd' ? 'bg-[#F5B056] hover:bg-[#ff6500] text-black' : 'bg-black text-white'
                  }`}
                  onClick={() => switchContent('sgd')}
                >
                  {t.exchange}
                </button>
                <button
                  className={`px-4 py-2 rounded-md font-semibold ${
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
              <div className="absolute -inset-1 bg-[#ff6500]/20 rounded-lg blur"></div>
              <video className="max-w-full relative rounded-lg" autoPlay loop muted playsInline>
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
                <div key={member.name} className="group flex flex-col items-center bg-black/30 p-6 rounded-lg border border-transparent transition duration-300">
  
                {/* Profile Image */}
                <div className="w-36 h-36 rounded-full overflow-hidden border-2 border-transparent group-hover:border-[#F5B056] transition duration-300">
                  <Image
                    src={member.image}
                    alt={`${member.name}'s profile`}
                    width={144}
                    height={144}
                    className="object-cover w-full h-full"
                  />
                </div>

                  {/* Name & Role */}
                  <h3 className="mt-4 text-xl font-semibold">{member.name}</h3>
                  <p className="text-[#F5B056]">{member.role}</p>
                  <p className="text-gray-300 text-center text-sm mt-2">{member.bio}</p>

                  {/* Social Icons */}
                  <div className="flex space-x-4 mt-4">
                    {member.facebook && (
                      <a
                        href={member.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-300 hover:text-[#F5B056] transition duration-300"
                        aria-label={`${member.name}'s Facebook profile`}
                      >
                        <FaFacebookF />
                      </a>
                    )}
                    {member.github && (
                      <a
                        href={member.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-300 hover:text-[#F5B056] transition duration-300"
                        aria-label={`${member.name}'s GitHub profile`}
                      >
                        <FaGithub />
                      </a>
                    )}
                    {member.linkedin && (
                      <a
                        href={member.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-300 hover:text-[#F5B056] transition duration-300"
                        aria-label={`${member.name}'s LinkedIn profile`}
                      >
                        <FaLinkedinIn />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CryptoPath Introduction and Trusted Leaders Section */}
        <div className="container mx-auto px-4 py-8" data-aos="fade-up">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">{t.whatIsCryptoPath}<span className="text-[#F5B056]">{t.cryptoPath}</span></h1>
            <p className="text-lg mb-6">
              {t.hearFromTopIndustry}
              <br />
              {t.whyCryptoPathIsFavorite}
            </p>
            <button
              id="btn-learnmore"
              className="bg-[#F5B056] text-black px-6 py-3 rounded-lg font-semibold hover:bg-opacity-80 transition"
            >
              {t.learnMore}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {/* Video 1: YouTube Embed */}
            <div className="bg-black/30 rounded-lg overflow-hidden border border-gray-800 hover:border-[#F5B056] transition duration-300" data-aos="fade-right">
              <iframe
                className="w-full aspect-video"
                src="https://www.youtube.com/embed/erzVdnTaBKk"
                title="What is Cryptocurrency?"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
              <div className="p-4">
                <h2 className="text-xl font-bold">{t.whatIsCryptocurrency}</h2>
                <p className="text-sm text-gray-400">{t.explainingNewCurrency}</p>
              </div>
            </div>

            {/* Video 2: YouTube Embed */}
            <div className="bg-black/30 rounded-lg overflow-hidden border border-gray-800 hover:border-[#F5B056] transition duration-300" data-aos="fade-up">
              <iframe
                className="w-full aspect-video"
                src="https://www.youtube.com/embed/oD98Jshj1QE"
                title="Redefining the system"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
              <div className="p-4">
                <h2 className="text-xl font-bold">{t.redefiningSystem}</h2>
                <p className="text-sm text-gray-400">{t.welcomeToWeb3}</p>
              </div>
            </div>

            {/* Video 3: YouTube Embed */}
            <div className="bg-black/30 rounded-lg overflow-hidden border border-gray-800 hover:border-[#F5B056] transition duration-300" data-aos="fade-left">
              <iframe
                className="w-full aspect-video"
                src="https://www.youtube.com/embed/sTFZras-1Lo"
                title="What is Blockchain?"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
              <div className="p-4">
                <h2 className="text-xl font-bold">{t.whatIsBlockchain}</h2>
                <p className="text-sm text-gray-400">{t.understandBlockchain}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Trusted Leaders Section */}
        <div className="container mx-auto px-4 py-12" data-aos="fade-up">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold">
              <span>{t.trustedBy}</span> <span className="text-[#F5B056]">{t.industryLeaders}</span>
            </h1>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-16 text-center">
            <div className="trusted-logo">
              <img
                src="/Img/Trusted Leader/facebook-better.svg"
                alt="Facebook"
                className="mx-auto mb-4 w-12"
              />
              <p className="text-black">Facebook</p>
            </div>
            <div className="trusted-logo">
              <img
                src="/Img/Trusted Leader/apple-better.svg"
                alt="Apple"
                className="mx-auto mb-4 w-12"
              />
              <p className="text-black">Apple</p>
            </div>
            <div className="trusted-logo">
              <img
                src="/Img/Trusted Leader/amazon-better.svg"
                alt="Amazon"
                className="mx-auto mb-4 w-12"
              />
              <p className="text-black">Amazon</p>
            </div>
            <div className="trusted-logo">
              <img
                src="/Img/Trusted Leader/netflix-better.svg"
                alt="Netflix"
                className="mx-auto mb-4 w-12"
              />
              <p className="text-black">Netflix</p>
            </div>
            <div className="trusted-logo">
              <img
                src="/Img/Trusted Leader/google-better.svg"
                alt="Google"
                className="mx-auto mb-4 w-12"
              />
              <p className="text-black">Google</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center space-y-6 md:space-y-0 md:space-x-12">
            <div>
              <img
                src="/minhduy.png"
                alt="Minh Duy Nguyen"
                className="w-32 h-32 rounded-full mx-auto border-2 border-[#F5B056]"
              />
            </div>
            <div className="text-center md:text-left">
              <p className="text-lg italic mb-4">
                {t.testimonialText}
              </p>
              <p className="font-bold text-[#ff6500]">Nguyen Minh Duy</p>
              <p>{t.founderOf}</p>
            </div>
          </div>
        </div>

        {/* CTA Section (New) */}
        <div className="container mx-auto px-4 py-12" data-aos="fade-up">
          <div className="bg-gradient-to-r from-[#F5B056]/20 to-black rounded-lg p-8 text-center max-w-4xl mx-auto border border-black">
            <h2 className="text-3xl font-bold mb-4">{t.readyToStart}</h2>
            <p className="text-lg mb-8">
              {t.joinThousands}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button className="bg-[#F5B056] text-black px-8 py-3 rounded-lg font-semibold hover:bg-opacity-80 transition">
                {t.downloadNow}
              </button>
              <button className="bg-transparent border border-[#F5B056] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#F5B056]/10 transition">
                {t.learnMore}
              </button>
            </div>
          </div>
        </div>

        {/* Insert FAQ component here - Pass language to FAQ component */}
        <FAQ language={language} />
      </div>
    </div>
  );
};

export default HomePage;