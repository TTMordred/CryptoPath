/**
 * Project knowledge base for CryptoPath
 * Contains structured information about the project components, features, and architecture
 * This information is extracted from the project report and codebase
 */

export interface MainFeature {
  name: string;
  description: string;
  capabilities: string[];
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface ProjectComponents {
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
}

export interface ProjectInfo {
  name: string;
  description: string;
  components: ProjectComponents;
  mainFeatures: MainFeature[];
  architecture: {
    frontendArchitecture: string;
    backendArchitecture: string;
    dataFlow: string;
    deployment: string;
  };
  userGuide: {
    gettingStarted: string;
    blockchainExplorer: string;
    portfolioTracker: string;
    nftMarketplace: string;
  };
}

export const projectInfo: ProjectInfo = {
  name: "CryptoPath",
  description: "A comprehensive blockchain explorer and visualization tool that helps users navigate and understand blockchain transactions, analyze wallet activities, track portfolios, and explore NFT marketplaces.",
  
  components: {
    frontEnd: {
      technologies: ["Next.js", "React", "TypeScript", "Tailwind CSS"],
      features: [
        "Responsive UI with dark and light themes",
        "Interactive visualizations for blockchain data",
        "Real-time transaction monitoring",
        "Wallet connection and integration"
      ]
    },
    backEnd: {
      technologies: ["API Routes (Next.js)", "Database integration", "Blockchain node connections"],
      features: [
        "Secure authentication system",
        "Data caching for performance",
        "Transaction processing",
        "Portfolio tracking"
      ]
    },
    blockchain: {
      supportedNetworks: ["Ethereum", "Polygon", "Solana", "Avalanche"],
      features: [
        "Multi-chain support",
        "Transaction verification",
        "Smart contract interaction",
        "NFT minting and trading"
      ]
    }
  },

  mainFeatures: [
    {
      name: "Blockchain Explorer",
      description: "Allows users to search for and visualize blockchain transactions, addresses, and smart contracts across multiple networks",
      capabilities: [
        "Transaction history tracking",
        "Address balance monitoring",
        "Visual transaction flow mapping",
        "Smart contract code verification"
      ]
    },
    {
      name: "Portfolio Tracker",
      description: "Enables users to monitor their cryptocurrency holdings across multiple wallets and chains",
      capabilities: [
        "Real-time price updates",
        "Performance analytics",
        "Historical value charts",
        "Investment insights"
      ]
    },
    {
      name: "NFT Marketplace",
      description: "Platform for discovering, buying, selling, and trading non-fungible tokens",
      capabilities: [
        "NFT collection browsing",
        "Minting interface",
        "Trading functionality",
        "Ownership verification"
      ]
    },
    {
      name: "Transaction Visualizer",
      description: "Interactive graphical representation of blockchain transactions and relationships",
      capabilities: [
        "Network flow visualization",
        "Transaction pattern analysis",
        "Wallet activity insights",
        "Time-based transaction mapping"
      ]
    }
  ],

  architecture: {
    frontendArchitecture: "Component-based React architecture with Next.js for server-side rendering and static generation",
    backendArchitecture: "API routes for serverless functions, connected to blockchain nodes and databases",
    dataFlow: "Client requests → Next.js API routes → Blockchain nodes/Database → Client rendering",
    deployment: "Vercel platform with continuous deployment from GitHub repository"
  },

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
    answer: "CryptoPath is a comprehensive blockchain explorer and visualization tool that helps users navigate and understand blockchain transactions, analyze wallet activities, track portfolios, and explore NFT marketplaces. It supports multiple blockchain networks including Ethereum, Polygon, Solana, and Avalanche."
  },
  {
    question: "How can I explore blockchain transactions?",
    answer: "You can explore blockchain transactions by entering a transaction hash, address, or block number in the search bar. The platform will provide detailed information about the transaction, including sender, receiver, value, gas fees, and status. You can also visualize transaction flows and relationships."
  },
  {
    question: "What features does the portfolio tracking have?",
    answer: "The portfolio tracking feature allows you to monitor your cryptocurrency holdings across multiple wallets and chains. It provides real-time price updates, performance analytics, historical value charts, and investment insights. You can track your gains/losses, set alerts, and analyze your investment strategy."
  },
  {
    question: "How do I use the NFT marketplace?",
    answer: "To use the NFT marketplace, navigate to the NFT section of the platform. Here you can browse collections, view your owned NFTs, list items for sale, or purchase NFTs. Connect your wallet to access personalized features and manage your NFT portfolio."
  },
  {
    question: "Which blockchain networks does CryptoPath support?",
    answer: "CryptoPath currently supports multiple blockchain networks including Ethereum, Polygon, Solana, and Avalanche. This multi-chain approach allows users to explore and interact with assets across different blockchain ecosystems."
  },
  {
    question: "How do I connect my wallet to CryptoPath?",
    answer: "You can connect your wallet by clicking the 'Connect Wallet' button in the header. CryptoPath supports various wallet providers including MetaMask, WalletConnect, Coinbase Wallet, and others. Once connected, you'll have access to personalized features like portfolio tracking."
  },
  {
    question: "Is CryptoPath secure to use?",
    answer: "Yes, CryptoPath is designed with security as a priority. The platform never stores your private keys, and all wallet connections are secured through established protocols. CryptoPath uses read-only connections for data visualization and requires explicit approval for any transactions."
  },
  {
    question: "How does the transaction visualizer work?",
    answer: "The transaction visualizer creates interactive graphical representations of blockchain transactions and relationships. It maps out network flows, highlights transaction patterns, provides wallet activity insights, and offers time-based transaction mapping to help you understand complex blockchain interactions."
  }
];

export const reportSummary = {
  introduction: "CryptoPath addresses the challenges of navigating blockchain complexity by providing intuitive visualization tools and comprehensive data analysis across multiple blockchain networks.",
  
  problemStatement: "Despite blockchain's growing importance, existing tools lack user-friendly interfaces and comprehensive cross-chain visibility, creating barriers to adoption and understanding.",
  
  solution: "CryptoPath combines powerful blockchain data visualization, multi-chain portfolio tracking, and NFT marketplace features in a single platform with an intuitive user interface.",
  
  technicalOverview: "Built using Next.js, React, and TypeScript with blockchain integrations through Web3.js and other blockchain-specific libraries. The system architecture ensures scalability and performance while maintaining security.",
  
  outcomes: "CryptoPath successfully delivers a platform that simplifies blockchain exploration, provides valuable insights through visualization, and enables seamless interaction with digital assets across multiple chains."
};