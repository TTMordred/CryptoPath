"use client";

import ParticlesBackground from "@/components/ParticlesBackground";
import HeroSection from "@/components/Price/HeroSection";
import TopMoversSection from "@/components/Price/TopMoversSection";
import CoinTable from "@/components/Price/CoinTable";
// ----------------- Main Page Component -----------------
const Page = () => {
  return (
    <>
    <ParticlesBackground ></ParticlesBackground>
    <HeroSection></HeroSection>
    <TopMoversSection></TopMoversSection>
    <CoinTable ></CoinTable>
    </>
  );
};
export default Page;