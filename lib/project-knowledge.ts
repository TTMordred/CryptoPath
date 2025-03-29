/**
 * Project knowledge base for CryptoPath
 * Contains structured information about the project components, features, and architecture
 */

export interface MainFeature {
  name: string;
  description: string;
  capabilities: string[];
  implementation?: {
    components: string[];
    apis: string[];
    technologies: string[];
  };
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface TechStack {
  frontend: string[];
  uiComponents: string[];
  stateManagement: string[];
  dataVisualization: string[];
  blockchainIntegration: string[];
  database: string[];
  authentication: string[];
  apiIntegrations: {
    name: string;
    purpose: string;
  }[];
}

export interface SecurityFeature {
  name: string;
  description: string;
}

export interface ProjectInfo {
  name: string;
  description: string;
  components: {
    frontEnd: {
      technologies: string[];
      features: string[];
    };
    backEnd: {
      technologies: string[];
      features: string[];
    };
    blockchain: {
      supportedNetworks: string[];
      features: string[];
    };
  };
  mainFeatures: MainFeature[];
  techStack: TechStack;
  security: SecurityFeature[];
  architecture: {
    frontendArchitecture: string;
    backendArchitecture: string;
    dataFlow: string;
    deployment: string;
  };
  mobileCompatibility: string[];
  prerequisites: string[];
  installation: {
    step: string;
    commands?: string[];
    description: string;
  }[];
  userGuide: {
    gettingStarted: string;
    blockchainExplorer: string;
    portfolioTracker: string;
    nftMarketplace: string;
  };
}

export const projectInfo: ProjectInfo = {
  name: "CryptoPath",
  description: "A comprehensive blockchain explorer and visualization platform that helps users navigate the complex world of blockchain technology. The application provides intuitive tools for transaction analysis, portfolio management, NFT trading, and interactive data visualization across multiple blockchain networks.",
  
  components: {
    frontEnd: {
      technologies: ["Next.js 14", "React", "TypeScript", "Tailwind CSS"],
      features: [
        "Responsive UI with dark and light themes",
        "Interactive visualizations for blockchain data",
        "Real-time transaction monitoring",
        "Wallet connection and integration",
        "Dynamic animations and transitions",
        "Multilingual support (English and Vietnamese)"
      ]
    },
    backEnd: {
      technologies: ["Next.js API Routes", "Supabase", "Neo4j", "Blockchain APIs"],
      features: [
        "Secure authentication system",
        "Data caching for performance",
        "Transaction processing",
        "Portfolio tracking",
        "Market data aggregation",
        "Cross-chain integrations"
      ]
    },
    blockchain: {
      supportedNetworks: ["Ethereum", "Polygon", "Solana", "Avalanche", "BSC"],
      features: [
        "Multi-chain support",
        "Transaction verification",
        "Smart contract interaction",
        "NFT minting and trading",
        "Portfolio tracking across chains",
        "Faucet integration"
      ]
    }
  },

  mainFeatures: [
    {
      name: "Search & Blockchain Explorer",
      description: "Powerful multi-chain explorer enabling in-depth blockchain data analysis and visualization",
      capabilities: [
        "Multi-chain transaction search by hash, address, or block number",
        "Interactive graph visualization of transaction relationships",
        "Smart contract interaction analysis and verification",
        "Advanced filtering and data export capabilities",
        "Cross-chain address and wallet analytics"
      ],
      implementation: {
        components: ["TransactionContent.tsx", "SearchOnTop.tsx"],
        apis: ["Etherscan", "BSCScan", "Alchemy"],
        technologies: ["Ethers.js", "Web3.js", "D3.js"]
      }
    },
    {
      name: "Portfolio Tracker",
      description: "Advanced portfolio management system for tracking crypto assets across multiple chains",
      capabilities: [
        "Multi-wallet and multi-chain asset tracking",
        "Performance analytics with historical charts",
        "Transaction history with gas fee analysis",
        "Asset allocation visualization",
        "Real-time price updates"
      ],
      implementation: {
        components: ["BalanceCard", "TokensCard", "NFTsCard", "HistoryChart", "AllocationChart"],
        apis: ["Alchemy", "CoinMarketCap", "Moralis"],
        technologies: ["Recharts", "Framer Motion", "Ethers.js"]
      }
    },
    {
      name: "Market Overview",
      description: "Real-time market data and analytics dashboard",
      capabilities: [
        "Price tracking and market caps",
        "Fear & Greed Index integration",
        "Market trends and analysis",
        "Custom watchlists",
        "Price alerts"
      ],
      implementation: {
        components: ["EthPriceLine", "MarketOverview"],
        apis: ["CoinMarketCap", "Alternative.me", "Binance"],
        technologies: ["React Query", "Recharts", "WebSocket"]
      }
    }
  ],

  techStack: {
    frontend: ["Next.js 14", "React", "TypeScript", "Tailwind CSS"],
    uiComponents: [
      "Custom components",
      "Shadcn/ui",
      "Geist UI",
      "Dynamic animations with keyframes",
      "Responsive layouts",
      "Dark/Light themes"
    ],
    stateManagement: [
      "React Context API",
      "React Query",
      "Supabase client",
      "Local storage caching"
    ],
    dataVisualization: [
      "D3.js",
      "Recharts",
      "Framer Motion",
      "Custom graph visualizations",
      "Interactive charts",
      "Real-time updates"
    ],
    blockchainIntegration: [
      "Ethers.js",
      "Web3.js",
      "Wagmi",
      "Alchemy SDK",
      "WalletConnect",
      "MetaMask"
    ],
    database: [
      "Neo4j (Graph Database)",
      "Supabase for user data",
      "Redis caching"
    ],
    authentication: [
      "NextAuth.js",
      "WalletConnect 2.0",
      "Supabase Auth",
      "Web3 signatures"
    ],
    apiIntegrations: [
      { name: "Etherscan & BSCScan", purpose: "blockchain data and verification" },
      { name: "Alchemy", purpose: "blockchain queries and NFT data" },
      { name: "CoinMarketCap", purpose: "market data and pricing" },
      { name: "Binance", purpose: "real-time price data" },
      { name: "Alternative.me", purpose: "Fear & Greed Index" },
      { name: "Moralis", purpose: "cross-chain data" },
      { name: "Google Gemini", purpose: "AI assistance" }
    ]
  },

  security: [
    {
      name: "Wallet Authentication",
      description: "Secure Web3 signature-based authentication with Supabase integration"
    },
    {
      name: "Read-only Connections",
      description: "Safe data visualization without write access"
    },
    {
      name: "Transaction Approval",
      description: "Explicit approval required for all blockchain transactions"
    },
    {
      name: "API Security",
      description: "Rate limiting, CORS protection, and secure key management"
    },
    {
      name: "Data Validation",
      description: "Input validation, sanitization, and blockchain address verification"
    }
  ],

  architecture: {
    frontendArchitecture: "Component-based React architecture with Next.js for server-side rendering and static generation",
    backendArchitecture: "API routes for serverless functions, connected to blockchain nodes and databases",
    dataFlow: "Client requests → Next.js API routes → Blockchain nodes/Database → Client rendering",
    deployment: "Vercel platform with continuous deployment from GitHub repository"
  },

  mobileCompatibility: [
    "Adaptive layouts for desktop, tablet, and mobile",
    "Touch-friendly UI components",
    "Performance optimizations for mobile networks",
    "PWA capabilities for app-like experience"
  ],

  prerequisites: [
    "Node.js 18.0 or higher",
    "npm or yarn package manager",
    "Neo4j database instance",
    "Git"
  ],

  installation: [
    {
      step: "Clone Repository",
      commands: [
        "git clone https://github.com/YourUsername/CryptoPath.git",
        "cd CryptoPath"
      ],
      description: "Clone the project repository and navigate to the project directory"
    },
    {
      step: "Install Dependencies",
      commands: [
        "npm install",
        "npm install --legacy-peer-deps"
      ],
      description: "Install project dependencies with fallback for peer dependency issues"
    }
  ],

  userGuide: {
    gettingStarted: "Connect your wallet using the 'Connect Wallet' button in the header to access personalized features",
    blockchainExplorer: "Enter a transaction hash, address, or block number in the search bar to explore blockchain data",
    portfolioTracker: "Navigate to the Portfolio section after connecting your wallet to view your holdings and performance",
    nftMarketplace: "Browse the NFT section to discover collections, view your owned NFTs, or list items for sale"
  }
};

export const faqQuestions: FAQ[] = [
  {
    question: "What is CryptoPath?",
    answer: "CryptoPath is a comprehensive blockchain explorer and visualization platform that helps users navigate the complex world of blockchain technology. It provides powerful tools for transaction analysis, portfolio management, NFT trading, and interactive data visualization across multiple blockchain networks including Ethereum, Polygon, Solana, and Avalanche."
  },
  {
    question: "How can I explore blockchain transactions?",
    answer: "You can explore blockchain transactions using our Search & Blockchain Explorer feature. Simply enter a transaction hash, address, or block number in the search bar. The platform provides detailed transaction information, interactive graph visualizations of transaction relationships, smart contract analysis, and cross-chain wallet analytics."
  },
  {
    question: "What features does the portfolio tracking have?",
    answer: "The Portfolio Tracker offers comprehensive asset management capabilities including: multi-wallet and multi-chain asset tracking in a unified dashboard, detailed performance analytics with historical charts, transaction history with gas fee analysis, asset allocation visualization, and AI-powered investment insights."
  },
  {
    question: "How do I use the NFT marketplace?",
    answer: "Our NFT Marketplace allows you to discover, buy, sell, and trade NFTs across multiple chains. You can browse collections with metadata filtering, track floor prices, view analytics, and execute transactions directly through your connected wallet. The platform also includes minting capabilities and ownership verification."
  },
  {
    question: "Which blockchain networks does CryptoPath support?",
    answer: "CryptoPath supports multiple major blockchain networks including Ethereum, Polygon, Solana, and Avalanche. This multi-chain approach enables users to explore and interact with assets across different blockchain ecosystems through a unified interface."
  },
  {
    question: "How do I connect my wallet to CryptoPath?",
    answer: "You can connect your wallet by clicking the 'Connect Wallet' button in the header. CryptoPath supports various wallet providers including MetaMask, WalletConnect, Coinbase Wallet, and others. The connection is secured through Web3 signatures, and the platform only uses read-only connections for data visualization."
  },
  {
    question: "What is the Click2Earn game feature?",
    answer: "The Click2Earn game is a gamified earning experience where users can collect PATH tokens through strategic gameplay. It features upgradeable mechanics, competitive leaderboards, and direct wallet integration for token rewards. This feature makes learning about blockchain interactions more engaging and rewarding."
  },
  {
    question: "How does the staking system work?",
    answer: "CryptoPath's staking system offers multiple staking pools with different APY/APR rates. Users can choose between flexible and locked staking periods, claim rewards manually or enable auto-compounding, and track their staking performance through detailed analytics. All staking operations require explicit transaction approval for security."
  }
];

export const reportSummary = {
  introduction: "CryptoPath addresses the challenges of navigating blockchain complexity by providing intuitive visualization tools and comprehensive data analysis across multiple blockchain networks.",
  
  problemStatement: "Despite blockchain's growing importance, existing tools lack user-friendly interfaces and comprehensive cross-chain visibility, creating barriers to adoption and understanding.",
  
  solution: "CryptoPath combines powerful blockchain data visualization, multi-chain portfolio tracking, and NFT marketplace features in a single platform with an intuitive user interface.",
  
  technicalOverview: "Built using Next.js, React, and TypeScript with blockchain integrations through Web3.js and other blockchain-specific libraries. The system architecture ensures scalability and performance while maintaining security.",
  
  outcomes: "CryptoPath successfully delivers a platform that simplifies blockchain exploration, provides valuable insights through visualization, and enables seamless interaction with digital assets across multiple chains."
};