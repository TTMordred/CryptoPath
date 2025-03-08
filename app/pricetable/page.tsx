"use client";

import ParticlesBackground from "@/components/ParticlesBackground";
import HeroSection from "@/components/HeroSection";
import TopMoversSection from "@/components/TopMoversSection";
import CoinTable from "@/components/CoinTable";
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