import { toast } from "sonner";
import axios from 'axios';

const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || 'demo';

const CHAIN_ID_TO_NETWORK: Record<string, string> = {
  '0x1': 'eth-mainnet',
  '0x5': 'eth-goerli',
  '0xaa36a7': 'eth-sepolia',
  '0x89': 'polygon-mainnet',
  '0x13881': 'polygon-mumbai',
  '0xa': 'optimism-mainnet',
  '0xa4b1': 'arbitrum-mainnet',
  '0x38': 'bsc-mainnet',
  '0x61': 'bsc-testnet',
};

interface AlchemyNFTResponse {
  ownedNfts: any[];
  totalCount: number;
  pageKey?: string;
}

interface CollectionMetadata {
  name: string;
  symbol: string;
  totalSupply: string;
  description: string;
  imageUrl: string;
}

// Real Ethereum collections
const mockCollections = [
  {
    id: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
    name: 'Bored Ape Yacht Club',
    description: 'The Bored Ape Yacht Club is a collection of 10,000 unique Bored Ape NFTs— unique digital collectibles living on the Ethereum blockchain.',
    imageUrl: 'https://i.seadn.io/gae/Ju9CkWtV-1Okvf45wo8UctR-M9He2PjILP0oOvxE89AyiPPGtrR3gysu1Zgy0hjd2xKIgjJJtWIc0ybj4Vd7wv8t3pxDGHoJBzDB?auto=format&dpr=1&w=1000',
    bannerImageUrl: 'https://i.seadn.io/gae/i5dYZRkVCUK97bfprQ3WXyrT9BnLSZtVKGJlKQ919uaUB0sxbngVCioaiyu9r6snqfi2aaTyIvv6DHm4m2R3y7hMajbsv14pSZK8mhs?auto=format&dpr=1&w=3840',
    floorPrice: '30.5',
    totalSupply: '10000',
    chain: '0x1',
    verified: true,
    category: 'Art & Collectibles'
  },
  {
    id: '0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb',
    name: 'CryptoPunks',
    description: 'CryptoPunks launched as a fixed set of 10,000 items in mid-2017 and became one of the inspirations for the ERC-721 standard. They have been featured in places like The New York Times, Christie\'s of London, Art|Basel Miami, and The PBS NewsHour.',
    imageUrl: 'https://i.seadn.io/gae/BdxvLseXcfl57BiuQcQYdJ64v-aI8din7WPk0Pgo3qQFhAUH-B6i-dCqqc_mCkRIzULmwzwecnohLhrcH8A9mpWIZqA7ygc52Sr81hE?auto=format&dpr=1&w=256',
    bannerImageUrl: 'https://i.seadn.io/s/primary-drops/0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb/2563:about:media:70594573-20b8-4f3d-b535-716084978052.png?auto=format&dpr=1&w=1920',
    floorPrice: '51.80',
    totalSupply: '10000',
    chain: '0x1',
    verified: true,
    category: 'Collectibles'
  },
  {
    id: '0x33fd426905f149f8376e227d0c9d3340aad17af1',
    name: 'The Memes by 6529',
    description: 'The Memes by 6529 is a collection of culturally and historically significant NFTs of the early NFT era. The collection embraces the essence of internet meme culture.',
    imageUrl: 'https://i.seadn.io/gcs/files/8573c42207ea4d7dc1bb6ed5c0b01243.jpg?auto=format&dpr=1&w=64',
    bannerImageUrl: 'https://i.seadn.io/gcs/files/e05d1e09349d7fb36c7970e7ac0e054c.png?auto=format&dpr=1&w=1920',
    floorPrice: '0.18',
    totalSupply: '1000',
    chain: '0x1',
    verified: true,
    category: 'Memes'
  },
  {
    id: '0x59468516a8259058bad1ca5f8f4bff190d30e066',
    name: 'Invisible Friends',
    description: 'Invisible Friends is a collection of 5,000 animated invisible characters by Markus Magnusson.',
    imageUrl: 'https://i.seadn.io/gae/lW22aEwUE0IqGaYm5HRiMS8DwkDwsdjPpprEqYnBqo2s7gSR-JqcYOjU9LM6p32ujG_YAEd72aDyox-pdCVK10G-u1qZ3zAsn2r9?auto=format&dpr=1&w=256',
    bannerImageUrl: 'https://i.seadn.io/gcs/files/dd3b757d25bf4aed0feb74ec421c7285.png?auto=format&dpr=1&w=1920',
    floorPrice: '2.25',
    totalSupply: '5000',
    chain: '0x1',
    verified: true,
    category: 'Art & Animation'
  },
  {
    id: '0x524cab2ec69124574082676e6f654a18df49a048',
    name: 'Lil Pudgys',
    description: 'Lil Pudgys is a derivative collection from the Pudgy Penguins ecosystem, featuring 22,222 unique characters.',
    imageUrl: 'https://i.seadn.io/s/raw/files/649289b91d3d0cefccfe6b9c7f83f471.png?auto=format&dpr=1&w=256',
    bannerImageUrl: 'https://i.seadn.io/s/primary-drops/0x524cab2ec69124574082676e6f654a18df49a048/3826365:about:media:6efd80cc-0c7c-4233-83d4-5375c60f89eb.png?auto=format&dpr=1&w=1920',
    floorPrice: '0.17',
    totalSupply: '22222',
    chain: '0x1',
    verified: true,
    category: 'Collectibles'
  },
  {
    id: '0x7e6027a6a84fc1f6db6782c523efe62c923e46ff',
    name: 'Rare Pepe',
    description: 'Rare Pepe is a collection of digital collectible cards featuring the Pepe the Frog character that originated as a meme.',
    imageUrl: 'https://i.seadn.io/gcs/files/b36c8411036867ffedd8d85c54079785.png?auto=format&dpr=1&w=256',
    bannerImageUrl: 'https://i.seadn.io/gcs/files/e3f46f74afc2df8875585f511edd940a.png?auto=format&dpr=1&w=1920',
    floorPrice: '2.1',
    totalSupply: '1774',
    chain: '0x1',
    verified: true,
    category: 'Meme'
  },
  {
    id: '0x49cf6f5d44e70224e2e23fdcdd2c053f30ada28b',
    name: 'CloneX',
    description: 'Clone X is a collection of 20,000 next-gen Avatars, created in collaboration with RTFKT and Takashi Murakami.',
    imageUrl: 'https://i.seadn.io/gae/XN0XuD8Uh3jyRWNtPTFeXJg_ht8m5ofDx6aHklOiy4amhFuWUa0JaR6It49AH8tlnYS386Q0TW_-Lmedn0UET_ko1a3CbJGeu5iHMg?auto=format&dpr=1&w=256',
    bannerImageUrl: 'https://i.seadn.io/s/primary-drops/0x49cf6f5d44e70224e2e23fdcdd2c053f30ada28b/3569322:about:media:f6f63025-4215-453e-803f-2b34090dfa29.jpeg?auto=format&dpr=1&w=1920',
    floorPrice: '3.48',
    totalSupply: '20000',
    chain: '0x1',
    verified: true,
    category: 'Avatars'
  },
  {
    id: '0x7bd29408f11d2bfc23c34f18275bbf23bb716bc7',
    name: 'Meebits',
    description: 'The Meebits are 20,000 unique 3D voxel characters, created by Larva Labs, the creators of CryptoPunks.',
    imageUrl: 'https://i.seadn.io/gcs/files/2d036c8c2bed042a1588622c3173677f.png?auto=format&dpr=1&w=256',
    bannerImageUrl: 'https://i.seadn.io/gcs/files/cbeed39f76506b4baf71005d7127d0df.png?auto=format&dpr=1&w=1920',
    floorPrice: '2.96',
    totalSupply: '20000',
    chain: '0x1',
    verified: true,
    category: 'Voxel'
  },
  {
    id: '0x781eaca19129d51787573e7aa6395e94321e64a7',
    name: 'Nakamigos',
    description: 'Nakamigos consists of 20,000 unique, randomly generated on-chain collectibles who are here to save The Cypherpunks Manifesto from the clutches of centralized control.',
    imageUrl: 'https://i.seadn.io/gcs/files/1619b033c453fe36c5d9e2ac451379a7.png?auto=format&dpr=1&w=256',
    bannerImageUrl: 'https://i.seadn.io/gcs/files/6cdaf5f7fc406df1b2861ade634aad63.png?auto=format&dpr=1&w=1920',
    floorPrice: '0.85',
    totalSupply: '20000',
    chain: '0x1',
    verified: true,
    category: 'Collectibles'
  },
  {
    id: '0x82c7a8f707110f5fbb16184a5933e9f78a34c6ab',
    name: '77Bit',
    description: '77-Bit is a collection of 7777 pixel owls, with a vast array of traits, outfits, and personalities.',
    imageUrl: 'https://i.seadn.io/s/raw/files/12518921adbcf9eb4235551dab23150c.png?auto=format&dpr=1&w=256',
    bannerImageUrl: 'https://i.seadn.io/s/primary-drops/0x497a9a79e82e6fc0ff10a16f6f75e6fcd5ae65a8/13941911:about:media:25c358d9-308f-49b0-b900-7ff47842bd33.gif?auto=format&dpr=1&w=1920',
    floorPrice: '0.11',
    totalSupply: '7777',
    chain: '0x1',
    verified: true,
    category: 'Pixel Art'
  },
  {
    id: '0x1d4359597beba2179b2fc17d162df3d12e82c743',
    name: 'God Hates NFTees',
    description: 'God Hates NFTees is a collection of 6666 digital tees living on the Ethereum blockchain.',
    imageUrl: 'https://i.seadn.io/gcs/files/b919222095cba00715d8013637e527d3.gif?auto=format&dpr=1&w=256',
    bannerImageUrl: 'https://openseauserdata.com/files/16bbf107b506d8d6b110c4e05eba7043.svg',
    floorPrice: '0.05',
    totalSupply: '6666',
    chain: '0x1',
    verified: true,
    category: 'Collectibles'
  },
  {
    id: '0x8a90cab2b38dba80c64b7734e58ee1db38b8992e',
    name: 'Doodles',
    description: 'A community-driven collectibles project featuring art by Burnt Toast. Doodles come in a joyful range of colors, traits and sizes with a collection size of 10,000.',
    imageUrl: 'https://i.seadn.io/gae/7B0qai02OdHA8P_EOVK672qUliyjQdQDGNrACxs7WnTgZAkJa_wWURnIFKeOh5VTf8cfTqW3wQpozGedaC9mteKphEOtztls02RlWQ?auto=format&dpr=1&w=256',
    bannerImageUrl: 'https://i.seadn.io/gae/svc_rQkHVGf3aMI14v3pN-ZTI7uDRwN-QayvixX-nHSMZBgb1L1LReSg1-rXj4gNLJgAB0-yD8ERoT-Q2Gu4cy5AuSg-RdHF9bOxFDw?auto=format&dpr=1&w=1920',
    floorPrice: '2.4',
    totalSupply: '10000',
    chain: '0x1',
    verified: true,
    category: 'Art & Collectibles'
  },
  {
    id: '0x059edd72cd353df5106d2b9cc5ab83a52287ac3a',
    name: 'Chromie Squiggle by Snowfro',
    description: 'The Chromie Squiggle by Snowfro is the first Art Blocks project ever created. It is a simple generative algorithm that creates unique squiggles with different colors, frequencies, and amplitudes. Each squiggle is a unique combination of parameters from a vast possibility space.',
    imageUrl: 'https://i.seadn.io/gae/0qG8Y78s198F2GZHhURw8_TEfxFlpS2XYnuLV_OW6TJin5AV1G2WOSpcLGnEmv5g2gZ6R6Pxjd4v1DP2p0bxptckM6ZJ3cMIvQmrgDM?auto=format&dpr=1&w=256',
    bannerImageUrl: 'https://i.seadn.io/s/primary-drops/0x059edd72cd353df5106d2b9cc5ab83a52287ac3a/2198741:about:media:2bf36829-9374-4475-9cb6-4a8c7713a3f1.png?auto=format&dpr=1&w=1920',
    floorPrice: '11.8',
    totalSupply: '9250',
    chain: '0x1',
    verified: true,
    category: 'Art Blocks'
  },
  {
    id: '0x39ee2c7b3cb80254225884ca001f57118c8f21b6',
    name: 'Memeland Potatoz',
    description: '9,999 SMALL SPECIES LEADING THE WAY TO MEMELAND.',
    imageUrl: 'https://i.seadn.io/gcs/files/129b97582f0071212ee7cf440644fc28.gif?auto=format&dpr=1&w=256',
    bannerImageUrl: 'https://i.seadn.io/gcs/files/62448fe425d5e5e2bd44ded754865f37.png?auto=format&dpr=1&w=1200',
    floorPrice: '0.2448',
    totalSupply: '9999',
    chain: '0x1',
    verified: true,
    category: 'Meme'
  },
  {
    id: '0x9a38dec0590abc8c883d72e52391090e948ddf12',
    name: 'Yumemono',
    description: 'Yumemono is a hand-drawn PFP collection by artist Yee Wong.',
    imageUrl: 'https://i.seadn.io/s/raw/files/251c06b48a67445178712303328ffdbf.gif?auto=format&dpr=1&w=256',
    bannerImageUrl: 'https://i.seadn.io/s/primary-drops/0x1ea96fa85256cf99f9de56bb2269c165bda97375/34547068:about:media:5513e7e2-43f2-463f-8612-399dc2560bc0.png?auto=format&dpr=1&w=1920',
    floorPrice: '0.29',
    totalSupply: '10000',
    chain: '0x1',
    verified: true,
    category: 'Art'
  },
  {
    id: '0xf74af46c07cf74b0f224db28638647767d7597e3',
    name: 'GNSSart',
    description: 'The art by GNSS is a collection of generative compositions by artist GNSS.',
    imageUrl: 'https://i.seadn.io/gae/4xgTjZ0_ybQi2TuRMsjmiL6-uqsbWl3UyinkbVZob92BCQFdl6JQowJ6e41gCxZ0Ut7D9wpjq-hQdEcQYQSrZHEKkPZjnbyGc8bhog?auto=format&dpr=1&w=256',
    bannerImageUrl: 'https://i.seadn.io/gae/PTS_vqird-CNZ-grJ_ZPKCVGaPrzoTmt4d9r-U3dXkTqa6EYkhEqsSf_JkAXRIaDGVOj4A0Bm_UVXQM3vwLa7BLXGbXGFVYgkw6bN0E?auto=format&dpr=1&w=1920',
    floorPrice: '0.25',
    totalSupply: '789',
    chain: '0x1',
    verified: true,
    category: 'Generative Art'
  },
  {
    id: '0x5a0121a0a21232ec0d024dab9017314509192948',
    name: 'GEMESIS',
    description: 'GEMESIS is a collection of 10,000 gems with unique traits & properties.',
    imageUrl: 'https://i.seadn.io/gcs/files/7ed181433ee09174f09a0e31b563d313.png?auto=format&dpr=1&w=256',
    bannerImageUrl: 'https://i.seadn.io/s/raw/files/cd5cd1ccaa3a3d2bcce53c275c44d9ff.png?auto=format&dpr=1&w=384',
    floorPrice: '0.12',
    totalSupply: '10000',
    chain: '0x1',
    verified: true,
    category: 'Collectibles'
  },
  {
    id: '0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85',
    name: 'ENS: Ethereum Name Service',
    description: 'Ethereum Name Service (ENS) domains are secure domain names for the decentralized world. ENS domains provide a way for users to map human readable names to blockchain and non-blockchain resources, like Ethereum addresses, IPFS hashes, or website URLs.',
    imageUrl: 'https://i.seadn.io/gae/0cOqWoYA7xL9CkUjGlxsjreSYBdrUBE0c6EO1COG4XE8UeP-Z30ckqUNiL872zHQHQU5MUNMNhfDpyXIP17hRSC5HQ?auto=format&dpr=1&w=256',
    bannerImageUrl: 'https://i.seadn.io/s/primary-drops/0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85/3072:about:media:252af124-c94f-43a8-b81a-ab886564116f.png?auto=format&dpr=1&w=1920',
    floorPrice: '0.002',
    totalSupply: '2792126',
    chain: '0x1',
    verified: true,
    category: 'Domain Names'
  },
  {
    id: '0xbd3531da5cf5857e7cfaa92426877b022e612cf8',
    name: 'Pudgy Penguins',
    description: 'Pudgy Penguins is a collection of 8,888 NFTs, waddling through Web3. Embodying empathy, compassion, & determination, the Pudgy Penguins are a beacon of positivity in the NFT Space.',
    imageUrl: 'https://i.seadn.io/s/raw/files/cdf489fb69fd11886b468c0f7ff1376c.png?auto=format&dpr=1&w=256',
    bannerImageUrl: 'https://i.seadn.io/s/primary-drops/0xbd3531da5cf5857e7cfaa92426877b022e612cf8/809912:about:media:a21a43b4-972a-4d72-a651-3bea2c285683.jpeg?auto=format&dpr=1&w=1920',
    floorPrice: '4.95',
    totalSupply: '8888',
    chain: '0x1',
    verified: true,
    category: 'PFP'
  },
  {
    id: '0x5af0d9827e0c53e4799bb226655a1de152a425a5',
    name: 'Milady Maker',
    description: 'Milady Maker is a collection of 10,000 generative pfpNFTs, created in 2021. Miladys have an intentionally sloppy, "poor" anime-aesthetics; each portrait is generatively rendered with hand-made items and accessories to inspire distinct personalities.',
    imageUrl: 'https://i.seadn.io/gae/a_frplnavZA9g4vN3SexO5rrtaBX_cBTaJYcgrPtwQIqPhzgzUendQxiwUdr51CGPE2QyPEa1DHnkW1wLrHAv5DgfC3BP-CWpFq6BA?auto=format&dpr=1&w=256',
    bannerImageUrl: 'https://i.seadn.io/gae/1TtiQPPiqoc6hqMw3xVYnlEatEi6QhRQGDQA3B3yZfhr2nuXbedAQCOcTs1UZot6-4FXSiYM6xOtHWcaJNwFdRyuOlC_q5erFRbMYA?auto=format&dpr=1&w=1920',
    floorPrice: '1.47',
    totalSupply: '10000',
    chain: '0x1',
    verified: true,
    category: 'PFP'
  },
  {
    id: '0xc274a97f1691ef390f662067e95a6eff1f99b504',
    name: 'Tin Fun NFT',
    description: 'Oriental fantasy adventure in Web3',
    imageUrl: 'https://i.seadn.io/s/raw/files/a531bedf317b5ffe5a35d559b5c94cd9.jpg?auto=format&dpr=1&w=256',
    bannerImageUrl: 'https://i.seadn.io/s/primary-drops/0xc274a97f1691ef390f662067e95a6eff1f99b504/31341974:about:media:98e2f8a2-a8aa-46d9-9267-87108353c759.jpeg?auto=format&dpr=1&w=1920',
    floorPrice: '0.0929',
    totalSupply: '9999',
    chain: '0x1',
    verified: true,
    category: 'China'
  },
  {
    id: '0x34d85c9cdeb23fa97cb08333b511ac86e1c4e258',
    name: 'Otherdeed for Otherside',
    description: 'Otherdeeds are the key to claiming land in Otherside. Each have a unique blend of environment and sediment – some with resources, some with powerful artifacts.',
    imageUrl: 'https://i.seadn.io/gae/yIm-M5-BpSDdTEIJRt5D6xphizhIdozXjqSITgK4phWq7MmAU3qE7Nw7POGCiPGyhtJ3ZFP8iJ29TFl-RLcGBWX5qI4-ZcnCPcsY4zI?auto=format&dpr=1&w=256',
    bannerImageUrl: 'https://i.seadn.io/gae/E_XVuM4_sRYvQpnzGefSfcP3aC5dJeUxNvEDXBT2BiBjOE_MQjmXlUxr8Mt8z9JQjLP8M2sQrC4AXNhUQA18_hOiaejuZI_cM2rARGE?auto=format&dpr=1&w=3840',
    floorPrice: '1.58',
    totalSupply: '100000',
    chain: '0x1',
    verified: true,
    category: 'Virtual Worlds'
  },
];

