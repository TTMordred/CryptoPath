# CryptoPath - Path Your Crypto Future
**COS30049 - Computing Technology Innovation Project**

## Installation Guide

### Prerequisites
- Node.js 18.0 or higher
- npm or yarn package manager
- Neo4j database
- Git

### Setup Instructions
```bash
# Clone the repository
git clone https://github.com/TTMordred/CryptoPath.git

# Navigate to project directory
cd cryptopath

# Install dependencies
npm install
npm install next --legacy-peer-deps
```
# Set up environment variables
touch .env.local
```s
Populate `.env.local` with:
```
```dotenv
ETHERSCAN_API_KEY=YOUR_API_KEY
ETHERSCAN_API_URL=https://api.etherscan.io/api
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-password
NEO4J_URI=neo4j+s://your-database-uri
NEO4J_USERNAME=your-username
NEO4J_PASSWORD=your-password
NEXTAUTH_URL=https://cryptopath.vercel.app/
NEXTAUTH_SECRET=your-secret-key
NEXT_PUBLIC_INFURA_KEY=your-infura-key
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-walletconnect-projectid
NEXT_PUBLIC_URL=http://localhost:3000
ALCHEMY_API_KEY=your-alchemy-key
REACT_APP_DAPPRADAR_API_KEY=your-DAPPRADAR-key
COINMARKETCAP_API_KEY=your-COINMARKETCAP-key
```
# Start the development server
```
npm run dev
```

## Project Overview

**Project Name:** CryptoPath  
**Description:** CryptoPath is a comprehensive blockchain explorer and visualization platform designed to make blockchain data accessible, understandable, and actionable. Our system provides:

- **Transaction Visualization**: Interactive graph-based representation of blockchain transactions
- **Multi-Network Support**: Seamless switching between Ethereum Mainnet, Sepolia, Polygon, and Arbitrum
- **Provider Options**: Flexibility to use Etherscan or Infura as data providers
- **Real-time Market Data**: Live cryptocurrency prices and gas metrics from trusted sources
- **Rich Search Capabilities**: Address, transaction, token, and domain search functionality
- **NFT Portfolio View**: Discover and explore NFTs associated with any address

## Team Members

- **Le Nguyen Dang Duy** (105028557) - **Frontend Developer / Graph Visualization**
- **Nguyen Minh Duy** (104974743) - **Team Leader / Full-Stack Developer / Product Experience Architect**
- **Phan Cong Hung** (104995595) - **Backend & Frontend Developer / API Integration**

## Core Features

### 🔍 Advanced Search & Navigation

- Multi-type search supporting addresses, transactions, tokens, and domains
- Intelligent search suggestions and history
- Cross-chain search capabilities

### 📊 Interactive Transaction Graph

- Force-directed graph visualization with interactive nodes
- Transaction path tracing and highlighting
- Zoom, pan, and focus controls
- Fullscreen mode for detailed exploration

### 💼 Comprehensive Wallet Explorer

- Detailed balance information across multiple tokens
- Transaction history with filtering options
- QR code generation for easy address sharing
- Portfolio valuation with historical performance

### 🖼️ NFT Gallery

- Visual display of all NFTs owned by an address
- Collection grouping and metadata display
- Direct links to marketplaces

### 📱 Responsive Design

- Optimized interface for desktop, tablet, and mobile devices
- Dark mode support with amber-themed accents
- Accessible UI components

### ⚡ Real-time Data

- Live cryptocurrency price feeds
- Up-to-date gas price information
- Pending transaction counts

## Technology Stack

### Frontend

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui
- **State Management**: React Hooks and Context API
- **Data Fetching**: SWR with optimistic updates

### Backend

- **API Routes**: Next.js API routes
- **Authentication**: NextAuth.js
- **Caching**: SWR and server-side caching strategies

### External APIs

- Etherscan API for blockchain data
- Infura for alternative provider access
- CoinGecko for cryptocurrency prices
- Custom endpoints for aggregated data

### UI/UX Enhancements

- Animated particles background
- Custom loading screens
- Responsive layouts with grid system
- Tooltips for enhanced discoverability

## Future Roadmap

### Phase 1: Core Features (Completed)

- Basic blockchain data retrieval and display
- Initial transaction graph implementation
- Responsive design foundation

### Phase 2: Enhanced Visualization (Completed)

- Advanced transaction graph with interactivity
- Portfolio analysis tools
- NFT integration

### Phase 3: Feature Refinement (Current)

- UI/UX improvements
- Comprehensive search capabilities
- Performance optimization

### Phase 4: Platform Expansion

- Multi-wallet comparison
- Advanced analytics dashboard
- Developer API access

### Phase 5: Ecosystem Growth

- Mobile application development
- DeFi protocol integration
- Community features and customization options

## Contributing

Contributions to CryptoPath are welcome! Please see our Contributing Guidelines for details on how to get involved.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Etherscan](vscode-file://vscode-app/c:/Users/Zuy-PC/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-sandbox/workbench/workbench.html) for blockchain data access
- [Infura](vscode-file://vscode-app/c:/Users/Zuy-PC/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-sandbox/workbench/workbench.html) for additional provider options
- [CoinGecko](vscode-file://vscode-app/c:/Users/Zuy-PC/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-sandbox/workbench/workbench.html) for cryptocurrency market data
- [Next.js](vscode-file://vscode-app/c:/Users/Zuy-PC/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-sandbox/workbench/workbench.html) for the React framework
- [Tailwind CSS](vscode-file://vscode-app/c:/Users/Zuy-PC/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-sandbox/workbench/workbench.html) for styling
- [Shadcn/UI](vscode-file://vscode-app/c:/Users/Zuy-PC/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-sandbox/workbench/workbench.html) for UI components
- [Particles.js](vscode-file://vscode-app/c:/Users/Zuy-PC/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-sandbox/workbench/workbench.html) for background effects
- [Framer Motion](vscode-file://vscode-app/c:/Users/Zuy-PC/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-sandbox/workbench/workbench.html) for animations
- [Force Graph](vscode-file://vscode-app/c:/Users/Zuy-PC/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-sandbox/workbench/workbench.html) for graph visualizations

## References

1. Nakamoto, S. (2008). Bitcoin: A peer-to-peer electronic cash system. Decentralized Business Review.
2. Wood, G. (2014). Ethereum: A secure decentralized generalized transaction ledger. Ethereum Project Yellow Paper.
3. Buterin, V. et al. (2014-2023). Ethereum Whitepaper. Ethereum Foundation.
4. Verborgh, R., & De Wilde, M. (2013). Using OpenRefine. Packt Publishing Ltd.
5. Shneiderman, B. (1996). The eyes have it: A task by data type taxonomy for information visualizations. Proceedings of the IEEE Symposium on Visual Languages.
6. Chen, J., & Guestrin, C. (2016). XGBoost: A scalable tree boosting system. Proceedings of the 22nd ACM SIGKDD International Conference on Knowledge Discovery and Data Mining.

---

_CryptoPath - Path Your Crypto Future_