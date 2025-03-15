import { useEffect, useRef } from 'react';
import Image from 'next/image';

const partners = [
  {
    name: 'Ethereum',
    logo: '/partners/ethereum.svg',
    url: 'https://ethereum.org'
  },
  {
    name: 'Neo4j',
    logo: '/partners/neo4j.svg',
    url: 'https://neo4j.com'
  },
  {
    name: 'Etherscan',
    logo: '/partners/etherscan.svg',
    url: 'https://etherscan.io'
  },
  {
    name: 'Next.js',
    logo: '/partners/nextjs.svg',
    url: 'https://nextjs.org'
  }
];

export default function PartnerBar() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Add subtle floating animation
  useEffect(() => {
    const logoElements = containerRef.current?.querySelectorAll('.partner-logo');
    if (logoElements) {
      logoElements.forEach((logo, index) => {
        (logo as HTMLElement).style.animationDelay = `${index * 0.2}s`;
      });
    }
  }, []);

  return (
    <div className="w-full py-16 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-[#1a1a1a]/80 to-black/90 z-0"></div>
      
      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-10 z-0"></div>
      
      <div className="cp-container relative z-10">
        <div className="text-center mb-10">
          <h4 className="text-xl font-medium text-white/70">Powered by Industry Leaders</h4>
          <div className="w-20 h-1 bg-gradient-to-r from-[#F5B056] to-[#ff6500] mx-auto mt-3"></div>
        </div>
        
        <div 
          ref={containerRef} 
          className="flex justify-center flex-wrap items-center gap-16 md:gap-24"
        >
          {partners.map((partner) => (
            <a
              key={partner.name}
              href={partner.url}
              target="_blank"
              rel="noopener noreferrer"
              className="partner-logo group relative transition-all duration-500 hover:scale-110"
              aria-label={partner.name}
            >
              {/* Glow effect on hover */}
              <div className="absolute inset-0 bg-[#F5B056]/0 group-hover:bg-[#F5B056]/20 rounded-full blur-xl -z-10 transition-all duration-300 opacity-0 group-hover:opacity-100"></div>
              
              <div className="relative h-16 w-[180px] flex items-center justify-center">
                <Image
                  src={partner.logo}
                  alt={`${partner.name} logo`}
                  width={160}
                  height={60}
                  className="brightness-0 invert opacity-60 group-hover:opacity-100 transition-all duration-300"
                  style={{ animation: 'float 6s ease-in-out infinite' }}
                />
              </div>
              
              {/* Tooltip on hover */}
              <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-white/60 opacity-0 group-hover:opacity-100 transition-all duration-300">
                {partner.name}
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}