// Real BNB Chain collections
const mockBNBCollections = [
  {
    id: '0xdcbcf766dcd33a7a8abe6b01a8b0e44a006c4ac1',
    name: 'Pancake Squad',
    description: 'PancakeSwap\'s NFT collection of 10,000 unique bunnies designed to reward loyal community members and bring utility to the CAKE token.',
    imageUrl: 'https://assets.pancakeswap.finance/pancakeSquad/header.png',
    bannerImageUrl: 'https://assets.pancakeswap.finance/pancakeSquad/pancakeSquadBanner.png',
    floorPrice: '2.5',
    totalSupply: '10000',
    chain: '0x38',
    verified: true,
    category: 'Gaming'
  },
  {
    id: '0xcec33930ba196cdf9f38e1a5e2a1e0708450d20f',
    name: 'Era7: Game of Truth',
    description: 'Era7: Game of Truth is a play-to-earn trading card game inspired by Magic: The Gathering, Hearthstone, and Runeterra. Build your deck and battle against players around the world!',
    imageUrl: 'https://images.pocketgamer.biz/T/52539/2022/52539_Era7_Game_of_Truth_screenshot_1.png',
    bannerImageUrl: 'https://pbs.twimg.com/profile_banners/1428004235405357057/1648021562/1500x500',
    floorPrice: '0.4',
    totalSupply: '33000',
    chain: '0x38',
    verified: true,
    category: 'Gaming'
  },
  {
    id: '0x04a5e3ed4907b781f702adbddf1b7e771c31b0f2',
    name: 'BSC Punks',
    description: 'CryptoPunks on BSC - 10,000 uniquely generated characters on the BNB Chain.',
    imageUrl: 'https://lh3.googleusercontent.com/BdxvLseXcfl57BiuQcQYdJ64v-aI8din7WPk0Pgo3qQFhAUH-B6i-dCqqc_mCkRIzULmwzwecnohLhrcH8A9mpWIZqA7ygc52Sr81hE=s130',
    bannerImageUrl: 'https://pbs.twimg.com/profile_banners/1364731917736632321/1649351522/1500x500',
    floorPrice: '0.25',
    totalSupply: '10000',
    chain: '0x38',
    verified: false,
    category: 'Art & Collectibles'
  },
  {
    id: '0x85f0e02cb992aa1f9f47112f815f519ef1a59e2d',
    name: 'BNB Bulls Club',
    description: 'The BNB Bulls Club is a collection of 10,000 unique NFTs living on the BNB Chain, each representing membership to the club with unique utilities.',
    imageUrl: 'https://static-nft.pancakeswap.com/mainnet/0x85F0e02cb992aa1F9F47112F815F519EF1A59E2D/banner-lg.png',
    bannerImageUrl: 'https://static-nft.pancakeswap.com/mainnet/0x85F0e02cb992aa1F9F47112F815F519EF1A59E2D/banner-lg.png',
    floorPrice: '1.2',
    totalSupply: '10000',
    chain: '0x38',
    verified: false,
    category: 'Membership'
  },
  {
    id: '0xc274a97f1691ef390f662067e95a6eff1f99b504',
    name: 'Tin Fun NFT',
    description: 'Buildspace: Build your own DAO with Javascript | Cohort Alkes | #360 - DAOs are taking over. Build one yourself for fun. Maybe it\'s a meme DAO for your friends. Maybe it\'s a DAO that aims to fix climate change. Up to you. We\'ll be going over things like minting a membership NFT, creating/airdropping a token, public treasuries, and governance using a token!',
    imageUrl: 'https://i.seadn.io/s/raw/files/a531bedf317b5ffe5a35d559b5c94cd9.jpg?auto=format&dpr=1&w=256',
    bannerImageUrl: 'https://i.seadn.io/s/primary-drops/0xc274a97f1691ef390f662067e95a6eff1f99b504/31341974:about:media:98e2f8a2-a8aa-46d9-9267-87108353c759.jpeg?auto=format&dpr=1&w=1920',
    floorPrice: '0.0929',
    totalSupply: '9999',
    chain: '0x38',
    verified: true,
    category: 'China'
  }
];

