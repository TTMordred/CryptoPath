# CryptoPath - Navigate the Blockchain Ecosystem

**CryptoPath** is a comprehensive blockchain explorer and visualization tool that helps users navigate and understand blockchain transactions, analyze wallet activities, track portfolios, and explore NFT marketplaces across multiple blockchain networks.

![CryptoPath Logo](./public/logo.png)

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

## 🚀 Core Features

![CryptoPath Dashboard](./public/dashboard.png)

### 🔍 Search & Blockchain Explorer

The platform's flagship feature allows users to search and analyze blockchain data across multiple networks:

- Search by transaction hash, wallet address, or block number
- Interactive transaction visualization with graph relationships
- Detailed transaction analysis with decoded smart contract interactions
- Advanced filtering and historical transaction tracking

### 📊 Market Overview

- Real-time cryptocurrency price tracking with price movements
- Global market statistics including volume, dominance, and market cap
- Fear & Greed Index and market sentiment indicators
- Trending cryptocurrencies and whale transaction alerts

### 💼 Portfolio Tracker

- Multi-wallet and multi-chain asset tracking
- Performance analytics with historical value charts
- Token balance visualization with price information
- Transaction history and portfolio diversification insights

### 🖼️ NFT Marketplace & Collection Explorer

- Browse, buy, and sell NFTs across multiple blockchains
- Explore trending NFT collections with metadata
- View owned NFTs across different wallets
- NFT metadata and attribute filtering

### 💧 Faucet

- Request free PATH tokens on BSC Testnet
- Test smart contract interactions without real value
- Monitor faucet balance and token distribution
- Automatic network switching to BSC Testnet

### 💱 Swap

- Exchange tokens across multiple blockchains
- Best price routing for optimal swaps
- Low fee transactions with price impact calculation
- Slippage tolerance settings and transaction confirmation

### 🥩 Staking

- Stake tokens to earn passive income
- Track APY/APR rates for different staking pools
- Claim and reinvest rewards
- Monitor staking positions and rewards history

### 🎮 Click2Earn Game

- Play-to-earn mini-game to collect PATH tokens
- Upgrade gameplay with auto-clickers and multipliers
- Claim tokens to game balance
- Leaderboard with top players

### 🤖 AI Support Chat

- AI-powered assistance using Google Gemini
- Get help with platform features and blockchain concepts
- Real-time responses to user queries
- Suggested questions for common topics

## 💻 Tech Stack

![Architecture](./public/architecture.png)

### Frontend

- **Framework**: Next.js 14 with App Router, React 19, TypeScript 5
- **Styling**: Tailwind CSS 3.4, Tailwind Merge, Tailwind Animate
- **UI Components**: Radix UI primitives, Custom components
- **State Management**: React Context API, TanStack Query
- **Animations**: Framer Motion, AOS (Animate On Scroll)

### Data Visualization

- **Charts**: Recharts, React Circular Progressbar
- **Graph Visualization**: React Force Graph 2D
- **Interactive Elements**: Embla Carousel, Swiper

### Blockchain Integration

- **Web3 Libraries**: Ethers.js 5.7, Web3-Onboard
- **Wallet Connections**: WalletConnect, Injected Wallets, Hardware Wallets
- **Security**: Crypto-JS, Eccrypto, ETH-Crypto

### Backend & Database

- **Database**: Neo4j Graph Database
- **Authentication**: Custom auth with bcrypt
- **Email**: Nodemailer

### API Integrations

- **Blockchain Data**: Etherscan & BSCScan APIs
- **Cross-chain**: Moralis API
- **NFT & Token Data**: Alchemy API
- **Market Information**: CoinMarketCap API
- **Risk Analysis**: Chainalysis API
- **AI Assistance**: Google Gemini API

## 📋 Prerequisites

- Node.js 18.0 or higher
- npm or yarn package manager
- Neo4j database instance (local or cloud)
- Git
- API keys for various services (see Environment Variables section)

## 🛠️ Installation Guide

### 1. Clone the repository

```bash
git clone https://github.com/YourUsername/CryptoPath.git
cd CryptoPath
```

### 2. Install dependencies

```bash
npm install
```

