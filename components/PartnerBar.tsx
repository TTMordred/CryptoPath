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
  return (
    <div className="w-full py-10 bg-black">
      <div className="container mx-auto px-4">
        <div className="flex justify-center items-center gap-16">
          {partners.map((partner) => (
            <a
              key={partner.name}
              href={partner.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group transition-opacity hover:opacity-100 opacity-80"
            >
              <Image
                src={partner.logo}
                alt={`${partner.name} logo`}
                width={170}
                height={60}
                className="brightness-0 invert" // Makes the logos white
              />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}