// CryptoPath ecosystem NFT collection on BNB Testnet
const cryptoPathCollection = {
  id: '0x2fF12fE4B3C4DEa244c4BdF682d572A90Df3B551',
  name: 'CryptoPath Genesis',
  description: 'The official NFT collection of the CryptoPath ecosystem. These limited edition NFTs grant exclusive access to premium features and rewards within the CryptoPath platform.',
  imageUrl: '/Img/logo/cryptopath.png', // Replace with actual image path
  bannerImageUrl: '/Img/logo/logo4.svg', // Replace with actual banner path
  floorPrice: '10.0',
  totalSupply: '1000',
  chain: '0x61', // BNB Testnet
  verified: true,
  category: 'Utility',
  featured: true
};

const API_ENDPOINTS = {
  '0x1': 'https://eth-mainnet.g.alchemy.com/v2/your-api-key',
  '0xaa36a7': 'https://eth-sepolia.g.alchemy.com/v2/your-api-key',
  '0x38': 'https://bsc-mainnet.g.alchemy.com/v2/your-api-key',
  '0x61': 'https://bsc-testnet.g.alchemy.com/v2/your-api-key'
};

export async function fetchUserNFTs(address: string, chainId: string, pageKey?: string): Promise<AlchemyNFTResponse> {
  if (!address) {
    throw new Error("Address is required to fetch NFTs");
  }

  const network = CHAIN_ID_TO_NETWORK[chainId as keyof typeof CHAIN_ID_TO_NETWORK] || 'eth-mainnet';
  
  try {
    const apiUrl = `https://${network}.g.alchemy.com/nft/v2/${ALCHEMY_API_KEY}/getNFTs`;
    const url = new URL(apiUrl);
    url.searchParams.append('owner', address);
    url.searchParams.append('withMetadata', 'true');
    url.searchParams.append('excludeFilters[]', 'SPAM');
    url.searchParams.append('pageSize', '100');
    
    if (pageKey) {
      url.searchParams.append('pageKey', pageKey);
    }

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching NFTs for ${address}:`, error);
    toast.error("Failed to load NFTs");
    return { ownedNfts: [], totalCount: 0 };
  }
}

export async function fetchCollectionInfo(contractAddress: string, chainId: string): Promise<CollectionMetadata> {
  if (!contractAddress) {
    throw new Error("Contract address is required");
  }

  const network = CHAIN_ID_TO_NETWORK[chainId as keyof typeof CHAIN_ID_TO_NETWORK] || 'eth-mainnet';
  
  try {
    const apiUrl = `https://${network}.g.alchemy.com/nft/v2/${ALCHEMY_API_KEY}/getContractMetadata`;
    const url = new URL(apiUrl);
    url.searchParams.append('contractAddress', contractAddress);

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    return {
      name: data.contractMetadata.name || 'Unknown Collection',
      symbol: data.contractMetadata.symbol || '',
      totalSupply: data.contractMetadata.totalSupply || '0',
      description: data.contractMetadata.openSea?.description || '',
      imageUrl: data.contractMetadata.openSea?.imageUrl || '',
    };
  } catch (error) {
    console.error(`Error fetching collection info for ${contractAddress}:`, error);
    toast.error("Failed to load collection info");
    return {
      name: 'Unknown Collection',
      symbol: '',
      totalSupply: '0',
      description: '',
      imageUrl: '',
    };
  }
}

