import Image from "next/image";
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Sparkles, Zap, TrendingUp, Users } from 'lucide-react';

interface Collection {
  id: string;
  name: string;
  description: string;
  image: string;
  bannerImage?: string;
  floorPrice?: string;
  volume24h?: string;
  totalItems?: number;
  owners?: number;
  verified?: boolean;
  category: string;
}

interface FeaturedCollectionsProps {
  collections: Collection[];
}

export default function FeaturedCollections({ collections = [] }: FeaturedCollectionsProps) {
  // If no real data, use sample data
  const sampleCollections: Collection[] = collections.length > 0 ? collections : [
    {
      id: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
      name: 'Bored Ape Yacht Club',
      description: 'The Bored Ape Yacht Club is a collection of 10,000 unique Bored Ape NFTs— unique digital collectibles living on the Ethereum blockchain.',
      image: 'https://i.seadn.io/gae/Ju9CkWtV-1Okvf45wo8UctR-M9He2PjILP0oOvxE89AyiPPGtrR3gysu1Zgy0hjd2xKIgjJJtWIc0ybj4Vd7wv8t3pxDGHoJBzDB?auto=format&dpr=1&w=1000',
      bannerImage: 'https://i.seadn.io/gae/i5dYZRkVCUK97bfprQ3WXyrT9BnLSZtVKGJlKQ919uaUB0sxbngVCioaiyu9r6snqfi2aaTyIvv6DHm4m2R3y7hMajbsv14pSZK8mhs?auto=format&dpr=1&w=3840',
      floorPrice: '30.5',
      volume24h: '450.23',
      totalItems: 10000,
      owners: 6350,
      verified: true,
      category: 'Art'
    },
    {
      id: '0x059edd72cd353df5106d2b9cc5ab83a52287ac3a',
      name: 'Chromie Squiggle by Snowfro',
      description: 'The Chromie Squiggle is the first Art Blocks project ever created - a simple generative algorithm creating unique squiggles with different colors, frequencies, and amplitudes.',
      image: 'https://i.seadn.io/gae/0qG8Y78s198F2QkwOJ92xsHi8qhqBZyjyhw9FWIWHd6lXDcGH_4ReP3T7P3xdLYbfJAkfjF0_TLHQzLH32Rgd9hSINR12Kb5-tZ5?auto=format&dpr=1&w=256',
      bannerImage: 'https://i.seadn.io/gae/d7X5YRFEgJGG-MNt8u9P-oFHvxHPv3LFdYcIr2g_99X9L9YDown2KZ4wLGvFUaBULHzJvKlL75h23QYrCVCkSdCSOMXcpl-J-M4qHw?auto=format&dpr=1&w=1920',
      floorPrice: '11.8',
      volume24h: '135.62',
      totalItems: 9250,
      owners: 3828,
      verified: true,
      category: 'Art Blocks'
    },
    {
      id: '0x39ee2c7b3cb80254225884ca001f57118c8f21b6',
      name: 'Memeland Potatoz',
      description: '9,999 SMALL SPECIES LEADING THE WAY TO MEMELAND.',
      image: 'https://i.seadn.io/gcs/files/129b97582f0071212ee7cf440644fc28.gif?auto=format&dpr=1&w=256',
      bannerImage: 'https://i.seadn.io/gcs/files/62448fe425d5e5e2bd44ded754865f37.png?auto=format&dpr=1&w=1200',
      floorPrice: '0.2448',
      volume24h: '78.35',
      totalItems: 9999,
      owners: 4800,
      verified: true,
      category: 'Meme'
    },
    {
      id: '0xc274a97f1691ef390f662067e95a6eff1f99b504',
      name: 'Tin Fun NFT',
      description: 'Buildspace: Build your own DAO with Javascript | Cohort Alkes | #360 - DAOs are taking over. Build one yourself for fun. Maybe it\'s a meme DAO for your friends. Maybe it\'s a DAO that aims to fix climate change. Up to you. We\'ll be going over things like minting a membership NFT, creating/airdropping a token, public treasuries, and governance using a token!',
      image: 'https://i.seadn.io/s/raw/files/a531bedf317b5ffe5a35d559b5c94cd9.jpg?auto=format&dpr=1&w=256',
      bannerImage: 'https://i.seadn.io/s/primary-drops/0xc274a97f1691ef390f662067e95a6eff1f99b504/31341974:about:media:98e2f8a2-a8aa-46d9-9267-87108353c759.jpeg?auto=format&dpr=1&w=1920',
      floorPrice: '0.0929',
      volume24h: '15.75',
      totalItems: 9999,
      owners: 4200,
      verified: true,
      category: 'China'
    },
    {
      id: '0x60e4d786628fea6478f785a6d7e704777c86a7c6',
      name: 'Mutant Ape Yacht Club',
      description: 'The MUTANT APE YACHT CLUB is a collection of up to 20,000 Mutant Apes that can only be created by exposing an existing Bored Ape to a vial of MUTANT SERUM.',
      image: 'https://i.seadn.io/gae/lHexKRMpw-aoSyB1WdFBff5yfANLReFxHzt1DOj_sg7mS14yARpuvYcUtsyyx-Nkpk6WTcUPF6rLh2D4Xw?auto=format&dpr=1&w=1000',
      floorPrice: '10.2',
      volume24h: '250.15',
      totalItems: 19423,
      owners: 12340,
      verified: true,
      category: 'Art'
    },
    {
      id: '0xed5af388653567af2f388e6224dc7c4b3241c544',
      name: 'Azuki',
      description: 'Azuki starts with a collection of 10,000 avatars that give you membership access to The Garden: a corner of the internet where artists, builders, and web3 enthusiasts meet to create a decentralized future.',
      image: 'https://i.seadn.io/gae/H8jOCJuQokNqGBpkBN5wk1oZwO7LM8bNnrHCaekV2nKjnCqw6UB5oaH8XyNeBDj6bA_n1mjejzhFQUP3O1NfjFLHr3FOaeHcTOOT?auto=format&dpr=1&w=1000',
      floorPrice: '8.75',
      volume24h: '175.45',
      totalItems: 10000,
      owners: 5120,
      verified: true,
      category: 'PFP'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <Sparkles className="mr-2 h-6 w-6 text-yellow-400" />
          Featured Collections
        </h2>
        <Link href="/NFT/collection">
          <Button variant="link" className="text-orange-400 hover:text-orange-300">
            View All Collections
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sampleCollections.map((collection) => (
          <Card key={collection.id} className="overflow-hidden border border-gray-800 bg-black/40 backdrop-blur-sm hover:border-gray-700 transition-all">
            <div className="relative h-32 w-full">
              {collection.bannerImage ? (
                <Image
                  src={collection.bannerImage}
                  alt={`${collection.name} banner`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-r from-gray-800 to-gray-900"></div>
              )}
              <div className="absolute bottom-0 left-4 transform translate-y-1/2">
                <div className="relative h-16 w-16 rounded-xl overflow-hidden border-4 border-black">
                  <Image
                    src={collection.image}
                    alt={collection.name}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              {collection.verified && (
                <div className="absolute top-2 right-2">
                  <Badge className="bg-blue-500 hover:bg-blue-600">
                    <Zap className="h-3 w-3 mr-1" /> Verified
                  </Badge>
                </div>
              )}
            </div>
            
            <CardHeader className="pt-10">
              <Link href={`/NFT/collection/${collection.id}`}>
                <CardTitle className="text-lg cursor-pointer hover:text-orange-400 transition-colors">
                  {collection.name}
                </CardTitle>
              </Link>
              <Badge variant="outline" className="w-fit">
                {collection.category}
              </Badge>
            </CardHeader>
            
            <CardContent>
              <p className="text-sm text-gray-400 line-clamp-2">
                {collection.description}
              </p>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-xs text-gray-500">Floor Price</p>
                  <p className="text-sm font-medium flex items-center">
                    {collection.floorPrice} ETH
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Volume (24h)</p>
                  <p className="text-sm font-medium flex items-center">
                    {collection.volume24h} ETH
                    {parseFloat(collection.volume24h || '0') > 200 && (
                      <TrendingUp className="h-3 w-3 ml-1 text-green-500" />
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between border-t border-gray-800 pt-4">
              <div className="flex items-center text-xs text-gray-400">
                <Users className="h-3 w-3 mr-1" />
                {collection.owners?.toLocaleString()} owners
              </div>
              <div className="flex items-center text-xs text-gray-400">
                {collection.totalItems?.toLocaleString()} items
              </div>
              <Link 
                href={`https://etherscan.io/address/${collection.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300"
              >
                <ExternalLink className="h-4 w-4" />
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      <div className="flex justify-center">
        <Link href="/NFT/collection">
          <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600">
            Explore All Collections
          </Button>
        </Link>
      </div>
    </div>
  );
}