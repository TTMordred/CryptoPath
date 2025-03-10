"use client";

import ParticlesBackground from "@/components/ParticlesBackground";
import HeroSection from "@/components/HeroSection";
import TopMoversSection from "@/components/table/TopMoversSection";
import CoinTable from "@/components/table/CoinTable";
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