# CryptoPath - Path Your Crypto Future
**COS30049 - Computing Technology Innovation Project**

## Installation Guide - duy deo trai

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

# Set up environment variables
touch .env.local
```
Populate `.env.local` with:
```
ETHERSCAN_API_KEY=YOUR_API_KEY
ETHERSCAN_API_URL=https://api.etherscan.io/api
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-password
```
```bash
# Start the development server
npm run dev
```

## Project Overview
**Project Name:** CryptoPath  
**Description:**
CryptoPath is a blockchain transaction visualization system that simplifies blockchain data interpretation through an interactive user interface. It allows users to:
- Enter an Ethereum wallet address to retrieve balance and transaction history.
- Visualize transactions as a directed graph with interactive nodes.
- Navigate transaction paths dynamically.
- View transaction details in a structured table with export options.
- Leverage a graph database (currently using static demo data) for efficient data storage and retrieval.

## Team Members
- **Le Nguyen Dang Duy** (105028557) - Frontend Lead / Graph Visualization
- **Phan Cong Hung** (104995595) - Backend & Data Integration Lead
- **Nguyen Minh Duy** (104974743) - Full-Stack Developer / UI & UX

## Project Structure
### Frontend
- Next.js 14 with TypeScript
- Tailwind CSS & Shadcn/ui components
- React-based visualization
- Theme support (light/dark mode)

### Backend
- RESTful API for blockchain data retrieval
- Data transformation & caching
- Authentication & rate limiting

### Graph Database
- Neo4j for transaction relationship mapping
- Optimized queries for path discovery
- Caching & indexing for efficient lookups

### API Integration
- Ethereum blockchain API
- WebSocket for real-time updates
- Robust error handling & data validation

### UI/UX Design
- Responsive & accessible UI
- Interactive transaction graph
- Enhanced navigation & visualization

## Core Functionalities
### Wallet Information
- Address lookup & validation
- Balance & transaction history
- Token holdings tracking

### Transaction Graph
- Interactive node-edge visualization
- Zoom, pan, filtering, and path tracing

### Transaction Table
- Sortable & searchable data
- Export (CSV) & quick-copy features

### Data Storage
- Efficient graph schema
- Caching & performance optimizations

## Future Enhancements
### Advanced Features
- Real-time data integration & multi-chain support
- 3D visualization & pattern recognition
- User-customizable alerts & annotations
- Performance & security optimizations

## API Documentation
- Authentication & rate limits
- Endpoint descriptions & error handling

## Contributing
Refer to `CONTRIBUTING.md` for guidelines on submitting pull requests.

## License
This project is licensed under the MIT License. See `LICENSE.md` for details.

## Acknowledgements
- Ethereum blockchain community
- Neo4j graph database
- Next.js framework
- Shadcn/ui components
