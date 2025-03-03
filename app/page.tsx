'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { FaFacebookF, FaGithub, FaLinkedinIn } from 'react-icons/fa';
import ParticlesBackground from '@/components/ParticlesBackground';
import FAQ from './FAQ';
import AOS from 'aos';
import 'aos/dist/aos.css';
import PartnerBar from '@/components/PartnerBar';

type Tab = 'sgd' | 'web3';

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

  useEffect(() => {
    AOS.init({
      duration: 1000, // Animation duration (in ms)
      once: true, // Whether animation should happen only once while scrolling down
    });
  }, []);

  const switchContent = (tab: Tab) => {
    setActiveTab(tab);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setEmailError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setEmailError('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    // Submit email logic here
    console.log('Email submitted:', email);
    setEmail('');
    // You could add a success message here
  };

  return (
    <div className="relative font-sans">
      <ParticlesBackground />

      <div className="relative z-10 bg-transparent">
        {/* Description Section */}
        <div className="min-h-screen w-full flex items-center" data-aos="fade-up">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center">
              <div className="text-center md:text-left md:w-1/2 md:pl-12">
                <p className="text-[#F5B056] mb-2 md:ml-40">Vietnam's Premier Crypto Platform</p>
                <h1 className="text-4xl md:text-6xl font-bold leading-tight text-center md:text-left mx-4 md:ml-40 mb-10 md:mb-20">
                  Join the all-in-one crypto <span className="text-[#F5B056]">app in Vietnam</span>
                </h1>
                <form onSubmit={handleSubmit} className="mt-6 flex flex-col md:flex-row gap-4 md:ml-40">
                  <div className="relative w-full md:w-auto">
                    <input
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={handleEmailChange}
                      className={`px-4 py-3 w-full md:w-64 rounded-md bg-gray-900 border ${emailError ? 'border-red-500' : 'border-gray-700'} text-white focus:outline-none`}
                    />
                    {emailError && <p className="text-red-500 text-sm mt-1 absolute">{emailError}</p>}
                  </div>
                  <button type="submit" className="cp-button cp-button--primary">
                    Try CryptoPath
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
            <h1 className="text-4xl font-bold mb-4">Trade like <span className="text-[#F5B056]">a pro</span></h1>
            <p className="text-lg mb-20">
              Get the lowest fees, fastest transactions, powerful APIs, and more
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
              <h1 className="text-4xl font-bold mb-4">One Application. <span className="text-[#F5B056]">Infinite Potential</span></h1>
              <p className="text-lg mb-6">
                {activeTab === 'sgd'
                  ? "Explore the world's best NFT marketplace, DEX, and wallets supporting all your favorite chains."
                  : 'Explore decentralized applications and experience cutting-edge blockchain technology.'}
              </p>
              <div className="flex justify-center md:justify-start space-x-4">
                <button
                  className={`px-4 py-2 rounded-md font-semibold ${
                    activeTab === 'sgd' ? 'bg-[#F5B056] hover:bg-[#ff6500] text-black' : 'bg-black text-white'
                  }`}
                  onClick={() => switchContent('sgd')}
                >
                  Exchange
                </button>
                <button
                  className={`px-4 py-2 rounded-md font-semibold ${
                    activeTab === 'web3' ? 'bg-[#F5B056] text-black' : 'bg-black text-white'
                  }`}
                  onClick={() => switchContent('web3')}
                >
                  Web3
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Evolution Illustration Section */}
        <div className="container mx-auto px-4 py-12 text-center" data-aos="fade-up">
          <h1 className="text-4xl font-bold mb-4">Accompanying You <span className="text-[#F5B056]">Every Step of the Way</span></h1>
          <p className="text-lg mb-12">
            From cryptocurrency transactions to your first NFT purchase, CryptoPath will guide you through the entire process.
            <br />
            Believe in yourself and never stop learning.
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
              Meet the <span className="text-[#ff6500]">Team</span>
            </h2>
            <p className="mt-2 text-base md:text-lg text-gray-300">
              We are always willing to listen to everyone!
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
            <h1 className="text-4xl font-bold mb-4">What is <span className="text-[#F5B056]">CryptoPath?</span></h1>
            <p className="text-lg mb-6">
              Hear from top industry leaders to understand
              <br />
              why CryptoPath is everyone's favorite application.
            </p>
            <button
              id="btn-learnmore"
              className="bg-[#F5B056] text-black px-6 py-3 rounded-lg font-semibold hover:bg-opacity-80 transition"
            >
              Learn More
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
                <h2 className="text-xl font-bold">What is Cryptocurrency?</h2>
                <p className="text-sm text-gray-400">Explaining the "new currency of the world"</p>
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
                <h2 className="text-xl font-bold">Redefining the system</h2>
                <p className="text-sm text-gray-400">Welcome to Web3</p>
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
                <h2 className="text-xl font-bold">What is Blockchain?</h2>
                <p className="text-sm text-gray-400">Understand how Blockchain works</p>
              </div>
            </div>
          </div>
        </div>

        {/* Trusted Leaders Section */}
        
        <div className="container mx-auto px-4 py-12" data-aos="fade-up">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold">
              <span>Trusted</span> by <span className="text-[#F5B056]">industry leaders</span>
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
                "CryptoPath is an amazing platform for tracking transactions. I can't even picture what the world would be like without it"
              </p>
              <p className="font-bold text-[#ff6500]">Nguyen Minh Duy</p>
              <p>Founder of CryptoPath</p>
            </div>
          </div>
        </div>

        {/* CTA Section (New) */}
        <div className="container mx-auto px-4 py-12" data-aos="fade-up">
          <div className="bg-gradient-to-r from-[#F5B056]/20 to-black rounded-lg p-8 text-center max-w-4xl mx-auto border border-black">
            <h2 className="text-3xl font-bold mb-4">Ready to start your crypto journey?</h2>
            <p className="text-lg mb-8">
              Join thousands of Vietnamese users who are already trading, investing, and earning with CryptoPath.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button className="bg-[#F5B056] text-black px-8 py-3 rounded-lg font-semibold hover:bg-opacity-80 transition">
                Download Now
              </button>
              <button className="bg-transparent border border-[#F5B056] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#F5B056]/10 transition">
                Learn More
              </button>
            </div>
          </div>
        </div>

        {/* Insert FAQ component here */}
        <FAQ />
      </div>
    </div>
  );
};

export default HomePage;