interface NFTItem {
  id: {
    tokenId: string;
  };
  title?: string;
  description?: string;
  media?: Array<{gateway?: string}>;
  metadata?: {
    attributes?: Array<{trait_type: string, value: string}>
  };
}

interface CollectionNFT {
  id: string;
  tokenId: string;
  name: string;
  description: string;
  imageUrl: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
}

interface CollectionNFTsResponse {
  nfts: CollectionNFT[];
  totalCount: number;
  pageKey?: string;
}


export async function fetchCollectionNFTs(
  contractAddress: string, 
  chainId: string,
  page: number = 1,
  pageSize: number = 20,
  sortBy: string = 'tokenId',
  sortDirection: 'asc' | 'desc' = 'asc',
  searchQuery: string = '',
  attributes: Record<string, string[]> = {}
): Promise<CollectionNFTsResponse> {
  if (!contractAddress) {
    throw new Error("Contract address is required");
  }
  
  // For other collections, continue with the existing implementation
  const network = CHAIN_ID_TO_NETWORK[chainId as keyof typeof CHAIN_ID_TO_NETWORK] || 'eth-mainnet';
  
  try {
    const apiUrl = `https://${network}.g.alchemy.com/nft/v2/${ALCHEMY_API_KEY}/getNFTsForCollection`;
    const url = new URL(apiUrl);
    url.searchParams.append('contractAddress', contractAddress);
    url.searchParams.append('withMetadata', 'true');
    url.searchParams.append('startToken', ((page - 1) * pageSize).toString());
    url.searchParams.append('limit', pageSize.toString());

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    // Process NFTs
    let nfts = data.nfts.map((nft: NFTItem) => ({
      id: `${contractAddress}-${nft.id.tokenId || ''}`,
      tokenId: nft.id.tokenId || '',
      name: nft.title || `NFT #${parseInt(nft.id.tokenId || '0', 16).toString()}`,
      description: nft.description || '',
      imageUrl: nft.media?.[0]?.gateway || '',
      attributes: nft.metadata?.attributes || [],
    }));
    
    // Apply filters
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      nfts = nfts.filter((nft: CollectionNFT) => 
        nft.name.toLowerCase().includes(query) || 
        nft.tokenId.toLowerCase().includes(query)
      );
    }
    
    // Apply attribute filters
    if (Object.keys(attributes).length > 0) {
      nfts = nfts.filter((nft: CollectionNFT) => {
        for (const [traitType, values] of Object.entries(attributes)) {
          const nftAttribute = nft.attributes.find((attr: {trait_type: string, value: string}) => attr.trait_type === traitType);
          if (!nftAttribute || !values.includes(nftAttribute.value)) {
            return false;
          }
        }
        return true;
      });
    }
    
    // Apply sorting
    nfts.sort((a: CollectionNFT, b: CollectionNFT) => {
      if (sortBy === 'tokenId') {
        const idA = parseInt(a.tokenId, 16) || 0;
        const idB = parseInt(b.tokenId, 16) || 0;
        return sortDirection === 'asc' ? idA - idB : idB - idA;
      } else if (sortBy === 'name') {
        return sortDirection === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      return 0;
    });

    return {
      nfts: nfts,
      totalCount: data.totalCount || nfts.length,
      pageKey: data.pageKey
    };
  } catch (error) {
    console.error(`Error fetching NFTs for collection ${contractAddress}:`, error);
    toast.error("Failed to load collection NFTs");
    return { nfts: [], totalCount: 0 };
  }
}