If you encounter peer dependency issues:

```bash
npm install --legacy-peer-deps
```

### 3. Set up environment variables

Create a `.env.local` file in the root directory with the following variables:

```dotenv
# Etherscan API Configuration
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY
ETHERSCAN_API_URL=https://api.etherscan.io/api

# SMTP Configuration for Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-email-password

# Neo4j Database
NEO4J_URI=neo4j+s://your-instance-id.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your-neo4j-password

# Authentication
NEXT_PUBLIC_INFURA_KEY=your-infura-key
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-walletconnect-project-id
NEXT_PUBLIC_URL=http://localhost:3000

# API Keys
ALCHEMY_API_KEY=your-alchemy-key
NEXT_PUBLIC_ALCHEMY_API_KEY=your-public-alchemy-key
REACT_APP_DAPPRADAR_API_KEY=your-dappradar-key
COINMARKETCAP_API_KEY=your-coinmarketcap-key
CHAINALYSIS_API_KEY=your-chainalysis-key
BSCSCAN_API_KEY=your-bscscan-key
MORALIS_API_KEY=your-moralis-key
NEXT_PUBLIC_MORALIS_API_KEY=your-public-moralis-key
GEMINI_API_KEY=your-gemini-key
NEXT_PUBLIC_GEMINI_API_KEY=your-public-gemini-key
```

### 4. Start the development server

Using Turbopack (faster development experience):

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### 5. Build for production

```bash
npm run build
npm run start
```

## 📚 Feature Details

### Home Page

Landing page introducing CryptoPath's features with interactive components and real-time cryptocurrency data visualization.

### TopTokens

Track prices and market data for thousands of cryptocurrencies with sorting, filtering, and historical data charts.

### Market Overview

Comprehensive dashboard showing global crypto market metrics, Bitcoin dominance, fear & greed index, and trending coins.

### Transactions

The blockchain explorer allows users to:

- Search any transaction, address, or smart contract
- Visualize transaction flows with interactive graphs
- Decode smart contract interactions and method calls
- Filter transactions by type, value, or timestamp
- Export transaction data for analysis

### Faucet

Request free PATH tokens on BSC Testnet to test platform features without using real funds.

### NFT Marketplace and Collection Explorer

Browse, buy, and sell NFTs with features for:

- Collection exploration with filters and sorting
- NFT metadata display with attribute breakdown
- Owner history and transaction records
- Trending collections and floor price tracking

### Swap

Exchange tokens across multiple blockchains with:

- Best price routing for optimal swaps
- Price impact calculation
- Custom slippage settings
- Transaction confirmation and history

### Staking

Earn passive income by staking tokens with:

- Multiple staking pools and strategies
- APY/APR calculation and projections
- Reward tracking and claiming
- Staking history and analytics

### Click2Earn Game

Simple play-to-earn game where users can:

- Earn PATH tokens by clicking
- Purchase upgrades to increase earnings
- Compete on the leaderboard
- Claim tokens to their game balance

### Support Chat AI

AI-powered assistant using Google Gemini to:

- Answer user questions about crypto and blockchain
- Provide guidance on using platform features
- Explain complex blockchain concepts
- Assist with troubleshooting

## 🔮 Future Roadmap

- **Mobile Application**: Native mobile apps for iOS and Android
- **Advanced DeFi Integrations**: Support for lending, borrowing, and yield farming protocols
- **Cross-chain Infrastructure**: Seamless bridges and swaps between different blockchains
- **Enhanced AI Analytics**: Predictive analytics and pattern recognition for transactions
- **Governance System**: PATH token and DAO implementation for community governance
- **Notification System**: Custom alerts for wallet activities, price movements, and security events
- **Enterprise Solutions**: White-label solutions for businesses and institutions

## 🛡️ Security

CryptoPath takes security seriously. We implement:

- Secure wallet connections with no private key storage
- Client-side encryption for sensitive data
- Regular security audits and code reviews
- Compliance with industry best practices

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

If you encounter any issues or have questions, please:

- Open an issue on GitHub
- Contact us at [support@cryptopath.io](mailto:support@cryptopath.io)
- Join our [Discord community](https://discord.gg/cryptopath)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
