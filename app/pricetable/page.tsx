"use client";

import ParticlesBackground from "@/components/ParticlesBackground";
import HeroSection from "@/components/tokentable/HeroSection";
import TopMoversSection from "@/components/tokentable/TopMoversSection";
import CoinTable from "@/components/tokentable/CoinTable";
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