// Mocked API service for NFT data
// In a real application, this would connect to Alchemy or another provider
export async function fetchPopularCollections(chainId: string): Promise<any[]> {
  try {
    // For BNB Testnet, include our ecosystem collection first
    if (chainId === '0x61') {
      return [cryptoPathCollection, ...mockBNBCollections.map(collection => ({
        ...collection,
        chain: chainId
      }))];
    }
    
    // For BNB Chain mainnet
    if (chainId === '0x38') {
      return mockBNBCollections.map(collection => ({
        ...collection,
        chain: chainId
      }));
    }
    
    // For Ethereum and Sepolia
    return mockCollections.map(collection => ({
      ...collection,
      chain: chainId
    }));
  } catch (error) {
    console.error('Error fetching collections:', error);
    throw error;
  }
}

// Function to fetch marketplace trading history 
export async function fetchTradeHistory(tokenId?: string): Promise<any[]> {
  // This would normally connect to a blockchain indexer service
  // For now, we'll return mock data
  return [
    {
      id: '1',
      event: 'Sale',
      tokenId: tokenId || '123',
      from: '0x1234567890abcdef1234567890abcdef12345678',
      to: '0xabcdef1234567890abcdef1234567890abcdef12',
      price: '120.5',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      txHash: '0xabc123def456'
    },
    {
      id: '2',
      event: 'Transfer',
      tokenId: tokenId || '123',
      from: '0xabcdef1234567890abcdef1234567890abcdef12',
      to: '0x9876543210abcdef1234567890abcdef12345678',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      txHash: '0xdef456abc789'
    },
    {
      id: '3',
      event: 'Mint',
      tokenId: tokenId || '123',
      from: '0x0000000000000000000000000000000000000000',
      to: '0x1234567890abcdef1234567890abcdef12345678',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
      txHash: '0x789abc123def'
    },
    {
      id: '4',
      event: 'List',
      tokenId: tokenId || '123',
      from: '0x1234567890abcdef1234567890abcdef12345678',
      to: '0x0000000000000000000000000000000000000000',
      price: '100',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
      txHash: '0x456def789abc'
    }
  ];
}

// Function to fetch price history data for charts
export async function fetchPriceHistory(tokenId?: string): Promise<any[]> {
  // This would normally fetch real historical price data
  // For now, generate some mock data
  const now = Date.now();
  const data = [];
  
  // Generate 30 days of price data
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now - 1000 * 60 * 60 * 24 * i);
    const basePrice = tokenId ? 100 : 120; // Different base for collection vs single NFT
    const randomFactor = 0.3 * Math.sin(i / 2) + 0.2 * Math.cos(i);
    const volatility = 0.1;
    
    data.push({
      date: date.toISOString().split('T')[0],
      price: basePrice * (1 + randomFactor + volatility * (Math.random() - 0.5))
    });
  }
  
  return data;
}
