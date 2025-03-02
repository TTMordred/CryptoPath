# CryptoPath - Path Your Crypto Future
 CryptoPath COS30049-Computing Technology Innovation Project

## 1. Project Overview

**Project Name:** CRYPTOPATH  
**Description:**  
A Blockchain Transaction Information Visualization System designed to simplify the complexity of blockchain transactions by providing an interactive, user-friendly platform. The system will allow users to:
- Enter an Ethereum wallet address to view its balance, transaction history, and related details.
- Visualize the transaction network as a directed graph where nodes represent wallet addresses and edges represent transactions.
- Interact with the graph to follow transaction paths.
- View detailed transaction data in a table with features such as quick copy and CSV export.
- Utilize a graph database (with static demo data for now) for efficient data storage and retrieval.

---

## 2. Team Members

- **Le Nguyen Dang Duy**  
  *Student ID:* 105028557  
  *Role:* Front-end Lead / Graph Visualization

- **Phan Cong Hung**  
  *Student ID:* 104995595  
  *Role:* Back-end & Data Integration Lead

- **Nguyen Minh Duy**  
  *Student ID:* 104974743  
  *Role:* Full-Stack Developer / UI & UX

## 3. Project Structure

### 3.1. Frontend
- Next.js 14 with TypeScript
- Tailwind CSS for styling
- Shadcn/ui components for UI elements
- React components for visualization
- Theme support (light/dark mode)

### 3.2. Backend
- RESTful API endpoints for transaction data
- Data processing and transformation
- Caching layer for improved performance
- Authentication and rate limiting

### 3.3. Graph Database
- Neo4j for storing transaction relationships
- Optimized queries for path finding
- Caching layer for frequent queries
- Data indexing for quick lookups

### 3.4. API Integration
- Ethereum blockchain API integration
- WebSocket support for real-time updates
- Rate limiting and error handling
- Data validation and sanitization

### 3.5. UI/UX Design
- Responsive design for all devices
- Intuitive navigation
- Interactive visualization components
- Accessibility compliance
- Loading states and error handling

## 4. Core Functionalities

### 4.1. Wallet Information
- Address validation and lookup
- Balance checking
- Transaction history
- Token holdings

### 4.2. Transaction Graph
- Interactive node-edge visualization
- Zoom and pan controls
- Node filtering and highlighting
- Path tracing between addresses

### 4.3. Transaction Table
- Sortable columns
- Pagination
- Search and filtering
- Export functionality
- Quick copy features

### 4.4. Data Storage
- Efficient graph database schema
- Caching mechanisms
- Data backup and recovery
- Performance optimization

## 5. Future Enhancements

### 5.1. Dynamic Data Integration
- Real-time transaction updates
- Multiple blockchain support
- Advanced filtering options
- Custom alert system

### 5.2. Advanced Visualization
- 3D graph visualization
- Custom layout algorithms
- Animation improvements
- Pattern recognition

### 5.3. User Interaction
- Saved searches
- Custom watchlists
- Transaction annotations
- Collaboration features

### 5.4. Performance Optimization
- Advanced caching strategies
- Query optimization
- Load balancing
- Resource management

## 6. Installation Guide

bash    

#### Clone the repository
git clone https://github.com/TTMordred/CryptoPath.git

#### Navigate to project directory
cd cryptopath

#### Install dependencies
npm install

npm install next --legacy-peer-deps

#### Set up environment variables
create the .env.local file with the content below: 
ETHERSCAN_API_KEY=6U137E3DGFMCCBQA8E3CAR1P1UW7EV8A6S
ETHERSCAN_API_URL=https://api.etherscan.io/api

#### Start the development server
npm run dev

### 6.1. Prerequisites
- Node.js 18.0 or higher
- npm or yarn package manager
- Neo4j database
- Git

### 6.2. Installation

### 6.3. Configuration
- Configure environment variables
- Set up database connections
- Configure API keys
- Set up authentication

## 7. Usage

### 7.1. Wallet Information
- Enter wallet address in search bar
- View basic information
- Explore transaction history
- Check token balances

### 7.2. Transaction Graph
- Navigate the visualization
- Use zoom and pan controls
- Filter transactions
- Follow transaction paths

### 7.3. Transaction Table
- Sort and filter data
- Export to CSV
- Copy transaction details
- Page through results

### 7.4. Graph Database
- Query optimization tips
- Data structure overview
- Backup procedures
- Maintenance guidelines

## 8. API Documentation
- Detailed endpoint descriptions
- Authentication methods
- Rate limiting information
- Error handling

## 9. Contributing
Please read CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.

## 10. License
This project is licensed under the MIT License - see the LICENSE.md file for details.

## 11. Acknowledgements
- Ethereum blockchain community
- Neo4j graph database
- Next.js framework
- Shadcn/ui components

            
